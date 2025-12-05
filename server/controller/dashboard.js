const { prisma } = require("../lib/clients");

/**
 * Get role-based dashboard analytics
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const user = req.user;

    let analytics = {
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      closedTickets: 0,
      resolvedTickets: 0,
      highPriorityTickets: 0,
      unassignedTickets: 0,
      myTickets: 0,
      assignedTickets: 0,
      chartData: [],
      recentActivities: [],
      systemHealth: {},
      serviceCenterStats: [],
      workloadMetrics: {}
    };

    // Base ticket query with role-based filtering
    let ticketWhere = {};
    
    // Apply role-based filtering
    switch (userRole) {
      case "CUSTOMER_FIELD_ENGINEER":
        // Only tickets created by this user
        ticketWhere.createdBy = userId;
        break;
        
      case "SERVICE_CENTER_TECHNICIAN":
      case "CUSTOMER_SERVICE_HEAD":
        // Only tickets assigned to user's service center
        if (user.centerCode) {
          ticketWhere.assignedServiceCenter = user.centerCode;
        } else {
          ticketWhere.id = -1; // No tickets if no center assigned
        }
        break;
        
      case "MACSOFT_ADMIN":
      case "MACSOFT_HEAD":
      case "MACSOFT_SUPPORT":
        // Can see all tickets, no additional filtering needed
        break;
        
      default:
        // Default to user's own tickets for safety
        ticketWhere.createdBy = userId;
    }

    // Get ticket counts
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      closedTickets,
      resolvedTickets,
      highPriorityTickets,
      unassignedTickets
    ] = await Promise.all([
      prisma.ticket.count({ where: ticketWhere }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'OPEN' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'CLOSED' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'RESOLVED' } }),
      prisma.ticket.count({ where: { ...ticketWhere, priority: 'HIGH' } }),
      userRole === 'CUSTOMER_FIELD_ENGINEER' ? 0 : prisma.ticket.count({ 
        where: { 
          assignedServiceCenter: null,
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        } 
      })
    ]);

    analytics.totalTickets = totalTickets;
    analytics.openTickets = openTickets;
    analytics.inProgressTickets = inProgressTickets;
    analytics.closedTickets = closedTickets;
    analytics.resolvedTickets = resolvedTickets;
    analytics.highPriorityTickets = highPriorityTickets;
    analytics.unassignedTickets = unassignedTickets;

    // Get recent tickets for activity feed (for management roles)
    if (['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'CUSTOMER_SERVICE_HEAD'].includes(userRole)) {
      const recentTickets = await prisma.ticket.findMany({
        where: ticketWhere,
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          createdByUser: {
            select: { name: true }
          }
        }
      });

      analytics.recentActivities = recentTickets.map(ticket => ({
        id: ticket.id,
        type: 'ticket_updated',
        ticket: ticket.ticketCode,
        user: ticket.createdByUser?.name || 'Unknown',
        time: getTimeAgo(ticket.updatedAt),
        description: ticket.description,
        status: ticket.status
      }));
    }

    // Get chart data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTickets = await prisma.ticket.groupBy({
      by: ['createdAt'],
      where: {
        ...ticketWhere,
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Process monthly data for charts
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const [monthOpen, monthInProgress, monthClosed] = await Promise.all([
        prisma.ticket.count({
          where: {
            ...ticketWhere,
            createdAt: { gte: monthStart, lt: monthEnd },
            status: 'OPEN'
          }
        }),
        prisma.ticket.count({
          where: {
            ...ticketWhere,
            createdAt: { gte: monthStart, lt: monthEnd },
            status: 'IN_PROGRESS'
          }
        }),
        prisma.ticket.count({
          where: {
            ...ticketWhere,
            createdAt: { gte: monthStart, lt: monthEnd },
            status: { in: ['CLOSED', 'RESOLVED'] }
          }
        })
      ]);

      chartData.push({
        name: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        open: monthOpen,
        inProgress: monthInProgress,
        closed: monthClosed,
        total: monthOpen + monthInProgress + monthClosed
      });
    }

    analytics.chartData = chartData;

    // Role-specific additional metrics
    if (userRole === 'MACSOFT_ADMIN') {
      const systemStats = await Promise.all([
        prisma.user.count(),
        prisma.serviceCenter.count(),
        prisma.organisation.count(),
        prisma.product.count()
      ]);

      analytics.systemHealth = {
        totalUsers: systemStats[0],
        totalServiceCenters: systemStats[1],
        totalOrganisations: systemStats[2],
        totalProducts: systemStats[3],
        systemVersion: "1.0.0",
        lastUpdated: new Date().toISOString()
      };
    }

    // Management metrics for MACSOFT_HEAD (global oversight)
    if (userRole === 'MACSOFT_HEAD') {
      const managementStats = await Promise.all([
        // Pending approvals (spare requests)
        prisma.spareRequest.count({
          where: { status: 'PENDING' }
        }),
        // Active service centers
        prisma.serviceCenter.count({
          where: { isActive: true }
        }),
        // Field clearances pending
        prisma.ticketMilestone.count({
          where: {
            stage: 'REQUEST_CLEARED_AT_FIELD',
            status: 'PENDING'
          }
        }),
        // Total active users
        prisma.user.count({
          where: { isActive: true }
        })
      ]);

      analytics.managementMetrics = {
        pendingSpareApprovals: managementStats[0],
        activeServiceCenters: managementStats[1],
        pendingFieldClearances: managementStats[2],
        activeUsers: managementStats[3],
        approvalAuthority: true
      };
    }

    // Service center workload for technicians and service heads
    if (['SERVICE_CENTER_TECHNICIAN', 'CUSTOMER_SERVICE_HEAD'].includes(userRole) && user.centerCode) {
      const milestoneStats = await prisma.ticketMilestone.groupBy({
        by: ['stage'],
        where: {
          ticket: {
            assignedServiceCenter: user.centerCode
          },
          status: 'IN_PROGRESS'
        },
        _count: {
          id: true
        }
      });

      analytics.workloadMetrics = {
        inDiagnosis: milestoneStats.find(m => m.stage === 'DIAGNOSIS_IN_PROGRESS')?._count?.id || 0,
        inRepair: milestoneStats.find(m => m.stage === 'REPAIR_IN_PROGRESS')?._count?.id || 0,
        readyForDispatch: milestoneStats.find(m => m.stage === 'READY_FOR_DISPATCH')?._count?.id || 0,
        receivedAtCenter: milestoneStats.find(m => m.stage === 'RECEIVED_AT_SERVICE_CENTER')?._count?.id || 0
      };
    }

    res.status(200).json({
      success: true,
      analytics,
      role: userRole,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch dashboard analytics",
      error: error.message 
    });
  }
};

/**
 * Get service center statistics for dashboard
 */
const getServiceCenterStats = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Check permissions
    if (!['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'].includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: "Insufficient permissions" 
      });
    }

    const serviceCenters = await prisma.serviceCenter.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            assignedTickets: {
              where: {
                status: { in: ['OPEN', 'IN_PROGRESS'] }
              }
            }
          }
        }
      }
    });

    const stats = serviceCenters.map(center => ({
      id: center.id,
      name: center.name,
      centerCode: center.centerCode,
      activeTickets: center._count.assignedTickets,
      address: center.address,
      serviceableStates: center.serviceableStates
    }));

    res.status(200).json({
      success: true,
      serviceCenters: stats
    });

  } catch (error) {
    console.error('Service center stats error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch service center statistics",
      error: error.message 
    });
  }
};

// Helper function to format time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
  return `${Math.floor(diffInMinutes / 1440)} days ago`;
};

module.exports = {
  getDashboardAnalytics,
  getServiceCenterStats
};