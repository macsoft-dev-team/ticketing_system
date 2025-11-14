import { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Upload, AlertCircle, Package, Filter, Search } from "lucide-react";
import axios from "axios";
import { API_URL } from "../lib/constants/api";
import useProducts from "../lib/hooks/useProducts";

export default function InboundActivityModal({
    isOpen,
    onClose,
    onSuccess
}) {
    const [formData, setFormData] = useState({
        supplier: '',
        reference: '',
        notes: ''
    });
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({
        productId: '',
        quantity: '',
        condition: 'good', // 'good', 'defect'
        isNew: false,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        condition: 'all', // 'all', 'good', 'defect'
        isNew: 'all', // 'all', 'new', 'used'
        search: ''
    });

    // Use products hook
    const { products, getProducts, loading: productsLoading } = useProducts();

    // Fetch products for dropdown
    useEffect(() => {
        if (isOpen) {
            // Fetch products using the hook
            getProducts({}); // Get more products for dropdown
            // Reset form
            setFormData({
                supplier: '',
                reference: '',
                notes: ''
            });
            setItems([]);
            setNewItem({
                productId: '',
                quantity: '',
                condition: 'good',
                isNew: false,
                notes: ''
            });
            setFilters({
                condition: 'all',
                isNew: 'all',
                search: ''
            });
            setError('');
        }
    }, [isOpen, getProducts]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate form
            if (items.length === 0) {
                setError('At least one item is required');
                return;
            }

            for (const item of items) {
                if (!item.productId || !item.quantity || parseInt(item.quantity) <= 0) {
                    setError('All items must have a product selected and positive quantity');
                    return;
                }
            }

            const payload = {
                items: items.map(item => ({
                    productId: parseInt(item.productId),
                    quantity: parseInt(item.quantity),
                    condition: item.condition,
                    isNew: item.isNew,
                    notes: item.notes || null
                })),
                supplier: formData.supplier || null,
                reference: formData.reference || null,
                notes: formData.notes || null
            };

            const response = await axios.post(`${API_URL}/inbound-activities`, payload, {
                withCredentials: true
            });

            if (response.data.success) {
                onSuccess?.(response.data.data);
                onClose();
            }
        } catch (error) {
            console.error('Error creating inbound activity:', error);
            setError(error.response?.data?.message || 'Failed to create inbound activity');
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNewItemChange = (field, value) => {
        setNewItem(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addItemToList = () => {
        if (!newItem.productId || !newItem.quantity || parseInt(newItem.quantity) <= 0) {
            setError('Please select a product and enter a valid quantity');
            return;
        }

        const itemToAdd = {
            ...newItem,
            id: Date.now(), // Simple ID for tracking
            quantity: parseInt(newItem.quantity)
        };

        setItems(prev => [...prev, itemToAdd]);
        
        // Reset form
        setNewItem({
            productId: '',
            quantity: '',
            condition: 'good',
            isNew: false,
            notes: ''
        });
        setError('');
    };

    const removeItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Filter items based on current filters
    const filteredItems = items.filter(item => {
        const product = products.find(p => p.id === parseInt(item.productId));
        const productName = product?.name || '';
        const productCode = product?.productCode || '';
        
        const matchesSearch = filters.search === '' || 
            productName.toLowerCase().includes(filters.search.toLowerCase()) ||
            productCode.toLowerCase().includes(filters.search.toLowerCase());
            
        const matchesCondition = filters.condition === 'all' || item.condition === filters.condition;
        
        const matchesNew = filters.isNew === 'all' || 
            (filters.isNew === 'new' && item.isNew) ||
            (filters.isNew === 'used' && !item.isNew);
            
        return matchesSearch && matchesCondition && matchesNew;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <Upload className="h-6 w-6 text-green-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Stock Inbound Activity
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
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

                    {/* Activity Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Supplier
                            </label>
                            <input
                                type="text"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleFormChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter supplier name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reference (PO/Invoice)
                            </label>
                            <input
                                type="text"
                                name="reference"
                                value={formData.reference}
                                onChange={handleFormChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter PO number or invoice reference"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleFormChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="Enter any additional notes about this inbound activity"
                        />
                    </div>

                    {/* Items Section */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Items to Receive</h3>
                        
                        {/* Add Item Form */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Item</h4>
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                                {/* Product Selection */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product *
                                    </label>
                                    <select
                                        value={newItem.productId}
                                        onChange={(e) => handleNewItemChange('productId', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="">Select product...</option>
                                        {products?.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} ({product.productCode})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Qty *
                                    </label>
                                    <input
                                        type="number"
                                        value={newItem.quantity}
                                        onChange={(e) => handleNewItemChange('quantity', e.target.value)}
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                        placeholder="Qty"
                                    />
                                </div>

                                {/* Condition */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Condition
                                    </label>
                                    <select
                                        value={newItem.condition}
                                        onChange={(e) => handleNewItemChange('condition', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="good">Good</option>
                                        <option value="defect">Defect</option>
                                    </select>
                                </div>

                                {/* New/Used */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={newItem.isNew ? 'new' : 'used'}
                                        onChange={(e) => handleNewItemChange('isNew', e.target.value === 'new')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="used">Used</option>
                                        <option value="new">New</option>
                                    </select>
                                </div>

                                {/* Add Button */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={addItemToList}
                                        disabled={!newItem.productId || !newItem.quantity || parseInt(newItem.quantity) <= 0}
                                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Plus className="w-4 h-4 mx-auto" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Item Notes */}
                            <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Item Notes
                                </label>
                                <input
                                    type="text"
                                    value={newItem.notes}
                                    onChange={(e) => handleNewItemChange('notes', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    placeholder="Optional notes for this item"
                                />
                            </div>
                        </div>

                        {/* Items List with Filters */}
                        {items.length > 0 && (
                            <div>
                                {/* Filters */}
                                <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <Filter className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">Filters:</span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <Search className="w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            placeholder="Search products..."
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                    
                                    <select
                                        value={filters.condition}
                                        onChange={(e) => handleFilterChange('condition', e.target.value)}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="all">All Conditions</option>
                                        <option value="good">Good Only</option>
                                        <option value="defect">Defect Only</option>
                                    </select>
                                    
                                    <select
                                        value={filters.isNew}
                                        onChange={(e) => handleFilterChange('isNew', e.target.value)}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="new">New Only</option>
                                        <option value="used">Used Only</option>
                                    </select>
                                </div>

                                {/* Items Table */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Added Items ({filteredItems.length})</h4>
                                    <div className="bg-white rounded-lg border overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Product
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Code
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Qty
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Condition
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Notes
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {filteredItems.map((item) => {
                                                    const product = products.find(p => p.id === parseInt(item.productId));
                                                    return (
                                                        <tr key={item.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                {product?.name || 'Unknown Product'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                                {product?.productCode || 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                                                {item.quantity}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                    item.condition === 'good' 
                                                                        ? 'bg-green-100 text-green-800' 
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {item.condition === 'good' ? 'Good' : 'Defect'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                    item.isNew 
                                                                        ? 'bg-blue-100 text-blue-800' 
                                                                        : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {item.isNew ? 'New' : 'Used'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                                {item.notes || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeItem(item.id)}
                                                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Process Inbound Activity
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}