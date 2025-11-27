// components/common/CommonHeader.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
 import { Plus, Search, Filter, X, Upload, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react"; 
import { useDebounce as useDebounceHook } from "../lib/hooks/ticketHooks";

/**
 * CommonHeader - reusable app header
 *
 * Props (most important; full list below in propTypes):
 * - statusCounts, filters, setFilters: optional external state (falls back to useUser())
 * - filterItems: array of { id, label, shortLabel, count }
 * - showFilters, showSearch, showRoleDropdown, showUpload, showAdd
 * - roleDropdownTitle, roleDropdownKey, roleOptions, initialRole
 * - onFilterChange(id), onSearchChange(q), onRoleChange(value, roleKey)
 * - onAdd, onUpload, actions array [{ key, label, icon, onClick, variant }]
 * - leftSlot, rightSlot, debounceMs
 */
export default function CommonHeader({
    // external state (optional) - if not provided, fallback to useUser()
    statusCounts: propStatusCounts,
    filters: propFilters,
    setFilters: propSetFilters,

    // UI config
    title = "App",
    showFilters = false,
    filterItems = null, // if null, will be derived from statusCounts default
    showSearch = true,
    showRoleDropdown = false,
    roleDropdownTitle = "Role",
    roleDropdownKey = "role",
    roleOptions = [],
    initialRole = "",
    showUpload = true,
    showAdd = true,
    actions = [],

    // Callbacks
    onFilterChange,
    onSearchChange,
    onRoleChange, // (value, roleKey)
    onAdd,
    onUpload,

    // Layout
    leftSlot = null,
    rightSlot = null,

    // misc
    debounceMs = 300,
}) {
    // --- hook fallback
    const statusCounts = propStatusCounts ?? propStatusCounts ?? {};
    const externalFilters = propFilters ?? propFilters ?? {};
    const externalSetFilters = propSetFilters ?? propSetFilters ?? {};

    // --- local state
    const [activeFilter, setActiveFilter] = useState(externalFilters?.status || "");
    const [searchTerm, setSearchTerm] = useState(externalFilters?.search || "");
    const [selectedRole, setSelectedRole] = useState(externalFilters?.[roleDropdownKey] ?? initialRole);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const roleDropdownRef = useRef(null);

    // Debounce: prefer imported hook if present, otherwise a small fallback
    const useDebounce = typeof useDebounceHook === "function" ? useDebounceHook : (v, ms) => {
        const [val, setVal] = useState(v);
        useEffect(() => {
            const t = setTimeout(() => setVal(v), ms);
            return () => clearTimeout(t);
        }, [v, ms]);
        return val;
    };

    const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

    // Derived filterTabItems default (if not provided by props)
    const defaultFilterItems = [
        { id: "", label: "All", shortLabel: "All", count: statusCounts?.ALL ?? 0, key: "ALL" },
        { id: "ACTIVE", label: "Active", shortLabel: "Active", count: statusCounts?.ACTIVE ?? 0, key: "ACTIVE" },
        { id: "INACTIVE", label: "Inactive", shortLabel: "Inactive", count: statusCounts?.INACTIVE ?? 0, key: "INACTIVE" },
    ];
    const tabs = filterItems ?? defaultFilterItems;

    // Sync local state when external filters change
    useEffect(() => {
        setActiveFilter(externalFilters?.status || "");
        setSearchTerm(externalFilters?.search || "");
        setSelectedRole(externalFilters?.[roleDropdownKey] ?? initialRole);
    }, [externalFilters, roleDropdownKey, initialRole]);

    // Close role dropdown on outside click
    useEffect(() => {
        const onDocClick = (e) => {
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
                setIsRoleDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // Update external filters when debounced search/activeFilter/selectedRole changes
    useEffect(() => {
        const curSearch = debouncedSearchTerm ?? "";
        if (typeof externalSetFilters === "function") {
            // only set if changed (cheap check)
            const next = {
                ...externalFilters,
                search: curSearch,
                status: activeFilter,
                [roleDropdownKey]: selectedRole,
            };
            externalSetFilters(next);
        }
        // also notify parent callback
        if (typeof onSearchChange === "function") onSearchChange(curSearch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, activeFilter, selectedRole, roleDropdownKey]);

    // Handlers
    const handleFilterClick = useCallback(
        (id) => {
            setActiveFilter(id);
            // update immediate external filters (keep debounced search stored)
            if (typeof externalSetFilters === "function") {
                externalSetFilters({ ...externalFilters, status: id, search: debouncedSearchTerm || "", [roleDropdownKey]: selectedRole });
            }
            if (typeof onFilterChange === "function") onFilterChange(id);
        },
        [externalFilters, externalSetFilters, debouncedSearchTerm, selectedRole, onFilterChange, roleDropdownKey]
    );

    const handleSearchInput = useCallback(
        (q) => {
            setSearchTerm(q);
            if (typeof onSearchChange === "function") onSearchChange(q); // immediate notification (optional)
        },
        [onSearchChange]
    );

    const handleRoleSelect = useCallback(
        (value) => {
            setSelectedRole(value);
            setIsRoleDropdownOpen(false);
            if (typeof externalSetFilters === "function") {
                externalSetFilters({ ...externalFilters, [roleDropdownKey]: value, search: debouncedSearchTerm || "", status: activeFilter });
            }
            if (typeof onRoleChange === "function") onRoleChange(value, roleDropdownKey);
        },
        [externalFilters, externalSetFilters, onRoleChange, roleDropdownKey, debouncedSearchTerm, activeFilter]
    );

    // animation variants & button variants kept from original
    const headerVariants = {
        initial: { opacity: 0, y: -20 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
            },
        },
    };
    const buttonVariants = {
        hover: { scale: 1.05, transition: { duration: 0.2 } },
        tap: { scale: 0.95, transition: { duration: 0.1 } },
    };

    const currentRoleLabel = roleOptions.find((r) => r.value === selectedRole)?.label ?? roleDropdownTitle;

    return (
        <motion.header variants={headerVariants} initial="initial" animate="animate" className="bg-white md:bg-transparent border-b border-gray-200 shadow-sm md:shadow-none md:border-0">
            {/* Main Header - Desktop & Mobile */}
            <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
                {/* Left Section */}
                <div className="flex items-center space-x-2 sm:space-x-6">
                    {leftSlot}
                    {/* Title */}
                    <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="text-lg sm:text-xl lg:text-2xl tracking-wide font-medium text-slate-700 uppercase">
                        {title}
                    </motion.h1>

                    {/* Filter Tabs - Hidden on small screens */}
                    {showFilters && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="hidden lg:flex bg-gray-100 rounded-lg p-1">
                            {tabs.map((filter, index) => (
                                <motion.button
                                    key={String(filter.id)}
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={() => handleFilterClick(filter.id)}
                                    className={`relative px-3 lg:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeFilter === filter.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                                        }`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * (index + 1) }}
                                >
                                    <span className="hidden xl:inline">{filter.label}</span>
                                    <span className="xl:hidden">{filter.shortLabel ?? filter.label}</span>
                                    {typeof filter.count === "number" && filter.count > -1 && (
                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 * (index + 1) }} className={`ml-1 lg:ml-2 px-1.5 lg:px-2 py-0.5 text-xs rounded-full ${activeFilter === filter.id ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"}`}>
                                            {filter.count}
                                        </motion.span>
                                    )}
                                    {activeFilter === filter.id && (
                                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-md shadow-sm" style={{ zIndex: -1 }} />
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Role Filter Dropdown - Desktop */}
                    {showRoleDropdown && (
                        <motion.div ref={roleDropdownRef} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="hidden md:block relative">
                            <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap" onClick={() => setIsRoleDropdownOpen((s) => !s)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-lg shadow-sm transition-all duration-200 min-w-[160px]" aria-haspopup="listbox" aria-expanded={isRoleDropdownOpen}>
                                <span className="truncate">{currentRoleLabel}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isRoleDropdownOpen ? "rotate-180" : ""}`} />
                            </motion.button>

                            <AnimatePresence>
                                {isRoleDropdownOpen && (
                                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto" role="listbox" aria-label={roleDropdownTitle}>
                                        {roleOptions.map((role, idx) => (
                                            <motion.button key={role.value ?? idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx }} onClick={() => handleRoleSelect(role.value)} className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${selectedRole === role.value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"}`}>
                                                {role.label}
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Search Input - Desktop */}
                    {showSearch && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="hidden md:block relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <motion.input whileFocus={{ scale: 1.02 }} type="search" placeholder="Search..." value={searchTerm} onChange={(e) => handleSearchInput(e.target.value)} className="pl-10 pr-4 py-2 w-48 lg:w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
                        </motion.div>
                    )}

                    {/* Search Button - Mobile */}
                    {showSearch && (
                        <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap" onClick={() => setIsSearchOpen((s) => !s)} className="md:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                            <Search className="w-4 h-4" />
                        </motion.button>
                    )}

                    {/* Filter Button - Mobile & Tablet */}
                    <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap" onClick={() => setIsMobileMenuOpen((s) => !s)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
                    </motion.button>

                    {/* Upload Button */}
                    {showUpload && (
                        <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap" onClick={onUpload} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="flex items-center cursor-pointer gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Upload</span>
                        </motion.button>
                    )}

                    {/* Add Button */}
                    {showAdd && (
                        <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap" onClick={onAdd} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="flex items-center cursor-pointer gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add</span>
                        </motion.button>
                    )}

                    {rightSlot}

                    {/* custom actions */}
                    {actions.map((a) => (
                        <motion.button key={a.key} variants={buttonVariants} whileHover="hover" whileTap="tap" onClick={a.onClick} className={`flex items-center cursor-pointer gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${a.variant === "primary" ? "text-white bg-blue-600 hover:bg-blue-700" : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"}`}>
                            {a.icon && <a.icon className="w-4 h-4" />}
                            <span className="hidden sm:inline">{a.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Mobile Search Bar */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="md:hidden px-4 pb-4 border-t border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input autoFocus type="search" placeholder="Search..." value={searchTerm} onChange={(e) => handleSearchInput(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Filter Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="lg:hidden px-4 pb-4 border-t border-gray-200 bg-gray-50">
                        {showFilters && (
                            <div className="mt-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Status</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {tabs.map((filter, index) => (
                                        <motion.button key={String(filter.id)} variants={buttonVariants} whileHover="hover" whileTap="tap" onClick={() => handleFilterClick(filter.id)} className={`flex items-center justify-between px-3 py-3 rounded-lg border transition-all duration-200 ${activeFilter === filter.id ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index }}>
                                            <span className="text-sm font-medium">{filter.label}</span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${activeFilter === filter.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}>{filter.count}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showRoleDropdown && (
                            <div className="mt-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">{roleDropdownTitle}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {roleOptions.map((role, index) => (
                                        <motion.button key={role.value ?? index} variants={buttonVariants} whileHover="hover" whileTap="tap" onClick={() => handleRoleSelect(role.value)} className={`px-3 py-3 rounded-lg border transition-all duration-200 text-left ${selectedRole === role.value ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (index + (tabs?.length || 0)) }}>
                                            <span className="text-sm font-medium">{role.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-4 flex justify-center">
                            <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg">
                                Close Filters
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}

 