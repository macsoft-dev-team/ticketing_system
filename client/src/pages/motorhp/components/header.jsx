import { Plus, Search, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export default function Header({ onAddMotorHP, onSearchChange, totalCount = 0 }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Handle search changes
    const handleSearchChange = (search) => {
        setSearchTerm(search);
        if (onSearchChange) {
            onSearchChange(search);
        }
    };

    const headerVariants = {
        initial: { opacity: 0, y: -20 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        }
    };

    const buttonVariants = {
        hover: {
            scale: 1.05,
            transition: { duration: 0.2 }
        },
        tap: {
            scale: 0.95,
            transition: { duration: 0.1 }
        }
    };

    return (
        <motion.header
            variants={headerVariants}
            initial="initial"
            animate="animate"
            className="bg-white md:bg-transparent border-b border-gray-200 shadow-sm md:shadow-none md:border-0"
        >
            {/* Main Header - Desktop & Mobile */}
            <div className="flex justify-between items-center px-4 sm:px-0 py-3 sm:py-4">
                {/* Left Section */}
                <div className="flex items-center space-x-2 sm:space-x-6">
                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center space-x-3"
                    >
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Wrench className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl lg:text-2xl tracking-wide font-medium text-slate-700 uppercase">
                                Motor HP Management
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {totalCount} configurations
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Search Input - Desktop */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="hidden md:block relative"
                    >
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <motion.input
                            whileFocus={{ scale: 1.02 }}
                            type="search"
                            placeholder="Search motor HP..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10 pr-4 py-2 w-48 lg:w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                    </motion.div>

                    {/* Search Button - Mobile */}
                    <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className="md:hidden p-2 text-gray-600 hover:text-gray-900 bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                        <Search className="w-5 h-5" />
                    </motion.button>

                    {/* Add Motor HP Button */}
                    <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={onAddMotorHP}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-sm transition-colors duration-200 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Motor HP</span>
                        <span className="sm:hidden">Add</span>
                    </motion.button>
                </div>
            </div>

            {/* Mobile Search Bar */}
            <motion.div
                initial={false}
                animate={{
                    height: isSearchOpen ? "auto" : 0,
                    opacity: isSearchOpen ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="md:hidden overflow-hidden border-t border-gray-200"
            >
                <div className="px-4 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="search"
                            placeholder="Search motor HP..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </motion.div>
        </motion.header>
    );
}