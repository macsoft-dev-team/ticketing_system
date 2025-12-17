import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trash2,
    Clock,
    User,
    Tag,
    Calendar,
    AlertCircle,
    ArrowRight,
    Zap,
    Eye,
    MessageSquare,
    Paperclip,
    Cpu,
    Smartphone,
    AlertTriangle,
    Copy,
    Check,
    X,
    AlertCircleIcon,
    CardSim,
    Hash
} from 'lucide-react';
import moment from 'moment';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useSoundManager } from '../../../lib/hooks/SoundManager';
import { TICKET_STATUS, STATUS_COLORS, TICKET_PRIORITY, PRIORITY_COLORS } from '../../../lib/constants';

export default function TicketCard({
    ticket = {
        id: 'TKT-2025-05',
        ticketNumber: 'TKT-2025-05',
        title: 'Network Connection Issue',
        description: 'Unable to connect to company WiFi network in office building',
        status: TICKET_STATUS.OPEN,
        priority: TICKET_PRIORITY.HIGH,
        assignedTo: 'John Smith',
        category: 'Network',
        createdAt: '2025-01-15',
        updatedAt: '2025-01-15',
        dueDate: '2025-01-20'
    },
    onStatusChange,
    onDelete,
    onView
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [isActionVisible, setIsActionVisible] = useState(false);
    const [showTicketTooltip, setShowTicketTooltip] = useState(false);
    const [showControllerTooltip, setShowControllerTooltip] = useState(false);
    const [showSimTooltip, setShowSimTooltip] = useState(false);
    const [copiedField, setCopiedField] = useState(null);
    const [localTicket, setLocalTicket] = useState(ticket);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { play } = useSoundManager();

    // Handle copy to clipboard
    const handleCopy = (text, fieldName) => {
        if (!text || text === 'N/A') return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Handle click outside to close tooltip
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showTicketTooltip && !event.target.closest('.ticket-tooltip-container')) {
                setShowTicketTooltip(false);
            }
            if (showControllerTooltip && !event.target.closest('.controller-tooltip-container')) {
                setShowControllerTooltip(false);
            }
            if (showSimTooltip && !event.target.closest('.sim-tooltip-container')) {
                setShowSimTooltip(false);
            }
        };

        if (showTicketTooltip || showControllerTooltip || showSimTooltip) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showTicketTooltip, showControllerTooltip, showSimTooltip]);

    // Update local ticket when prop changes
    useEffect(() => {
        setLocalTicket(ticket);
    }, [ticket]);

    // Socket event listener for real-time message updates
    useEffect(() => {
        const handleTicketMessageUpdate = (event) => {
            const messageData = event.detail;

            // Only update if this message is for the current ticket
            if (messageData.ticketId === localTicket.id) {
 
                // Update local ticket with new message
                setLocalTicket(prev => {
                    // Create new message object from socket data
                    const newMessage = {
                        id: messageData.id,
                        content: messageData.content,
                        senderId: messageData.senderId,
                        sender: messageData.sender,
                        createdAt: messageData.createdAt,
                        attachments: messageData.attachments || [],
                        seenBy: messageData.seenBy || []
                    };

                    // Check if message already exists (avoid duplicates)
                    const messageExists = prev.messages?.some(m => m.id === newMessage.id);

                    if (messageExists) {
                        // Update existing message
                        return {
                            ...prev,
                            messages: prev.messages.map(m =>
                                m.id === newMessage.id ? newMessage : m
                            ),
                            updatedAt: messageData.createdAt
                        };
                    } else {
                        // Add new message
                        return {
                            ...prev,
                            messages: [...(prev.messages || []), newMessage],
                            updatedAt: messageData.createdAt,
                            hasNewActivity: true
                        };
                    }
                });
            }
        };

        const handleConversationUpdate = (event) => {
            const messageData = event.detail;

            // Only update if this message is for the current ticket
            if (messageData.ticketId === localTicket.id) {
 
                // Update local ticket with new message
                setLocalTicket(prev => {
                    // Create new message object from socket data
                    const newMessage = {
                        id: messageData.id,
                        content: messageData.content,
                        senderId: messageData.senderId,
                        sender: messageData.sender,
                        createdAt: messageData.createdAt,
                        attachments: messageData.attachments || [],
                        seenBy: messageData.seenBy || []
                    };

                    // Check if message already exists (avoid duplicates)
                    const messageExists = prev.messages?.some(m => m.id === newMessage.id);

                    if (messageExists) {
                        return prev; // Don't add duplicate
                    }

                    // Add new message
                    return {
                        ...prev,
                        messages: [...(prev.messages || []), newMessage],
                        updatedAt: messageData.createdAt,
                        hasNewActivity: true
                    };
                });
            }
        };

        // Listen for ticket message updates (for ticket cards)
        window.addEventListener('ticketMessageUpdate', handleTicketMessageUpdate);

        // Also listen for conversation updates (general chat messages)
        window.addEventListener('conversationUpdate', handleConversationUpdate);

        return () => {
            window.removeEventListener('ticketMessageUpdate', handleTicketMessageUpdate);
            window.removeEventListener('conversationUpdate', handleConversationUpdate);
        };
    }, [localTicket.id, localTicket.ticketCode]);

    const handleStatusChange = (newStatus) => {
        onStatusChange?.(localTicket.id, newStatus);
    };

    const handleCardClick = (e) => {
        // Prevent navigation if clicking on interactive elements
        if (e.target.closest('button') || e.target.closest('[data-radix-popper-content-wrapper]')) {
            return;
        }
        navigate(`/tickets/${localTicket.id}`);
    };

    const handleButtonClick = (e, callback) => {
        e.preventDefault();
        e.stopPropagation();
        callback?.();
    };

    const getPriorityIcon = () => {
        switch (localTicket.priority) {
            case TICKET_PRIORITY.HIGH:
                return <AlertCircle className="w-3 h-3 text-red-500" />;
            case TICKET_PRIORITY.MEDIUM:
                return <Zap className="w-3 h-3 text-orange-500" />;
            default:
                return '';
        }
    };

    // Helper function to get last message
    const getLastMessage = () => {
        if (!localTicket.messages || localTicket.messages.length === 0) return null;
        const lastMessage = localTicket.messages[localTicket.messages.length - 1];
        return {
            content: lastMessage.content || '',
            senderName: lastMessage.sender?.name || 'Unknown',
            createdAt: lastMessage.createdAt,
            hasAttachments: lastMessage.attachments && lastMessage.attachments.length > 0
        };
    };

    // Helper function to get unread/unseen message count
    const getUnreadMessageCount = () => {
        if (!localTicket.messages || localTicket.messages.length === 0 || !user?.id) return 0;

        return localTicket.messages.filter(message => {
            // Skip messages sent by current user (they are automatically "read")
            if (message.senderId === user.id) return false;

            // If seenBy is empty or current user hasn't seen it
            if (!message.seenBy || message.seenBy.length === 0) return true;

            // Check if current user has seen this message
            const hasUserSeen = message.seenBy.some(seen => seen.userId === user.id);
            return !hasUserSeen;
        }).length;
    };

    // Helper function to check if we should show new message indicator (legacy - keeping for compatibility)
    const shouldShowNewMessageIndicator = () => {
        // This function is no longer used as we now show last message for all open/in-progress tickets
        return false;
    };

    // Helper function to check if we should show last message for open/in-progress tickets
    const shouldShowLastMessageForActiveTickets = () => {
        return (localTicket.status === TICKET_STATUS.OPEN || localTicket.status === TICKET_STATUS.IN_PROGRESS) &&
            hasMessages && lastMessage;
    };

    const lastMessage = getLastMessage();
    const hasMessages = localTicket.messages && localTicket.messages.length > 0;
    const unreadCount = getUnreadMessageCount();

    const isOverdue = localTicket.dueDate && moment(localTicket.dueDate).isBefore(moment(), 'day');

    // Helper function to get closure information
    const getClosureInfo = () => {
        if (localTicket.status !== TICKET_STATUS.CLOSED && localTicket.status !== TICKET_STATUS.RESOLVED) {
            return null;
        }

        if (!localTicket.ticketMilestones || localTicket.ticketMilestones.length === 0) {
            return null;
        }

        // Check for field clearance scenarios first (higher priority)
        const fieldClearedMilestone = localTicket.ticketMilestones.find(m =>
            m.stage === 'REQUEST_CLEARED_AT_FIELD' && m.status === 'DONE'
        );
        if (fieldClearedMilestone) {
            return {
                type: 'field-cleared',
                label: 'Cleared at Field',
                icon: '✓',
                description: fieldClearedMilestone.description || 'Issue resolved on-site by field engineer',
                bgColor: 'bg-emerald-50',
                textColor: 'text-emerald-800',
                borderColor: 'border-emerald-100',
                iconColor: 'text-emerald-600',
                closedBy: fieldClearedMilestone.changer?.name,
                closedAt: fieldClearedMilestone.completedAt,
                notes: fieldClearedMilestone.notes
            };
        }

        // Check for field clearance approval
        const fieldClearanceApprovedMilestone = ticket.ticketMilestones.find(m =>
            m.stage === 'FIELD_CLEARANCE_APPROVED' && m.status === 'DONE'
        );
        if (fieldClearanceApprovedMilestone) {
            return {
                type: 'field-clearance-approved',
                label: 'Field Clearance Approved',
                icon: '✓',
                description: fieldClearanceApprovedMilestone.description || 'Field clearance approved by Head',
                bgColor: 'bg-green-50',
                textColor: 'text-green-800',
                borderColor: 'border-green-100',
                iconColor: 'text-green-600',
                closedBy: fieldClearanceApprovedMilestone.changer?.name,
                closedAt: fieldClearanceApprovedMilestone.completedAt,
                notes: fieldClearanceApprovedMilestone.notes
            };
        }

        // Check for delivery completion
        const deliveredMilestone = ticket.ticketMilestones.find(m =>
            m.stage === 'DELIVERED_TO_FIELD' && m.status === 'DONE'
        );
        if (deliveredMilestone) {
            return {
                type: 'delivered',
                label: 'Delivered to Field',
                icon: '📦',
                description: deliveredMilestone.description || 'Controller delivered/dispatched back to field',
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-800',
                borderColor: 'border-blue-100',
                iconColor: 'text-blue-600',
                closedBy: deliveredMilestone.changer?.name,
                closedAt: deliveredMilestone.completedAt,
                notes: deliveredMilestone.notes
            };
        }

        // Check for general ticket closure (including auto-closure)
        const ticketClosedMilestone = ticket.ticketMilestones.find(m =>
            m.stage === 'TICKET_CLOSED' && m.status === 'DONE'
        );
        if (ticketClosedMilestone) {
            // Check if it's an auto-closure based on description or notes
            const isAutoClosed = ticketClosedMilestone.description?.toLowerCase().includes('automatically') ||
                ticketClosedMilestone.notes?.toLowerCase().includes('automatically');

            const isNoResponse = ticketClosedMilestone.description?.toLowerCase().includes('no customer response') ||
                ticketClosedMilestone.notes?.toLowerCase().includes('no customer response');

            let label = 'Ticket Closed';
            let icon = '🔒';
            let bgColor = 'bg-gray-50';
            let textColor = 'text-gray-800';
            let borderColor = 'border-gray-200';
            let iconColor = 'text-gray-600';

            if (isAutoClosed) {
                if (isNoResponse) {
                    label = 'Auto-Closed (No Response)';
                    icon = '⏰';
                    bgColor = 'bg-orange-50';
                    textColor = 'text-orange-800';
                    borderColor = 'border-orange-100';
                    iconColor = 'text-orange-600';
                } else {
                    label = 'Auto-Closed';
                    icon = '🤖';
                    bgColor = 'bg-purple-50';
                    textColor = 'text-purple-800';
                    borderColor = 'border-purple-100';
                    iconColor = 'text-purple-600';
                }
            }

            return {
                type: isAutoClosed ? 'auto-closed' : 'closed',
                label,
                icon,
                description: ticketClosedMilestone.description || 'Ticket permanently closed',
                bgColor,
                textColor,
                borderColor,
                iconColor,
                closedBy: ticketClosedMilestone.changer?.name,
                closedAt: ticketClosedMilestone.completedAt,
                notes: ticketClosedMilestone.notes,
                isAutoClosed,
                isNoResponse
            };
        }

        return null;
    };

    const closureInfo = getClosureInfo();

    // Check if this ticket has a buzzer alert
    // Only show visual effects for MACSOFT_HEAD and MACSOFT_SUPPORT
    const allowedBuzzerRoles = ['MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
    const shouldShowBuzzerEffects = user && allowedBuzzerRoles.includes(user.role);
    const hasBuzzerAlert = shouldShowBuzzerEffects && localTicket.hasBuzzerAlert;
    const buzzerAlertData = shouldShowBuzzerEffects ? localTicket.buzzerAlertData : null;

    // Play buzzer alert sound when hasBuzzerAlert is true
    useEffect(() => {
        if (hasBuzzerAlert) {
            play('notify_critical');
        }
    }, [hasBuzzerAlert, play, localTicket.ticketCode]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
                opacity: 1,
                y: 0,
                scale: hasBuzzerAlert ? [1, 1.02, 1, 1.02, 1] : 1,
                boxShadow: hasBuzzerAlert
                    ? [
                        "0 0 0 0 rgba(239, 68, 68, 0)",
                        "0 0 0 8px rgba(239, 68, 68, 0.4)",
                        "0 0 0 16px rgba(239, 68, 68, 0)",
                        "0 0 0 8px rgba(239, 68, 68, 0.4)",
                        "0 0 0 0 rgba(239, 68, 68, 0)"
                    ]
                    : "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
            }}
            whileHover={{
                y: -4,
                scale: 1.02,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            transition={{
                duration: hasBuzzerAlert ? 0.6 : 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
                scale: {
                    repeat: hasBuzzerAlert ? Infinity : 0,
                    repeatDelay: 0.2
                },
                boxShadow: {
                    repeat: hasBuzzerAlert ? Infinity : 0,
                    repeatDelay: 0.2,
                    duration: 1.5
                }
            }}
            onHoverStart={() => {
                setIsHovered(true);
                setIsActionVisible(true);
            }}
            onHoverEnd={() => {
                setIsHovered(false);
                setIsActionVisible(false);
            }}
            onClick={handleCardClick}
            className={`
                relative overflow-hidden cursor-pointer group
                bg-white border rounded-xl h-full min-h-4/5
                ${hasBuzzerAlert ? 'border-red-500 ring-2 ring-red-400 shadow-2xl' :
                    isOverdue ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'}
                hover:border-gray-300 shadow-sm transition-all duration-300
                backdrop-blur-sm
            `}
        >
            {/* Buzzer Alert Indicator - Animated red pulsing overlay */}
            {hasBuzzerAlert && (
                <motion.div
                    className="absolute inset-0 pointer-events-none z-30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.15, 0, 0.15, 0] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 0.2
                    }}
                    style={{
                        background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0) 70%)'
                    }}
                />
            )}

            {/* Buzzer Alert Badge */}
            {hasBuzzerAlert && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        scale: {
                            duration: 0.8,
                            repeat: Infinity,
                            repeatDelay: 0.3
                        },
                        rotate: {
                            duration: 1,
                            repeat: Infinity,
                            repeatDelay: 0.2
                        }
                    }}
                    className="absolute top-24 right-2 z-40"
                >
                    <div className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1.5 border-2 border-white">

                        RESPONSE NEEDED IMMEDIATELY
                    </div>
                </motion.div>
            )}

            {/* Status Bar */}
            <div className={`
                absolute top-0 left-0 right-0 h-1
                ${hasBuzzerAlert ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600' :
                    localTicket.status === TICKET_STATUS.OPEN ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                        localTicket.status === TICKET_STATUS.IN_PROGRESS ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-green-500 to-green-200'}
            `} />

            {/* Overdue indicator */}
            {isOverdue && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 z-20"
                >
                    <div className="bg-red-500 text-white text-[10px] px-1 pe-2 pt-1 pb-0.5 rounded-bl-md rounded-tr-xl font-medium shadow-sm">
                        Overdue
                    </div>
                </motion.div>
            )}

            {/* New ticket indicator */}
            {localTicket.isNewTicket && (
                <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="absolute -top-1 -left-1 z-20"
                >
                    <div className="bg-green-500 text-white text-xs ps-3 tracking-wide  px-2 pt-1 pb-0.5 rounded-br-md rounded-tl-xl font-medium shadow-sm ">
                        <span className='animate-pulse'>New</span>
                    </div>
                </motion.div>
            )}

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    {/* Ticket ID & Priority */}
                    <div className="flex items-center gap-2">
                        <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="text-xs text-nowrap font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded"
                        >
                            {localTicket.ticketCode || localTicket.id}
                        </motion.span>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            {getPriorityIcon()}
                        </motion.div>

                        {/* Ticket Copy Icon */}
                        {localTicket && (
                            <div className="relative ticket-tooltip-container">
                                <motion.button
                                    onClick={(e) => {
                                        handleButtonClick(e, () => {
                                            handleCopy(localTicket.ticketCode || localTicket.id, 'ticket');
                                            setShowTicketTooltip(true);
                                            setTimeout(() => setShowTicketTooltip(false), 2000);
                                        });
                                    }}
                                    onHoverStart={() => setShowTicketTooltip(true)}
                                    onHoverEnd={() => {
                                        if (copiedField !== 'ticket') {
                                            setShowTicketTooltip(false);
                                        }
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="cursor-pointer p-1 rounded-full hover:bg-purple-100 transition-colors"
                                    title="Click to copy Ticket Code"
                                >
                                    <Hash className="w-4 h-4 text-purple-600" />
                                </motion.button>

                                <AnimatePresence>
                                    {showTicketTooltip && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-xl"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="bg-purple-50 p-3 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                                                        <Hash className="w-3 h-3" />
                                                        Ticket Code
                                                    </h3>
                                                    {copiedField === 'ticket' ? (
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="bg-white p-2 rounded">
                                                    <p className="text-xs font-mono font-semibold text-gray-900 break-all">
                                                        {localTicket.ticketCode || localTicket.id}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2 text-center">
                                                    {copiedField === 'ticket' ? 'Copied!' : 'Click to copy'}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Controller Info Tooltip */}
                        {localTicket && localTicket.controllerNo && (
                            <div className="relative controller-tooltip-container">
                                <motion.button
                                    onClick={(e) => {
                                        handleButtonClick(e, () => {
                                            handleCopy(localTicket.controllerNo, 'cpu');
                                            setShowControllerTooltip(true);
                                            setTimeout(() => setShowControllerTooltip(false), 2000);
                                        });
                                    }}
                                    onHoverStart={() => setShowControllerTooltip(true)}
                                    onHoverEnd={() => {
                                        if (copiedField !== 'cpu') {
                                            setShowControllerTooltip(false);
                                        }
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="cursor-pointer p-1 rounded-full hover:bg-green-100 transition-colors"
                                    title="Click to copy Controller No"
                                >
                                    <Cpu className="w-4 h-4 text-green-600" />
                                </motion.button>

                                <AnimatePresence>
                                    {showControllerTooltip && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-xl"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="bg-green-50 p-3 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                                                        <Cpu className="w-3 h-3" />
                                                        Controller No
                                                    </h3>
                                                    {copiedField === 'cpu' ? (
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="bg-white p-2 rounded">
                                                    <p className="text-xs font-mono font-semibold text-gray-900 break-all">
                                                        {localTicket.controllerNo}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2 text-center">
                                                    {copiedField === 'cpu' ? 'Copied!' : 'Click to copy'}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* SIM/IMEI Info - Tooltip */}
                        {localTicket && localTicket.imei && (
                            <div className="relative sim-tooltip-container">
                                <motion.button
                                    onClick={(e) => {
                                        handleButtonClick(e, () => {
                                            handleCopy(localTicket.imei, 'simImei');
                                            setShowSimTooltip(true);
                                            setTimeout(() => setShowSimTooltip(false), 2000);
                                        });
                                    }}
                                    onHoverStart={() => setShowSimTooltip(true)}
                                    onHoverEnd={() => {
                                        if (copiedField !== 'simImei') {
                                            setShowSimTooltip(false);
                                        }
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="cursor-pointer p-1 rounded-full hover:bg-blue-100 transition-colors"
                                    title="Click to copy IMEI"
                                >
                                    <CardSim className="w-4 h-4 text-blue-600" />
                                </motion.button>

                                <AnimatePresence>
                                    {showSimTooltip && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-xl"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                                                        <CardSim className="w-3 h-3" />
                                                        IMEI
                                                    </h3>
                                                    {copiedField === 'simImei' ? (
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="bg-white p-2 rounded">
                                                    <p className="text-xs font-mono font-semibold text-gray-900 break-all">
                                                        {localTicket.imei}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2 text-center">
                                                    {copiedField === 'simImei' ? 'Copied!' : 'Click to copy'}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Status Display */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`
                            flex items-center gap-2 text-xs font-medium
                            px-3 py-1.5 rounded-full border transition-all
                            ${STATUS_COLORS[localTicket.status] || 'bg-gray-100 text-gray-800 border-gray-200'} 
                            capitalize backdrop-blur-sm shadow-sm
                        `}
                    >
                        <div className={`w-2 h-2 rounded-full ${localTicket.status === TICKET_STATUS.OPEN ? 'bg-red-500' :
                                localTicket.status === TICKET_STATUS.IN_PROGRESS ? 'bg-yellow-500' :
                                    'bg-blue-500'
                            }`}></div>
                        {localTicket.status.replace('-', ' ')}
                    </motion.div>
                </div>

                {/* Title and Description */}
                <div className="flex-1 flex flex-col justify-start mb-4">
                    <motion.h4
                        className="text-base font-semibold mb-2 line-clamp-2 leading-snug"
                        style={{ color: "#1e293b" }}
                        whileHover={{ color: "#3b82f6" }}
                        transition={{ duration: 0.2 }}
                    >
                        {localTicket.title}
                    </motion.h4>
                    <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed min-h-10">
                        {localTicket.description}
                    </p>
                    {/* ticket ticketMilestones is array */}
                    {localTicket.ticketMilestones && localTicket.ticketMilestones.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                            {localTicket.ticketMilestones.filter((m) => m.status === "IN_PROGRESS").map((milestone) => (
                                <span
                                    key={milestone.id}
                                    className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded-tr-xl rounded-bl-xl font-medium"
                                >
                                    {milestone.stage.replace(/_/g, ' ')}{/*  by <span className='text-yellow-500'>{milestone.changer?.name || ''}</span> */}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Buzzer Alert Info - Show alert details prominently */}
                    {hasBuzzerAlert && buzzerAlertData && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-3 p-3 bg-red-50 border-2 border-red-500 rounded-lg shadow-md"
                        >
                            <div className="flex items-start gap-2 mb-2">
                                <AlertCircleIcon className="w-10 h-10 text-red-600" />
                                <span className="text-sm font-bold text-red-800">
                                    URGENT: {lastMessage.senderName || 'Customer'} is Waiting for your response since{lastMessage.createdAt ? ` ${moment(lastMessage.createdAt).fromNow(true)}` : ''}
                                </span>
                            </div>
                            <p className="text-xs text-red-700 leading-relaxed">
                                {buzzerAlertData.message || 'Customer message needs immediate response'}
                            </p>
                        </motion.div>
                    )}

                    {/* Show detailed closure information for closed/resolved tickets */}
                    {closureInfo && (
                        <div className={`p-3 ${closureInfo.bgColor} rounded-lg border ${closureInfo.borderColor}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm ${closureInfo.iconColor}`}>{closureInfo.icon}</span>
                                <span className={`text-xs font-medium ${closureInfo.textColor}`}>
                                    {closureInfo.label}
                                </span>
                            </div>
                            <p className={`text-xs ${closureInfo.textColor} opacity-80 mb-1`}>
                                {closureInfo.description}
                            </p>
                            {closureInfo.closedBy && (
                                <div className={`text-xs ${closureInfo.textColor} opacity-70 flex items-center gap-1`}>
                                    <User className="w-3 h-3" />
                                    <span>Closed by {closureInfo.closedBy}</span>
                                    {closureInfo.closedAt && (
                                        <span className="ml-1">• {moment(closureInfo.closedAt).format('MMM DD, YYYY')}</span>
                                    )}
                                </div>
                            )}
                            {closureInfo.notes && closureInfo.notes !== closureInfo.description && (
                                <p className={`text-xs ${closureInfo.textColor} opacity-70 mt-1 italic`}>
                                    "{closureInfo.notes}"
                                </p>
                            )}

                            {/* Show last message for cleared at field tickets */}
                            {(closureInfo.type === 'field-cleared' || closureInfo.type === 'field-clearance-approved') && lastMessage && (
                                <div className={`mt-3 pt-2 border-t ${closureInfo.borderColor}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className={`w-4 h-4 ${closureInfo.iconColor}`} />
                                        <span className={`text-xs font-semibold ${closureInfo.textColor}`}>
                                            Final Communication
                                        </span>
                                        {lastMessage.hasAttachments && (
                                            <Paperclip className={`w-3 h-3 ${closureInfo.iconColor}`} title="Has attachments" />
                                        )}
                                    </div>
                                    <div className={`text-xs ${closureInfo.textColor} opacity-90`}>
                                        <div className="flex items-center gap-1 mb-1">
                                            <User className="w-3 h-3" />
                                            <span className="font-medium">{lastMessage.senderName}</span>
                                            <span className="opacity-60">•</span>
                                            <span className="opacity-70">{moment(lastMessage.createdAt).fromNow()}</span>
                                        </div>
                                        <p className="line-clamp-2 leading-relaxed">
                                            {lastMessage.content.length > 100
                                                ? `${lastMessage.content.substring(0, 100)}...`
                                                : lastMessage.content
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Last message for open/in-progress tickets */}
                    {shouldShowLastMessageForActiveTickets() && (
                        <div className={`mt-3 p-3 rounded-lg border ${unreadCount > 0
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className={`w-4 h-4 ${unreadCount > 0 ? 'text-blue-600' : 'text-slate-600'}`} />
                                <span className={`text-xs font-medium ${unreadCount > 0 ? 'text-blue-800' : 'text-slate-700'}`}>
                                    {unreadCount > 0 ? `${unreadCount} Unread Message${unreadCount !== 1 ? 's' : ''}` : 'Recent Message'}
                                </span>
                                {unreadCount > 0 && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Unread messages" />
                                )}
                                {lastMessage.hasAttachments && (
                                    <Paperclip title="Has attachments" className={`w-3 h-3 ${unreadCount > 0 ? 'text-blue-600' : 'text-slate-600'}`} />
                                )}
                            </div>
                            <div className={`text-xs ${unreadCount > 0 ? 'text-blue-800' : 'text-slate-700'}`}>
                                <div className="flex items-center gap-1 mb-1">
                                    <User className="w-3 h-3" />
                                    <span className="font-medium">{lastMessage.senderName}</span>
                                    <span className="opacity-60">•</span>
                                    <span className={`${unreadCount > 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                                        {moment(lastMessage.createdAt).fromNow()}
                                    </span>
                                </div>
                                <p className="line-clamp-2 leading-relaxed">
                                    {lastMessage.content.length > 100
                                        ? `${lastMessage.content.substring(0, 100)}...`
                                        : lastMessage.content
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Metadata Grid */}
                <div className="space-y-3 mt-auto">
                    {/* Assignee and Category */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg flex-1 mr-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="truncate font-medium">{localTicket.createdByUser?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                            <Tag className="w-4 h-4 text-slate-400" />
                            <span className="truncate">{localTicket.category}</span>
                        </div>
                    </div>

                    {/* Dates Row */}
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>Created {moment(localTicket.createdAt).format('MMM DD, YYYY')}</span>
                        </div>
                        <div className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'
                            }`}>
                            <AlertCircle className="w-3 h-3" />
                            <span>
                                {localTicket.dueDate ?
                                    `Due ${moment(localTicket.dueDate).format('MMM DD')}` :
                                    'No due date'
                                }
                            </span>
                        </div>
                    </div>

                    {/* Footer with updated time and view action */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>Updated {moment(localTicket.updatedAt).fromNow()}</span>
                            {localTicket.hasNewActivity && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Recent activity" />
                            )}
                        </div>

                        <AnimatePresence>
                            {isHovered && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-1 text-blue-600 text-xs font-medium"
                                >
                                    <Eye className="w-3 h-3" />
                                    <span>View Details</span>
                                    <ArrowRight className="w-3 h-3" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}