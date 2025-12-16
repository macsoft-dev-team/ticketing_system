import { useEffect, useState } from "react";
import TitleHead from "../../components/TitleHead";
import ReusableTable from "../../components/ui/reusableTable";
import axios from "axios";
import { API_URL } from "../../lib/constants/api";
import {
  Package,
  Plus,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Settings,
  ArrowLeftRight,
  PackageCheck,
  History,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../../lib/hooks/useAuth";
import InventoryModal from "./components/InventoryModal";
import InventoryAnalytics from "./components/InventoryAnalytics";
// import BulkTransactionModal from "./components/BulkTransactionModal"; // Not needed for now
import AdjustmentModal from "./components/AdjustmentModal";
import CustomerReturnModal from "./components/CustomerReturnModal";
import TransferDispatchModal from "./components/TransferDispatchModal";
import PendingTransfersModal from "./components/PendingTransfersModal";
import PendingApprovalsModal from "./components/PendingApprovalsModal";
import TransactionHistoryModal from "./components/TransactionHistoryModal";
import { Button } from "../../components/ui/button";
import Select from "../../components/ui/select";

export default function Inventory() {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  // const [showBulkTransactionModal, setShowBulkTransactionModal] = useState(false); // Not needed for now
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  
  // New modals
  const [showCustomerReturnModal, setShowCustomerReturnModal] = useState(false);
  const [showTransferDispatchModal, setShowTransferDispatchModal] = useState(false);
  const [showPendingTransfersModal, setShowPendingTransfersModal] = useState(false);
  const [showPendingApprovalsModal, setShowPendingApprovalsModal] = useState(false);
  const [showTransactionHistoryModal, setShowTransactionHistoryModal] = useState(false);
  const [pendingTransfersCount, setPendingTransfersCount] = useState(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    centerCode: '',
    condition: '',
    category: ''
  });
  const [serviceCenters, setServiceCenters] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  
  // Predefined categories
  const categories = [
    'MCB',
    'VFD',
    'RMS',
    'SPD',
    'WIRE',
    'CONNECTOR',
    'ENCLOSURE_AND_ACCESSORIES'
  ];

  const { isAuthenticated, canAccess, user } = useAuth();

  // MACSOFT roles can do adjustments and view all inventory
  const isMacsoftRole = () => canAccess(["MACSOFT_ADMIN", "MACSOFT_HEAD", "MACSOFT_SUPPORT"]);
  
  // Check if user is from MACSOFT Head Office
  const isHeadOffice = () => {
    return user?.serviceCenter?.isMacsoftHead === true;
  };
  
  // Check if user is from a Head Service Center (regional HSC)
  const isHeadServiceCenter = () => {
    return user?.serviceCenter?.isMacsoft === true && !isHeadOffice();
  };
  
  // Check if user is from any MACSOFT center (Head Office or regional HSC)
  const isAnyMacsoftCenter = () => {
    return user?.serviceCenter?.isMacsoft === true || isHeadOffice();
  };
  
  // Roles that can adjust inventory (MACSOFT roles, Head Office, and HSC technicians)
  const canAdjustInventory = () => {
    return canAccess(["MACSOFT_ADMIN", "MACSOFT_HEAD"]) || 
           (canAccess(["SERVICE_CENTER_TECHNICIAN"]) && isAnyMacsoftCenter());
  };
  
  // Roles that can manage inventory (add/edit) - includes Head Office and HSC technicians
  const canManageInventory = () => {
    return canAccess([
      "MACSOFT_ADMIN", 
      "MACSOFT_HEAD", 
      "MACSOFT_SUPPORT",
      "CUSTOMER_SERVICE_HEAD"
    ]) || (canAccess(["SERVICE_CENTER_TECHNICIAN"]) && isAnyMacsoftCenter());
  };

  // Roles that can do transactions
  const canDoTransactions = () => canAccess([
    "MACSOFT_ADMIN", 
    "MACSOFT_HEAD",
    "MACSOFT_SUPPORT",
    "SERVICE_CENTER_TECHNICIAN", 
    "CUSTOMER_SERVICE_HEAD"
  ]);

  // Check if user is service center technician
  const isServiceCenterTechnician = () => canAccess(["SERVICE_CENTER_TECHNICIAN"]);

  // ---------------- FETCH INVENTORY ----------------
  const fetchInventoryData = async (paginationParams = null) => {
    try {
      setLoading(true);
       
      // Use provided pagination params or current state
      // Convert 1-based currentPage to 0-based for backend
      const page = paginationParams?.skip !== undefined ? paginationParams.skip : currentPage - 1;
      const take = paginationParams?.take || pageSize;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.append('filter', filters.search);
      if (filters.centerCode) params.append('centerCode', filters.centerCode);
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.category) params.append('category', filters.category);
      
      // Add pagination parameters
      params.append('skip', page.toString());
      params.append('take', take.toString());
      
       
      const res = await axios.get(`${API_URL}/inventory?${params.toString()}`, {
        withCredentials: true,
      });

      if (res.data.success) {
        const transformed = res.data.inventory.map((item) => ({
          ...item,
          productname: item.productName,
          availableQuantity: item.quantity,
          minQty: item.minStock,
          maxQty: item.maxStock || "N/A",
        }));

        setInventoryData(transformed);
        
        // Update pagination state
        const count = res.data.count || 0;
        const calculatedTotalPages = Math.ceil(count / take);
        setTotalCount(count);
        setTotalPages(calculatedTotalPages);
        setCurrentPage(page + 1); // Convert 0-based backend page to 1-based for ReusableTable
        
       }
    } catch (err) {
      console.error("❌ Fetch inventory failed:", err.response?.status, err.response?.data?.message || err.message);
      
      // Don't show error for permission issues, just log them
      if (err.response?.status === 403) {
        console.warn('⚠️ Access denied to inventory - user may not have required permissions');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/inventory/low-stock`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setLowStockItems(res.data.data);
      }
    } catch (err) {
      console.error("❌ Fetch low stock items failed:", err.response?.status, err.response?.data?.message || err.message);
      
      // Don't show error for permission issues, just log them
      if (err.response?.status === 403) {
        console.warn('⚠️ Access denied to low stock items - user may not have required permissions');
      }
    }
  };

  const fetchServiceCenters = async () => {
    try {
      const res = await axios.get(`${API_URL}/service-centers`, {
        withCredentials: true,
      });
      if (res.data.serviceCenters) {
        setServiceCenters(res.data.serviceCenters);
      }
    } catch (err) {
      console.error("Failed to fetch service centers:", err);
    }
  };

  const fetchPendingTransfersCount = async () => {
    try {
      const res = await axios.get(`${API_URL}/inventory-transactions/transfer/pending`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setPendingTransfersCount(res.data.transfers?.length || 0);
      }
    } catch (err) {
      console.error("Failed to fetch pending transfers count:", err);
    }
  };

  const fetchPendingApprovalsCount = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/inventory-transactions/history?status=PENDING_APPROVAL`,
        { withCredentials: true }
      );
      if (res.data.success) {
        setPendingApprovalsCount(res.data.transactions?.length || 0);
      }
    } catch (err) {
      console.error("Failed to fetch pending approvals count:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchInventoryData();
      fetchLowStockItems();
      fetchServiceCenters();
      fetchPendingTransfersCount();
      if (isMacsoftRole()) {
        fetchPendingApprovalsCount();
      }
    }
  }, [isAuthenticated]);

  // Fetch inventory when filters change (reset to first page)
  useEffect(() => {
    if (isAuthenticated) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1); // Reset to first page when filters change
        fetchInventoryData({ skip: 0, take: pageSize });
      }, 300); // Debounce search
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters, isAuthenticated]);

  // Refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventoryData({ skip: currentPage - 1, take: pageSize });
    await fetchLowStockItems();
    setRefreshing(false);
  };

  // Filter handling
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // Pagination handling
  const handlePageChange = (page) => {
    // Convert 1-based page to 0-based for backend
    fetchInventoryData({ skip: page - 1, take: pageSize });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      centerCode: '',
      condition: '',
      category: ''
    });
  };

  // Export inventory data to CSV
  const handleExport = () => {
    if (inventoryData.length === 0) return;

    const headers = [
      'Product Name', 'Product Code', 'Category', 'Service Center',
      'Condition', 'Quantity', 'Min Stock', 'Max Stock', 'Location', 'Status'
    ];

    const csvData = inventoryData.map(item => [
      item.productname || '',
      item.productCode || '',
      item.category || '',
      item.centerInfo || '',
      item.condition || '',
      item.availableQuantity || 0,
      item.minQty || 0,
      item.maxQty || '',
      item.location || '',
      item.status || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell =>
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // ---------------- STATUS BADGE ----------------
  const getStatusDisplay = (status) => {
    switch (status) {
      case "IN_STOCK":
        return (
          <span className="flex rounded-sm items-center w-max py-0.5 px-2 bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" /> In Stock
          </span>
        );
      case "LOW_STOCK":
        return (
          <span className="flex rounded-sm items-center w-max py-0.5 px-2 bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock
          </span>
        );
      case "OUT_OF_STOCK":
        return (
          <span className="flex rounded-sm items-center w-max py-0.5 px-2 bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" /> Out of Stock
          </span>
        );
      default:
        return (
          <span className="flex rounded-sm items-center w-max py-0.5 px-2 bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" /> Unknown
          </span>
        );
    }
  };

  const getConditionDisplay = (condition) => {
    switch (condition) {
      case "GOOD":
        return (
          <span className="flex rounded-sm items-center w-max py-0.5 px-2 bg-green-100 text-green-800">
            Good
          </span>
        );
      case "DEFECTIVE":
        return (
          <span className="flex rounded-sm items-center w-max py-0.5 px-2 bg-red-100 text-red-800">
            Defective
          </span>
        );
      case "REPAIRABLE":
        return (
          <span className="flex rounded-sm items-center w-max py-0.5 px-2 bg-yellow-100 text-yellow-800">
            Repairable
          </span>
        );
      case "SCRAP":
        return (
          <span className="flex rounded-sm items-center w-max py-0.5 px-2 bg-gray-100 text-gray-800">
            Scrap
          </span>
        );
      default:
        return (
          <span className="flex rounded-sm items-center w-max py-0.5 px-2 bg-blue-100 text-blue-800">
            {condition}
          </span>
        );
    }
  };

  const tableData = inventoryData.map((i) => ({
    ...i,
    status: getStatusDisplay(i.status),
    conditionBadge: getConditionDisplay(i.condition),
    centerInfo: `${i.centerName || i.centerCode}`,
  }));

  return (
    <section className="px-6 py-4 space-y-4">
      <TitleHead
        title="Inventory Management"
        description="Monitor and manage inventory levels and stock conditions"
      >
        <div className="flex items-center gap-2">
         {/*  <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md ${showAnalytics
              ? 'bg-purple-600 text-white hover:bg-purple-700 ring-2 ring-purple-400'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <TrendingUp className="w-5 h-5" />
          </button> */}

          <Button
            onClick={handleExport}
            disabled={inventoryData.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
          </Button>

          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            <span className={`${refreshing ? "animate-spin" : ""}`}><RefreshCw className="w-5 h-5" /></span>
          </Button>

          {/* Transaction History - All authenticated users */}
          <button
            onClick={() => setShowTransactionHistoryModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <History className="w-4 h-4" />
            History
          </button>

          {/* Customer Return - Service Center Technicians and above */}
          {canDoTransactions() && (
            <button
              onClick={() => setShowCustomerReturnModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <RotateCcw className="w-4 h-4" />
              Return
            </button>
          )}

          {/* Pending Transfers - All roles that can do transactions */}
          {canDoTransactions() && (
            <button
              onClick={() => setShowPendingTransfersModal(true)}
              className="relative flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <PackageCheck className="w-4 h-4" />
              Pending
              {pendingTransfersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingTransfersCount}
                </span>
              )}
            </button>
          )}

          {/* Pending Approvals - MACSOFT only */}
          {isMacsoftRole() && (
            <button
              onClick={() => setShowPendingApprovalsModal(true)}
              className="relative flex items-center gap-2 px-3 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              <Clock className="w-4 h-4" />
              Approvals
              {pendingApprovalsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}

          {/* Transfer Dispatch/Request - MACSOFT can dispatch, SSC can request */}
          {canDoTransactions() && (
            <button
              onClick={() => setShowTransferDispatchModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <ArrowLeftRight className="w-4 h-4" />
              {isMacsoftRole() ? "Transfer" : "Request"}
            </button>
          )}

          {/* Bulk Transaction Modal - Not needed for now */}
          {/* {canDoTransactions() && (
            <button
              onClick={() => setShowBulkTransactionModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              <Package className="w-4 h-4" />
              Transaction
            </button>
          )} */}

          {canAdjustInventory() && (
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Settings className="w-4 h-4" />
              Adjust
            </button>
          )}

          {canManageInventory() && (
            <button
              onClick={() => {
                setSelectedItem(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </TitleHead>

      {/* ANALYTICS */}
      {showAnalytics && (
        <InventoryAnalytics inventoryData={inventoryData} />
      )}


      {/* LOW STOCK ALERT */}
     {/*  {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
          <strong>Low Stock Alert:</strong> {lowStockItems.length} items need attention
        </div>
      )}
 */}
      {/* FILTERS - Available for MACSOFT roles and Service Center Technicians */}
      {(isMacsoftRole() || isServiceCenterTechnician()) && (
        <div className=" rounded-lg space-y-4">
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isMacsoftRole() ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 items-center *:flex *:flex-col *:gap-2`}>
          {/* Search Input */}
          <div>
{/*             <label className="text-sm font-medium text-gray-700">Search</label>
 */}            <input
              type="search"
              placeholder="Search by name, code..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Service Center Filter - Only for MACSOFT roles */}
          {isMacsoftRole() && (
            <div>
{/*               <label className="text-sm font-medium text-gray-700">Service Center</label>
 */}              <Select
                value={filters.centerCode}
                onChange={(e) => handleFilterChange('centerCode', e.target.value)}
                options={[
                  { label: 'All Centers', value: '' },
                  ...serviceCenters.map((center) => ({
                    label: `${center.name} (${center.centerCode})`,
                    value: center.centerCode
                  }))
                ]}
                placeholder="All Centers"
                className="w-full"
              />
            </div>
          )}

          {/* Condition Filter */}
          <div>
{/*             <label className="text-sm font-medium text-gray-700">Condition</label>
 */}            <Select
              value={filters.condition}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
              options={[
                { label: 'All Conditions', value: '' },
                { label: 'Good', value: 'GOOD' },
                { label: 'Defective', value: 'DEFECTIVE' },
                { label: 'Repairable', value: 'REPAIRABLE' },
                { label: 'Scrap', value: 'SCRAP' }
              ]}
              placeholder="All Conditions"
              className="w-full"
            />
          </div>

          {/* Category Filter */}
          <div>
{/*             <label className="text-sm font-medium text-gray-700">Category</label>
 */}            <Select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              options={[
                { label: 'All Categories', value: '' },
                ...categories.map((category) => ({
                  label: category,
                  value: category
                }))
              ]}
              placeholder="All Categories"
              className="w-full"
            />
          </div>

          {/* Clear All Filter */}
          <div>
{/*             <label htmlFor="clear-filters-button" className="invisible">Clear All Filters</label>
 */}            <Button
              onClick={clearFilters}
              id="clear-filters-button"
             >
              Clear All
            </Button>
          </div>
        </div>
        </div>
      )}

      {/* TABLE */}
       <ReusableTable
        title="Inventory"
        loading={loading}
        bordered
        headerColor="bg-gray-700"
        headerTextColor="text-white"
        searchPlaceholder="Search by product, code, category..."
        columns={[
          { key: "productname", label: "Product Name" },
          { key: "productCode", label: "Product Code" },
          { key: "category", label: "Category" },
          { key: "centerInfo", label: "Service Center" },
          { key: "conditionBadge", label: "Condition", align: "start" },
/*           { key: "location", label: "Location" },
 */          { key: "availableQuantity", label: "Qty", align: "start" },
          { key: "minQty", label: "Min", align: "start" },
          { key: "maxQty", label: "Max", align: "start" },
          { key: "status", label: "Status", align: "start" },
        ]}
        data={tableData}
        onPageChange={handlePageChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onView={(row) => {
          setSelectedItem(row);
          setShowDetailsModal(true);
        }}
        onEdit={
          canManageInventory()
            ? (row) => {
              setSelectedItem(row);
              setShowAddModal(true);
            }
            : undefined
        }
      />

      {/* CREATE / EDIT MODAL */}
      <InventoryModal
        open={showAddModal}
        mode={selectedItem ? "edit" : "create"}
        initialData={selectedItem}
        onClose={() => {
          setShowAddModal(false);
          setSelectedItem(null);
        }}
        onSuccess={fetchInventoryData}
      />

      {/* VIEW MODAL */}
      <InventoryModal
        open={showDetailsModal}
        mode="view"
        initialData={selectedItem}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedItem(null);
        }}
      />

      {/* BULK TRANSACTION MODAL - Not needed for now */}
      {/* <BulkTransactionModal
        open={showBulkTransactionModal}
        onClose={() => setShowBulkTransactionModal(false)}
        onSuccess={fetchInventoryData}
        inventoryData={inventoryData}
      /> */}

      {/* ADJUSTMENT MODAL (MACSOFT only) */}
      {canAdjustInventory() && (
        <AdjustmentModal
          open={showAdjustmentModal}
          onClose={() => setShowAdjustmentModal(false)}
          onSuccess={fetchInventoryData}
          inventoryData={inventoryData}
        />
      )}

      {/* CUSTOMER RETURN MODAL */}
      <CustomerReturnModal
        open={showCustomerReturnModal}
        onClose={() => setShowCustomerReturnModal(false)}
        onSuccess={() => {
          fetchInventoryData();
          fetchPendingTransfersCount();
        }}
      />

      {/* TRANSFER DISPATCH MODAL (MACSOFT and SSC) */}
      <TransferDispatchModal
        open={showTransferDispatchModal}
        onClose={() => setShowTransferDispatchModal(false)}
        onSuccess={() => {
          fetchInventoryData();
          if (isMacsoftRole()) {
            fetchPendingApprovalsCount();
          }
        }}
      />

      {/* PENDING APPROVALS MODAL (MACSOFT only) */}
      {isMacsoftRole() && (
        <PendingApprovalsModal
          open={showPendingApprovalsModal}
          onClose={() => setShowPendingApprovalsModal(false)}
          onSuccess={() => {
            fetchInventoryData();
            fetchPendingApprovalsCount();
            fetchPendingTransfersCount();
          }}
        />
      )}

      {/* PENDING TRANSFERS MODAL (All roles that can do transactions) */}
      <PendingTransfersModal
        open={showPendingTransfersModal}
        onClose={() => setShowPendingTransfersModal(false)}
        onSuccess={() => {
          fetchInventoryData();
          fetchPendingTransfersCount();
        }}
      />

      {/* TRANSACTION HISTORY MODAL */}
      <TransactionHistoryModal
        open={showTransactionHistoryModal}
        onClose={() => setShowTransactionHistoryModal(false)}
      />
    </section>
  );
}
