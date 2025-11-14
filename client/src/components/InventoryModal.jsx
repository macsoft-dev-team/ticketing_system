import { useState, useEffect } from "react";
import { X, Save, Package, MapPin, Hash, AlertCircle } from "lucide-react";
import axios from "axios";
import { API_URL } from "../lib/constants/api";
import useProducts from "../lib/hooks/useProducts";

export default function InventoryModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editItem = null,
  mode = 'add' // 'add' or 'edit'
}) {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    minStock: '',
    maxStock: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Use products hook
  const { products, getProducts, loading: productsLoading } = useProducts();

  // Fetch products for dropdown
  useEffect(() => {
    if (isOpen) {
      // Fetch products using the hook
      getProducts({}); // Get more products for dropdown
      
      // If editing, populate form with existing data
      if (mode === 'edit' && editItem) {
        setFormData({
          productId: editItem.productId || '',
          quantity: editItem.quantity || '',
          minStock: editItem.minStock || '',
          maxStock: editItem.maxStock || '',
          location: editItem.location || ''
        });
      } else {
        // Reset form for add mode
        setFormData({
          productId: '',
          quantity: '',
          minStock: '',
          maxStock: '',
          location: ''
        });
      }
    }
  }, [isOpen, mode, editItem, getProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.productId || !formData.quantity) {
        setError('Product and quantity are required');
        return;
      }

      const response = await axios.post(`${API_URL}/inventory`, {
        productId: parseInt(formData.productId),
        quantity: parseInt(formData.quantity),
        minStock: parseInt(formData.minStock) || 0,
        maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
        location: formData.location || null
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      setError(error.response?.data?.message || 'Failed to update inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'edit' ? 'Update Inventory' : 'Add Inventory'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product *
            </label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              disabled={mode === 'edit'} // Don't allow changing product when editing
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              required
            >
              <option value="">Select a product...</option>
              {products?.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.productCode})
                </option>
              )) || []}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash className="inline w-4 h-4 mr-1" />
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter quantity"
              required
            />
          </div>

          {/* Min Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <AlertCircle className="inline w-4 h-4 mr-1" />
              Minimum Stock Level
            </label>
            <input
              type="number"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter minimum stock level"
            />
          </div>

          {/* Max Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash className="inline w-4 h-4 mr-1" />
              Maximum Stock Level (Optional)
            </label>
            <input
              type="number"
              name="maxStock"
              value={formData.maxStock}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter maximum stock level"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline w-4 h-4 mr-1" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter storage location (e.g., Warehouse A, Shelf 1)"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'edit' ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'edit' ? 'Update Inventory' : 'Add to Inventory'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}