import { useEffect, useState, useCallback } from "react";
import TitleHead from "../../components/TitleHead";
import ReusableTable from "../../components/ui/reusableTable";
import axios from "axios";
import { API_URL } from "../../lib/constants/api";
import { X, Calendar, User, Package, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useAuth } from "../../lib/hooks/useAuth";
import { debounceSearch } from "../../utils/debounce";

export default function SpareRequest() {
  const [fetchSpareData, setFetchSpareData] = useState([]);
  const [showItems, setShowItems] = useState(false);
  const [selectedSpare, setSelectedSpare] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState({ search: '', status: '' });
  
  // Use authentication hook
  const { user: currentUser, isAuthenticated, hasRole, canAccess } = useAuth();

  // Check if user has admin privileges using useAuth
  const hasApprovalRights = () => {
    return canAccess(['MACSOFT_ADMIN', 'MACSOFT_HEAD']);
  };

  // Additional role checking methods
  const isMacsoftAdmin = () => hasRole('MACSOFT_ADMIN');
  const isMacsoftHead = () => hasRole('MACSOFT_HEAD');

  // GET spare requests with server-side filtering
  const getSpare = async ({ skip = 0, take = 10, filter: filterObj = {} } = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (skip > 0) params.append('skip', skip.toString());
      if (take > 0) params.append('take', take.toString());
      if (filterObj && Object.keys(filterObj).length > 0) {
        params.append('filter', JSON.stringify(filterObj));
      }
      
      const res = await axios.get(`${API_URL}/spare-requests?${params.toString()}`, {
        withCredentials: true,
      });
      
      setFetchSpareData(res.data.spareRequests);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.currentPage);
    } catch (error) {
      console.error('Error fetching spare requests:', error);
      if (error.response?.status === 401) {
        showNotification('Session expired. Please log in again.', 'error');
      } else {
        showNotification('Failed to fetch spare requests', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create debounced search function for server-side filtering
  const debouncedSearch = useCallback(
    debounceSearch((searchValue) => {
      const newFilter = { ...filter, search: searchValue };
      setFilter(newFilter);
      getSpare({ skip: 0, take: 10, filter: newFilter });
      setCurrentPage(0); // Reset to first page when searching
    }, 500),
    [filter]
  );

  // Handle search change
  const handleSearchChange = (search) => {
    debouncedSearch(search);
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    const newFilter = { ...filter, [filterType]: value };
    setFilter(newFilter);
    getSpare({ skip: 0, take: 10, filter: newFilter });
    setCurrentPage(0); // Reset to first page when filtering
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    getSpare({ skip: newPage, take: 10, filter });
  };

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Status icon mapping
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'in-progress':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Show confirmation toast
  const showConfirmation = (message, onConfirm, onCancel) => {
    setConfirmAction({ message, onConfirm, onCancel });
  };

  // Handle confirmation
  const handleConfirm = () => {
    if (confirmAction?.onConfirm) {
      confirmAction.onConfirm();
    }
    setConfirmAction(null);
  };

  const handleCancel = () => {
    if (confirmAction?.onCancel) {
      confirmAction.onCancel();
    }
    setConfirmAction(null);
  };

  // Update spare item status
  const updateItemStatus = async (itemId, newStatus) => {
    setIsUpdating(true);
    try {
      const res = await axios.put(`${API_URL}/spare-requests/items/${itemId}/status`, {
        status: newStatus
      }, {
        withCredentials: true,
      });

      if (res.data.success) {
        showNotification(`Item ${newStatus} successfully!`, 'success');
        // Refresh the data to show updated status
        await getSpare({ skip: currentPage, take: 10, filter });
        
        // Update the selected spare data locally for immediate UI update
        if (selectedSpare) {
          const updatedItems = selectedSpare.spareItems.map(item => 
            item.id === itemId ? { ...item, status: newStatus } : item
          );
          setSelectedSpare({ ...selectedSpare, spareItems: updatedItems });
        }
      } else {
        throw new Error(res.data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.message || error.message;
      showNotification(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      getSpare({ skip: currentPage, take: 10, filter });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && Object.keys(filter).some(key => filter[key])) {
      // Only refetch if there are active filters
      getSpare({ skip: currentPage, take: 10, filter });
    }
  }, [filter, currentPage, isAuthenticated]);

  // Authentication guard
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Please log in to access spare requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex relative">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : notification.type === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {notification.type === 'error' && <XCircle className="w-5 h-5" />}
            {notification.type === 'info' && <AlertCircle className="w-5 h-5" />}
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
      {confirmAction && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[70] bg-white rounded-lg shadow-2xl border border-gray-200 p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-4">
              <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Action</h3>
              <p className="text-gray-600">{confirmAction.message}</p>
            </div>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation backdrop */}
      {confirmAction && (
        <div 
          className="fixed inset-0 bg-black/50 z-[65]"
          onClick={handleCancel}
        />
      )}

      <div
        className={`flex-1 transition-all duration-800 ${
          showItems ? "md:mr-[39%]" : ""
        }`}
      >
        <section className="px-6 py-4 space-y-3">
          <TitleHead
            title="Spare Request"
            description="Manage your spare requests here."
          /> 
        
          <ReusableTable
            columns={[
              { key: "ticketCode", label: "Ticket Code", align: "left" , textWrap: 'nowrap', },
              { 
                key: "status", 
                label: "Status", 
                align: "center",
                render: (value) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    value === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    value === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    value === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {value}
                  </span>
                )
              , textWrap: 'nowrap', },
              { key: "createdBy", label: "Raised by", align: "left" , textWrap: 'nowrap', },
              { key: "updatedBy", label: "Updated by", align: "left" , textWrap: 'nowrap', },
              { key: "createdAt", label: "Created Date", align: "center" , textWrap: 'nowrap', },
            ]}
            data={fetchSpareData}
            title="Spare Request"
            headerColor="bg-gray-700"
            headerTextColor="text-white"
            bordered
            loading={loading}
            searchPlaceholder="Search by ticket code or user name..."
            onSearchChange={handleSearchChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onAdd={hasApprovalRights() ? () => console.log("Add spare request") : undefined}
            onView={(row) => {
              setShowItems(true);
              setSelectedSpare(row);
            }}
            
          />
        </section>
      </div>
      {/* Enhanced Modal */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          showItems ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setShowItems(false)}
      />
      
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[90%] md:w-[60%] lg:w-[45%] xl:w-[40%] bg-white shadow-2xl transform transition-transform duration-300 z-50 ${
          showItems ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedSpare && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">
                    Spare Request Details
                  </h2>
                  <div className="flex items-center space-x-2 mb-1">
                    <Package className="w-4 h-4" />
                    <span className="text-blue-100">Ticket Code:</span>
                    <span className="font-semibold">{selectedSpare.ticketCode}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-blue-100">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>Raised by: {selectedSpare.createdBy || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Date: {formatDate(selectedSpare.createdAt)}</span>
                    </div>
                  </div>
                  {currentUser && (
                    <div className="mt-2 text-xs text-blue-200 bg-blue-700 bg-opacity-30 px-2 py-1 rounded flex items-center justify-between">
                      <div>
                        <span>Viewing as: {currentUser.name}</span>
                        {hasApprovalRights() && (
                          <span className="ml-2 text-green-200 font-medium">• Approval Rights</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {isMacsoftAdmin() && (
                          <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">ADMIN</span>
                        )}
                        {isMacsoftHead() && (
                          <span className="bg-orange-600 text-white px-2 py-0.5 rounded text-xs font-bold">HEAD</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  className="text-white hover:text-gray-800 duration-300 cursor-pointer transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                  onClick={() => setShowItems(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Request Status Badge */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Request Status:</span>
                <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedSpare.status)}`}>
                  {getStatusIcon(selectedSpare.status)}
                  <span className="capitalize">{selectedSpare.status || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Requested Items ({selectedSpare.spareItems?.length || 0})
                </h3>
                
                {selectedSpare.spareItems && selectedSpare.spareItems.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSpare.spareItems.map((item, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-col items-start gap-2">
                              <h4 className="font-semibold text-gray-900 text-base">
                                {item.product?.name || 'Unknown Product'}
                              </h4>
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
                                {item.product?.productCode || 'N/A'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm items-center">
                              <div>
                                <span className="text-gray-500">Brand:</span>
                                <span className="ml-1 font-medium">{item.product?.brandName || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Quantity:</span>
                                <span className="ml-1 font-bold text-lg">{item.quantity}</span>
                              </div> 
                            </div>

                            {item.notes && (
                              <div className="text-sm">
                                <span className="text-gray-500">Notes:</span>
                                <p className="ml-1 text-gray-700 italic">{item.notes}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end space-y-2">
                            <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              <span className="capitalize">{item.status || 'Pending'}</span>
                            </div>
                            
                            {/* Quick Action Buttons - Only for Macsoft Admin/Head */}
                            {hasApprovalRights() && (
                              <div className="flex space-x-1">
                                {item.status !== 'approved' && (
                                  <button
                                    onClick={() => {
                                      showConfirmation(
                                        `Are you sure you want to approve "${item.product?.name}"?`,
                                        () => updateItemStatus(item.id, 'approved'),
                                        () => {}
                                      );
                                    }}
                                    disabled={isUpdating}
                                    className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                    title="Approve this item (Admin only)"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    <span>{isUpdating ? 'Processing...' : 'Approve'}</span>
                                  </button>
                                )}
                                {item.status !== 'rejected' && (
                                  <button
                                    onClick={() => {
                                      showConfirmation(
                                        `Are you sure you want to reject "${item.product?.name}"?`,
                                        () => updateItemStatus(item.id, 'rejected'),
                                        () => {}
                                      );
                                    }}
                                    disabled={isUpdating}
                                    className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                    title="Reject this item (Admin only)"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>{isUpdating ? 'Processing...' : 'Reject'}</span>
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* Role info for non-admin users */}
                            {!hasApprovalRights() && (
                              <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                                <div className="flex items-center space-x-1 mb-1">
                                  <User className="w-3 h-3" />
                                  <span className="font-medium text-gray-700">Access Level: View Only</span>
                                </div>
                                <p className="text-gray-600">
                                  Contact MACSOFT_ADMIN or MACSOFT_HEAD for approval actions
                                </p>
                              </div>
                            )}
                            
                            {/* Status display for completed actions */}
                            {(item.status === 'approved' || item.status === 'rejected') && (
                              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                Action completed • No further changes allowed
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No spare items found for this request.</p>
                  </div>
                )}
              </div>

              
            </div>

            {/* Footer Actions */}
            <div className="border-t bg-gray-50 p-4 border-gray-200">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 sm:justify-end">
                <button
                  onClick={() => setShowItems(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Add export/print functionality
                   }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Export Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

