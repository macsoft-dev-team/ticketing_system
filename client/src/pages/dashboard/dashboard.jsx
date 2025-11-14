import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
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
  Search,
  MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import useAuth from '../../lib/hooks/useAuth';
import useTickets from '../../lib/hooks/useTickets';
import { TICKET_STATUS, TICKET_PRIORITY } from '../../lib/constants';

// Mock data for demonstration
const mockData = {
  ticketStats: [
    { name: 'Jan', open: 65, inProgress: 28, closed: 95 },
    { name: 'Feb', open: 78, inProgress: 35, closed: 88 },
    { name: 'Mar', open: 52, inProgress: 42, closed: 102 },
    { name: 'Apr', open: 89, inProgress: 31, closed: 76 },
    { name: 'May', open: 67, inProgress: 48, closed: 94 },
    { name: 'Jun', open: 45, inProgress: 29, closed: 118 },
  ],
  categoryData: [
    { name: 'Hardware', value: 35, color: '#3B82F6' },
    { name: 'Software', value: 25, color: '#10B981' },
    { name: 'Maintenance', value: 20, color: '#F59E0B' },
    { name: 'Installation', value: 12, color: '#EF4444' },
    { name: 'Other', value: 8, color: '#8B5CF6' },
  ],
  recentActivities: [
    { id: 1, type: 'ticket_created', ticket: 'TKT-2025-001', user: 'John Doe', time: '2 minutes ago' },
    { id: 2, type: 'ticket_resolved', ticket: 'TKT-2025-002', user: 'Jane Smith', time: '15 minutes ago' },
    { id: 3, type: 'ticket_assigned', ticket: 'TKT-2025-003', user: 'Tech Team A', time: '1 hour ago' },
    { id: 4, type: 'ticket_updated', ticket: 'TKT-2025-004', user: 'Mike Johnson', time: '2 hours ago' },
    { id: 5, type: 'ticket_created', ticket: 'TKT-2025-005', user: 'Sarah Wilson', time: '3 hours ago' },
  ]
};

const MetricCard = ({ icon: Icon, title, value, change, trend, color, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    whileHover={{ 
      y: -4, 
      scale: 1.01,
      boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
      borderColor: 'rgba(59, 130, 246, 0.3)'
    }}
    whileTap={{ scale: 0.98 }}
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  // Calculate dashboard metrics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === TICKET_STATUS.OPEN).length;
  const inProgressTickets = tickets.filter(t => t.status === TICKET_STATUS.IN_PROGRESS).length;
  const closedTickets = tickets.filter(t => t.status === TICKET_STATUS.CLOSED).length;
  const highPriorityTickets = tickets.filter(t => t.priority === TICKET_PRIORITY.HIGH).length;

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const quickActions = [
    {
      icon: Plus,
      title: 'Create Ticket',
      description: 'Submit a new support ticket for technical assistance',
      color: 'bg-blue-500',
      onClick: () => navigate('/tickets/new')
    },
    {
      icon: Search,
      title: 'Search Tickets',
      description: 'Find and manage existing tickets in the system',
      color: 'bg-green-500',
      onClick: () => navigate('/tickets')
    },
    {
      icon: Users,
      title: 'Manage Users',
      description: 'Add, edit, or remove users from the system',
      color: 'bg-purple-500',
      onClick: () => navigate('/users')
    },
    {
      icon: Settings,
      title: 'System Settings',
      description: 'Configure system preferences and parameters',
      color: 'bg-orange-500',
      onClick: () => navigate('/settings')
    }
  ];

  return (
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
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your ticket system today.
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

        {/* Metrics Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          <MetricCard
            icon={Ticket}
            title="Total Tickets"
            value={totalTickets}
            change={8}
            trend="up"
            color="bg-blue-500"
            onClick={() => navigate('/tickets')}
          />
          <MetricCard
            icon={AlertCircle}
            title="Open Tickets"
            value={openTickets}
            change={12}
            trend="up"
            color="bg-red-500"
            onClick={() => navigate('/tickets?status=open')}
          />
          <MetricCard
            icon={Clock}
            title="In Progress"
            value={inProgressTickets}
            change={5}
            trend="down"
            color="bg-orange-500"
            onClick={() => navigate('/tickets?status=in-progress')}
          />
          <MetricCard
            icon={CheckCircle}
            title="Resolved"
            value={closedTickets}
            change={15}
            trend="up"
            color="bg-green-500"
            onClick={() => navigate('/tickets?status=closed')}
          />
          <MetricCard
            icon={TrendingUp}
            title="High Priority"
            value={highPriorityTickets}
            change={3}
            trend="up"
            color="bg-purple-500"
            onClick={() => navigate('/tickets?priority=high')}
          />
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Ticket Trends Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Ticket Trends</h3>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockData.ticketStats}>
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

          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Ticket Categories</h3>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    dataKey="value"
                    data={mockData.categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {mockData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {mockData.categoryData.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>        
      </div>
    </div>
  );
}