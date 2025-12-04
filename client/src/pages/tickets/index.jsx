import Pagination from "../../components/ui/pagination";
import useTickets from "../../lib/hooks/useTickets";
import Header from "./components/header";
import TicketCard from "./components/ticketCard";
import { motion } from "motion/react";
import { useEffect } from "react";

export default function Tickets() {
    const { tickets, filters, totalPages, currentPage, setTickets, fetchTickets } = useTickets();
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
     const handlePageChange = (newPage) => {
        fetchTickets({ skip: newPage, take: 8, filter: filters });
    }
    return (
        <section className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            <Header />
            <motion.section
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="px-5 py-2 sm:pb-20"
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