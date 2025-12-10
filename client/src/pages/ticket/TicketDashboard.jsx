import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import moment from 'moment';
import MilestoneTimeline from '../../components/MilestoneTimeline';
import PhotoUploadModal from '../../components/PhotoUploadModal';
import ServiceCenterAssignmentModal from '../../components/ServiceCenterAssignmentModal';
import DocumentModal from '../../components/ui/DocumentModal';
import {
  ArrowLeft,
  Calendar,
  User,
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
  Building,
  Eye,
  Package,
  Hash,
  Loader2,
  X,
  Truck,
  MapPin,
  ChevronUp
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { ChatWindow } from '../../components/ui/chat';
import { SpareRequestForm } from '../../components/ui/spareRequestForm';
import { useToast } from '../../components/ui/toast';
import useTickets from '../../lib/hooks/useTickets';
import { useAuth } from '../../lib/hooks/useAuth';
import { useSocket } from '../../lib/contexts/SocketContext';
import useConversation from '../../lib/hooks/useConversation';
import {
  approveSpareRequestItem,
  rejectSpareRequestItem,
  getProductInventoryDetails,
  getProductTransactionHistory
} from '../../lib/api/spareApproval';
import { markTicketNotificationsAsSeen } from '../../lib/features/notifications';

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
    farmerName: apiTicket.farmerName || '',
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

const AttachmentItem = ({ attachment, showPreview = false, token, addToast, onPreview }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const getIcon = (type) => {
    return type === 'image' ? '🖼️' : '📄';
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);

    try {
      const baseApiUrl = import.meta.env.VITE_API_URL;
      const baseUrl = baseApiUrl?.replace('/api', '') || 'http://localhost:3057'; // Remove /api for file URLs
      let downloadUrl;

      // Try multiple download strategies
      const downloadStrategies = [];

      // Strategy 1: Use API endpoint if we have an ID and token
      if (attachment.id && token) {
        downloadStrategies.push({
          url: `${baseApiUrl}/attachments/download/${attachment.id}`,
          headers: { 'Authorization': `Bearer ${token}` },
          name: 'API with auth'
        });
      }

      // Strategy 2: Direct file access
      if (attachment.url) {
        const fileUrl = attachment.url.startsWith('/uploads/') ? attachment.url : `/uploads/${attachment.url}`;
        downloadStrategies.push({
          url: `${baseUrl}${fileUrl}`,
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          name: 'Direct file'
        });
      }

      // Try each strategy until one works
      let successful = false;
      for (const strategy of downloadStrategies) {
        try {
          const response = await fetch(strategy.url, {
            method: 'GET',
            headers: strategy.headers,
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = attachment.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            if (addToast) addToast({
              title: `Downloaded ${attachment.name}`,
              description: 'File saved to your downloads folder',
              variant: 'success'
            });
            successful = true;
            break;
          }
        } catch (error) {
          console.warn(`${strategy.name} failed:`, error);
        }
      }

      if (!successful) {
        throw new Error('All download strategies failed');
      }
    } catch (error) {
      if (addToast) addToast({
        title: 'Download failed',
        description: 'Please check your connection and try again',
        variant: 'error',
        duration: 7000
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    if (onPreview) {
      onPreview(attachment);
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
        <h4 className="font-medium text-gray-900 truncate sm:max-w-60">{attachment.name}</h4>
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
            className="p-2 cursor-pointer text-gray-500 hover:text-blue-600 transition-colors"
            title="Preview"
          >
            <Eye size={16} />
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDownload}
          disabled={isDownloading}
          className={`p-2 transition-colors ${isDownloading
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-600 hover:text-blue-800 cursor-pointer'
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
  const dispatch = useDispatch();
  const { ticket, fetchTicketById, updateMilestone, loading, error } = useTickets();
  const { user, token } = useAuth();
  const { setCurrentTicketId, markTicketNotificationsAsRead } = useSocket();
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
    // MessageSeen functions
    markMessagesAsSeen: originalMarkMessagesAsSeen,
    markMessageAsSeen,
    getUnreadCount,
  } = useConversation(ticketId);

  // Wrapper function to mark messages as seen and refresh ticket data
  const markMessagesAsSeen = useCallback(async (messageIds) => {
    try {
      // Only proceed if there are messages to mark
      if (!messageIds || (Array.isArray(messageIds) && messageIds.length === 0)) {
        return;
      }

      // Mark messages as seen
      const result = await originalMarkMessagesAsSeen(messageIds);

      // Only refresh ticket data if messages were actually marked as seen
      if (result && result.markedCount > 0) {
        await fetchTicketById(ticketId);
      }
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  }, [originalMarkMessagesAsSeen, fetchTicketById, ticketId]);

  const [ticketData, setTicketData] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState(null);
  const [showSpareRequestForm, setShowSpareRequestForm] = useState(false);
  const [activeTab, setActiveTab] = useState('ticket'); // For mobile tabs
  const [showScrollToTop, setShowScrollToTop] = useState(false); // For floating scroll button
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [showServiceCenterModal, setShowServiceCenterModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  // Spare request states
  const [spareRequests, setSpareRequests] = useState([]);
  const [loadingSpareRequests, setLoadingSpareRequests] = useState(false);
  const [showSpareRejectModal, setShowSpareRejectModal] = useState(false);
  const [rejectingSpareItem, setRejectingSpareItem] = useState(null);
  const [spareRejectReason, setSpareRejectReason] = useState('');
  const [spareActionLoading, setSpareActionLoading] = useState({});
  const [showSpareDetailModal, setShowSpareDetailModal] = useState(false);
  const [selectedSpareItem, setSelectedSpareItem] = useState(null);
  const [inventoryDetails, setInventoryDetails] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loadingInventoryDetails, setLoadingInventoryDetails] = useState(false);

  // Set current ticket ID for socket context (prevents sounds/toasts when user is in this ticket)
  useEffect(() => {
    if (ticketId) {
      const parsedTicketId = parseInt(ticketId);
      setCurrentTicketId(parsedTicketId);
      // Also set on window object for immediate access by socket handlers
      window.currentTicketId = parsedTicketId;
      return () => {
        setCurrentTicketId(null); // Clear when leaving ticket
        window.currentTicketId = null;
      };
    }
  }, [ticketId, setCurrentTicketId]);

  // Mark ticket-related notifications as seen when entering the ticket dashboard
  useEffect(() => {
    if (ticketId && user?.id) {

      // Update socket context state immediately for instant UI feedback
      markTicketNotificationsAsRead(ticketId);

      // Then update database and Redux store
      dispatch(markTicketNotificationsAsSeen(ticketId))

    }
  }, [ticketId, user?.id]);

  // Auto-close timer simulation - only trigger when last message changes
  useEffect(() => {
    if (messages.length === 0) return;

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
  }, [messages[messages.length - 1]?.id, messages[messages.length - 1]?.isOwnMessage]);

  const handleSendMessage = useCallback(async (message, attachments) => {
    try {
      await sendConversationMessage(message, attachments);
      setAutoCloseTimer(null);
    } catch (error) {
      addToast({
        title: 'Failed to send message',
        description: error.message || 'Please try again',
        variant: 'error',
        id: 'send-message-error',
        duration: 7000
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
      const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3057/api';
      const response = await fetch(`${baseApiUrl}/spare-requests`, {
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
        variant: 'error',
        id: 'spare-request-error',
        duration: 7000
      });
    }
  }, [ticketData.ticketCode, token, addToast, fetchTicketById, ticketId]);

  const handleUpdateNotes = useCallback(async (milestoneId, notes) => {
    try {
      const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3057/api';
      const response = await fetch(`${baseApiUrl}/tickets/${ticketId}/milestones/${milestoneId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to update notes');
      }

      addToast({
        title: 'Notes Updated',
        description: 'Milestone notes have been updated successfully',
        variant: 'success'
      });

      // Refresh ticket data to show updated notes
      await fetchTicketById(ticketId);
    } catch (error) {
      addToast({
        title: 'Update Failed',
        description: error.message || 'Failed to update notes. Please try again.',
        variant: 'error',
        duration: 7000
      });
    }
  }, [ticketId, token, addToast, fetchTicketById]);

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
        // Validate that we have a valid target stage and it's different from current
        if (!targetStage) {
          throw new Error('No target stage specified for transition');
        }

        if (currentStage && targetStage === currentStage) {
          throw new Error(`Cannot transition from ${currentStage} to ${targetStage} - same stage`);
        }

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

      // Provide more specific error messages
      let errorMessage = error.message || 'An error occurred';

      if (error.message?.includes('Invalid transition')) {
        errorMessage = 'This milestone transition is not allowed. Please check the current status.';
      } else if (error.message?.includes('same stage')) {
        errorMessage = 'Milestone is already at the target stage.';
      }

      addToast({
        title: 'Action Failed',
        description: errorMessage,
        variant: 'error',
        id: 'milestone-action-error',
        duration: 7000
      });
    }
  }, [ticketId, updateMilestone, addToast, fetchTicketById]);

  const handlePhotoUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    try {
      setUploadingPhotos(true);

      // Use updateMilestone from ticket hook - only add photos, don't transition
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
          const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3057/api';
          const baseUrl = baseApiUrl.replace('/api', '');
          let downloadUrl;

          // Use dedicated download endpoint if attachment has an ID
          if (attachment.id) {
            downloadUrl = `${baseApiUrl}/attachments/download/${attachment.id}`;
          } else {
            // Fallback to direct file URL - handle relative URLs properly
            const fileUrl = attachment.url.startsWith('/') ? attachment.url : `/${attachment.url}`;
            downloadUrl = `${baseUrl}${fileUrl}`;
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

  const handlePreviewAttachment = useCallback((attachment) => {
    setSelectedDocument(attachment);
    setIsDocumentModalOpen(true);
  }, []);

  const closeDocumentModal = useCallback(() => {
    setIsDocumentModalOpen(false);
    setSelectedDocument(null);
  }, []);

  // Scroll tracking for floating button on mobile chat
  useEffect(() => {
    const updateButtonVisibility = () => {
      const isSmallScreen = window.innerWidth < 1024;
      const isChatActive = activeTab === 'chat';

      // For now, show button whenever chat is active on small screen (remove scroll requirement for testing)
      setShowScrollToTop(isChatActive && isSmallScreen);
    };

    window.addEventListener('scroll', updateButtonVisibility);
    window.addEventListener('resize', updateButtonVisibility);

    // Initial check and whenever activeTab changes
    updateButtonVisibility();

    return () => {
      window.removeEventListener('scroll', updateButtonVisibility);
      window.removeEventListener('resize', updateButtonVisibility);
    };
  }, [activeTab]);

  // Scroll to top function
  const scrollToTop = () => {

    // Try multiple scroll strategies
    // 1. Scroll main window
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // 2. Also scroll document body
    document.body.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // 3. Find and scroll any potential chat containers
    const chatContainers = document.querySelectorAll('[class*="chat"], [class*="conversation"], .overflow-y-auto, .overflow-auto');
    chatContainers.forEach(container => {
      if (container.scrollTop > 0) {
        container.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });

    // 4. Try scrolling document element as well
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Fetch spare requests for this ticket
  const fetchSpareRequests = useCallback(async (ticketCode = ticketData.ticketCode) => {
    if (!ticketCode) return;

    try {
      setLoadingSpareRequests(true);
      const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3057/api';
      const response = await fetch(`${baseApiUrl}/spare-requests/ticket/${ticketCode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch spare requests');
      }

      const result = await response.json();

      // Transform spare requests to match the format expected by the approval component
      const transformedRequests = [];
      if (result.success && result.data) {
        result.data.forEach(request => {
          request.spareItems.forEach(item => {
            transformedRequests.push({
              itemId: item.id,
              requestId: request.id,
              ticketCode: request.ticketCode,
              productId: item.productId,
              productName: item.product.name,
              productCode: item.product.productCode,
              requestedQuantity: item.quantity,
              availableQuantity: item.product.inventory?.quantity || 0,
              status: item.status,
              requestedBy: request.createdByUser?.name || 'Unknown',
              requestedByRole: request.createdByUser?.role || 'Unknown',
              requestedDate: request.createdAt,
              canApprove: (item.product.inventory?.quantity || 0) >= item.quantity && item.status === 'REQUESTED'
            });
          });
        });
      }

      setSpareRequests(transformedRequests);
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to fetch spare requests',
        variant: 'error'
      });
    } finally {
      setLoadingSpareRequests(false);
    }
  }, [token, addToast]);

  // Handle spare request approval
  const handleSpareApprove = async (itemId) => {
    try {
      setSpareActionLoading(prev => ({ ...prev, [itemId]: 'approving' }));

      await approveSpareRequestItem(itemId);

      addToast({
        title: 'Success',
        description: 'Spare request approved successfully',
        variant: 'success'
      });

      // Refresh spare requests and ticket data
      await Promise.all([fetchSpareRequests(ticketData.ticketCode), fetchTicketById(ticketId)]);

    } catch (error) {
      addToast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve spare request',
        variant: 'error'
      });
    } finally {
      setSpareActionLoading(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    }
  };

  // Handle spare request rejection
  const handleSpareReject = (itemId) => {
    setRejectingSpareItem(itemId);
    setSpareRejectReason('');
    setShowSpareRejectModal(true);
  };

  // Confirm spare request rejection
  const confirmSpareReject = async () => {
    try {
      setSpareActionLoading(prev => ({ ...prev, [rejectingSpareItem]: 'rejecting' }));

      await rejectSpareRequestItem(rejectingSpareItem, spareRejectReason);

      addToast({
        title: 'Success',
        description: 'Spare request rejected successfully',
        variant: 'success'
      });

      setShowSpareRejectModal(false);
      setRejectingSpareItem(null);
      setSpareRejectReason('');

      // Refresh spare requests and ticket data
      await Promise.all([fetchSpareRequests(ticketData.ticketCode), fetchTicketById(ticketId)]);

    } catch (error) {
      addToast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject spare request',
        variant: 'error'
      });
    } finally {
      setSpareActionLoading(prev => {
        const newState = { ...prev };
        delete newState[rejectingSpareItem];
        return newState;
      });
      setShowSpareRejectModal(false);
    }
  };

  // Handle viewing spare details
  const handleViewSpareDetails = async (item) => {
    setSelectedSpareItem(item);
    setShowSpareDetailModal(true);
    setLoadingInventoryDetails(true);

    try {
      const [inventoryResponse, transactionResponse] = await Promise.all([
        getProductInventoryDetails(item.productId),
        getProductTransactionHistory(item.productId, 5)
      ]);

      if (inventoryResponse.success) {
        setInventoryDetails(inventoryResponse.data);
      }

      if (transactionResponse.success) {
        setTransactionHistory(transactionResponse.data);
      }
    } catch (error) {
      addToast({
        title: 'Warning',
        description: 'Could not fetch detailed inventory information',
        variant: 'warning'
      });
    } finally {
      setLoadingInventoryDetails(false);
    }
  };

  const getStockStatus = useCallback((requested, available) => {
    if (available >= requested) {
      return {
        status: 'sufficient',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800'
      };
    }
    return {
      status: 'insufficient',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800'
    };
  }, []);

  // Fetch spare requests when ticket code changes
  useEffect(() => {
    if (ticketData.ticketCode) {
      fetchSpareRequests(ticketData.ticketCode);
    }
  }, [ticketData.ticketCode, fetchSpareRequests]);

  // Mobile tab navigation
  const tabs = useMemo(() => [
    { id: 'ticket', label: 'Ticket', icon: FileText },
    { id: 'controller', label: 'Controller', icon: Cpu },
    { id: 'milestones', label: 'Progress', icon: GitBranch },
    { id: 'spares', label: 'Spares', icon: Package },
    { id: 'chat', label: 'Chat', icon: MessageSquare }
  ], []);

  // Get current milestone from ticket
  const currentMilestone = useMemo(() => {
    if (!ticket?.ticketMilestones) return null;
    return ticket.ticketMilestones.find(m => m.status === 'IN_PROGRESS') || null;
  }, [ticket?.ticketMilestones]);

  // Check if all spare requests are resolved (approved or rejected)
  const allSpareRequestsResolved = useMemo(() => {
    if (!spareRequests || spareRequests.length === 0) return false;
    return spareRequests.every(item => item.status === 'approved' || item.status === 'rejected');
  }, [spareRequests]);

  // Check if all spare requests are rejected
  const allSpareRequestsRejected = useMemo(() => {
    if (!spareRequests || spareRequests.length === 0) return false;
    return spareRequests.every(item => item.status === 'rejected');
  }, [spareRequests]);

  // Handle bulk approve for milestone transition
  const handleBulkApproveSpareRequests = async () => {
    if (!allSpareRequestsResolved) {
      addToast({
        type: 'error',
        title: 'Cannot Process',
        description: 'All spare requests must be either approved or rejected before proceeding.'
      });
      return;
    }

    try {
      let targetStage, description, successMessage;

      if (allSpareRequestsRejected) {
        // If all spare requests are rejected, move to spare rejected and then close ticket
        targetStage = 'TICKET_CLOSED';
        description = 'All spare requests rejected - ticket closed';
        successMessage = 'All spare requests rejected. Ticket has been closed.';
      } else {
        // If at least one spare request is approved, move to spare approved
        targetStage = 'SPARE_APPROVED';
        description = 'Spare requests processed - milestone updated to Spare Approved';
        successMessage = 'Milestone successfully updated to Spare Approved';
      }

      // Use the updateMilestone hook to transition
      const resultAction = await updateMilestone({
        ticketId: ticketId,
        action: 'transition',
        targetStage: targetStage,
        currentStage: currentMilestone?.stage,
        description: description
      });

      if (resultAction.success) {
        addToast({
          type: allSpareRequestsRejected ? 'warning' : 'success',
          title: allSpareRequestsRejected ? 'Ticket Closed' : 'Milestone Updated',
          description: successMessage
        });

        // Refresh ticket data
        await fetchTicketById(ticketId);
      } else {
        throw new Error(resultAction.error || 'Failed to update milestone');
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: error.message || 'Failed to process spare requests'
      });
    }
  };

  // Get photo modal info based on current milestone
  const photoModalInfo = useMemo(() => {
    if (!currentMilestone) return { title: 'Upload Photos', description: 'Add photos for this milestone' };

    const stageInfo = {
      REQUEST_CLEARED_AT_FIELD: {
        title: 'Field Clearance Photos (Optional)',
        description: 'Add photos if available to document that the issue has been resolved at field. Photos help provide better documentation but are not mandatory.',
      },
      SUBMITTED_TO_SERVICE_CENTER: {
        title: 'Upload Submission Photos',
        description: 'Add 4 specific photos confirming controller submission: Controller Front, Controller Bottom, Full View Open, MCB Close Up',
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

    const info = stageInfo[currentMilestone.stage] || {
      title: 'Upload Milestone Photos',
      description: `Add photos for ${currentMilestone.stage.replace(/_/g, ' ')}`,
    };

    // Set minimum photos requirement - 0 for field clearance, 1 for others
    info.minPhotos = currentMilestone.stage === 'REQUEST_CLEARED_AT_FIELD' ? 0 : 1;

    return info;
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
      // Only update if the data actually changed to prevent unnecessary re-renders
      setTicketData(prevData => {
        if (prevData.id !== mappedData.id || prevData.updatedAt !== mappedData.updatedAt) {
          return mappedData;
        }
        return prevData;
      });
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
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/tickets')}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
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
            {/* Hide button after ticket has been submitted to service center or closed */}
            {(user?.role === 'MACSOFT_SUPPORT' || user?.role === 'MACSOFT_ADMIN' || user?.role === 'MACSOFT_HEAD') &&
              !ticket?.ticketMilestones?.some(milestone => milestone.stage === 'SUBMITTED_TO_SERVICE_CENTER' || milestone.stage === 'TICKET_CLOSED' || milestone.stage === 'REQUEST_CLEARED_AT_FIELD') &&
              ticketData.status !== 'closed' && (
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
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap min-w-fit ${activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Icon size={16} />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
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
                {/*  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Complaint Type</p>
                    <p className="text-sm sm:text-base text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
                      {ticketData.complaintType || 'N/A'}
                    </p>
                  </div>
                </div> */}
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

            {/* Customer Details */}
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <User className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                Farmer/Supplier Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Farmer Name</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">{ticketData?.farmerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Supplier Name</p>
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
                  <p className="text-sm sm:text-base text-gray-900">
                    {[
                      ticketData.customer?.village,
                      ticketData.customer?.block,
                      ticketData.customer?.district,
                      ticketData.customer?.state
                    ].filter(Boolean).join(', ') || 'N/A'}
                  </p>
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
                      onPreview={handlePreviewAttachment}
                    />
                  ))}
                </div>
              </div>
            )}

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
              onUpdateNotes={handleUpdateNotes}
              ticketStatus={ticketData?.status}
            />
          </div>

          {/* Spare Requests Section - Desktop only */}
          <div className="hidden lg:block p-4 sm:p-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Spare Requests
                {spareRequests.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {spareRequests.length}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                {user?.role === 'MACSOFT_ADMIN' || user?.role === 'MACSOFT_HEAD' ? (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Approval Access
                  </span>
                ) : null}
                {(user?.role === 'MACSOFT_ADMIN' || user?.role === 'MACSOFT_HEAD') && spareRequests.length > 0 && currentMilestone?.stage === 'SPARE_REQUESTED' && (
                  <button
                    onClick={handleBulkApproveSpareRequests}
                    disabled={!allSpareRequestsResolved}
                    className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white ${allSpareRequestsResolved
                      ? allSpareRequestsRejected
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                      } disabled:opacity-50`}
                    title={
                      !allSpareRequestsResolved
                        ? 'All spare requests must be resolved first'
                        : allSpareRequestsRejected
                          ? 'Close ticket - all spares rejected'
                          : 'Approve milestone transition'
                    }
                  >
                    {allSpareRequestsRejected ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Close Ticket
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve Milestone
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {loadingSpareRequests ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading spare requests...</span>
              </div>
            ) : spareRequests.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No spare requests found for this ticket</p>
              </div>
            ) : (
              <div className="space-y-3">
                {spareRequests.map((item) => {
                  const stockStatus = getStockStatus(item.requestedQuantity, item.availableQuantity);
                  const StockIcon = stockStatus.icon;

                  return (
                    <motion.div
                      key={item.itemId}
                      whileHover={{ scale: 1.01 }}
                      className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.status === 'REQUESTED' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'approved' ? 'bg-green-100 text-green-800' :
                              item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {item.status}
                          </span>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          <StockIcon className="h-3 w-3 mr-1" />
                          {stockStatus.status === 'sufficient' ? 'Available' : 'Low Stock'}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <Package className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.productCode}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            Requested: <span className="font-medium text-blue-600">{item.requestedQuantity}</span>
                          </span>
                          <span className="text-gray-600">
                            Available: <span className={`font-medium ${item.availableQuantity >= item.requestedQuantity ? 'text-green-600' : 'text-red-600'
                              }`}>{item.availableQuantity}</span>
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          <span>By: {item.requestedBy}</span>
                        </div>

                        {/* Action buttons for admins */}
                        {(user?.role === 'MACSOFT_ADMIN' || user?.role === 'MACSOFT_HEAD') && item.status === 'REQUESTED' && (
                          <div className="flex space-x-1 pt-2">
                            <button
                              onClick={() => handleViewSpareDetails(item)}
                              className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </button>

                            <button
                              onClick={() => handleSpareApprove(item.itemId)}
                              disabled={!item.canApprove || spareActionLoading[item.itemId] === 'approving'}
                              className={`flex-1 inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white ${item.canApprove
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-400 cursor-not-allowed'
                                } disabled:opacity-50`}
                            >
                              {spareActionLoading[item.itemId] === 'approving' ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              Approve
                            </button>

                            <button
                              onClick={() => handleSpareReject(item.itemId)}
                              disabled={spareActionLoading[item.itemId] === 'rejecting'}
                              className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                              {spareActionLoading[item.itemId] === 'rejecting' ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Spare Requests Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`${activeTab === 'spares' ? 'block' : 'hidden'
            } lg:hidden bg-white border-r border-gray-200 overflow-y-auto`}
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Spare Requests
              </h2>
              <div className="flex items-center gap-2">
                {user?.role === 'MACSOFT_ADMIN' || user?.role === 'MACSOFT_HEAD' ? (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Approval Access
                  </span>
                ) : null}
                {(user?.role === 'MACSOFT_ADMIN' || user?.role === 'MACSOFT_HEAD') && spareRequests.length > 0 && currentMilestone?.stage === 'SPARE_REQUESTED' && (
                  <button
                    onClick={handleBulkApproveSpareRequests}
                    disabled={!allSpareRequestsResolved}
                    className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white ${allSpareRequestsResolved
                      ? allSpareRequestsRejected
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                      } disabled:opacity-50`}
                    title={
                      !allSpareRequestsResolved
                        ? 'All spare requests must be resolved first'
                        : allSpareRequestsRejected
                          ? 'Close ticket - all spares rejected'
                          : 'Approve milestone transition'
                    }
                  >
                    {allSpareRequestsRejected ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Close Ticket
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve Milestone
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {loadingSpareRequests ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading spare requests...</span>
              </div>
            ) : spareRequests.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No spare requests found for this ticket</p>
              </div>
            ) : (
              <div className="space-y-4">
                {spareRequests.map((item) => {
                  const stockStatus = getStockStatus(item.requestedQuantity, item.availableQuantity);
                  const StockIcon = stockStatus.icon;

                  return (
                    <motion.div
                      key={item.itemId}
                      whileHover={{ scale: 1.01 }}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Hash className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">{item.ticketCode}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.status === 'REQUESTED' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'approved' ? 'bg-green-100 text-green-800' :
                              item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {item.status}
                          </span>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          <StockIcon className="h-3 w-3 mr-1" />
                          {stockStatus.status === 'sufficient' ? 'Available' : 'Low Stock'}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                          <Package className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.productCode}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Requested</p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.requestedQuantity}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Available</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.availableQuantity >= item.requestedQuantity
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {item.availableQuantity}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          <span>By: {item.requestedBy}</span>
                          <Calendar className="h-3 w-3 ml-2" />
                          <span>{formatDate(item.requestedDate)}</span>
                        </div>

                        {/* Action buttons for admins */}
                        {(user?.role === 'MACSOFT_ADMIN' || user?.role === 'MACSOFT_HEAD') && item.status === 'REQUESTED' && (
                          <div className="flex space-x-2 pt-2">
                            <button
                              onClick={() => handleViewSpareDetails(item)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </button>

                            <button
                              onClick={() => handleSpareApprove(item.itemId)}
                              disabled={!item.canApprove || spareActionLoading[item.itemId] === 'approving'}
                              className={`flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${item.canApprove
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-400 cursor-not-allowed'
                                } disabled:opacity-50`}
                            >
                              {spareActionLoading[item.itemId] === 'approving' ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              Approve
                            </button>

                            <button
                              onClick={() => handleSpareReject(item.itemId)}
                              disabled={spareActionLoading[item.itemId] === 'rejecting'}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                              {spareActionLoading[item.itemId] === 'rejecting' ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
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
            onMarkMessagesAsSeen={markMessagesAsSeen}
            currentUserId={user?.id}
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
              className="max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg p-4 sm:p-6"
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
        minPhotos={photoModalInfo.minPhotos || 1}
        uploading={uploadingPhotos}
      />

      {/* Service Center Assignment Modal */}
      <ServiceCenterAssignmentModal
        isOpen={showServiceCenterModal}
        onClose={() => setShowServiceCenterModal(false)}
        ticket={ticketData}
        onSuccess={handleServiceCenterAssignment}
      />

      {/* Document Modal */}
      <DocumentModal
        isOpen={isDocumentModalOpen}
        onClose={closeDocumentModal}
        document={selectedDocument}
      />

      {/* Spare Request Reject Modal */}
      {showSpareRejectModal && (
        <div className="fixed inset-0 bg-black/25 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-4 sm:p-5 border w-full max-w-md sm:max-w-lg shadow-lg rounded-md bg-white">
            <div className="text-center">
              <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-600 mx-auto" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mt-4">Reject Spare Request</h3>
              <div className="mt-2 px-2 sm:px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to reject this spare request? Please provide a reason.
                </p>
                <textarea
                  value={spareRejectReason}
                  onChange={(e) => setSpareRejectReason(e.target.value)}
                  placeholder="Enter rejection reason (optional)"
                  className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={3}
                />
              </div>
              <div className="px-2 sm:px-4 py-3">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-center">
                  <button
                    onClick={confirmSpareReject}
                    disabled={spareActionLoading[rejectingSpareItem] === 'rejecting'}
                    className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {spareActionLoading[rejectingSpareItem] === 'rejecting' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 inline animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1 inline" />
                        Reject
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowSpareRejectModal(false);
                      setRejectingSpareItem(null);
                      setSpareRejectReason('');
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spare Details Modal */}
      {showSpareDetailModal && selectedSpareItem && (
        <div className="fixed inset-0 bg-black/25 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative overflow-y-auto max-h-4/5 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Spare Request Details</h3>
              <button
                onClick={() => {
                  setShowSpareDetailModal(false);
                  setSelectedSpareItem(null);
                  setInventoryDetails(null);
                  setTransactionHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Request Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Request Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Ticket Code</label>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpareItem.ticketCode}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Request Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedSpareItem.requestedDate)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Requested By</label>
                    <p className="text-sm text-gray-900">{selectedSpareItem.requestedBy}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Role</label>
                    <p className="text-sm text-gray-900">{selectedSpareItem.requestedByRole}</p>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Product Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Product Name</label>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpareItem.productName}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Product Code</label>
                    <p className="text-sm text-gray-900">{selectedSpareItem.productCode}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Requested Quantity</label>
                    <p className="text-sm text-gray-900">{selectedSpareItem.requestedQuantity}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Available Quantity</label>
                    <p className="text-sm text-gray-900">{selectedSpareItem.availableQuantity}</p>
                  </div>
                </div>
              </div>

              {/* Inventory Status */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  Inventory Status
                </h4>

                {loadingInventoryDetails ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading inventory details...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Stock Status</span>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedSpareItem.canApprove ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {selectedSpareItem.canApprove ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Available
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Insufficient Stock
                          </>
                        )}
                      </div>
                    </div>

                    {inventoryDetails && (
                      <div className="border-t border-green-200 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Storage Location</label>
                            <p className="text-sm text-gray-900 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {inventoryDetails.location || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Last Updated</label>
                            <p className="text-sm text-gray-900 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {inventoryDetails.updatedAt ? formatDate(inventoryDetails.updatedAt) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transaction History */}
                    {transactionHistory.length > 0 && (
                      <div className="border-t border-green-200 pt-4">
                        <h5 className="text-xs font-medium text-gray-700 mb-2">Recent Transactions</h5>
                        <div className="space-y-2">
                          {transactionHistory.map((transaction, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                {transaction.type} - {transaction.quantity} units
                              </span>
                              <span className="text-gray-500">
                                {formatDate(transaction.createdAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Warning for insufficient stock */}
              {!selectedSpareItem.canApprove && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                    <div>
                      <h5 className="text-sm font-medium text-red-800">Insufficient Stock</h5>
                      <p className="text-sm text-red-700 mt-1">
                        Cannot approve this request as there is insufficient stock available.
                        Available: {selectedSpareItem.availableQuantity}, Required: {selectedSpareItem.requestedQuantity}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Confirmation for sufficient stock */}
              {selectedSpareItem.canApprove && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-2" />
                    <div>
                      <h5 className="text-sm font-medium text-blue-800">Ready for Approval</h5>
                      <p className="text-sm text-blue-700 mt-1">
                        <strong>Impact:</strong> Approving this request will deduct {selectedSpareItem.requestedQuantity} units from inventory,
                        updating the stock from {selectedSpareItem.availableQuantity} to {selectedSpareItem.availableQuantity - selectedSpareItem.requestedQuantity} units.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {(user?.role === 'MACSOFT_ADMIN' || user?.role === 'MACSOFT_HEAD') && selectedSpareItem.status === 'REQUESTED' && (
              <div className="flex flex-wrap sm:justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowSpareDetailModal(false);
                    setSelectedSpareItem(null);
                    setInventoryDetails(null);
                    setTransactionHistory([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setShowSpareDetailModal(false);
                    handleSpareReject(selectedSpareItem.itemId);
                  }}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircle className="h-4 w-4 mr-1 inline" />
                  Reject
                </button>

                <button
                  onClick={() => {
                    setShowSpareDetailModal(false);
                    handleSpareApprove(selectedSpareItem.itemId);
                  }}
                  disabled={!selectedSpareItem.canApprove || spareActionLoading[selectedSpareItem.itemId] === 'approving'}
                  className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${selectedSpareItem.canApprove
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-gray-400 cursor-not-allowed'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
                >
                  {spareActionLoading[selectedSpareItem.itemId] === 'approving' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 inline animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1 inline" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Scroll to Top Button - Only visible on mobile when chat tab is active */}
      <AnimatePresence>
        {showScrollToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="lg:hidden flex justify-center uppercase gap-2 items-center min-w-40 w-full my-2 z-[9999] bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-2xl border-2 border-white focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Scroll to top"
            style={{ zIndex: 9999 }}
          >
            <ChevronUp className="w-6 h-6" /> scroll up
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}