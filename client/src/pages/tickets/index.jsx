import Pagination from "../../components/ui/pagination";
import useTickets from "../../lib/hooks/useTickets";
import Header from "./components/header";
import TicketCard from "./components/ticketCard";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useSocket } from "../../lib/contexts/SocketContext";

export default function Tickets() {
    const { tickets, filters, totalPages, currentPage, setTickets, fetchTickets, updateLastMessage, updateTicketWithMessage, addNewTicket, markBuzzerAlert, clearBuzzerAlert } = useTickets();
    const { isConnected } = useSocket();
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
    }, [filters, totalPages, currentPage]);

    // Socket event listener for real-time ticket message updates
    useEffect(() => {
        const handleTicketMessageUpdate = (event) => {
            const messageData = event.detail;
            console.log('📩 Updating ticket card with new message:', messageData);
            
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
            console.log('🎫 New ticket created:', ticketData);
            
            // Add new ticket to the list
            addNewTicket(ticketData);
        };

        const handleBuzzerAlert = (event) => {
            const alertData = event.detail;
            console.log('🚨 [TICKETS PAGE] Buzzer alert event received!');
            console.log('🚨 [TICKETS PAGE] Alert data:', alertData);
            console.log('🚨 [TICKETS PAGE] Ticket code:', alertData.ticketCode);
            console.log('🚨 [TICKETS PAGE] Ticket ID:', alertData.ticketId);
            
            // Mark ticket with buzzer alert (NO AUTO-CLEAR - persists until Macsoft responds)
            if (alertData.ticketId) {
                console.log('🚨 [TICKETS PAGE] Marking ticket with buzzer alert:', alertData.ticketId);
                markBuzzerAlert(alertData.ticketId, alertData);
            } else {
                console.warn('🚨 [TICKETS PAGE] No ticketId in alert data!');
            }
        };

        const handleBuzzerAlertCleared = (event) => {
            const data = event.detail;
            console.log('🔕 [TICKETS PAGE] Buzzer alert cleared event received!');
            console.log('🔕 [TICKETS PAGE] Ticket ID:', data.ticketId);
            
            if (data.ticketId) {
                console.log('🔕 [TICKETS PAGE] Clearing buzzer alert for:', data.ticketId);
                clearBuzzerAlert(data.ticketId);
            }
        };

        // Listen for ticket message updates
        window.addEventListener('ticketMessageUpdate', handleTicketMessageUpdate);
        
        // Listen for new ticket creation
        window.addEventListener('ticketCreated', handleNewTicketCreated);
        
        // Listen for buzzer alerts
        window.addEventListener('socketBuzzerAlert', handleBuzzerAlert);
        
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
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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