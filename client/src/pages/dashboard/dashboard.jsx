import React, { useEffect, useState, useMemo } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Settings,
  BarChart3,
  ArrowRight,
  Plus,
  RefreshCw,
  AlertTriangle ,
  Search,
  MoreHorizontal,
  Building,
  Package,
  Wrench,
  ClipboardList,
  MapPin,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import useAuth from '../../lib/hooks/useAuth';
import useTickets from '../../lib/hooks/useTickets';
import useDashboardAnalytics from '../../lib/hooks/useDashboardAnalytics';
import RoleBasedComponent from '../../components/RoleBasedComponent';
import { TICKET_STATUS, TICKET_PRIORITY } from '../../lib/constants';
import { useSocketActivities } from '../../lib/hooks/useSocketActivities';

// Role-based dashboard configuration
const getRoleDashboardConfig = (role) => {
  const configs = {
    MACSOFT_ADMIN: {
      title: 'Admin Dashboard',
      description: 'Complete system overview and management',
      showServiceCenterStats: true,
      showInventoryStats: true,
      showUserManagement: true,
      showSystemHealth: true,
      primaryMetrics: ['total', 'open', 'inProgress', 'closed', 'highPriority', 'serviceCenters', 'users', 'inventory']
    },
    MACSOFT_HEAD: {
      title: 'Management Dashboard', 
      description: 'Global oversight and approvals - All tickets across all states',
      showServiceCenterStats: true,
      showApprovalsPending: true,
      showGlobalOverview: true,
      primaryMetrics: ['total', 'open', 'inProgress', 'closed', 'pendingApprovals', 'activeServiceCenters', 'activeUsers', 'pendingFieldClearances']
    },
    MACSOFT_SUPPORT: {
      title: 'Support Dashboard',
      description: 'Technical support and center assignment',
      showAssignmentQueue: true,
      showServiceCenterStats: true,
      showSpareRequests: true,
      primaryMetrics: ['total', 'open', 'inProgress', 'unassigned', 'spareRequests']
    },
    CUSTOMER_SERVICE_HEAD: {
      title: 'Service Center Dashboard',
      description: 'Your service center operations',
      showCenterWorkload: true,
      showTechnicianPerformance: true,
      primaryMetrics: ['assigned', 'inProgress', 'completed', 'technicians']
    },
    SERVICE_CENTER_TECHNICIAN: {
      title: 'Technician Dashboard',
      description: 'Your assigned work and progress',
      showMyWork: true,
      showRepairQueue: true,
      primaryMetrics: ['myTickets', 'inDiagnosis', 'inRepair', 'completed']
    },
    CUSTOMER_FIELD_ENGINEER: {
      title: 'Field Engineer Dashboard',
      description: 'Your field tickets and progress', 
      showMyTickets: true,
      showFieldWork: true,
      primaryMetrics: ['myTotal', 'myOpen', 'myInProgress', 'myClosed']
    }
  };
  return configs[role] || configs.CUSTOMER_FIELD_ENGINEER;
};

// Role-based quick actions
const getRoleQuickActions = (role, navigate) => {
  const actions = {
    MACSOFT_ADMIN: [
      {
        icon: Plus,
        title: 'Create Ticket',
        description: 'Submit a new support ticket',
        color: 'bg-blue-500',
        onClick: () => navigate('/tickets/new')
      },
      {
        icon: Users,
        title: 'Manage Users',
        description: 'Add, edit, or remove users',
        color: 'bg-green-500',
        onClick: () => navigate('/users')
      },
      {
        icon: Building,
        title: 'Service Centers',
        description: 'Manage service center operations',
        color: 'bg-purple-500',
        onClick: () => navigate('/service-center')
      },
      {
        icon: Settings,
        title: 'System Settings',
        description: 'Configure system parameters',
        color: 'bg-orange-500',
        onClick: () => navigate('/settings')
      }
    ],
    MACSOFT_HEAD: [
      {
        icon: ClipboardList,
        title: 'Spare Approvals',
        description: 'Review and approve spare requests',
        color: 'bg-red-500',
        onClick: () => navigate('/spare-request-approval')
      },
      {
        icon: Building,
        title: 'Service Centers',
        description: 'Monitor service center performance',
        color: 'bg-purple-500',
        onClick: () => navigate('/service-center')
      },
      {
        icon: BarChart3,
        title: 'Reports',
        description: 'View system reports and analytics',
        color: 'bg-blue-500',
        onClick: () => navigate('/tickets')
      },
      {
        icon: Users,
        title: 'Team Management',
        description: 'Manage team and assignments',
        color: 'bg-green-500',
        onClick: () => navigate('/users')
      }
    ],
    MACSOFT_SUPPORT: [
      {
        icon: Plus,
        title: 'Create Ticket',
        description: 'Submit a new support ticket',
        color: 'bg-blue-500',
        onClick: () => navigate('/tickets/new')
      },
      {
        icon: Building,
        title: 'Assign Centers',
        description: 'Assign tickets to service centers',
        color: 'bg-green-500',
        onClick: () => navigate('/service-center')
      },
      {
        icon: Package,
        title: 'Spare Requests',
        description: 'Manage spare part requests',
        color: 'bg-orange-500',
        onClick: () => navigate('/spare-request-approvals')
      },
      {
        icon: Search,
        title: 'Search Tickets',
        description: 'Find and manage tickets',
        color: 'bg-purple-500',
        onClick: () => navigate('/tickets')
      }
    ],
    CUSTOMER_SERVICE_HEAD: [
      {
        icon: Ticket,
        title: 'Center Tickets',
        description: 'View tickets assigned to your center',
        color: 'bg-blue-500',
        onClick: () => navigate('/tickets')
      },
      {
        icon: Users,
        title: 'Technicians',
        description: 'Manage center technicians',
        color: 'bg-green-500',
        onClick: () => navigate('/users?role=SERVICE_CENTER_TECHNICIAN')
      },
      {
        icon: Wrench,
        title: 'Receive Controller',
        description: 'Receive controllers at service center',
        color: 'bg-purple-500',
        onClick: () => navigate('/receive-controller')
      },
      {
        icon: Package,
        title: 'Inventory',
        description: 'Manage spare parts inventory',
        color: 'bg-orange-500',
        onClick: () => navigate('/inventory')
      }
    ],
    SERVICE_CENTER_TECHNICIAN: [
      {
        icon: Wrench,
        title: 'Receive Controller',
        description: 'Receive controllers for repair',
        color: 'bg-blue-500',
        onClick: () => navigate('/receive-controller')
      },
      {
        icon: Ticket,
        title: 'My Work',
        description: 'View assigned tickets',
        color: 'bg-green-500',
        onClick: () => navigate('/tickets')
      },
      {
        icon: Package,
        title: 'Request Spares',
        description: 'Request spare parts',
        color: 'bg-orange-500',
        onClick: () => navigate('/spare-requests')
      },
      {
        icon: FileText,
        title: 'Delivery',
        description: 'Deliver repaired controllers',
        color: 'bg-purple-500',
        onClick: () => navigate('/deliver')
      }
    ],
    CUSTOMER_FIELD_ENGINEER: [
      {
        icon: Plus,
        title: 'Create Ticket',
        description: 'Report a new field issue',
        color: 'bg-blue-500',
        onClick: () => navigate('/tickets/new')
      },
      {
        icon: Ticket,
        title: 'My Tickets',
        description: 'View your submitted tickets',
        color: 'bg-green-500',
        onClick: () => navigate('/tickets')
      },
      {
        icon: MapPin,
        title: 'Field Status',
        description: 'Update field clearance status',
        color: 'bg-orange-500',
        onClick: () => navigate('/tickets')
      },
      {
        icon: Search,
        title: 'Track Status',
        description: 'Track ticket progress',
        color: 'bg-purple-500',
        onClick: () => navigate('/tickets')
      }
    ]
  };
  return actions[role] || actions.CUSTOMER_FIELD_ENGINEER;
};

const MetricCard = ({ icon: Icon, title, value, change, trend, color, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    whileHover={{ 
      y: -4, 
      scale: 1.01,
      boxShadow: '0 12px 24px rgba(0,0,0,0.08)'
    }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", damping: 20, stiffness: 300 }}
    className="relative bg-white rounded-xl p-4 cursor-pointer border border-gray-200 hover:border-blue-200 transition-all duration-300 overflow-hidden group"
    onClick={onClick}
  >
    {/* Background gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    {/* Top section with icon and trend */}
    <div className="relative flex items-start justify-between mb-3">
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <h3 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-200">
                    {value}
                </h3>
            </motion.div>
     
      
      {change && (
        <motion.div 
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend === 'up' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}
        >
          <motion.div
            animate={{ y: trend === 'up' ? [-0.5, 0.5, -0.5] : [0.5, -0.5, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </motion.div>
          +{change}%
        </motion.div>
      )}
    </div>

    {/* Value and title section */}
    <div className="relative flex justify-between items-center">
            <motion.div
                className={`p-2 rounded-lg ${color} shadow-md group-hover:shadow-lg transition-shadow duration-200`}
                whileHover={{ rotate: [0, -3, 3, 0] }}
                transition={{ duration: 0.4 }}
            >
                <Icon className="w-5 h-5 text-white" />
            </motion.div>
      
      <p className="text-gray-600 text-xs font-medium group-hover:text-gray-700 transition-colors duration-200">
        {title}
      </p>
    </div>

    {/* Subtle decorative element */}
    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-50/40 to-transparent rounded-full transform translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform duration-500" />
  </motion.div>
);

const QuickActionCard = ({ icon: Icon, title, description, color, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 cursor-pointer transition-all duration-300 group"
    onClick={onClick}
  >
    <div className={`p-3 rounded-lg ${color} mb-4 w-fit`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm mb-4">{description}</p>
    <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
      Get Started
      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
    </div>
  </motion.div>
);

const ActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'ticket_created': return <Plus className="w-4 h-4" />;
      case 'ticket_resolved': return <CheckCircle className="w-4 h-4" />;
      case 'ticket_assigned': return <Users className="w-4 h-4" />;
      case 'ticket_updated': return <Settings className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'ticket_created': return 'bg-blue-100 text-blue-600';
      case 'ticket_resolved': return 'bg-green-100 text-green-600';
      case 'ticket_assigned': return 'bg-purple-100 text-purple-600';
      case 'ticket_updated': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getActivityText = (type) => {
    switch (type) {
      case 'ticket_created': return 'created';
      case 'ticket_resolved': return 'resolved';
      case 'ticket_assigned': return 'assigned to';
      case 'ticket_updated': return 'updated';
      default: return 'modified';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
    >
      <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{activity.ticket}</span> {getActivityText(activity.type)} <span className="font-medium">{activity.user}</span>
        </p>
        <p className="text-xs text-gray-500">{activity.time}</p>
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tickets, fetchTickets, loading } = useTickets();
  const { 
    totalTickets,
    openTickets,
    inProgressTickets,
    closedTickets,
    resolvedTickets,
    highPriorityTickets,
    unassignedTickets,
    systemHealth, 
    workloadMetrics,
    recentActivities,
    chartData,
    getRoleMetrics, 
    getChartData,
    loading: analyticsLoading,
    error: analyticsError,
    refresh: refreshAnalytics 
  } = useDashboardAnalytics();
  const [refreshing, setRefreshing] = useState(false);

  // Get role-based configuration
  const dashboardConfig = useMemo(() => getRoleDashboardConfig(user?.role), [user?.role]);
  const quickActions = useMemo(() => getRoleQuickActions(user?.role, navigate), [user?.role, navigate]);

  useEffect(() => {
    // Fetch tickets with role-based filtering
    fetchTickets({
      skip: 0,
      take: 100,
      filter: {}
    });
  }, [user?.role]);

  // Get role-based dashboard metrics from server
  const metrics = useMemo(() => {
    const serverMetrics = getRoleMetrics();
    
    return {
      ...serverMetrics,
      // Server data
      total: totalTickets || 0,
      open: openTickets || 0,
      inProgress: inProgressTickets || 0,
      closed: closedTickets || 0,
      resolved: resolvedTickets || 0,
      highPriority: highPriorityTickets || 0,
      unassigned: unassignedTickets || 0,
      unassignedCount: unassignedTickets || 0,
      // Workload metrics from server
      inDiagnosis: workloadMetrics?.inDiagnosis || 0,
      inRepair: workloadMetrics?.inRepair || 0,
      readyForDispatch: workloadMetrics?.readyForDispatch || 0,
      receivedAtCenter: workloadMetrics?.receivedAtCenter || 0,
      // System health from server  
      serviceCenters: systemHealth?.totalServiceCenters || 5,
      users: systemHealth?.totalUsers || 25,
      organisations: systemHealth?.totalOrganisations || 0,
      products: systemHealth?.totalProducts || 0,
      // Field engineer specific (same as totals for field engineers)
      myTotal: totalTickets || 0,
      myOpen: openTickets || 0,
      myInProgress: inProgressTickets || 0,
      myClosed: closedTickets || 0,
      // Service center specific
      assigned: totalTickets || 0,
      centerInProgress: inProgressTickets || 0,
      centerCompleted: closedTickets || 0,
      // Placeholder values for features not yet implemented
      inventory: 150,
      pendingApprovals: 8,
      spareRequests: 12,
      technicians: 8
    };
  }, [totalTickets, openTickets, inProgressTickets, closedTickets, resolvedTickets, highPriorityTickets, unassignedTickets, systemHealth, workloadMetrics, getRoleMetrics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchTickets({
          skip: 0,
          take: 100,
          filter: {}
        }),
        refreshAnalytics()
      ]);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  // Show loading state
  if (loading && analyticsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if analytics failed but allow partial loading
  if (analyticsError && !totalTickets && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{analyticsError}</p>
          <button
            onClick={refreshAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig transition={{ type: "spring", damping: 20, stiffness: 300 }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:tracking-wider text-gray-900">
                {dashboardConfig.title} - Welcome back, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                {dashboardConfig.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/tickets/new')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                New Ticket
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Role-based Metrics Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8"
        >
          {/* Universal Metrics */}
          {dashboardConfig.primaryMetrics.includes('total') && (
            <MetricCard
              icon={Ticket}
              title="Total Tickets"
              value={metrics.total}
              change={8}
              trend="up"
              color="bg-blue-500"
              onClick={() => navigate('/tickets')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('open') && (
            <MetricCard
              icon={AlertCircle}
              title="Open Tickets"
              value={metrics.open}
              change={12}
              trend="up"
              color="bg-red-500"
              onClick={() => navigate('/tickets?status=open')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('inProgress') && (
            <MetricCard
              icon={Clock}
              title="In Progress"
              value={metrics.inProgress}
              change={5}
              trend="down"
              color="bg-orange-500"
              onClick={() => navigate('/tickets?status=in-progress')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('closed') && (
            <MetricCard
              icon={CheckCircle}
              title="Resolved"
              value={metrics.closed}
              change={15}
              trend="up"
              color="bg-green-500"
              onClick={() => navigate('/tickets?status=closed')}
            />
          )}
          
          {/* Role-specific Metrics */}
          
          {/* Field Engineer Specific */}
          {dashboardConfig.primaryMetrics.includes('myTotal') && (
            <MetricCard
              icon={Ticket}
              title="My Tickets"
              value={metrics.myTotal}
              change={5}
              trend="up"
              color="bg-blue-500"
              onClick={() => navigate('/tickets')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('myOpen') && (
            <MetricCard
              icon={AlertCircle}
              title="My Open"
              value={metrics.myOpen}
              change={3}
              trend="up"
              color="bg-red-500"
              onClick={() => navigate('/tickets?status=open')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('myInProgress') && (
            <MetricCard
              icon={Clock}
              title="My Progress"
              value={metrics.myInProgress}
              change={2}
              trend="up"
              color="bg-orange-500"
              onClick={() => navigate('/tickets?status=in-progress')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('myClosed') && (
            <MetricCard
              icon={CheckCircle}
              title="My Completed"
              value={metrics.myClosed}
              change={8}
              trend="up"
              color="bg-green-500"
              onClick={() => navigate('/tickets?status=closed')}
            />
          )}
          
          {/* Service Center Specific */}
          {dashboardConfig.primaryMetrics.includes('assigned') && (
            <MetricCard
              icon={Building}
              title="Assigned"
              value={metrics.assigned}
              change={4}
              trend="up"
              color="bg-purple-500"
              onClick={() => navigate('/tickets')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('technicians') && (
            <MetricCard
              icon={Users}
              title="Technicians"
              value={metrics.technicians}
              change={1}
              trend="up"
              color="bg-indigo-500"
              onClick={() => navigate('/users?role=SERVICE_CENTER_TECHNICIAN')}
            />
          )}
          
          {/* Technician Specific */}
          {dashboardConfig.primaryMetrics.includes('inDiagnosis') && (
            <MetricCard
              icon={Activity}
              title="In Diagnosis"
              value={metrics.inDiagnosis}
              change={2}
              trend="up"
              color="bg-yellow-500"
              onClick={() => navigate('/tickets')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('inRepair') && (
            <MetricCard
              icon={Wrench}
              title="In Repair"
              value={metrics.inRepair}
              change={3}
              trend="down"
              color="bg-blue-600"
              onClick={() => navigate('/tickets')}
            />
          )}
          
          {/* Admin/Management Specific */}
          {dashboardConfig.primaryMetrics.includes('serviceCenters') && (
            <MetricCard
              icon={Building}
              title="Service Centers"
              value={metrics.serviceCenters}
              change={0}
              trend="up"
              color="bg-purple-500"
              onClick={() => navigate('/service-center')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('users') && (
            <MetricCard
              icon={Users}
              title="Users"
              value={metrics.users}
              change={5}
              trend="up"
              color="bg-green-600"
              onClick={() => navigate('/users')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('unassigned') && (
            <MetricCard
              icon={AlertTriangle}
              title="Unassigned"
              value={metrics.unassignedCount || metrics.unassigned || 0}
              change={-2}
              trend="down"
              color="bg-red-600"
              onClick={() => navigate('/service-center')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('spareRequests') && (
            <MetricCard
              icon={Package}
              title="Spare Requests"
              value={metrics.spareRequests}
              change={4}
              trend="up"
              color="bg-orange-600"
              onClick={() => navigate('/spare-requests')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('pendingApprovals') && (
            <MetricCard
              icon={ClipboardList}
              title="Pending Approvals"
              value={metrics.pendingApprovals}
              change={2}
              trend="up"
              color="bg-red-500"
              onClick={() => navigate('/spare-request-approval')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('activeServiceCenters') && (
            <MetricCard
              icon={Building}
              title="Active Centers"
              value={metrics.activeServiceCenters}
              change={1}
              trend="up"
              color="bg-blue-600"
              onClick={() => navigate('/service-center')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('activeUsers') && (
            <MetricCard
              icon={Users}
              title="Active Users"
              value={metrics.activeUsers}
              change={3}
              trend="up"
              color="bg-green-600"
              onClick={() => navigate('/users')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('pendingFieldClearances') && (
            <MetricCard
              icon={MapPin}
              title="Field Clearances"
              value={metrics.pendingFieldClearances}
              change={-1}
              trend="down"
              color="bg-orange-500"
              onClick={() => navigate('/tickets?stage=REQUEST_CLEARED_AT_FIELD')}
            />
          )}
          
          {dashboardConfig.primaryMetrics.includes('inventory') && (
            <MetricCard
              icon={Package}
              title="Inventory Items"
              value={metrics.inventory}
              change={12}
              trend="up"
              color="bg-teal-500"
              onClick={() => navigate('/inventory')}
            />
          )}
        </motion.div>

        {/* Role-based Charts and Quick Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
     
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {quickActions.slice(0, 4).map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.onClick}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left"
                >
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{action.title}</h4>
                    <p className="text-xs text-gray-600">{action.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        
          {/* Recent Activity for admins and managers */}
          <RoleBasedComponent 
            allowedRoles={['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'CUSTOMER_SERVICE_HEAD']}
            fallback={null}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                {(recentActivities || []).map((activity, index) => (
                  <motion.div
                    key={activity.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                    onClick={() => activity.ticket && navigate(`/tickets/${activity.ticket}`)}
                  >
                    <div className={`p-2 rounded-full ${
                      activity.status === 'OPEN' ? 'bg-red-100 text-red-600' : 
                      activity.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.ticket}</span> {activity.type === 'ticket_updated' ? 'updated by' : 'created by'} <span className="font-medium">{activity.user}</span>
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
                {(!recentActivities || recentActivities.length === 0) && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No recent activities</p>
                  </div>
                )}
              </div>
            </motion.div>
          </RoleBasedComponent>

          {/* System Health for Admins */}
          <RoleBasedComponent 
            allowedRoles={['MACSOFT_ADMIN']}
            fallback={null}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Healthy</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Users</span>
                  <span className="text-sm font-medium text-blue-600">{metrics.users}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tickets</span>
                  <span className="text-sm font-medium text-blue-600">{metrics.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Service Centers</span>
                  <span className="text-sm font-medium text-blue-600">{metrics.serviceCenters}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Organisations</span>
                  <span className="text-sm font-medium text-green-600">{metrics.organisations}</span>
                </div>
              </div>
            </motion.div>
          </RoleBasedComponent>

          {/* My Workload for Service Center roles */}
          <RoleBasedComponent 
            allowedRoles={['SERVICE_CENTER_TECHNICIAN', 'CUSTOMER_SERVICE_HEAD']}
            fallback={null}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">My Workload</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Controllers to Receive</span>
                  <span className="text-sm font-medium text-blue-600">{Math.floor(metrics.assigned * 0.3)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">In Diagnosis</span>
                  <span className="text-sm font-medium text-yellow-600">{metrics.inDiagnosis}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">In Repair</span>
                  <span className="text-sm font-medium text-orange-600">{metrics.inRepair}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ready for Dispatch</span>
                  <span className="text-sm font-medium text-green-600">{Math.floor(metrics.assigned * 0.2)}</span>
                </div>
              </div>
            </motion.div>
          </RoleBasedComponent>
   {/* Personal Tickets Chart for Field Engineers */}
          {user?.role === 'CUSTOMER_FIELD_ENGINEER' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 col-span-2 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">My Tickets Status</h3>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'My Tickets', open: metrics.myOpen || 0, inProgress: metrics.myInProgress || 0, closed: metrics.myClosed || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="open" fill="#EF4444" name="Open" />
                  <Bar dataKey="inProgress" fill="#F59E0B" name="In Progress" />
                  <Bar dataKey="closed" fill="#10B981" name="Closed" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Field Work Status for Field Engineers */}
          <RoleBasedComponent 
            allowedRoles={['CUSTOMER_FIELD_ENGINEER']}
            fallback={null}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Field Work Status</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Field Visits</span>
                  <span className="text-sm font-medium text-blue-600">{metrics.myOpen}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Awaiting Service Center</span>
                  <span className="text-sm font-medium text-orange-600">{Math.floor(metrics.myInProgress * 0.6)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Clearance</span>
                  <span className="text-sm font-medium text-yellow-600">{Math.floor(metrics.myInProgress * 0.4)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Month Completed</span>
                  <span className="text-sm font-medium text-green-600">{metrics.myClosed}</span>
                </div>
              </div>
            </motion.div>
          </RoleBasedComponent>
               {/* Ticket Status Overview Chart - Show for most roles except basic field engineer */}
          {user?.role !== 'CUSTOMER_FIELD_ENGINEER' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white col-span-2 p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Ticket Status Overview</h3>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData || getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="open" fill="#EF4444" name="Open" />
                  <Bar dataKey="inProgress" fill="#F59E0B" name="In Progress" />
                  <Bar dataKey="closed" fill="#10B981" name="Closed" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Socket Activities Test Panel - Only for development/testing */}
        {/*   {user?.role === 'MACSOFT_ADMIN' && (
            <SocketTestPanel />
          )}
             */}    
        </div>
      </div>
    </div>
    </MotionConfig>
  );
}

// Socket Test Panel Component for debugging
const SocketTestPanel = () => {
  const {
    isConnected,
    notifications,
    buzzerAlerts,
    unreadNotifications,
    activeAlerts,
    sendTestNotification,
    sendTestBuzzer,
    sendTestTicketMessage,
    sendTestTicketCreation
  } = useSocketActivities();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="col-span-full bg-yellow-50 border border-yellow-200 p-6 rounded-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-yellow-800">Socket Activities Test Panel</h3>
        <div className="flex items-center space-x-2">
          <div 
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
          <span className="text-sm text-yellow-700">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">Real-time Stats</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Notifications:</span>
              <span className="font-medium">{notifications.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Unread:</span>
              <span className="font-medium text-red-600">{unreadNotifications}</span>
            </div>
            <div className="flex justify-between">
              <span>Buzzer Alerts:</span>
              <span className="font-medium text-orange-600">{activeAlerts}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">Latest Notifications</h4>
          <div className="space-y-1 text-xs max-h-20 overflow-y-auto">
            {notifications.slice(0, 3).map((notif, index) => (
              <div key={index} className="text-gray-600 truncate">
                {notif.title}
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-gray-400 italic">No notifications yet</div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">Test Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => sendTestNotification({ 
                title: 'Test Notification', 
                message: `Test at ${new Date().toLocaleTimeString()}` 
              })}
              className="w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Send Test Notification
            </button>
            <button
              onClick={() => sendTestBuzzer({ 
                title: 'Test Buzzer Alert', 
                message: `Buzzer test at ${new Date().toLocaleTimeString()}` 
              })}
              className="w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              Send Test Buzzer
            </button>
            <button
              onClick={() => sendTestTicketMessage(1, { 
                content: `Test message at ${new Date().toLocaleTimeString()}`,
                senderName: 'Test User',
                ticketUpdates: {
                  hasNewActivity: true,
                  lastActivity: new Date().toISOString(),
                  lastMessageBy: 'Test User'
                }
              })}
              className="w-full px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Ticket Update
            </button>
            <button
              onClick={() => sendTestTicketCreation({ 
                title: `New Test Ticket ${new Date().toLocaleTimeString()}`,
                customerName: 'John Doe',
                description: 'Test ticket created via socket'
              })}
              className="w-full px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Test New Ticket
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-yellow-600">
        💡 This panel is only visible to MACSOFT_ADMIN users for testing socket activities. 
        Real-time notifications should appear in the notification bell and buzzer alerts will show as popups.
      </div>
    </motion.div>
  );
};