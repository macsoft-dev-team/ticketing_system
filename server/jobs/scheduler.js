const cron = require('node-cron');
const { autoCloseTickets, getCandidateTicketsForClosure } = require('./autoCloseTickets');
const { checkPendingCustomerMessages, getCandidateTicketsForBuzzer } = require('./buzzerAlerts');

class JobScheduler {
  constructor() {
    this.jobs = new Map();
    this.isStarted = false;
  }

  /**
   * Start the job scheduler
   */
  start(io = null) {
    if (this.isStarted) {
      console.log('Job scheduler is already running');
      return;
    }

    console.log('Starting job scheduler...');
    
    // Schedule auto-close tickets job to run every 2 hours
    const autoCloseJob = cron.schedule('0 */2 * * *', async () => {
      console.log('Running scheduled auto-close tickets job...');
      try {
        await autoCloseTickets();
      } catch (error) {
        console.error('Auto-close tickets job failed:', error);
      }
    }, {
      scheduled: false,
      name: 'autoCloseTickets'
    });
    
    this.jobs.set('autoCloseTickets', autoCloseJob);
    autoCloseJob.start();
    
    // Schedule buzzer alerts job to run every 30 seconds
    const buzzerAlertsJob = cron.schedule('*/30 * * * * *', async () => {
      console.log('Running scheduled buzzer alerts job...');
      try {
        await checkPendingCustomerMessages(io);
      } catch (error) {
        console.error('Buzzer alerts job failed:', error);
      }
    }, {
      scheduled: false,
      name: 'buzzerAlerts'
    });
    
    this.jobs.set('buzzerAlerts', buzzerAlertsJob);
    buzzerAlertsJob.start();
    
    // Schedule a monitoring job to log candidates every 6 hours (optional)
    const monitoringJob = cron.schedule('0 */6 * * *', async () => {
      console.log('Running ticket closure monitoring job...');
      try {
        const candidates = await getCandidateTicketsForClosure();
        console.log(`Found ${candidates.length} tickets that may be closed in the next run:`, 
          candidates.map(t => ({ 
            code: t.ticketCode, 
            lastMessageAt: t.messages[0]?.createdAt 
          }))
        );
        
        // Also log buzzer candidates
        const buzzerCandidates = await getCandidateTicketsForBuzzer();
        console.log(`Found ${buzzerCandidates.length} tickets needing Macsoft response:`, 
          buzzerCandidates.map(t => ({ 
            code: t.ticketCode, 
            lastMessageAt: t.messages[0]?.createdAt,
            lastMessageFrom: t.messages[0]?.sender.name 
          }))
        );
      } catch (error) {
        console.error('Monitoring job failed:', error);
      }
    }, {
      scheduled: false,
      name: 'monitorCandidates'
    });
    
    this.jobs.set('monitorCandidates', monitoringJob);
    monitoringJob.start();
    
    this.isStarted = true;
    console.log('Job scheduler started successfully');
    console.log('- Auto-close tickets job: Every 2 hours');
    console.log('- Buzzer alerts job: Every 30 seconds');
    console.log('- Monitoring job: Every 6 hours');
  }

  /**
   * Stop the job scheduler
   */
  stop() {
    if (!this.isStarted) {
      console.log('Job scheduler is not running');
      return;
    }

    console.log('Stopping job scheduler...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      job.destroy();
      console.log(`Stopped job: ${name}`);
    });
    
    this.jobs.clear();
    this.isStarted = false;
    console.log('Job scheduler stopped');
  }

  /**
   * Run auto-close job manually
   */
  async runAutoCloseNow() {
    console.log('Running auto-close tickets job manually...');
    try {
      const result = await autoCloseTickets();
      console.log('Manual auto-close job completed:', result);
      return result;
    } catch (error) {
      console.error('Manual auto-close job failed:', error);
      throw error;
    }
  }

  /**
   * Run buzzer alerts job manually
   */
  async runBuzzerAlertsNow(io = null) {
    console.log('Running buzzer alerts job manually...');
    try {
      const result = await checkPendingCustomerMessages(io);
      console.log('Manual buzzer alerts job completed:', result);
      return result;
    } catch (error) {
      console.error('Manual buzzer alerts job failed:', error);
      throw error;
    }
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    return {
      isStarted: this.isStarted,
      jobs: Array.from(this.jobs.keys()).map(name => ({
        name,
        running: this.jobs.get(name)?.running || false
      }))
    };
  }
}

// Create singleton instance
const jobScheduler = new JobScheduler();

module.exports = jobScheduler;