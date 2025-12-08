import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import moment from 'moment';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Hash, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  Clock
} from 'lucide-react';
import { useToast } from '../../components/ui/toast';
import apiClient from '../../lib/services/api';
import { useAuth } from '../../lib/hooks/useAuth';

const Settings = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('ticket-codes');
  
  // Working Hours Settings
  const [workingHoursSettings, setWorkingHoursSettings] = useState({
    workingHours: [],
    breakTimes: [],
    holidays: []
  });
  
  // Holiday form states
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', description: '' });
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ show: false, holiday: null });
  
  // Ticket Code Settings
  const [ticketCodeSettings, setTicketCodeSettings] = useState({
    currentPrefix: 'TKT',
    newPrefix: '',
    nextNumber: 1,
    previewCode: 'TKT-2025-001',
    stats: {
      year: 2025,
      lastNumber: 0,
      totalTickets: 0
    }
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    ticketCreated: true,
    ticketUpdated: true,
    ticketAssigned: true,
    milestoneCompleted: true,
    spareRequestApproval: true,
    systemMaintenance: true,
    weeklyReports: true,
    monthlyReports: false
  });

  // Buzzer Alert Settings
  const [buzzerAlertSettings, setBuzzerAlertSettings] = useState({
    minHours: 3,
    minMinutes: 0,
    minSeconds: 0,
    maxHours: 5,
    maxMinutes: 0,
    maxSeconds: 0,
    isActive: true,
    description: ''
  });

  // Check if user has admin access
  const hasAdminAccess = user?.role === 'MACSOFT_ADMIN';

  useEffect(() => {
    if (hasAdminAccess) {
      loadSettings();
    }
  }, [hasAdminAccess]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load ticket code statistics
      const statsResponse = await apiClient.get('/ticket-code/stats');
      const previewResponse = await apiClient.get('/ticket-code/next-preview');
      
      setTicketCodeSettings(prev => ({
        ...prev,
        currentPrefix: statsResponse.data.prefix,
        newPrefix: statsResponse.data.prefix,
        nextNumber: previewResponse.data.nextNumber,
        previewCode: previewResponse.data.previewCode,
        stats: statsResponse.data
      }));

      // Load notification settings
      const notificationResponse = await apiClient.get('/settings/notifications');
      setNotificationSettings(notificationResponse.data);

      // Load working hours settings
      const [workingHoursRes, breakTimesRes, holidaysRes] = await Promise.all([
        apiClient.get('/working-hours/working-hours'),
        apiClient.get('/working-hours/break-times'),
        apiClient.get('/working-hours/holidays')
      ]);
      
      setWorkingHoursSettings({
        workingHours: workingHoursRes.data.data,
        breakTimes: breakTimesRes.data.data,
        holidays: holidaysRes.data.data
      });

      // Load buzzer alert settings
      try {
        const buzzerConfigRes = await apiClient.get('/buzzer-config');
        if (buzzerConfigRes.data.success) {
          setBuzzerAlertSettings(buzzerConfigRes.data.data);
        }
      } catch (error) {
        console.error('Failed to load buzzer config:', error);
      }

    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrefixChange = (value) => {
    setTicketCodeSettings(prev => ({
      ...prev,
      newPrefix: value.toUpperCase()
    }));
    
    // Update preview in real-time
    updatePreview(value.toUpperCase());
  };

  const updatePreview = async (prefix) => {
    try {
      const response = await apiClient.get(`/ticket-code/next-preview?prefix=${prefix}`);
      setTicketCodeSettings(prev => ({
        ...prev,
        previewCode: response.data.previewCode
      }));
    } catch (error) {
    }
  };

  const saveTicketCodeSettings = async () => {
    setSaving(true);
    try {
      await apiClient.put('/ticket-code/prefix', {
        prefix: ticketCodeSettings.newPrefix,
        year: new Date().getFullYear()
      });
      
      setTicketCodeSettings(prev => ({
        ...prev,
        currentPrefix: prev.newPrefix
      }));
      
      addToast({
        title: "Success!",
        description: "Ticket code prefix updated successfully",
        variant: "success"
      });
      await loadSettings(); // Reload to get updated stats
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to update ticket code prefix",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    setSaving(true);
    try {
      await apiClient.put('/settings/notifications', notificationSettings);
      addToast({
        title: "Success!",
        description: "Notification preferences saved successfully",
        variant: "success"
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveBuzzerAlertSettings = async () => {
    setSaving(true);
    try {
      // Validation
      const minTotalSeconds = buzzerAlertSettings.minHours * 3600 + buzzerAlertSettings.minMinutes * 60 + buzzerAlertSettings.minSeconds;
      const maxTotalSeconds = buzzerAlertSettings.maxHours * 3600 + buzzerAlertSettings.maxMinutes * 60 + buzzerAlertSettings.maxSeconds;
      
      if (minTotalSeconds >= maxTotalSeconds) {
        addToast({
          title: "Validation Error",
          description: "Minimum time must be less than maximum time",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      if (minTotalSeconds === 0) {
        addToast({
          title: "Validation Error",
          description: "Minimum time must be at least 1 second",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      if (buzzerAlertSettings.minHours > 48 || buzzerAlertSettings.maxHours > 48) {
        addToast({
          title: "Validation Error",
          description: "Hours cannot exceed 48",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      await apiClient.put('/buzzer-config', buzzerAlertSettings);
      addToast({
        title: "Success!",
        description: "Buzzer alert configuration saved successfully",
        variant: "success"
      });
      await loadSettings(); // Reload to get updated config
    } catch (error) {
      addToast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save buzzer alert configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Holiday management functions
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.date) {
      addToast({
        title: "Error",
        description: "Name and date are required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/working-hours/holidays', newHoliday);
      addToast({
        title: "Success!",
        description: "Holiday added successfully",
        variant: "success"
      });
      setNewHoliday({ name: '', date: '', description: '' });
      setShowHolidayForm(false);
      await loadSettings(); // Refresh holidays
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to add holiday",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const showDeleteDialog = (holiday) => {
    setDeleteDialog({ show: true, holiday });
  };

  const handleDeleteHoliday = async () => {
    const { holiday } = deleteDialog;
    if (!holiday) return;

    setSaving(true);
    try {
      await apiClient.delete(`/working-hours/holidays/${holiday.id}`);
      addToast({
        title: "Success!",
        description: "Holiday deleted successfully",
        variant: "success"
      });
      setDeleteDialog({ show: false, holiday: null });
      await loadSettings(); // Refresh holidays
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to delete holiday",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ show: false, holiday: null });
  };

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            Only MACSOFT_ADMIN users can access system settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 rounded-b-none border-b-0">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <SettingsIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600 mt-1">Manage system configuration and preferences</p>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Admin Only
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('ticket-codes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'ticket-codes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Ticket Codes
                </div>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'notifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </div>
              </button>
              <button
                onClick={() => setActiveTab('working-hours')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'working-hours'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Working Hours
                </div>
              </button>
              <button
                onClick={() => setActiveTab('buzzer-alerts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'buzzer-alerts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Buzzer Alerts
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Ticket Code Settings Form */}
        {activeTab === 'ticket-codes' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 rounded-t-none">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Ticket Code Configuration</h2>
              </div>
              <p className="text-gray-600">Configure how ticket codes are generated for new tickets.</p>
            </div>

            <form className="p-6 space-y-8">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm font-medium text-blue-600 mb-1">Current Year</div>
                  <div className="text-2xl font-bold text-blue-700">{ticketCodeSettings.stats.year}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-sm font-medium text-green-600 mb-1">Total Tickets</div>
                  <div className="text-2xl font-bold text-green-700">{ticketCodeSettings.stats.totalTickets}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-sm font-medium text-purple-600 mb-1">Next Number</div>
                  <div className="text-2xl font-bold text-purple-700">{ticketCodeSettings.nextNumber}</div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="currentPrefix" className="text-sm font-medium text-gray-700 mb-2 block">
                    Current Prefix
                  </Label>
                  <Input
                    id="currentPrefix"
                    value={ticketCodeSettings.currentPrefix}
                    disabled
                    className="bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <Label htmlFor="newPrefix" className="text-sm font-medium text-gray-700 mb-2 block">
                    New Prefix
                  </Label>
                  <Input
                    id="newPrefix"
                    value={ticketCodeSettings.newPrefix}
                    onChange={(e) => handlePrefixChange(e.target.value)}
                    placeholder="Enter new prefix (e.g., TKT, MACS, URGENT)"
                    maxLength={10}
                    className="uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use 3-5 uppercase characters for best results
                  </p>
                </div>
              </div>

              {/* Preview Section */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  <Eye className="h-4 w-4 inline mr-1" />
                  Preview Next Ticket Code
                </Label>
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                  <code className="text-xl font-mono text-blue-600 font-bold">
                    {ticketCodeSettings.previewCode}
                  </code>
                </div>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> Changing the prefix will only affect new tickets created after saving. 
                      Existing tickets will keep their current codes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <Button 
                  type="button"
                  onClick={saveTicketCodeSettings}
                  disabled={saving || ticketCodeSettings.newPrefix === ticketCodeSettings.currentPrefix}
                  variant="primary"
                  className="flex-1 sm:flex-none"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Prefix Changes
                    </>
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={loadSettings}
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Notification Settings Form */}
        {activeTab === 'notifications' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200  rounded-t-none">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
              </div>
              <p className="text-gray-600">Configure system-wide notification settings for all users.</p>
            </div>

            <form className="p-6 space-y-8">
              {/* General Notifications Section */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">General Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <Label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                        Email Notifications
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Send notifications via email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <Label htmlFor="pushNotifications" className="text-sm font-medium text-gray-700">
                        Push Notifications
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Send real-time push notifications</p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Ticket Notifications Section */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Ticket Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <Label htmlFor="ticketCreated" className="text-sm font-medium text-gray-700">
                        Ticket Created
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Notify when new tickets are created</p>
                    </div>
                    <Switch
                      id="ticketCreated"
                      checked={notificationSettings.ticketCreated}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, ticketCreated: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <Label htmlFor="ticketUpdated" className="text-sm font-medium text-gray-700">
                        Ticket Updated
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Notify when tickets are updated</p>
                    </div>
                    <Switch
                      id="ticketUpdated"
                      checked={notificationSettings.ticketUpdated}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, ticketUpdated: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <Label htmlFor="ticketAssigned" className="text-sm font-medium text-gray-700">
                        Ticket Assigned
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Notify when tickets are assigned to service centers</p>
                    </div>
                    <Switch
                      id="ticketAssigned"
                      checked={notificationSettings.ticketAssigned}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, ticketAssigned: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <Label htmlFor="milestoneCompleted" className="text-sm font-medium text-gray-700">
                        Milestone Completed
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Notify when ticket milestones are completed</p>
                    </div>
                    <Switch
                      id="milestoneCompleted"
                      checked={notificationSettings.milestoneCompleted}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, milestoneCompleted: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* System Notifications Section */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">System Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <Label htmlFor="spareRequestApproval" className="text-sm font-medium text-gray-700">
                        Spare Request Approvals
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Notify about spare request approvals needed</p>
                    </div>
                    <Switch
                      id="spareRequestApproval"
                      checked={notificationSettings.spareRequestApproval}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, spareRequestApproval: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <Label htmlFor="systemMaintenance" className="text-sm font-medium text-gray-700">
                        System Maintenance
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Notify about scheduled system maintenance</p>
                    </div>
                    <Switch
                      id="systemMaintenance"
                      checked={notificationSettings.systemMaintenance}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, systemMaintenance: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Report Notifications Section */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Report Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <Label htmlFor="weeklyReports" className="text-sm font-medium text-gray-700">
                        Weekly Reports
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Send weekly system reports</p>
                    </div>
                    <Switch
                      id="weeklyReports"
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, weeklyReports: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <Label htmlFor="monthlyReports" className="text-sm font-medium text-gray-700">
                        Monthly Reports
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Send monthly system reports</p>
                    </div>
                    <Switch
                      id="monthlyReports"
                      checked={notificationSettings.monthlyReports}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, monthlyReports: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200">
                <Button 
                  type="button"
                  onClick={saveNotificationSettings}
                  disabled={saving}
                  variant="primary"
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Notification Settings
                    </>
                  )}
                </Button>
              </div>

              {/* Info Alert */}
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      These settings will apply to all users system-wide. Individual users can override 
                      some of these preferences in their profile settings.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Working Hours Settings Form */}
        {activeTab === 'working-hours' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 rounded-t-none">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Working Hours Configuration</h2>
              </div>
              <p className="text-gray-600">Configure office hours, break times, and holidays for buzzer alert scheduling.</p>
            </div>

            <div className="p-6 space-y-8">
              {/* Working Hours Section */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-4">Office Hours</h3>
                <div className="space-y-3">
                  {workingHoursSettings.workingHours.map((wh) => {
                    const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                    return (
                      <div key={wh.dayOfWeek} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <span className="font-medium text-gray-900 w-20">{dayNames[wh.dayOfWeek]}</span>
                          <Switch
                            checked={wh.isActive}
                            onCheckedChange={async (checked) => {
                              try {
                                await apiClient.put(`/working-hours/working-hours/${wh.dayOfWeek}`, {
                                  startHour: wh.startHour,
                                  endHour: wh.endHour,
                                  isActive: checked
                                });
                                setWorkingHoursSettings(prev => ({
                                  ...prev,
                                  workingHours: prev.workingHours.map(h => 
                                    h.dayOfWeek === wh.dayOfWeek ? { ...h, isActive: checked } : h
                                  )
                                }));
                                addToast({
                                  title: "Success",
                                  description: `${dayNames[wh.dayOfWeek]} hours updated`,
                                  variant: "success"
                                });
                              } catch (error) {
                                addToast({
                                  title: "Error",
                                  description: "Failed to update working hours",
                                  variant: "destructive"
                                });
                              }
                            }}
                          />
                        </div>
                        {wh.isActive && (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="0"
                              max="23"
                              value={wh.startHour}
                              onChange={async (e) => {
                                const newStartHour = parseInt(e.target.value);
                                try {
                                  await apiClient.put(`/working-hours/working-hours/${wh.dayOfWeek}`, {
                                    startHour: newStartHour,
                                    endHour: wh.endHour,
                                    isActive: wh.isActive
                                  });
                                  setWorkingHoursSettings(prev => ({
                                    ...prev,
                                    workingHours: prev.workingHours.map(h => 
                                      h.dayOfWeek === wh.dayOfWeek ? { ...h, startHour: newStartHour } : h
                                    )
                                  }));
                                } catch (error) {
                                  addToast({
                                    title: "Error",
                                    description: "Failed to update start hour",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              className="w-20"
                            />
                            <span className="text-gray-500">to</span>
                            <Input
                              type="number"
                              min="0"
                              max="23"
                              value={wh.endHour}
                              onChange={async (e) => {
                                const newEndHour = parseInt(e.target.value);
                                try {
                                  await apiClient.put(`/working-hours/working-hours/${wh.dayOfWeek}`, {
                                    startHour: wh.startHour,
                                    endHour: newEndHour,
                                    isActive: wh.isActive
                                  });
                                  setWorkingHoursSettings(prev => ({
                                    ...prev,
                                    workingHours: prev.workingHours.map(h => 
                                      h.dayOfWeek === wh.dayOfWeek ? { ...h, endHour: newEndHour } : h
                                    )
                                  }));
                                } catch (error) {
                                  addToast({
                                    title: "Error",
                                    description: "Failed to update end hour",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              className="w-20"
                            />
                            <span className="text-gray-500 text-sm text-nowrap">
                              ({moment().hour(wh.startHour).minute(0).format('h:mm A')} - {moment().hour(wh.endHour).minute(0).format('h:mm A')})
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Break Times Section */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-4">Break Times</h3>
                <div className="space-y-3">
                  {workingHoursSettings.breakTimes.map((bt) => (
                    <div key={bt.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-gray-900 w-32">{bt.name}</span>
                        <Switch
                          checked={bt.isActive}
                          onCheckedChange={async (checked) => {
                            try {
                              await apiClient.put(`/working-hours/break-times/${bt.id}`, {
                                ...bt,
                                isActive: checked
                              });
                              setWorkingHoursSettings(prev => ({
                                ...prev,
                                breakTimes: prev.breakTimes.map(b => 
                                  b.id === bt.id ? { ...b, isActive: checked } : b
                                )
                              }));
                              addToast({
                                title: "Success",
                                description: `${bt.name} updated`,
                                variant: "success"
                              });
                            } catch (error) {
                              addToast({
                                title: "Error",
                                description: "Failed to update break time",
                                variant: "destructive"
                              });
                            }
                          }}
                        />
                      </div>
                      {bt.isActive && (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={bt.startHour}
                            onChange={async (e) => {
                              const newStartHour = parseInt(e.target.value);
                              try {
                                await apiClient.put(`/working-hours/break-times/${bt.id}`, {
                                  ...bt,
                                  startHour: newStartHour
                                });
                                setWorkingHoursSettings(prev => ({
                                  ...prev,
                                  breakTimes: prev.breakTimes.map(b => 
                                    b.id === bt.id ? { ...b, startHour: newStartHour } : b
                                  )
                                }));
                              } catch (error) {
                                addToast({
                                  title: "Error",
                                  description: "Failed to update break time",
                                  variant: "destructive"
                                });
                              }
                            }}
                            className="w-20"
                          />
                          <span className="text-gray-500">:</span>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={bt.startMinute}
                            onChange={async (e) => {
                              const newStartMinute = parseInt(e.target.value);
                              try {
                                await apiClient.put(`/working-hours/break-times/${bt.id}`, {
                                  ...bt,
                                  startMinute: newStartMinute
                                });
                                setWorkingHoursSettings(prev => ({
                                  ...prev,
                                  breakTimes: prev.breakTimes.map(b => 
                                    b.id === bt.id ? { ...b, startMinute: newStartMinute } : b
                                  )
                                }));
                              } catch (error) {
                                addToast({
                                  title: "Error",
                                  description: "Failed to update break time",
                                  variant: "destructive"
                                });
                              }
                            }}
                            className="w-20"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={bt.endHour}
                            onChange={async (e) => {
                              const newEndHour = parseInt(e.target.value);
                              try {
                                await apiClient.put(`/working-hours/break-times/${bt.id}`, {
                                  ...bt,
                                  endHour: newEndHour
                                });
                                setWorkingHoursSettings(prev => ({
                                  ...prev,
                                  breakTimes: prev.breakTimes.map(b => 
                                    b.id === bt.id ? { ...b, endHour: newEndHour } : b
                                  )
                                }));
                              } catch (error) {
                                addToast({
                                  title: "Error",
                                  description: "Failed to update break time",
                                  variant: "destructive"
                                });
                              }
                            }}
                            className="w-20"
                          />
                          <span className="text-gray-500">:</span>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={bt.endMinute}
                            onChange={async (e) => {
                              const newEndMinute = parseInt(e.target.value);
                              try {
                                await apiClient.put(`/working-hours/break-times/${bt.id}`, {
                                  ...bt,
                                  endMinute: newEndMinute
                                });
                                setWorkingHoursSettings(prev => ({
                                  ...prev,
                                  breakTimes: prev.breakTimes.map(b => 
                                    b.id === bt.id ? { ...b, endMinute: newEndMinute } : b
                                  )
                                }));
                              } catch (error) {
                                addToast({
                                  title: "Error",
                                  description: "Failed to update break time",
                                  variant: "destructive"
                                });
                              }
                            }}
                            className="w-20"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Holidays Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold text-gray-900">Office Holidays</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHolidayForm(!showHolidayForm)}
                    disabled={saving}
                  >
                    {showHolidayForm ? 'Cancel' : 'Add Holiday'}
                  </Button>
                </div>

                {/* Add Holiday Form */}
                {showHolidayForm && (
                  <form onSubmit={handleAddHoliday} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="holidayName" className="text-sm font-medium text-gray-700">
                          Holiday Name *
                        </Label>
                        <Input
                          id="holidayName"
                          type="text"
                          value={newHoliday.name}
                          onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                          placeholder="e.g., Christmas"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="holidayDate" className="text-sm font-medium text-gray-700">
                          Date *
                        </Label>
                        <Input
                          id="holidayDate"
                          type="date"
                          value={newHoliday.date}
                          onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="holidayDescription" className="text-sm font-medium text-gray-700">
                        Description (optional)
                      </Label>
                      <Input
                        id="holidayDescription"
                        type="text"
                        value={newHoliday.description}
                        onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                        placeholder="Optional description"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? 'Adding...' : 'Add Holiday'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowHolidayForm(false);
                          setNewHoliday({ name: '', date: '', description: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {workingHoursSettings.holidays.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                      No holidays configured. Click "Add Holiday" to create one.
                    </div>
                  ) : (
                    workingHoursSettings.holidays.map((holiday) => (
                      <div key={holiday.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4 flex-1">
                          <span className="font-medium text-gray-900">{holiday.name}</span>
                          <span className="text-gray-500 text-sm">
                            {moment(holiday.date).format('MMM DD, YYYY')}
                          </span>
                          {holiday.description && (
                            <span className="text-gray-400 text-sm">- {holiday.description}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={holiday.isActive}
                            onCheckedChange={async (checked) => {
                              try {
                                await apiClient.put(`/working-hours/holidays/${holiday.id}`, {
                                  ...holiday,
                                  isActive: checked
                                });
                                setWorkingHoursSettings(prev => ({
                                  ...prev,
                                  holidays: prev.holidays.map(h => 
                                    h.id === holiday.id ? { ...h, isActive: checked } : h
                                  )
                                }));
                                addToast({
                                  title: "Success",
                                  description: `${holiday.name} ${checked ? 'activated' : 'deactivated'}`,
                                  variant: "success"
                                });
                              } catch (error) {
                                addToast({
                                  title: "Error",
                                  description: "Failed to update holiday",
                                  variant: "destructive"
                                });
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => showDeleteDialog(holiday)}
                            disabled={saving}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Status Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">How This Works</h4>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Buzzer alerts will only be sent during active working hours</p>
                  <p>• Break times automatically suspend alerts even during working hours</p>
                  <p>• Holidays override working hours - no alerts will be sent on holiday dates</p>
                  <p>• Changes take effect immediately for all future buzzer alerts</p>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={loadSettings}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Configuration
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Buzzer Alert Settings Form */}
        {activeTab === 'buzzer-alerts' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 rounded-t-none">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Buzzer Alert Configuration</h2>
              </div>
              <p className="text-gray-600">Configure when buzzer alerts are triggered for pending customer messages.</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Alert Time Window Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900">Alert Time Window</h3>
                    <p className="text-sm text-gray-500">Set the time range for triggering buzzer alerts</p>
                  </div>
                  <Switch
                    checked={buzzerAlertSettings.isActive}
                    onCheckedChange={(checked) => setBuzzerAlertSettings(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Minimum Time Configuration */}
                  <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900">Minimum Time Before Alert</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="minHours" className="text-xs font-medium text-gray-600">Hours</Label>
                        <Input
                          id="minHours"
                          type="number"
                          min="0"
                          max="48"
                          value={buzzerAlertSettings.minHours}
                          onChange={(e) => setBuzzerAlertSettings(prev => ({
                            ...prev,
                            minHours: parseInt(e.target.value) || 0
                          }))}
                          disabled={!buzzerAlertSettings.isActive}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minMinutes" className="text-xs font-medium text-gray-600">Minutes</Label>
                        <Input
                          id="minMinutes"
                          type="number"
                          min="0"
                          max="59"
                          value={buzzerAlertSettings.minMinutes}
                          onChange={(e) => setBuzzerAlertSettings(prev => ({
                            ...prev,
                            minMinutes: parseInt(e.target.value) || 0
                          }))}
                          disabled={!buzzerAlertSettings.isActive}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minSeconds" className="text-xs font-medium text-gray-600">Seconds</Label>
                        <Input
                          id="minSeconds"
                          type="number"
                          min="0"
                          max="59"
                          value={buzzerAlertSettings.minSeconds}
                          onChange={(e) => setBuzzerAlertSettings(prev => ({
                            ...prev,
                            minSeconds: parseInt(e.target.value) || 0
                          }))}
                          disabled={!buzzerAlertSettings.isActive}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Start triggering alerts after this duration since last customer message
                    </p>
                  </div>

                  {/* Maximum Time Configuration */}
                  <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900">Maximum Time Before Alert</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="maxHours" className="text-xs font-medium text-gray-600">Hours</Label>
                        <Input
                          id="maxHours"
                          type="number"
                          min="0"
                          max="48"
                          value={buzzerAlertSettings.maxHours}
                          onChange={(e) => setBuzzerAlertSettings(prev => ({
                            ...prev,
                            maxHours: parseInt(e.target.value) || 0
                          }))}
                          disabled={!buzzerAlertSettings.isActive}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxMinutes" className="text-xs font-medium text-gray-600">Minutes</Label>
                        <Input
                          id="maxMinutes"
                          type="number"
                          min="0"
                          max="59"
                          value={buzzerAlertSettings.maxMinutes}
                          onChange={(e) => setBuzzerAlertSettings(prev => ({
                            ...prev,
                            maxMinutes: parseInt(e.target.value) || 0
                          }))}
                          disabled={!buzzerAlertSettings.isActive}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxSeconds" className="text-xs font-medium text-gray-600">Seconds</Label>
                        <Input
                          id="maxSeconds"
                          type="number"
                          min="0"
                          max="59"
                          value={buzzerAlertSettings.maxSeconds}
                          onChange={(e) => setBuzzerAlertSettings(prev => ({
                            ...prev,
                            maxSeconds: parseInt(e.target.value) || 0
                          }))}
                          disabled={!buzzerAlertSettings.isActive}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Stop triggering alerts after this duration (messages older than this are ignored)
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description (Optional)
                  </Label>
                  <Input
                    id="description"
                    type="text"
                    value={buzzerAlertSettings.description}
                    onChange={(e) => setBuzzerAlertSettings(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="e.g., Default buzzer alert configuration"
                    disabled={!buzzerAlertSettings.isActive}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Current Configuration Preview */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-3">Current Alert Behavior</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${buzzerAlertSettings.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-gray-700">
                          Status: <span className="font-medium">{buzzerAlertSettings.isActive ? 'Active' : 'Inactive'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          Alert window: <span className="font-medium">
                            {buzzerAlertSettings.minHours}h {buzzerAlertSettings.minMinutes}m {buzzerAlertSettings.minSeconds}s - {buzzerAlertSettings.maxHours}h {buzzerAlertSettings.maxMinutes}m {buzzerAlertSettings.maxSeconds}s
                          </span> after last customer message
                        </span>
                      </div>
                      <div className="mt-3 p-3 bg-white/50 rounded border border-orange-200">
                        <p className="text-xs text-gray-600">
                          <strong>Example:</strong> If a customer sends a message at 10:00:00 AM, buzzer alerts will trigger between{' '}
                          <span className="font-medium text-orange-700">
                            {(() => {
                              const startTime = new Date();
                              const minTotalSeconds = buzzerAlertSettings.minHours * 3600 + buzzerAlertSettings.minMinutes * 60 + buzzerAlertSettings.minSeconds;
                              const maxTotalSeconds = buzzerAlertSettings.maxHours * 3600 + buzzerAlertSettings.maxMinutes * 60 + buzzerAlertSettings.maxSeconds;
                              
                              startTime.setHours(10, 0, 0, 0);
                              startTime.setSeconds(startTime.getSeconds() + minTotalSeconds);
                              
                              const endTime = new Date();
                              endTime.setHours(10, 0, 0, 0);
                              endTime.setSeconds(endTime.getSeconds() + maxTotalSeconds);
                              
                              return `${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} and ${endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
                            })()}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Information Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">How Buzzer Alerts Work</h4>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Buzzer alerts notify Macsoft staff when customer messages are awaiting response</p>
                  <p>• Alerts only trigger during configured working hours (see Working Hours tab)</p>
                  <p>• The time window prevents alert fatigue from very old or very recent messages</p>
                  <p>• Visual effects (red pulsing, vibration) appear on ticket cards when alerts trigger</p>
                  <p>• Alerts automatically clear after 30 seconds or when staff responds to the message</p>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200 gap-3">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={loadSettings}
                  disabled={loading || saving}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Reset Changes
                </Button>
                <Button 
                  type="button"
                  onClick={saveBuzzerAlertSettings}
                  disabled={saving || !buzzerAlertSettings.isActive}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Holiday Confirmation Dialog */}
        {deleteDialog.show && (
          <div className="fixed inset-0 bg-black/25 duration-300 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Holiday</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete "<span className="font-medium">{deleteDialog.holiday?.name}</span>"? 
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelDelete}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteHoliday}
                    disabled={saving}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {saving ? 'Deleting...' : 'Delete Holiday'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;