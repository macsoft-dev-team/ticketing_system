import { Plus, Search, Filter, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useCallback } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import useTickets from "../../../lib/hooks/useTickets";
import { useDebounce } from "../../../lib/hooks/ticketHooks";

export default function Header() {
    const { tickets, setFilters, filters, statusCount, setCurrentPage } = useTickets();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeFilter, setActiveFilter] = useState(filters?.status || '');
    const [activeStageFilter, setActiveStageFilter] = useState(filters?.stage || '');
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [searchType, setSearchType] = useState(filters?.searchType || 'controller');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isStageDropdownOpen, setIsStageDropdownOpen] = useState(false);

    // Stage options based on the provided requirements
    const stageOptions = [
        { value: '', label: 'All Stages' },
        { value: 'TICKET_RAISED', label: 'Ticket Raised' },
        { value: 'SERVICE_CENTER_ASSIGNED', label: 'Service Center Assigned' },
        { value: 'REQUEST_CLEARED_AT_FIELD', label: 'Request Cleared at Field' },
        { value: 'SENT_TO_SERVICE_CENTER', label: 'Sent to Service Center' },
        { value: 'SUBMITTED_TO_SERVICE_CENTER', label: 'Submitted to Service Center' },
        { value: 'RECEIVED_AT_SERVICE_CENTER', label: 'Received at Service Center' },
        { value: 'DIAGNOSIS_IN_PROGRESS', label: 'Diagnosis in Progress' },
        { value: 'SPARE_REQUESTED', label: 'Spare Requested' },
        { value: 'SPARE_APPROVED', label: 'Spare Approved' },
        { value: 'PARTIALY_SPARE_APPROVED', label: 'Partially Spare Approved' },
        { value: 'REPAIR_IN_PROGRESS', label: 'Repair in Progress' },
        { value: 'REPLACEMENT_IN_PROGRESS', label: 'Replacement in Progress' },
        { value: 'REPAIRED', label: 'Repaired' },
        { value: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch' },
        { value: 'DELIVERED_TO_FIELD', label: 'Delivered to Field' },
        { value: 'FIELD_CLEARANCE_APPROVED', label: 'Field Clearance Approved' },
        { value: 'TICKET_CLOSED', label: 'Ticket Closed' }
    ];

    // Debounce the search term with 300ms delay
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    
    // Initialize from URL params on mount
    useEffect(() => {
        const statusParam = searchParams.get('status');
        const stageParam = searchParams.get('stage');
        const searchParam = searchParams.get('search');
        const searchTypeParam = searchParams.get('searchType');
        
        // Convert hyphens to underscores and uppercase
        if (statusParam) setActiveFilter(statusParam.replace(/-/g, '_').toUpperCase());
        if (stageParam) setActiveStageFilter(stageParam.replace(/-/g, '_').toUpperCase());
        if (searchParam) setSearchTerm(searchParam);
        if (searchTypeParam) setSearchType(searchTypeParam);
    }, []);
    
    const filterTabItems = [
        { id: '', label: 'All', shortLabel: 'All', key: 'ALL' },
        { id: 'OPEN', label: 'Open', shortLabel: 'Open', key: 'OPEN' },
        { id: 'IN_PROGRESS', label: 'In Progress', shortLabel: 'Progress', key: 'IN_PROGRESS' },
        { id: 'CLOSED', label: 'Closed', shortLabel: 'Closed', key: 'CLOSED' }
    ];

    // Handle filter changes
    const handleFilterChange = useCallback((status) => {
        setActiveFilter(status);
        setFilters({ status, stage: activeStageFilter, search: debouncedSearchTerm || '', searchType });
        setCurrentPage(0); // Reset to first page on filter change
        
        // Update URL params (convert underscores to hyphens for URL)
        const newParams = new URLSearchParams(searchParams);
        if (status) {
            newParams.set('status', status.toLowerCase().replace(/_/g, '-'));
        } else {
            newParams.delete('status');
        }
        setSearchParams(newParams);
    }, [activeStageFilter, debouncedSearchTerm, searchType, setFilters, setCurrentPage, searchParams, setSearchParams]);

    // Handle stage filter changes
    const handleStageFilterChange = useCallback((stage) => {
        setActiveStageFilter(stage);
        setFilters({ status: activeFilter, stage, search: debouncedSearchTerm || '', searchType });
        setCurrentPage(0); // Reset to first page on filter change
        setIsStageDropdownOpen(false);
        
        // Update URL params (convert underscores to hyphens for URL)
        const newParams = new URLSearchParams(searchParams);
        if (stage) {
            newParams.set('stage', stage.toLowerCase().replace(/_/g, '-'));
        } else {
            newParams.delete('stage');
        }
        setSearchParams(newParams);
    }, [activeFilter, debouncedSearchTerm, searchType, setFilters, setCurrentPage, searchParams, setSearchParams]);

    // Handle search changes
    const handleSearchChange = useCallback((search) => {
        setSearchTerm(search);
        // Don't immediately update filters - let the debounced effect handle it
    }, []);

    // Update filters when debounced search term changes
    useEffect(() => {
        // Only update if the values have actually changed and setFilters is available
        const currentSearch = debouncedSearchTerm || '';
        if (setFilters && (filters?.status !== activeFilter || filters?.stage !== activeStageFilter || filters?.search !== currentSearch || filters?.searchType !== searchType)) {
            setFilters({ status: activeFilter, stage: activeStageFilter, search: currentSearch, searchType });
            
            // Update URL params for search
            const newParams = new URLSearchParams(searchParams);
            if (currentSearch) {
                newParams.set('search', currentSearch);
            } else {
                newParams.delete('search');
            }
            if (searchType) {
                newParams.set('searchType', searchType);
            }
            setSearchParams(newParams);
        }
    }, [debouncedSearchTerm, activeFilter, activeStageFilter, searchType, filters?.status, filters?.stage, filters?.search, filters?.searchType, setFilters, searchParams, setSearchParams]);

    // Close stage dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isStageDropdownOpen && !event.target.closest('[data-stage-dropdown]')) {
                setIsStageDropdownOpen(false);
            }
        };

        if (isStageDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isStageDropdownOpen]);

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
            <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
                {/* Left Section */}
                <div className="flex items-center space-x-2 sm:space-x-6">
                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg sm:text-xl lg:text-2xl tracking-wide font-medium text-slate-700 uppercase"
                    >
                        Tickets
                    </motion.h1>

                    {/* Filter Tabs - Hidden on small screens */}
                         <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="hidden lg:flex bg-gray-100 rounded-lg p-1"
                        >
                            {filterTabItems.map((filter, index) => (
                                <motion.button
                                    key={filter.id}
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={() => handleFilterChange(filter.id)}
                                    className={`relative px-3 lg:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeFilter === filter.id
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * (index + 1) }}
                                >
                                    <span className="hidden xl:inline">{filter.label}</span>
                                    <span className="xl:hidden">{filter.shortLabel}</span>
                                    {statusCount?.[filter.key] > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2 * (index + 1) }}
                                            className={`ml-1 lg:ml-2 px-1.5 lg:px-2 py-0.5 text-xs rounded-full ${activeFilter === filter.id
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-gray-200 text-gray-600'
                                                }`}
                                        >
                                            {statusCount?.[filter.key]}
                                        </motion.span>
                                    )}

                                    {activeFilter === filter.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white rounded-md shadow-sm"
                                            style={{ zIndex: -1 }}
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>

                    {/* Stage Filter Dropdown - Desktop */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 }}
                        className="hidden lg:block relative"
                        data-stage-dropdown
                    >
                        <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => setIsStageDropdownOpen(!isStageDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                        >
                             <span className="text-gray-900">
                                {activeStageFilter ? stageOptions.find(s => s.value === activeStageFilter)?.label : 'All Stages'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                                isStageDropdownOpen ? 'rotate-180' : ''
                            }`} />
                        </motion.button>

                        <AnimatePresence>
                            {isStageDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full right-0 mt-1 sm:min-w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                                >
                                    {stageOptions.map((stage, index) => (
                                        <motion.button
                                            key={stage.value}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            onClick={() => handleStageFilterChange(stage.value)}
                                            className={`w-full text-left px-4 py-3 text-xs sm:text-sm hover:bg-gray-50 transition-colors duration-150 ${
                                                activeStageFilter === stage.value
                                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                                    : 'text-gray-700'
                                            } ${
                                                index === 0 ? 'rounded-t-lg' : ''
                                            } ${
                                                index === stageOptions.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-100'
                                            }`}
                                        >
                                            {stage.label}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                 </div>

                {/* Right Section */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Search Type Select - Desktop */}
                    <motion.select
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="hidden md:block px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                        <option value="controller">Controller No</option>
                        <option value="ticket">Ticket No</option>
                    </motion.select>

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
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10 pr-4 py-2 w-48 lg:w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                        </motion.div>
 
                         <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="md:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200"
                        >
                            <Search className="w-4 h-4" />
                        </motion.button>
                     {/* Filter Button - Mobile & Tablet */}
                         <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
                        </motion.button>
                     {/* Create Ticket Button */}
                    <NavLink to="/tickets/new" >
                        <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center cursor-pointer gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Create Ticket</span>
                            <span className="sm:hidden">Create</span>
                        </motion.button>
                    </NavLink>

                </div>
            </div>

            {/* Mobile Search Bar */}
            {tickets.length > 0 && (
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="md:hidden px-4 pb-4 border-t border-gray-200"
                        >
                            <div className="space-y-2">
                                {/* Search Type Select - Mobile */}
                                <select
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="controller">Controller No</option>
                                    <option value="ticket">Ticket No</option>
                                </select>
                                
                                {/* Search Input - Mobile */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="search"
                                        placeholder="Search tickets..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Mobile Filter Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="lg:hidden px-4 pb-4 border-t border-gray-200 bg-gray-50"
                    >
                        <div className="space-y-4 mt-4">
                            {/* Status Filter */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {filterTabItems.map((filter, index) => (
                                        <motion.button
                                            key={filter.id}
                                            variants={buttonVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                            onClick={() => {
                                                handleFilterChange(filter.id);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={`flex items-center justify-between px-3 py-3 rounded-lg border transition-all duration-200 ${activeFilter === filter.id
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                                }`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * index }}
                                        >
                                            <span className="text-sm font-medium">{filter.label}</span>
                                            {statusCount?.[filter.key] > 0 && (
                                                <span className={`px-2 py-1 text-xs rounded-full ${activeFilter === filter.id
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {statusCount?.[filter.key]}
                                                </span>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Stage Filter */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Stage</h3>
                                <select
                                    value={activeStageFilter}
                                    onChange={(e) => {
                                        handleStageFilterChange(e.target.value);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    {stageOptions.map((stage) => (
                                        <option key={stage.value} value={stage.value}>
                                            {stage.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}