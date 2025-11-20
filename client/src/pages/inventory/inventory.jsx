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
  Upload,
  Eye,
  Edit,
  X
} from "lucide-react";
import { useAuth } from "../../lib/hooks/useAuth";
import InventoryModal from "../../components/InventoryModal";
import InboundActivityModal from "../../components/InboundActivityModal";

export default function Inventory() {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0
  });

  // Use authentication hook
  const { user: currentUser, isAuthenticated, hasRole, canAccess } = useAuth();

  // Check if user can manage inventory
  const canManageInventory = () => {
    return canAccess(['MACSOFT_ADMIN', 'MACSOFT_HEAD']);
  };

  // Fetch inventory data
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/inventory`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        const transformedData = response.data.inventory.map(item => ({
          ...item,
          productname: item.productName,
          availableQuantity: item.quantity,
          minQty: item.minStock,
          maxQty: item.maxStock || 'N/A'
        }));
        
        setInventoryData(transformedData);
        
        // Calculate stats
        const stats = {
          totalItems: transformedData.length,
          lowStockCount: transformedData.filter(item => item.status === 'LOW_STOCK').length,
          outOfStockCount: transformedData.filter(item => item.status === 'OUT_OF_STOCK').length,
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch low stock items
  const fetchLowStockItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/inventory/low-stock`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setLowStockItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching low stock items:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchInventoryData();
      fetchLowStockItems();
    }
  }, [isAuthenticated]);

  // Get status color and icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            In Stock
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Low Stock
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Out of Stock
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  // Transform data for display
  const transformedInventoryData = inventoryData.map(item => ({
    ...item,
    status: getStatusDisplay(item.status)
  }));

  return (
    <section className="px-6 py-4 space-y-6">
      <TitleHead title="Inventory Management" description="Monitor and manage your inventory levels, stock movements, and replenishment activities." />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalItems}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.lowStockCount}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.outOfStockCount}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                <dd className="text-lg font-medium text-gray-900">{inventoryData.length}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Low Stock Alert:</strong> {lowStockItems.length} items are running low on stock and may need replenishment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {canManageInventory() && (
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setShowInboundModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Upload className="w-4 h-4 mr-2" />
            Stock Inbound
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Update Inventory
          </button>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow">
        <ReusableTable
          columns={[
            { key: 'productname', label: 'Product Name', align: 'left', textWrap: 'nowrap', },
            { key: 'productCode', label: 'Product Code', align: 'left', textWrap: 'nowrap', },
            { key: 'category', label: 'Category', align: 'left', textWrap: 'nowrap', },
            { key: 'location', label: 'Location', align: 'left', textWrap: 'nowrap', },
            { key: 'availableQuantity', label: 'Available Qty', align: 'center', textWrap: 'nowrap', },
            { key: 'minQty', label: 'Min Stock', align: 'center', textWrap: 'nowrap', },
            { key: 'maxQty', label: 'Max Stock', align: 'center', textWrap: 'nowrap', },
            { key: 'status', label: 'Status', align: 'center', textWrap: 'nowrap', },
          ]}
          data={transformedInventoryData}
          title="Inventory"
          headerColor="bg-gray-700"
          headerTextColor="text-white"
          bordered
          searchPlaceholder="Search inventory by product name, code, or category..."
          loading={loading}
          onView={(row) => {
            setSelectedItem(row);
            setShowDetailsModal(true);
          }}
          onEdit={canManageInventory() ? (row) => {
            setSelectedItem(row);
            setShowAddModal(true);
          } : undefined}
        />
      </div>

      {/* Modals */}
      <InventoryModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedItem(null);
        }}
        onSuccess={() => {
          fetchInventoryData();
          fetchLowStockItems();
        }}
        editItem={selectedItem}
        mode={selectedItem ? 'edit' : 'add'}
      />

      <InboundActivityModal
        isOpen={showInboundModal}
        onClose={() => setShowInboundModal(false)}
        onSuccess={(data) => {
          fetchInventoryData();
          fetchLowStockItems();
          // You could show a success message here
          console.log('Inbound activity processed:', data);
        }}
      />

      {/* Details Modal - You can implement this later for viewing item details */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Package className="h-6 w-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Inventory Details
                </h2>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Product Name</dt>
                  <dd className="text-sm text-gray-900">{selectedItem.productname}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Product Code</dt>
                  <dd className="text-sm text-gray-900">{selectedItem.productCode}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="text-sm text-gray-900">{selectedItem.category}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="text-sm text-gray-900">{selectedItem.location || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Available Quantity</dt>
                  <dd className="text-sm text-gray-900">{selectedItem.availableQuantity}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Minimum Stock</dt>
                  <dd className="text-sm text-gray-900">{selectedItem.minQty}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Maximum Stock</dt>
                  <dd className="text-sm text-gray-900">{selectedItem.maxQty}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">{getStatusDisplay(selectedItem.status)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">{selectedItem.updatedAt}</dd>
                </div>
              </dl>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}