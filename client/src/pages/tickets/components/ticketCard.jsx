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
    Eye
} from 'lucide-react';
import moment from 'moment';
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

    const isOverdue = ticket.dueDate && moment(ticket.dueDate).isBefore(moment(), 'day');

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
                bg-white border rounded-xl h-full min-h-[280px] max-h-[320px]
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
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-bl-md rounded-tr-xl font-medium shadow-sm">
                        Overdue
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
                <div className="flex-1 mb-4">
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
                </div>

                {/* Metadata Grid */}
                <div className="space-y-3 mt-auto">
                    {/* Assignee and Category */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg flex-1 mr-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="truncate font-medium">{ticket.assignedTo}</span>
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