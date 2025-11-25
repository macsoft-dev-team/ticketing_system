import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';
import MilestoneTimeline from '../../components/MilestoneTimeline';
import PhotoUploadModal from '../../components/PhotoUploadModal';
import ServiceCenterAssignmentModal from '../../components/ServiceCenterAssignmentModal';
import {
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  Phone,
  FileText,
  Download,
  Settings,
  Cpu,
  Smartphone,
  Zap,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  GitBranch,
  Building
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { ChatWindow } from '../../components/ui/chat';
import { SpareRequestForm } from '../../components/ui/spareRequestForm';
import { useToast } from '../../components/ui/toast';
import useTickets from '../../lib/hooks/useTickets';
import { useAuth } from '../../lib/hooks/useAuth';
import useConversation from '../../lib/hooks/useConversation';

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to map ticket data from API response to component format
const mapTicketData = (apiTicket) => {
  if (!apiTicket || !apiTicket.id) return {};

  return {
    id: apiTicket.id,
    ticketCode: apiTicket.ticketCode,
    raisedDate: apiTicket.createdAt,
    updatedAt: apiTicket.updatedAt,
    dueDate: null, // Add due date logic if available in your API
    status: apiTicket.status?.toLowerCase() || 'open',
    description: apiTicket.description || '',
    complaintType: apiTicket.complaintType || '',
    state: apiTicket.state || '', // Add state at root level for service center assignment
    assignedServiceCenter: apiTicket.assignedServiceCenter || null, // Add assigned service center
    attachments: (apiTicket.attachments || []).map(att => ({
      id: att.id,
      name: att.fileName,
      type: att.fileType?.startsWith('image/') ? 'image' : 'file',
      size: formatFileSize(att.fileSize),
      url: att.fileUrl,
      mimetype: att.fileType,
      createdAt: att.createdAt
    })),
    customer: {
      name: apiTicket.customerName || 'N/A',
      phone: apiTicket.createdByUser?.phone || 'N/A',
      email: apiTicket.createdByUser?.email || 'N/A',
      address: `Village ${apiTicket.village || apiTicket.block || ''}, Block ${apiTicket.block || ''}, District ${apiTicket.district || ''}, ${apiTicket.state || ''}`,
      district: apiTicket.district || '',
      block: apiTicket.block || '',
      village: apiTicket.village || apiTicket.block || '',
      state: apiTicket.state || ''
    },
    controller: {
      controllerNo: apiTicket.controllerNo || '',
      imei: apiTicket.imei || '',
      hp: apiTicket.hp || '',
      motorType: apiTicket.motorType || '',
      faultCode: apiTicket.faultCode || ''
    },
    createdBy: apiTicket.createdByUser || null,
    updatedBy: apiTicket.updatedByUser || null,
    messages: apiTicket.messages || [],
    notifications: apiTicket.notifications || []
  };
};


const StatusBadge = ({ status }) => {
  const statusConfig = {
    'open': { variant: 'info', label: 'Open', icon: Clock },
    'in-progress': { variant: 'warning', label: 'In Progress', icon: Settings },
    'resolved': { variant: 'success', label: 'Resolved', icon: CheckCircle },
    'closed': { variant: 'dark', label: 'Closed', icon: XCircle },
    'pending': { variant: 'warning', label: 'Pending', icon: Clock },
    'assigned': { variant: 'info', label: 'Assigned', icon: Settings }
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig['open'];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon size={12} />
      {config.label}
    </Badge>
  );
};

const AttachmentItem = ({ attachment, showPreview = false, token, addToast }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const getIcon = (type) => {
    return type === 'image' ? '🖼️' : '📄';
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      let downloadUrl;

      // Use dedicated download endpoint if attachment has an ID
      if (attachment.id) {
        downloadUrl = `${baseUrl}/api/attachments/download/${attachment.id}`;
      } else {
        // Fallback to direct file URL
        downloadUrl = `${baseUrl}${attachment.url}`;
      }
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        // Try fallback method - direct link
        if (attachment.url) {
          const fallbackUrl = `${baseUrl}${attachment.url}`;
           window.open(fallbackUrl, '_blank');
          if (addToast) addToast({
            title: `Opening ${attachment.name}`,
            description: 'File opened in new tab',
            variant: 'success'
          });
          return;
        }
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (addToast) addToast({
        title: `Downloaded ${attachment.name}`,
        description: 'File saved to your downloads folder',
        variant: 'success'
      });
    } catch (error) {
      console.error('Download failed:', error);

      // Final fallback - try direct URL in new tab
      if (attachment.url) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const fallbackUrl = `${baseUrl}${attachment.url}`;
         window.open(fallbackUrl, '_blank');
        if (addToast) addToast({
          title: `Opening ${attachment.name}`,
          description: 'File opened in new tab',
          variant: 'success'
        });
      } else {
        if (addToast) addToast({
          title: 'Download failed',
          description: 'Please check your connection and try again',
          variant: 'error'
        });
        else alert('Download failed. Please try again.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = () => {
    if (attachment.type === 'image') {
      // Open image in a new tab/window
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      window.open(`${baseUrl}${attachment.url}`, '_blank');
    } else {
      // For non-image files, trigger download
      handleDownload();
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={showPreview ? handlePreview : undefined}
      className={`group flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${showPreview ? 'cursor-pointer' : ''}`}
    >
      <span className="text-2xl">{getIcon(attachment.type)}</span>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 truncate">{attachment.name}</h4>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">{attachment.size}</p>
          {attachment.mimetype && (
            <span className="text-xs bg-gray-200 px-2 py-1 rounded uppercase">
              {attachment.mimetype.split('/')[1]?.slice(0, 4)}
            </span>
          )}
          {attachment.createdAt && (
            <span className="text-xs text-gray-500">
              {moment(attachment.createdAt).fromNow()}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {attachment.type === 'image' && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePreview}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
            title="Preview"
          >
            👁️
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDownload}
          disabled={isDownloading}
          className={`p-2 transition-colors ${isDownloading
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-600 hover:text-blue-800'
            }`}
          title={isDownloading ? 'Downloading...' : 'Download'}
        >
          {isDownloading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
            />
          ) : (
            <Download size={16} />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default function TicketDashboard() {
  const { ticket, fetchTicketById, updateMilestone, loading, error } = useTickets();
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const { ticketId } = useParams();
  const navigate = useNavigate();

  // Use the new conversation hook
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    isConnected: socketConnected,
    sendMessage: sendConversationMessage,
    refreshMessages,
  } = useConversation(ticketId);

  const [ticketData, setTicketData] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState(null);
  const [showSpareRequestForm, setShowSpareRequestForm] = useState(false);
  const [activeTab, setActiveTab] = useState('ticket'); // For mobile tabs
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [showServiceCenterModal, setShowServiceCenterModal] = useState(false);

  // Auto-close timer simulation
  useEffect(() => {
    // Simulate auto-close timer when admin sends message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.isOwnMessage) {
      setAutoCloseTimer(600); // 10 minutes in seconds
      const interval = setInterval(() => {
        setAutoCloseTimer(prev => {
          if (prev <= 1) {
            // Auto close conversation
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (message, attachments) => {
    try {
      await sendConversationMessage(message, attachments);
      setAutoCloseTimer(null);
      addToast({
        title: 'Message sent',
        description: 'Your message has been sent successfully',
        variant: 'success'
      });
    } catch (error) {
      addToast({
        title: 'Failed to send message',
        description: error.message || 'Please try again',
        variant: 'error'
      });
    }
  }, [sendConversationMessage, addToast, ticketId, user, token]);

  const handleSpareRequestSubmit = useCallback(async (formData) => {
     try {
      const spareItems = formData.products.map(product => {
        return {
          productId: parseInt(product.productId, 10),
          quantity: product.quantity
        };
      });

      const requestData = {
        ticketCode: ticketData.ticketCode,
        spareItems,
        requestReason: formData.requestReason || 'Spare parts required',
        urgencyLevel: formData.urgencyLevel || 'NORMAL',
        expectedDelivery: formData.expectedDelivery,
        additionalNotes: formData.additionalNotes
      };
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/spare-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit spare request');
      }

      // Close form
      setShowSpareRequestForm(false);

      // Show success notification
      addToast({
        title: 'Spare Request Submitted',
        description: `Request for ${spareItems.length} item(s) submitted and milestone updated to Spare Approved`,
        variant: 'success'
      });

      // Refresh ticket data to show updated milestone
      await fetchTicketById(ticketId);
    } catch (error) {
      addToast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit spare request. Please try again.',
        variant: 'error'
      });
    }
  }, [ticketData.ticketCode, token, addToast, fetchTicketById, ticketId]);

  const handleMilestoneAction = useCallback(async (actionData) => {
    const { action, targetStage, currentStage } = actionData;

    try {
      if (action === 'spare_request') {
        // Open spare request form
        setShowSpareRequestForm(true);
      } else if (action === 'upload_photos') {
        // Open photo upload modal
        setShowPhotoUploadModal(true);
      } else if (action === 'service_center_assignment') {
        // Open service center assignment modal
        setShowServiceCenterModal(true);
      } else if (action === 'transition') {
        // Transition to next stage using updateMilestone hook
        const resultAction = await updateMilestone({
          ticketId: parseInt(ticketId),
          milestoneData: {
            targetStage: targetStage,
            action: 'transition'
          }
        });

        // Check if the action was successful
        if (resultAction.meta.requestStatus === 'fulfilled') {
          const stageDisplayName = targetStage.replace(/_/g, ' ').toLowerCase();
          let successMessage = `Successfully advanced to ${stageDisplayName}`;
          let successTitle = 'Milestone Updated';

          // Special message for spare approval
          if (targetStage === 'SPARE_APPROVED') {
            successTitle = 'Spare Request Approved';
            successMessage = 'All pending spare requests have been approved and milestone updated';

            // Check if we have spare approval details in the response
            const responseData = resultAction.payload;
            if (responseData?.milestone?.spareApprovalResult) {
              const { approvedRequests, approvedItems } = responseData.milestone.spareApprovalResult;
              if (approvedRequests > 0) {
                successMessage = `Approved ${approvedRequests} spare request(s) with ${approvedItems} item(s) and updated milestone`;
              }
            }
          }

          addToast({
            title: successTitle,
            description: successMessage,
            variant: 'success'
          });
          await fetchTicketById(ticketId);
        } else {
          throw new Error(resultAction.payload || 'Failed to transition milestone');
        }
      }
    } catch (error) {
      console.error('Error handling milestone action:', error);
      addToast({
        title: 'Action Failed',
        description: error.message || 'An error occurred',
        variant: 'error'
      });
    }
  }, [ticketId, updateMilestone, addToast, fetchTicketById]);

  const handlePhotoUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    try {
      setUploadingPhotos(true);

      // Use updateMilestone from ticket hook
      const resultAction = await updateMilestone({
        ticketId: parseInt(ticketId),
        milestoneData: {
          attachments: files,
          action: 'add_photos'
        }
      });

      // Check if the action was successful
      if (resultAction.meta.requestStatus === 'fulfilled') {
        addToast({
          title: 'Photos Uploaded',
          description: `${files.length} photo(s) added to current milestone`,
          variant: 'success'
        });
        await fetchTicketById(ticketId);
      } else {
        throw new Error(resultAction.payload || 'Failed to upload photos');
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      addToast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload photos',
        variant: 'error'
      });
      throw error; // Re-throw to let modal handle it
    } finally {
      setUploadingPhotos(false);
    }
  }, [ticketId, updateMilestone, addToast, fetchTicketById]);

  const handleServiceCenterAssignment = useCallback(async (assignedCenter) => {
    // Refresh ticket data after successful assignment (handled by the modal)
    await fetchTicketById(ticketId);
    addToast({
      title: 'Service Center Assigned',
      description: `Service center ${assignedCenter.name} assigned successfully`,
      variant: 'success'
    });
  }, [ticketId, fetchTicketById, addToast]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return moment(dateString).format('DD MMM YYYY, hh:mm A');
  }, []);

  const handleBulkDownload = useCallback(async (attachments) => {
    setDownloadingAll(true);
    try {
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          let downloadUrl;

          // Use dedicated download endpoint if attachment has an ID
          if (attachment.id) {
            downloadUrl = `${baseUrl}/api/attachments/download/${attachment.id}`;
          } else {
            // Fallback to direct file URL
            downloadUrl = `${baseUrl}${attachment.url}`;
          }

          const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            console.error(`Failed to download ${attachment.name}`);
            continue;
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = attachment.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          // Add small delay between downloads to avoid overwhelming the browser
          if (i < attachments.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Failed to download ${attachment.name}:`, error);
        }
      }

      addToast({
        title: `Downloaded ${attachments.length} files`,
        description: 'All attachments saved to your downloads folder',
        variant: 'success'
      });
    } finally {
      setDownloadingAll(false);
    }
  }, [token]);



  // Mobile tab navigation
  const tabs = useMemo(() => [
    { id: 'ticket', label: 'Ticket', icon: FileText },
    { id: 'controller', label: 'Controller', icon: Cpu },
    { id: 'milestones', label: 'Progress', icon: GitBranch },
    { id: 'chat', label: 'Chat', icon: MessageSquare }
  ], []);

  // Get current milestone from ticket
  const currentMilestone = useMemo(() => {
    if (!ticket?.ticketMilestones) return null;
    return ticket.ticketMilestones.find(m => m.status === 'IN_PROGRESS') || null;
  }, [ticket?.ticketMilestones]);

  // Get photo modal info based on current milestone
  const photoModalInfo = useMemo(() => {
    if (!currentMilestone) return { title: 'Upload Photos', description: 'Add photos for this milestone' };

    const stageInfo = {
      REQUEST_CLEARED_AT_FIELD: {
        title: 'Upload Field Clearance Photos',
        description: 'Add photos confirming the issue has been resolved at field',
      },
      RECEIVED_AT_SERVICE_CENTER: {
        title: 'Upload Receipt Photos',
        description: 'Add photos of the controller received at service center',
      },
      SPARE_REQUESTED: {
        title: 'Upload Spare Parts Photos',
        description: 'Add photos of the requested spare parts',
      },
      READY_FOR_DISPATCH: {
        title: 'Upload Dispatch Photos',
        description: 'Add photos of the controller ready for dispatch',
      },
    };

    return stageInfo[currentMilestone.stage] || {
      title: 'Upload Milestone Photos',
      description: `Add photos for ${currentMilestone.stage.replace(/_/g, ' ')}`,
    };
  }, [currentMilestone]);

  useEffect(() => {
    if (ticketId) {
      fetchTicketById(ticketId);
    }
  }, [ticketId]); // Remove fetchTicketById from dependencies

  // Update ticket data when ticket from hook changes
  useEffect(() => {
    if (ticket && ticket.id) {
      const mappedData = mapTicketData(ticket);
      setTicketData(mappedData);
    }
  }, [ticket?.id, ticket?.updatedAt]); // Only re-run when ticket ID or update time changes

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Ticket</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/tickets')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  // No ticket data
  if (!ticketData.ticketCode) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-600 mb-4">The requested ticket could not be found.</p>
          <button
            onClick={() => navigate('/tickets')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/tickets')}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </motion.button>
            <div>
              <h1 className="uppercase tracking-wide font-bold text-gray-900">
                Ticket {ticketData.ticketCode}
              </h1>
              <p className="text-sm text-gray-600">
                Raised on {formatDate(ticketData.raisedDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={ticketData.status} />
            {/* Service Center Assignment Button for MACSOFT_SUPPORT, MACSOFT_HEAD, and MACSOFT_ADMIN */}
            {/* Hide button after ticket has been sent to service center */}
            {(user?.role === 'MACSOFT_SUPPORT' || user?.role === 'MACSOFT_ADMIN' || user?.role === 'MACSOFT_HEAD') &&
              !ticket?.ticketMilestones?.some(milestone => milestone.stage === 'SENT_TO_SERVICE_CENTER') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowServiceCenterModal(true)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${ticketData.assignedServiceCenter
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                >
                  <Building size={16} />
                  {ticketData.assignedServiceCenter ? 'Reassign SC' : 'Assign SC'}
                </motion.button>
              )}
          </div>
        </div>
      </motion.div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden bg-white border-b border-gray-200">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-8rem)]">
        {/* Desktop: Split Layout, Mobile: Tab Content */}

        {/* Left Panel - Ticket & Customer Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`${activeTab === 'ticket' ? 'block' : 'hidden'
            } lg:block lg:w-1/3 bg-white lg:border-r border-gray-200 overflow-y-auto`}
        >
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Ticket Details */}
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <FileText className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                Ticket Details
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Ticket Code</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">{ticketData.ticketCode}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Status</p>
                    <StatusBadge status={ticketData.status} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Raised Date</p>
                    <p className="text-sm sm:text-base text-gray-900 flex items-center gap-2">
                      <Calendar className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                      {formatDate(ticketData.raisedDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Last Updated</p>
                    <p className="text-sm sm:text-base text-gray-900 flex items-center gap-2">
                      <Clock className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                      {formatDate(ticketData.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Complaint Type</p>
                    <p className="text-sm sm:text-base text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                      {ticketData.complaintType || 'N/A'}
                    </p>
                  </div>
                </div>
                {/* Service Center Assignment */}
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Assigned Service Center</p>
                  {ticket?.serviceCenter ? (
                    <div className="text-sm sm:text-base text-gray-900">
                      <div className="flex items-center gap-2 mb-1">
                        <Building className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                        <span className="font-medium">{ticket.serviceCenter.name}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Code: {ticket.serviceCenter.centerCode}
                        {ticket.serviceCenter.address && (
                          <span> • {ticket.serviceCenter.address}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm sm:text-base text-orange-600 flex items-center gap-2">
                      <AlertTriangle className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                      No service center assigned
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Fault detail</p>
                  <p className="text-sm sm:text-base text-gray-900 leading-relaxed">{ticketData.description}</p>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {ticketData.attachments && ticketData.attachments.length > 0 && (
              <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                    Attachments ({ticketData.attachments.length})
                  </h3>
                  {ticketData.attachments.length > 1 && (
                    <motion.button
                      whileHover={!downloadingAll ? { scale: 1.05 } : {}}
                      whileTap={!downloadingAll ? { scale: 0.95 } : {}}
                      onClick={() => handleBulkDownload(ticketData.attachments)}
                      disabled={downloadingAll}
                      className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${downloadingAll
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                    >
                      {downloadingAll ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-3 h-3 border border-white border-t-transparent rounded-full"
                          />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download size={12} />
                          Download All
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
                <div className="space-y-2">
                  {ticketData.attachments.map((attachment, index) => (
                    <AttachmentItem
                      key={attachment.id || index}
                      attachment={attachment}
                      showPreview={true}
                      token={token}
                      addToast={addToast}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Customer Details */}
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <User className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                Customer Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Name</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">{ticketData.customer?.name || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Phone</p>
                    <p className="text-sm sm:text-base text-gray-900 flex items-center gap-2">
                      <Phone className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                      <span className="break-all">{ticketData.customer?.phone || 'N/A'}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Created By</p>
                    <p className="text-sm sm:text-base text-gray-900 flex items-center gap-2">
                      <User className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                      <span className="break-all">{ticketData.createdBy?.name || 'N/A'}</span>
                    </p>
                  </div>
                </div>
                {ticketData.updatedBy && (
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Last Updated By</p>
                    <p className="text-sm sm:text-base text-gray-900 flex items-center gap-2">
                      <User className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                      <span className="break-all">{ticketData.updatedBy.name}</span>
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Address</p>
                  <p className="text-sm sm:text-base text-gray-900 flex items-start gap-2">
                    <MapPin className="w-[14px] h-[14px] sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                    <span>{ticketData.customer?.address || 'N/A'}</span>
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">State</p>
                    <p className="text-sm sm:text-base text-gray-900">{ticketData.customer?.state || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">District</p>
                    <p className="text-sm sm:text-base text-gray-900">{ticketData.customer?.district || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Block</p>
                    <p className="text-sm sm:text-base text-gray-900">{ticketData.customer?.block || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Village</p>
                    <p className="text-sm sm:text-base text-gray-900">{ticketData.customer?.village || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Middle Panel - Controller Details & Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${activeTab === 'controller' || activeTab === 'milestones' ? 'block' : 'hidden'
            } lg:block lg:w-1/3 bg-white lg:border-r border-gray-200 overflow-y-auto`}
        >
          {/* Controller Details - Always visible on desktop, shown when tab is active on mobile */}
          <div className={`${activeTab === 'milestones' ? 'hidden lg:block' : 'block'} p-4 sm:p-6`}>
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Cpu className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                Controller Details
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Controller No</p>
                  <p className="text-sm sm:text-base font-mono font-semibold text-gray-900 break-all">{ticketData.controller?.controllerNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">IMEI</p>
                  <p className="text-sm sm:text-base font-mono text-gray-900 flex items-center gap-2">
                    <Smartphone className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                    <span className="break-all">{ticketData.controller?.imei || 'N/A'}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">HP</p>
                  <p className="text-sm sm:text-base text-gray-900 flex items-center gap-2">
                    <Zap className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                    {ticketData.controller?.hp || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Motor Type</p>
                  <p className="text-sm sm:text-base text-gray-900">{ticketData.controller?.motorType || 'N/A'}</p>
                </div>
                {ticketData.controller?.faultCode && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2">
                      <AlertTriangle className="w-[14px] h-[14px] sm:w-4 sm:h-4 text-red-500" />
                      Fault Code
                    </p>
                    <Badge variant="danger" className="mt-1 text-xs sm:text-sm">
                      {ticketData.controller.faultCode}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Milestones - Shown when milestones tab is active on mobile */}
          <div className={`${activeTab === 'milestones' ? 'block' : 'hidden lg:block'} p-4 sm:p-6 border-t lg:border-t-0 border-gray-200`}>
            <MilestoneTimeline
              ticketId={ticketId}
              milestones={ticket?.ticketMilestones || []}
              onMilestoneUpdate={() => fetchTicketById(ticketId)}
              currentMilestone={currentMilestone}
              onAction={handleMilestoneAction}
              ticketStatus={ticketData?.status}
            />
          </div>
        </motion.div>

        {/* Right Panel - Conversation */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`${activeTab === 'chat' ? 'block' : 'hidden'
            } lg:block lg:w-1/3 bg-white h-full`}
        >
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            autoCloseTimer={autoCloseTimer}
            loading={messagesLoading}
            error={messagesError}
            isConnected={true}
            onRefresh={refreshMessages}
            ticketStatus={ticketData.status}
          />
        </motion.div>
      </div>


      {/* Spare Request Form Modal */}
      <AnimatePresence>
        {showSpareRequestForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-2 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            >
              <SpareRequestForm
                onSubmit={handleSpareRequestSubmit}
                onCancel={() => setShowSpareRequestForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={showPhotoUploadModal}
        onClose={() => setShowPhotoUploadModal(false)}
        onUpload={handlePhotoUpload}
        title={photoModalInfo.title}
        description={photoModalInfo.description}
        minPhotos={1}
        uploading={uploadingPhotos}
      />

      {/* Service Center Assignment Modal */}
      <ServiceCenterAssignmentModal
        isOpen={showServiceCenterModal}
        onClose={() => setShowServiceCenterModal(false)}
        ticket={ticketData}
        onSuccess={handleServiceCenterAssignment}
      />

    </div>
  );
}