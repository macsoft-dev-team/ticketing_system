import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Search, Save, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

const UserMappingModal = ({
    open,
    onOpenChange,
    users = [],
    selectedUserIds = [],
    onSave,
    disabled = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Initialize selected IDs when modal opens
    useEffect(() => {
        if (open) {
            // Ensure all IDs are strings for consistency
            setSelectedIds(selectedUserIds.map(String));
            setSearchTerm('');
            setCurrentPage(1);
        }
    }, [open, selectedUserIds]);

    // Filter users based on search
    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;
        const term = searchTerm.toLowerCase();
        return users.filter(user =>
            user.name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.username?.toLowerCase().includes(term)
        );
    }, [users, searchTerm]);

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    // Handle checkbox toggle
    const handleToggleUser = (userId) => {
        const idStr = String(userId);
        setSelectedIds(prev =>
            prev.includes(idStr)
                ? prev.filter(id => id !== idStr)
                : [...prev, idStr]
        );
    };

    // Handle select all on current page
    const handleSelectAll = () => {
        const currentPageIds = paginatedUsers.map(u => String(u.id));
        const allSelected = currentPageIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    // Handle save
    const handleSave = () => {
        onSave?.(selectedIds);
        onOpenChange(false);
    };

    // Check if all users on current page are selected
    const allCurrentPageSelected = paginatedUsers.length > 0 &&
        paginatedUsers.every(u => selectedIds.includes(String(u.id)));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        <span className="block pb-3 mb-4 border-b border-gray-300">
                            Map Users ({selectedIds.length} selected)
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or username..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={disabled}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Select All Checkbox */}
                    {paginatedUsers.length > 0 && (
                        <div className="flex items-center space-x-2 py-2 border-b border-gray-300">
                            <input
                                type="checkbox"
                                checked={allCurrentPageSelected}
                                onChange={handleSelectAll}
                                disabled={disabled}
                                className="w-4 h-4 cursor-pointer"
                            />
                            <label className="text-sm font-medium cursor-pointer" onClick={handleSelectAll}>
                                Select all on this page
                            </label>
                        </div>
                    )}

                    {/* User List */}
                    <div className="flex-1 overflow-y-auto border border-gray-300 rounded p-2">
                        {paginatedUsers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                {searchTerm ? 'No users found matching your search' : 'No users available'}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {paginatedUsers.map(user => (
                                    <label
                                        key={user.id}
                                        className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(String(user.id))}
                                            onChange={() => handleToggleUser(user.id)}
                                            disabled={disabled}
                                            className="w-4 h-4 mt-1 cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{user.name}</div>
                                            {user.email && (
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            )}
                                            {user.username && (
                                                <div className="text-xs text-gray-400">@{user.username}</div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between py-2 border-t border-gray-300">
                            <div className="text-sm text-gray-600">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="small"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || disabled}
                                >
                                    <ChevronLeft  />
                                </Button>
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                disabled={disabled}
                                                className={`px-3 py-1 text-sm rounded ${currentPage === pageNum
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="small"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || disabled}
                                >
                                    <ChevronRight />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-2 border-t border-gray-300">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        {!disabled && (
                            <Button
                                type="button"
                                onClick={handleSave}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Mapping
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UserMappingModal;
