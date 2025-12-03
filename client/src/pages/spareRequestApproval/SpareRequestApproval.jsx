import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Package, 
  Calendar, 
  User, 
  Hash,
  Loader2,
  RefreshCcw,
  Eye,
  X,
  Truck,
  MapPin,
  Clock
} from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import TitleHead from '../../components/TitleHead';
import { 
  getPendingSpareRequests,
  approveSpareRequestItem,
  rejectSpareRequestItem,
  bulkApproveSpareRequestItems,
  getProductInventoryDetails,
  getProductTransactionHistory
} from '../../lib/api/spareApproval';
import { useToast } from '../../components/ui/toast';

export default function SpareRequestApproval() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  // New states for spare details modal
  const [showSpareModal, setShowSpareModal] = useState(false);
  const [selectedSpare, setSelectedSpare] = useState(null);
  const [inventoryDetails, setInventoryDetails] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loadingInventoryDetails, setLoadingInventoryDetails] = useState(false);

  const { user, canAccess } = useAuth();
  const { addToast } = useToast();
  const hasApprovalRights = canAccess(['MACSOFT_ADMIN', 'MACSOFT_HEAD']);

  // Redirect if user doesn't have approval rights
  React.useEffect(() => {
    if (!hasApprovalRights) {
      addToast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      // Redirect to dashboard or appropriate page
      window.location.href = '/dashboard';
    }
  }, [hasApprovalRights]);

  const fetchPendingRequests = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const skip = (page - 1) * 20;
      const response = await getPendingSpareRequests(skip, 20);
      
      setPendingRequests(response.data || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      addToast({
        title: 'Error',
        description: 'Failed to fetch pending spare requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasApprovalRights) {
      fetchPendingRequests();
    }
  }, [hasApprovalRights, fetchPendingRequests]);

  const handleApprove = async (itemId) => {
    try {
      setActionLoading(prev => ({ ...prev, [itemId]: 'approving' }));
      
      await approveSpareRequestItem(itemId);
      
      addToast({
        title: 'Success',
        description: 'Spare request approved successfully',
        variant: 'success',
      });
      
      // Refresh the list
      await fetchPendingRequests(currentPage);
      
    } catch (error) {
      console.error('Error approving request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to approve spare request';
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    }
  };

  const handleReject = (itemId) => {
    setRejectingItem(itemId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleViewSpare = async (item) => {
    setSelectedSpare(item);
    setShowSpareModal(true);
    setLoadingInventoryDetails(true);
    
    try {
      // Fetch detailed inventory information
      const [inventoryResponse, transactionResponse] = await Promise.all([
        getProductInventoryDetails(item.productId),
        getProductTransactionHistory(item.productId, 5)
      ]);
      
      if (inventoryResponse.success) {
        setInventoryDetails(inventoryResponse.data);
      }
      
      if (transactionResponse.success) {
        setTransactionHistory(transactionResponse.data);
      }
    } catch (error) {
      console.error('Error fetching inventory details:', error);
      addToast({
        title: 'Warning',
        description: 'Could not fetch detailed inventory information',
        variant: 'warning',
      });
    } finally {
      setLoadingInventoryDetails(false);
    }
  };

  const handleModalApprove = async () => {
    if (!selectedSpare) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [selectedSpare.itemId]: 'approving' }));
      
      await approveSpareRequestItem(selectedSpare.itemId);
      
      addToast({
        title: 'Success',
        description: 'Spare request approved successfully',
        variant: 'success',
      });
      
      setShowSpareModal(false);
      setSelectedSpare(null);
      setInventoryDetails(null);
      setTransactionHistory([]);
      
      // Refresh the list
      await fetchPendingRequests(currentPage);
      
    } catch (error) {
      console.error('Error approving request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to approve spare request';
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[selectedSpare?.itemId];
        return newState;
      });
    }
  };

  const handleModalReject = () => {
    if (!selectedSpare) return;
    setShowSpareModal(false);
    handleReject(selectedSpare.itemId);
  };

  const confirmReject = async () => {
    try {
      setActionLoading(prev => ({ ...prev, [rejectingItem]: 'rejecting' }));
      
      await rejectSpareRequestItem(rejectingItem, rejectReason);
      
      addToast({
        title: 'Success',
        description: 'Spare request rejected successfully',
        variant: 'success',
      });
      
      setShowRejectModal(false);
      setRejectingItem(null);
      setRejectReason('');
      
      // Refresh the list
      await fetchPendingRequests(currentPage);
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reject spare request';
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[rejectingItem];
        return newState;
      });
      setShowRejectModal(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) {
      addToast({
        title: 'Warning',
        description: 'Please select items to approve',
        variant: 'warning',
      });
      return;
    }

    try {
      setBulkActionLoading(true);
      
      const itemIds = Array.from(selectedItems);
      const response = await bulkApproveSpareRequestItems(itemIds);
      
      if (response.data.successful.length > 0) {
        addToast({
          title: 'Success',
          description: `Successfully approved ${response.data.successful.length} items`,
          variant: 'success',
        });
      }
      
      if (response.data.failed.length > 0 || response.data.insufficientStock.length > 0) {
        const failedCount = response.data.failed.length + response.data.insufficientStock.length;
        addToast({
          title: 'Partial Success',
          description: `${response.data.successful.length} items approved, ${failedCount} failed`,
          variant: 'warning',
        });
      }
      
      setSelectedItems(new Set());
      await fetchPendingRequests(currentPage);
      
    } catch (error) {
      console.error('Error bulk approving:', error);
      const errorMessage = error.response?.data?.message || 'Failed to bulk approve requests';
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === pendingRequests.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(pendingRequests.map(item => item.itemId)));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStockStatus = (requested, available) => {
    if (available >= requested) {
      return { status: 'sufficient', color: 'text-green-600 bg-green-50', icon: CheckCircle };
    } else {
      return { status: 'insufficient', color: 'text-red-600 bg-red-50', icon: AlertTriangle };
    }
  };

  if (!hasApprovalRights) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      {/* Header with bulk actions */}
      <div className="">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-4">
                  <TitleHead   >
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 uppercase">Pending Spare Requests</h2>
            <p className="text-sm text-gray-600 mt-1">
              {pendingRequests.length} items pending approval
            </p>
          </TitleHead>
          
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => fetchPendingRequests(currentPage)}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </button>
            
            {selectedItems.size > 0 && (
              <button
                onClick={handleBulkApprove}
                disabled={bulkActionLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {bulkActionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">Bulk Approve ({selectedItems.size})</span>
                <span className="sm:hidden">Approve ({selectedItems.size})</span>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pending spare requests found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === pendingRequests.length && pendingRequests.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span>Select All</span>
                </label>
              </div>
              {pendingRequests.map((item) => {
                const stockStatus = getStockStatus(item.requestedQuantity, item.availableQuantity);
                const StockIcon = stockStatus.icon;
                
                return (
                  <div key={item.itemId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.itemId)}
                          onChange={() => handleSelectItem(item.itemId)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <div className="flex items-center">
                            <Hash className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm font-semibold text-gray-900">{item.ticketCode}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        <StockIcon className="h-3 w-3 mr-1" />
                        {stockStatus.status === 'sufficient' ? 'Available' : 'Low Stock'}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <Package className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                          <p className="text-xs text-gray-500">{item.productCode}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Requested</p>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.requestedQuantity}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Available</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.availableQuantity >= item.requestedQuantity 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.availableQuantity}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 truncate">{item.requestedBy}</p>
                          <p className="text-xs text-gray-500">{item.requestedByRole}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{formatDate(item.requestedDate)}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleViewSpare(item)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </button>
                      
                      <button
                        onClick={() => handleApprove(item.itemId)}
                        disabled={!item.canApprove || actionLoading[item.itemId] === 'approving'}
                        className={`flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                          item.canApprove 
                            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                            : 'bg-gray-400 cursor-not-allowed'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
                      >
                        {actionLoading[item.itemId] === 'approving' ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        Approve
                      </button>
                      
                      <button
                        onClick={() => handleReject(item.itemId)}
                        disabled={actionLoading[item.itemId] === 'rejecting'}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {actionLoading[item.itemId] === 'rejecting' ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === pendingRequests.length && pendingRequests.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spare Name
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested Qty
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available Qty
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Status
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested By/ Requested Date
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingRequests.map((item) => {
                    const stockStatus = getStockStatus(item.requestedQuantity, item.availableQuantity);
                    const StockIcon = stockStatus.icon;
                    
                    return (
                      <tr key={item.itemId} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.itemId)}
                            onChange={() => handleSelectItem(item.itemId)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Hash className="h-4 w-4 text-gray-400 mr-1 lg:mr-2" />
                            <span className="text-xs lg:text-sm font-medium text-gray-900 truncate max-w-20 lg:max-w-none">
                              {item.ticketCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-4">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 text-gray-400 mr-1 lg:mr-2 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs lg:text-sm font-medium text-gray-900 truncate max-w-32 lg:max-w-none">
                                {item.productName}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-32 lg:max-w-none">
                                {item.productCode}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-1.5 lg:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.requestedQuantity}
                          </span>
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-1.5 lg:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.availableQuantity >= item.requestedQuantity 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.availableQuantity}
                          </span>
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-1.5 lg:px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            <StockIcon className="h-3 w-3 mr-0.5 lg:mr-1" />
                            <span className="hidden lg:inline">{stockStatus.status === 'sufficient' ? 'Available' : 'Low Stock'}</span>
                            <span className="lg:hidden">{stockStatus.status === 'sufficient' ? 'OK' : 'Low'}</span>
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-32 xl:max-w-none">
                                {item.requestedBy}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-32 xl:max-w-none">
                                {item.requestedByRole}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">
                              {formatDate(item.requestedDate)}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex flex-col lg:flex-row space-y-1 lg:space-y-0 lg:space-x-2">
                            <button
                              onClick={() => handleViewSpare(item)}
                              className="inline-flex items-center justify-center px-2 lg:px-3 py-1 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              title="View spare details"
                            >
                              <Eye className="h-3 w-3" />
                              <span className="ml-1 hidden lg:inline">View</span>
                            </button>
                            
                            <button
                              onClick={() => handleApprove(item.itemId)}
                              disabled={
                                !item.canApprove || 
                                actionLoading[item.itemId] === 'approving'
                              }
                              className={`inline-flex items-center justify-center px-2 lg:px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                                item.canApprove 
                                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                                  : 'bg-gray-400 cursor-not-allowed'
                              } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
                              title={!item.canApprove ? 'Insufficient stock available' : 'Approve request'}
                            >
                              {actionLoading[item.itemId] === 'approving' ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              <span className="ml-1 hidden lg:inline">Approve</span>
                            </button>
                            
                            <button
                              onClick={() => handleReject(item.itemId)}
                              disabled={actionLoading[item.itemId] === 'rejecting'}
                              className="inline-flex items-center justify-center px-2 lg:px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              {actionLoading[item.itemId] === 'rejecting' ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span className="ml-1 hidden lg:inline">Reject</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex justify-center sm:justify-end space-x-2">
              <button
                onClick={() => fetchPendingRequests(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchPendingRequests(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-4 sm:p-5 border w-full max-w-md sm:max-w-lg shadow-lg rounded-md bg-white">
            <div className="text-center">
              <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-600 mx-auto" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mt-4">Reject Spare Request</h3>
              <div className="mt-2 px-2 sm:px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to reject this spare request? Please provide a reason.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason (optional)"
                  className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={3}
                />
              </div>
              <div className="px-2 sm:px-4 py-3">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-center">
                  <button
                    onClick={confirmReject}
                    disabled={actionLoading[rejectingItem] === 'rejecting'}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {actionLoading[rejectingItem] === 'rejecting' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Reject Request
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectingItem(null);
                      setRejectReason('');
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spare Details Modal */}
      {showSpareModal && selectedSpare && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Spare Request Details</h3>
              <button
                onClick={() => {
                  setShowSpareModal(false);
                  setSelectedSpare(null);
                  setInventoryDetails(null);
                  setTransactionHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Request Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Request Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Ticket Code</label>
                    <p className="text-sm font-semibold text-gray-900">{selectedSpare.ticketCode}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Request Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedSpare.requestedDate)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Requested By</label>
                    <p className="text-sm text-gray-900">{selectedSpare.requestedBy}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Role</label>
                    <p className="text-sm text-gray-900">{selectedSpare.requestedByRole}</p>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Product Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Product Name</label>
                    <p className="text-sm font-medium text-gray-900">{selectedSpare.productName}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Product Code</label>
                    <p className="text-sm text-gray-900">{selectedSpare.productCode}</p>
                  </div>
                </div>
              </div>

              {/* Inventory Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  Inventory Status
                </h4>
                
                {loadingInventoryDetails ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading inventory details...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Requested Quantity</label>
                        <p className="text-2xl font-bold text-blue-600">{selectedSpare.requestedQuantity}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Available Quantity</label>
                        <p className={`text-2xl font-bold ${
                          selectedSpare.availableQuantity >= selectedSpare.requestedQuantity 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {selectedSpare.availableQuantity}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Status</label>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedSpare.canApprove 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedSpare.canApprove ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Available
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Insufficient Stock
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional inventory details */}
                    {inventoryDetails && (
                      <div className="border-t border-green-200 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Storage Location</label>
                            <p className="text-sm text-gray-900 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {inventoryDetails.location || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Min Stock Level</label>
                            <p className="text-sm text-gray-900">{inventoryDetails.minStock || 'Not set'}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Max Stock Level</label>
                            <p className="text-sm text-gray-900">{inventoryDetails.maxStock || 'Not set'}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Last Updated</label>
                            <p className="text-sm text-gray-900">{formatDate(inventoryDetails.updatedAt)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Transaction History */}
              {transactionHistory.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Recent Transactions (Last 5)
                  </h4>
                  <div className="space-y-2">
                    {transactionHistory.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            transaction.type === 'INBOUND' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-900">
                            {transaction.type === 'INBOUND' ? 'Added' : 'Issued'} {transaction.quantity} units
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning for insufficient stock */}
              {!selectedSpare.canApprove && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                    <div>
                      <h5 className="text-sm font-medium text-red-800">Insufficient Stock</h5>
                      <p className="text-sm text-red-700 mt-1">
                        Cannot approve this request as there is insufficient stock available. 
                        Available: {selectedSpare.availableQuantity}, Required: {selectedSpare.requestedQuantity}
                      </p>
                      <p className="text-sm text-red-700 mt-2">
                        <strong>Impact:</strong> Approving this request will update the inventory from {selectedSpare.availableQuantity} to {selectedSpare.availableQuantity - selectedSpare.requestedQuantity} units.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Confirmation for sufficient stock */}
              {selectedSpare.canApprove && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-2" />
                    <div>
                      <h5 className="text-sm font-medium text-blue-800">Ready for Approval</h5>
                      <p className="text-sm text-blue-700 mt-1">
                        <strong>Impact:</strong> Approving this request will deduct {selectedSpare.requestedQuantity} units from inventory, 
                        updating the stock from {selectedSpare.availableQuantity} to {selectedSpare.availableQuantity - selectedSpare.requestedQuantity} units.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowSpareModal(false);
                  setSelectedSpare(null);
                  setInventoryDetails(null);
                  setTransactionHistory([]);
                }}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              
              <button
                onClick={handleModalReject}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XCircle className="h-4 w-4 mr-1 inline" />
                Reject
              </button>
              
              <button
                onClick={handleModalApprove}
                disabled={!selectedSpare.canApprove || actionLoading[selectedSpare.itemId] === 'approving'}
                className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                  selectedSpare.canApprove 
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                    : 'bg-gray-400 cursor-not-allowed'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
              >
                {actionLoading[selectedSpare.itemId] === 'approving' ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin inline" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1 inline" />
                )}
                {selectedSpare.canApprove ? 'Approve & Update Inventory' : 'Insufficient Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}