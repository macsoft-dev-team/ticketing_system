import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../constants/api';
import useAuth from './useAuth';

/**
 * Custom hook for fetching role-based dashboard analytics
 */
const useDashboardAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    serviceCenterStats: [],
    systemHealth: {},
    workloadMetrics: {},
    recentActivities: [],
    loading: true,
    error: null
  });

  // Fetch analytics from server
  const fetchAnalytics = async () => {
    if (!user?.role) return;

    try {
      setAnalytics(prev => ({ ...prev, loading: true, error: null }));
      
      // Fetch main dashboard analytics
      const dashboardResponse = await axios.get(`${API_ENDPOINTS.dashboard}/analytics`);
      
      if (dashboardResponse.data.success) {
        const analytics = dashboardResponse.data.analytics;
        
        setAnalytics(prev => ({
          ...prev,
          loading: false,
          error: null,
          // Main metrics
          totalTickets: analytics.totalTickets,
          openTickets: analytics.openTickets,
          inProgressTickets: analytics.inProgressTickets,
          closedTickets: analytics.closedTickets,
          resolvedTickets: analytics.resolvedTickets,
          highPriorityTickets: analytics.highPriorityTickets,
          unassignedTickets: analytics.unassignedTickets,
          myTickets: analytics.myTickets,
          assignedTickets: analytics.assignedTickets,
          // Chart and activity data
          chartData: analytics.chartData || [],
          recentActivities: analytics.recentActivities || [],
          // System and workload metrics
          systemHealth: analytics.systemHealth || {},
          workloadMetrics: analytics.workloadMetrics || {},
          managementMetrics: analytics.managementMetrics || {},
          // Additional computed data
          serviceCenterStats: [],
          role: dashboardResponse.data.role,
          lastUpdated: dashboardResponse.data.timestamp
        }));
      } else {
        throw new Error(dashboardResponse.data.message || 'Failed to fetch analytics');
      }
      
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      setAnalytics(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dashboard analytics'
      }));
    }
  };

  // Get role-specific metrics from server data
  const getRoleMetrics = () => {
    if (!user) return {};

    return {
      total: analytics.totalTickets || 0,
      open: analytics.openTickets || 0,
      inProgress: analytics.inProgressTickets || 0,
      closed: analytics.closedTickets || 0,
      resolved: analytics.resolvedTickets || 0,
      highPriority: analytics.highPriorityTickets || 0,
      unassigned: analytics.unassignedTickets || 0,
      // Role-specific metrics
      myTotal: analytics.totalTickets || 0,
      myOpen: analytics.openTickets || 0,
      myInProgress: analytics.inProgressTickets || 0,
      myClosed: analytics.closedTickets || 0,
      assigned: analytics.assignedTickets || 0,
      centerInProgress: analytics.inProgressTickets || 0,
      centerCompleted: analytics.closedTickets || 0,
      // Workload metrics from server
      inDiagnosis: analytics.workloadMetrics?.inDiagnosis || 0,
      inRepair: analytics.workloadMetrics?.inRepair || 0,
      readyForDispatch: analytics.workloadMetrics?.readyForDispatch || 0,
      receivedAtCenter: analytics.workloadMetrics?.receivedAtCenter || 0,
      // System metrics
      serviceCenters: analytics.systemHealth?.totalServiceCenters || 0,
      users: analytics.systemHealth?.totalUsers || 0,
      organisations: analytics.systemHealth?.totalOrganisations || 0,
      products: analytics.systemHealth?.totalProducts || 0,
      // Management metrics for MACSOFT_HEAD
      pendingApprovals: analytics.managementMetrics?.pendingSpareApprovals || 0,
      activeServiceCenters: analytics.managementMetrics?.activeServiceCenters || 0,
      pendingFieldClearances: analytics.managementMetrics?.pendingFieldClearances || 0,
      activeUsers: analytics.managementMetrics?.activeUsers || 0
    };
  };

  // Get chart data from server
  const getChartData = () => {
    return analytics.chartData || [];
  };

  // Get priority distribution
  const getPriorityDistribution = (tickets = []) => {
    const priorities = {
      HIGH: { count: 0, color: '#EF4444' },
      MEDIUM: { count: 0, color: '#F59E0B' },
      LOW: { count: 0, color: '#10B981' },
      UNASSIGNED: { count: 0, color: '#6B7280' }
    };
    
    tickets.forEach(ticket => {
      const priority = ticket.priority || 'UNASSIGNED';
      if (priorities[priority]) {
        priorities[priority].count++;
      }
    });
    
    return Object.entries(priorities).map(([name, data]) => ({
      name,
      value: data.count,
      color: data.color
    })).filter(item => item.value > 0);
  };

  useEffect(() => {
    if (user?.role) {
      fetchAnalytics();
    }
  }, [user?.role]);

  return {
    ...analytics,
    fetchAnalytics,
    getRoleMetrics,
    getChartData,
    getPriorityDistribution,
    refresh: fetchAnalytics
  };
};

export default useDashboardAnalytics;