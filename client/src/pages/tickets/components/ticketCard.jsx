import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
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
    Paperclip
} from 'lucide-react';
import moment from 'moment';
import { useAuth } from '../../../lib/hooks/useAuth';
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
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleStatusChange = (newStatus) => {
        onStatusChange?.(ticket.id, newStatus);
    };

    const handleCardClick = (e) => {
        // Prevent navigation if clicking on interactive elements
        if (e.target.closest('button') || e.target.closest('[data-radix-popper-content-wrapper]')) {
            return;
        }
        navigate(`/tickets/${ticket.id}`);
    };

    const handleButtonClick = (e, callback) => {
        e.preventDefault();
        e.stopPropagation();
        callback?.();
    };

    const getPriorityIcon = () => {
        switch (ticket.priority) {
            case TICKET_PRIORITY.HIGH:
                return <AlertCircle className="w-3 h-3 text-red-500" />;
            case TICKET_PRIORITY.MEDIUM:
                return <Zap className="w-3 h-3 text-orange-500" />;
            default:
                return <Tag className="w-3 h-3 text-blue-500" />;
        }
    };

    // Helper function to get last message
    const getLastMessage = () => {
        if (!ticket.messages || ticket.messages.length === 0) return null;
        const lastMessage = ticket.messages[ticket.messages.length - 1];
        return {
            content: lastMessage.content || '',
            senderName: lastMessage.sender?.name || 'Unknown',
            createdAt: lastMessage.createdAt,
            hasAttachments: lastMessage.attachments && lastMessage.attachments.length > 0
        };
    };

    // Helper function to get unread/unseen message count
    const getUnreadMessageCount = () => {
        if (!ticket.messages || ticket.messages.length === 0 || !user?.id) return 0;
        
        return ticket.messages.filter(message => {
            // Skip messages sent by current user (they are automatically "read")
            if (message.senderId === user.id) return false;
            
            // If seenBy is empty or current user hasn't seen it
            if (!message.seenBy || message.seenBy.length === 0) return true;
            
            // Check if current user has seen this message
            const hasUserSeen = message.seenBy.some(seen => seen.userId === user.id);
            return !hasUserSeen;
        }).length;
    };

    // Helper function to check if we should show new message indicator
    const shouldShowNewMessageIndicator = () => {
        // Don't show message indicator for closed tickets
        if (ticket.status === TICKET_STATUS.CLOSED || ticket.status === TICKET_STATUS.RESOLVED) {
            return false;
        }
        
        if (!hasMessages || unreadCount === 0) return false;
        
        const lastMessage = getLastMessage();
        if (!lastMessage) return false;
        
        // Don't show if the last message sender is the current user
        const lastMessageFromDb = ticket.messages[ticket.messages.length - 1];
        if (lastMessageFromDb && lastMessageFromDb.senderId === user?.id) return false;
        
        return unreadCount > 0;
    };

    const lastMessage = getLastMessage();
    const hasMessages = ticket.messages && ticket.messages.length > 0;
    const unreadCount = getUnreadMessageCount();

    const isOverdue = ticket.dueDate && moment(ticket.dueDate).isBefore(moment(), 'day');

    // Helper function to get closure information
    const getClosureInfo = () => {
        if (ticket.status !== TICKET_STATUS.CLOSED && ticket.status !== TICKET_STATUS.RESOLVED) {
            return null;
        }

        if (!ticket.ticketMilestones || ticket.ticketMilestones.length === 0) {
            return null;
        }

        // Check for field clearance scenarios first (higher priority)
        const fieldClearedMilestone = ticket.ticketMilestones.find(m => 
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{
                y: -4,
                scale: 1.02,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            transition={{
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94]
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
                ${isOverdue ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'}
                hover:border-gray-300 shadow-sm transition-all duration-300
                backdrop-blur-sm
            `}
        >
            {/* Status indicator line */}
            <div className={`
                absolute top-0 left-0 right-0 h-1
                ${ticket.status === TICKET_STATUS.OPEN ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                    ticket.status === TICKET_STATUS.IN_PROGRESS ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
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
            {ticket.isNewTicket && (
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
            <div className="relative z-10 h-full flex flex-col p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    {/* Ticket ID & Priority */}
                    <div className="flex items-center gap-2">
                        <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded"
                        >
                            {ticket.ticketCode || ticket.id}
                        </motion.span>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            {getPriorityIcon()}
                        </motion.div>
                    </div>

                    {/* Status Display */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`
                            flex items-center gap-2 text-xs font-medium
                            px-3 py-1.5 rounded-full border transition-all
                            ${STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-800 border-gray-200'} 
                            capitalize backdrop-blur-sm shadow-sm
                        `}
                    >
                        <div className={`w-2 h-2 rounded-full ${
                            ticket.status === TICKET_STATUS.OPEN ? 'bg-red-500' :
                            ticket.status === TICKET_STATUS.IN_PROGRESS ? 'bg-yellow-500' :
                            'bg-blue-500'
                        }`}></div>
                        {ticket.status.replace('-', ' ')}
                    </motion.div>
                </div>

                {/* Title and Description */}
                <div className="flex-1 flex flex-col justify-start mb-4">
                    <motion.h4
                        className="text-base font-semibold text-slate-800 mb-2 line-clamp-2 leading-snug"
                        whileHover={{ color: "#3b82f6" }}
                        transition={{ duration: 0.2 }}
                    >
                        {ticket.title}
                    </motion.h4>
                    <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                        {ticket.description}
                    </p>
                    {/* ticket ticketMilestones is array */}
                    {ticket.ticketMilestones    && ticket.ticketMilestones.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                            {ticket.ticketMilestones.filter((m) => m.status === "IN_PROGRESS").map((milestone) => (
                                <span
                                    key={milestone.id}
                                    className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded-tr-xl rounded-bl-xl font-medium"
                                >
                                    {milestone.stage.replace(/_/g, ' ')}{/*  by <span className='text-yellow-500'>{milestone.changer?.name || ''}</span> */}
                                </span>
                            ))}
                        </div>
                    )}
                    
                    {/* Show detailed closure information for closed/resolved tickets */}
                    {closureInfo && (
                        <div className={`mt-3 p-3 ${closureInfo.bgColor} rounded-lg border ${closureInfo.borderColor}`}>
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
                        </div>
                    )}
                    
                    {/* Conversation indicator and last message - only show if there are unread messages and last message is not from current user */}
                    {shouldShowNewMessageIndicator() && (
                        <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                            <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-medium text-emerald-800">
                                    {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                                </span>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="New messages" />
                                {lastMessage && lastMessage.hasAttachments && (
                                    <Paperclip title="Has attachments" className="w-2 h-2 sm:w-3 sm:h-3 text-green-600" />
                                )}
                            </div>
                            {lastMessage && (
                                <div className="text-xs text-emerald-700">
                                    <span className="font-medium">{lastMessage.senderName}:</span>
                                    <span className="ml-1 line-clamp-1">
                                        {lastMessage.content.length > 50 
                                            ? `${lastMessage.content.substring(0, 50)}...` 
                                            : lastMessage.content
                                        }
                                        {lastMessage && lastMessage.hasAttachments && (
                                            <span className="ml-1 text-green-600">Attachment</span>
        )}
                                    </span>
                                    <div className="text-emerald-500 mt-1">
                                        {moment(lastMessage.createdAt).fromNow()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Metadata Grid */}
                <div className="space-y-3 mt-auto">
                    {/* Assignee and Category */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg flex-1 mr-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="truncate font-medium">{ticket.createdByUser?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                            <Tag className="w-4 h-4 text-slate-400" />
                            <span className="truncate">{ticket.category}</span>
                        </div>
                    </div>

                    {/* Dates Row */}
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>Created {moment(ticket.createdAt).format('MMM DD, YYYY')}</span>
                        </div>
                        <div className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'
                            }`}>
                            <AlertCircle className="w-3 h-3" />
                            <span>
                                {ticket.dueDate ?
                                    `Due ${moment(ticket.dueDate).format('MMM DD')}` :
                                    'No due date'
                                }
                            </span>
                        </div>
                    </div>

                    {/* Footer with updated time and view action */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>Updated {moment(ticket.updatedAt).fromNow()}</span>
                            {ticket.hasNewActivity && (
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