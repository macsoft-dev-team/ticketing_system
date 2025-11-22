import { Plus, Search, Filter, X, Upload, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef, useCallback } from "react";
import useUser from "../../../lib/hooks/useUser";
import { useDebounce } from "../../../lib/hooks/ticketHooks";

export default function Header({ onAddUser, onUploadUsers, onFilterChange, onSearchChange, onRoleChange }) {
    const { statusCounts, filters, setFilters } = useUser();
    const [activeFilter, setActiveFilter] = useState(filters?.status || '');
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedRole, setSelectedRole] = useState(filters?.role || '');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const roleDropdownRef = useRef(null);
    
    // Debounce the search term with 300ms delay
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
     const filterTabItems = [
        { id: '', label: 'All Users', shortLabel: 'All', count: statusCounts?.ALL || 0 ,key: 'ALL'},
        { id: 'ACTIVE', label: 'Active', shortLabel: 'Active', count: statusCounts?.ACTIVE || 0 ,key: 'ACTIVE'},
        { id: 'INACTIVE', label: 'Inactive', shortLabel: 'Inactive', count: statusCounts?.INACTIVE || 0 ,key: 'INACTIVE'},
     ];

     const roleOptions = [
        { value: '', label: 'All Roles' },
        { value: 'MACSOFT_ADMIN', label: 'Macsoft Admin' },
        { value: 'MACSOFT_HEAD', label: 'Macsoft Head' },
        { value: 'MACSOFT_SUPPORT', label: 'Macsoft Support' },
        { value: 'CUSTOMER_SERVICE_HEAD', label: 'Customer Service Head' },
        { value: 'SERVICE_CENTER_TECHNICIAN', label: 'Service Center Technician' },
        { value: 'CUSTOMER_FIELD_ENGINEER', label: 'Customer Field Engineer' },
     ];

    // Sync local state with filter state
    useEffect(() => {
        setActiveFilter(filters?.status || '');
        setSearchTerm(filters?.search || '');
        setSelectedRole(filters?.role || '');
    }, [filters]);

    // Close role dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
                setIsRoleDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update filters when debounced search term changes
    useEffect(() => {
        // Only update if the values have actually changed and setFilters is available
        const currentSearch = debouncedSearchTerm || '';
        if (setFilters && (filters?.search !== currentSearch)) {
            setFilters({ 
                ...filters, 
                search: currentSearch, 
                status: activeFilter, 
                role: selectedRole 
            });
        }
    }, [debouncedSearchTerm, activeFilter, selectedRole, filters?.search, setFilters]);

    // Handle filter changes
    const handleFilterChange = useCallback((status) => {
        setActiveFilter(status);
        setFilters({ ...filters, status, search: debouncedSearchTerm || '', role: selectedRole });
        if (onFilterChange) {
            onFilterChange(status);
        }
    }, [debouncedSearchTerm, selectedRole, filters, setFilters, onFilterChange]);

    // Handle search changes
    const handleSearchChange = useCallback((search) => {
        setSearchTerm(search);
        // Don't immediately update filters - let the debounced effect handle it
        if (onSearchChange) {
            onSearchChange(search);
        }
    }, [onSearchChange]);

    // Handle role changes
    const handleRoleChange = useCallback((role) => {
        setSelectedRole(role);
        setFilters({ ...filters, role, search: debouncedSearchTerm || '', status: activeFilter });
        setIsRoleDropdownOpen(false);
        if (onRoleChange) {
            onRoleChange(role);
        }
    }, [debouncedSearchTerm, activeFilter, filters, setFilters, onRoleChange]);

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
                        Users
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
                                className={`relative px-3 lg:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                    activeFilter === filter.id
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * (index + 1) }}
                            >
                                <span className="hidden xl:inline">{filter.label}</span>
                                <span className="xl:hidden">{filter.shortLabel}</span>
                                {filter.count > 0 && (
                                    <motion.span 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2 * (index + 1) }}
                                        className={`ml-1 lg:ml-2 px-1.5 lg:px-2 py-0.5 text-xs rounded-full ${
                                            activeFilter === filter.id 
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-gray-200 text-gray-600'
                                        }`}
                                    >
                                        {filter.count}
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
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Role Filter Dropdown - Desktop */}
                    <motion.div 
                        ref={roleDropdownRef}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        className="hidden md:block relative"
                    >
                        <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-lg shadow-sm transition-all duration-200 min-w-[160px]"
                        >
                            <span className="truncate">
                                {roleOptions.find(role => role.value === selectedRole)?.label || 'All Roles'}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                                isRoleDropdownOpen ? 'rotate-180' : ''
                            }`} />
                        </motion.button>

                        <AnimatePresence>
                            {isRoleDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                                >
                                    {roleOptions.map((role, index) => (
                                        <motion.button
                                            key={role.value}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 * index }}
                                            onClick={() => handleRoleChange(role.value)}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                                                selectedRole === role.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                                            }`}
                                        >
                                            {role.label}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

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
                            placeholder="Search users..."
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

                    {/* Upload Button */}
                    <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={onUploadUsers}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center cursor-pointer gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Upload</span>
                    </motion.button>

                    {/* Add User Button */}
                    <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={onAddUser}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center cursor-pointer gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add User</span>
                        <span className="sm:hidden">Add</span>
                    </motion.button>
 
                </div>
            </div>

            {/* Mobile Search Bar */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="md:hidden px-4 pb-4 border-t border-gray-200"
                    >
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="search"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                autoFocus
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        {/* Status Filter */}
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Status</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {filterTabItems.map((filter, index) => (
                                    <motion.button
                                        key={filter.id}
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        onClick={() => {
                                            handleFilterChange(filter.id);
                                        }}
                                        className={`flex items-center justify-between px-3 py-3 rounded-lg border transition-all duration-200 ${
                                            activeFilter === filter.id
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                        }`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * index }}
                                    >
                                        <span className="text-sm font-medium">{filter.label}</span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            activeFilter === filter.id
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {filter.count}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Role</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {roleOptions.map((role, index) => (
                                    <motion.button
                                        key={role.value}
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        onClick={() => {
                                            handleRoleChange(role.value);
                                        }}
                                        className={`px-3 py-3 rounded-lg border transition-all duration-200 text-left ${
                                            selectedRole === role.value
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                        }`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * (index + filterTabItems.length) }}
                                    >
                                        <span className="text-sm font-medium">{role.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Close button */}
                        <div className="mt-4 flex justify-center">
                            <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
                            >
                                Close Filters
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}