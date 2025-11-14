import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Hash, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye
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
      
      addToast({
        title: "Success!",
        description: "Settings loaded successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('Error loading settings:', error);
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
      console.error('Error updating preview:', error);
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
      console.error('Error saving ticket code settings:', error);
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
      console.error('Error saving notification settings:', error);
      addToast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
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
      </div>
    </div>
  );
};

export default Settings;