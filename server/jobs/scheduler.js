const cron = require("node-cron");
const {
  autoCloseTickets,
  getCandidateTicketsForClosure,
} = require("./autoCloseTickets");
const {
  checkPendingCustomerMessages,
  getCandidateTicketsForBuzzer,
} = require("./buzzerAlerts");
const {
  archiveClosedTickets,
  getCandidateTicketsForArchival,
} = require("./archiveTickets");

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
       return;
    }

 
    //Schedule auto-close tickets job to run every 2 hours
    const autoCloseJob = cron.schedule(
      "0 */2 * * *",
      async () => {
         try {
          await autoCloseTickets();
        } catch (error) {
          console.error("Auto-close tickets job failed:", error);
        }
      },
      {
        scheduled: false,
        name: "autoCloseTickets",
      }
    );

    this.jobs.set("autoCloseTickets", autoCloseJob);
    autoCloseJob.start();

    // Schedule buzzer alerts job to run every 30 seconds
    const buzzerAlertsJob = cron.schedule(
      "*/30 * * * * *",
      async () => {
         try {
          await checkPendingCustomerMessages(io);
        } catch (error) {
          console.error("Buzzer alerts job failed:", error);
        }
      },
      {
        scheduled: false,
        name: "buzzerAlerts",
      }
    );

    this.jobs.set("buzzerAlerts", buzzerAlertsJob);
    buzzerAlertsJob.start();

    // Schedule archive tickets job to run every 4 hours
    const archiveTicketsJob = cron.schedule(
      "0 */4 * * *",
      async () => {
        try {
          console.log("Running scheduled ticket archival job...");
          const result = await archiveClosedTickets();
          console.log("Ticket archival job completed:", result);
        } catch (error) {
          console.error("Archive tickets job failed:", error);
        }
      },
      {
        scheduled: false,
        name: "archiveTickets",
      }
    );

    this.jobs.set("archiveTickets", archiveTicketsJob);
    archiveTicketsJob.start();

    // // Schedule a monitoring job to log candidates every 6 hours (optional)
    const monitoringJob = cron.schedule(
      "0 */6 * * *",
      async () => {
         try {
          const candidates = await getCandidateTicketsForClosure();  
          const buzzerCandidates = await getCandidateTicketsForBuzzer();
          const archiveCandidates = await getCandidateTicketsForArchival();
          console.log(`Monitoring: ${candidates.length} tickets for closure, ${buzzerCandidates.length} for buzzer, ${archiveCandidates.length} for archival`);
        } catch (error) {
          console.error("Monitoring job failed:", error);
        }
      },
      {
        scheduled: false,
        name: "monitorCandidates",
      }
    );

    this.jobs.set("monitorCandidates", monitoringJob);
    monitoringJob.start();

    this.isStarted = true;
   }

  /**
   * Stop the job scheduler
   */
  stop() {
    if (!this.isStarted) {
       return;
    }

     this.jobs.forEach((job, name) => {
      job.stop();
      job.destroy();
     });

    this.jobs.clear();
    this.isStarted = false;
   }

  /**
   * Run auto-close job manually
   */
  async runAutoCloseNow() {
     try {
      const result = await autoCloseTickets();
       return result;
    } catch (error) {
      console.error("Manual auto-close job failed:", error);
      throw error;
    }
  }

  /**
   * Run buzzer alerts job manually
   */
  async runBuzzerAlertsNow(io = null) {
     try {
      const result = await checkPendingCustomerMessages(io);
       return result;
    } catch (error) {
      console.error("Manual buzzer alerts job failed:", error);
      throw error;
    }
  }

  /**
   * Run archive tickets job manually
   */
  async runArchiveTicketsNow() {
    try {
      console.log("Running manual ticket archival job...");
      const result = await archiveClosedTickets();
      console.log("Manual archival job completed:", result);
      return result;
    } catch (error) {
      console.error("Manual archive tickets job failed:", error);
      throw error;
    }
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    return {
      isStarted: this.isStarted,
      jobs: Array.from(this.jobs.keys()).map((name) => ({
        name,
        running: this.jobs.get(name)?.running || false,
      })),
    };
  }
}

// Create singleton instance
const jobScheduler = new JobScheduler();

module.exports = jobScheduler;
