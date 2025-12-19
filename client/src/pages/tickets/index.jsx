import Pagination from "../../components/ui/pagination";
import useTickets from "../../lib/hooks/useTickets";
import Header from "./components/header";
import TicketCard from "./components/ticketCard";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useSocket } from "../../lib/contexts/SocketContext";
import { useSearchParams } from "react-router-dom";

// Ticket skeleton loader matching TicketCard layout
function TicketSkeleton() {
    return (
        <div className="animate-pulse bg-white border border-gray-200 rounded-xl h-full min-h-80  flex flex-col p-4 gap-4">
            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 to-gray-100 rounded-t-xl" />
            {/* Header */}
            <div className="flex items-start justify-between mb-4 mt-2">
                <div className="flex items-center gap-2">
                    <div className="h-14 w-20 bg-gray-100 rounded-xl font-mono" />
                    <div className="h-5 w-5 bg-gray-200 rounded" />
                    <div className="h-5 w-5 bg-gray-100 rounded" />
                    <div className="h-5 w-5 bg-gray-100 rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
            </div>
            {/* Title and description */}
            <div className="flex-1 flex flex-col justify-start mb-4 gap-2">
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-full bg-gray-100 rounded mb-1" />
                <div className="h-4 w-2/3 bg-gray-100 rounded mb-1" />
                <div className="flex gap-2 mt-2">
                    <div className="h-4 w-16 bg-gray-100 rounded" />
                    <div className="h-4 w-20 bg-gray-100 rounded" />
                </div>
                {/* Simulate milestone badges */}
                <div className="flex gap-2 mt-2">
                    <div className="h-5 w-40 bg-blue-100 rounded-xl" />
                 </div>
                {/* Simulate alert/info box */}
                <div className="h-8 w-full bg-gray-100 rounded-lg mt-2" />
                {/* Simulate last message/closure info */}
                <div className="h-10 w-full bg-gray-100 rounded-lg mt-2" />
            </div>
            {/* Metadata grid */}
            <div className="space-y-3 mt-auto">
                <div className="flex items-center justify-between">
                    <div className="h-6 w-28 bg-gray-100 rounded-lg mr-2" />
                    <div className="h-6 w-20 bg-gray-100 rounded-lg" />
                </div>
                <div className="flex items-center justify-between">
                    <div className="h-4 w-28 bg-gray-100 rounded" />
                    <div className="h-4 w-20 bg-gray-100 rounded" />
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                    <div className="h-4 w-20 bg-gray-100 rounded" />
                </div>
            </div>
        </div>
    );
}

export default function Tickets() {
    const { tickets, filters, totalPages, currentPage, setTickets, fetchTickets, updateLastMessage, updateTicketWithMessage, addNewTicket, markBuzzerAlert, clearBuzzerAlert, setFilters, loading } = useTickets();
    const [searchParams, setSearchParams] = useSearchParams();
    const { isConnected } = useSocket();
    
    // Initialize filters from URL on mount
    useEffect(() => {
        const statusParam = searchParams.get('status');
        const stageParam = searchParams.get('stage');
        const searchParam = searchParams.get('search');
        
        // Only update filters if URL params exist (convert hyphens to underscores)
        if (statusParam || stageParam || searchParam) {
            setFilters({
                status: statusParam ? statusParam.replace(/-/g, '_').toUpperCase() : '',
                stage: stageParam ? stageParam.replace(/-/g, '_').toUpperCase() : '',
                search: searchParam || ''
            });
        }
    }, []); // Run only on mount
    
    const handleStatusChange = (ticketId, newStatus) => {
        setTickets(prev => prev.map(ticket =>
            ticket.id === ticketId
                ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
                : ticket
        ));
    };

    const handleDelete = (ticketId) => {
        setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
    };

    const handleView = (ticketId) => {
         // Navigate to ticket detail page
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    useEffect(() => {
        fetchTickets({ skip: currentPage, take: 8, filter: filters });
    }, [filters, currentPage]);

    // Socket event listener for real-time ticket message updates
    useEffect(() => {
        const handleTicketMessageUpdate = (event) => {
            const messageData = event.detail;
             // Update the ticket's last message and ticket data in Redux store
            if (messageData.ticketId) {
                // Use server-provided ticket updates if available, or generate client-side
                const ticketUpdates = messageData.ticketUpdates || {
                    lastActivity: messageData.createdAt,
                    messageCount: (tickets.find(t => t.id === messageData.ticketId)?.messages?.length || 0) + 1,
                    hasNewActivity: true,
                    updatedAt: messageData.createdAt
                };
                
                updateTicketWithMessage(messageData.ticketId, messageData, ticketUpdates);
            }
        };

        const handleNewTicketCreated = (event) => {
            const ticketData = event.detail;
             addNewTicket(ticketData);
        };

        const handleBuzzerAlert = (event) => {
            const alertData = event.detail;
             
            // Mark ticket with buzzer alert (NO AUTO-CLEAR - persists until Macsoft responds)
            if (alertData.ticketId) {
                 markBuzzerAlert(alertData.ticketId, alertData);
            } else {
                console.warn('🚨 [TICKETS PAGE] No ticketId in alert data!');
            }
        };

        const handleBuzzerAlertCleared = (event) => {
            const data = event.detail;
             if (data.ticketId) {
                 clearBuzzerAlert(data.ticketId);
            }
        };

        // Listen for ticket message updates
        window.addEventListener('ticketMessageUpdate', handleTicketMessageUpdate);
        
        // Listen for new ticket creation
        window.addEventListener('ticketCreated', handleNewTicketCreated);
        
        // Listen for buzzer alerts
        window.addEventListener('socketBuzzerAlert', handleBuzzerAlert);
        // if socketBuzzerAlert refresh the ticket list to show the alert icon
    
        // Listen for buzzer alert cleared
        window.addEventListener('socketBuzzerAlertCleared', handleBuzzerAlertCleared);

        return () => {
            window.removeEventListener('ticketMessageUpdate', handleTicketMessageUpdate);
            window.removeEventListener('ticketCreated', handleNewTicketCreated);
            window.removeEventListener('socketBuzzerAlert', handleBuzzerAlert);
            window.removeEventListener('socketBuzzerAlertCleared', handleBuzzerAlertCleared);
        };
    }, [updateTicketWithMessage, addNewTicket, tickets, markBuzzerAlert, clearBuzzerAlert]);
     const handlePageChange = (newPage) => {
        fetchTickets({ skip: newPage, take: 8, filter: filters });
    }
    return (
        <section className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            <Header />
            {/* Socket Connection Status */}
            {isConnected && (
                <div className="px-5 py-1">
                    <div className="flex items-center gap-2 text-xs text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Real-time updates active</span>
                    </div>
                </div>
            )}
            <motion.section
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="px-5 py-2 pb-20 "
            >
                 {/* Show skeletons while loading */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <TicketSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <>
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                            variants={containerVariants}
                        >
                            {tickets.map((ticket, index) => (
                                <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{
                                        delay: index * 0.1,
                                        duration: 0.5,
                                        ease: [0.25, 0.46, 0.45, 0.94]
                                    }}
                                >
                                    <TicketCard
                                        ticket={ticket}
                                        onStatusChange={handleStatusChange}
                                        onDelete={handleDelete}
                                        onView={handleView}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                        {tickets.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="flex flex-col items-center justify-center py-16 text-center"
                            >
                                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets found</h3>
                                <p className="text-gray-500">Get started by creating your first ticket.</p>
                            </motion.div>
                        )}
                    </>
                )}
            </motion.section>
            <footer className="fixed w-full bottom-0 bg-white">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    siblingCount={1}
                    showItemsInfo={true}
                />
            </footer>
        </section>
    );
}