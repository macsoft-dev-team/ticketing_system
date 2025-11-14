import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {  
  Search,  
  ShoppingCart,
  Package, 
  Loader2,
  Delete
} from 'lucide-react';
import * as yup from 'yup';
import useProduct from '../../lib/hooks/useProducts';
 
// Validation Schema for Spare Request
const spareRequestSchema = yup.object({
  requestReason: yup.string().required('Request reason is required'),
  urgencyLevel: yup.string().required('Urgency level is required'),
  expectedDelivery: yup.string().required('Expected delivery date is required'),
  products: yup.array().of(
    yup.object({
      productId: yup.string().required('Product is required'),
      productName: yup.string().required('Product name is required'),
      quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
     })
  ).min(1, 'At least one product is required'),
 });

const ProductSearch = ({ onProductSelect, selectedProducts = [], availableProducts = [], isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredProducts = availableProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brandName?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(product => 
    !selectedProducts.find(selected => selected.productId === product.id.toString())
  );

  const handleProductSelect = (product) => {
    onProductSelect({
      productId: product.id.toString(),
      productName: product.name,
      quantity: 1,
      unitPrice: 0, // Price will be set from inventory or manually
      notes: ''
    });
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        {isLoading ? (
          <Loader2 size={20} className="absolute left-3 top-3 text-gray-400 animate-spin" />
        ) : (
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
        )}
        <input
          type="text"
          placeholder={isLoading ? "Loading products..." : "Search products..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={isLoading}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <AnimatePresence>
        {isOpen && searchTerm && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredProducts.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                No products found matching "{searchTerm}"
              </div>
            ) : (
              filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ backgroundColor: '#f3f4f6' }}
                  onClick={() => handleProductSelect(product)}
                  className="p-3 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">
                        Code: {product.productCode} | Category: {product.category || 'N/A'}
                      </p>
                      {product.brandName && (
                        <p className="text-xs text-gray-500">Brand: {product.brandName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Available</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

const ProductTable = ({ products, onQuantityChange, onPriceChange, onRemoveProduct, onNotesChange }) => {
  const totalAmount = products.reduce((sum, product) => sum + (product.quantity * product.unitPrice), 0);

  return (
    <div className="space-y-4">
      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No products selected. Use the search above to add products.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Quantity</th>
                   <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border-t border-gray-200"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{product.productName}</h4>
                        <p className="text-sm text-gray-600">ID: {product.productId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => onQuantityChange(index, parseInt(e.target.value) || 1)}
                        className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>                  
                    
                    <td className="px-4 py-3 text-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onRemoveProduct(index)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Delete size={16} />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </>
      )}
    </div>
  );
};

export const SpareRequestForm = ({ onSubmit, onCancel, isLoading = false }) => {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  
  // Use products hook
  const { fetchProducts, products, loading: productsLoading } = useProduct();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(spareRequestSchema),
    defaultValues: {
      requestReason: '',
      urgencyLevel: 'medium',
      expectedDelivery: '',
      products: [],
      additionalNotes: ''
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'products'
  });

  const watchedProducts = watch('products');

  // Fetch products on component mount
  useEffect(() => {
    // Fetch all products without pagination (large take value)
    fetchProducts({ skip: 0, take: 1000, filter: null });
  }, [fetchProducts]);

  // Update available products when products from Redux change
  useEffect(() => {
    if (products && Array.isArray(products)) {
      setAvailableProducts(products);
    }
  }, [products]);

  const handleProductSelect = (product) => {
    append(product);
  };

  const handleQuantityChange = (index, quantity) => {
    const currentProduct = watchedProducts[index];
    update(index, { ...currentProduct, quantity });
  };

  const handlePriceChange = (index, price) => {
    const currentProduct = watchedProducts[index];
    update(index, { ...currentProduct, unitPrice: price });
  };

  const handleRemoveProduct = (index) => {
    remove(index);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit = (data) => {
    console.log('📝 Form data being submitted:', data);
    
    // Additional validation
    if (!data.products || data.products.length === 0) {
      console.error('❌ No products selected');
      return;
    }
    
    console.log('✅ Form validation passed, calling onSubmit');
    onSubmit({ ...data, attachments });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-3 sm:p-6"
    >
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
          Spare Parts Request
        </h2>
        <p className="text-sm sm:text-base text-gray-600">Request spare parts for ticket resolution</p>
      </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 sm:space-y-6">
        {/* Debug information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-3 rounded text-sm">
            <p>Form errors: {JSON.stringify(errors)}</p>
            <p>Products count: {watchedProducts?.length || 0}</p>
            <p>Is submitting: {isSubmitting.toString()}</p>
          </div>
        )}
        
        {/* Basic Request Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency Level *
            </label>
            <Controller
              name="urgencyLevel"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low - Can wait a week</option>
                  <option value="medium">Medium - Needed within 3-5 days</option>
                  <option value="high">High - Needed within 1-2 days</option>
                  <option value="critical">Critical - Needed immediately</option>
                </select>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Delivery Date *
            </label>
            <Controller
              name="expectedDelivery"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            />
            {errors.expectedDelivery && (
              <p className="mt-1 text-sm text-red-600">{errors.expectedDelivery.message}</p>
            )}
          </div>
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Products *
          </label>
          <ProductSearch 
            onProductSelect={handleProductSelect}
            selectedProducts={watchedProducts}
            availableProducts={availableProducts}
            isLoading={productsLoading}
          />
          {errors.products && (
            <p className="mt-1 text-sm text-red-600">{errors.products.message}</p>
          )}
        </div>

        {/* Selected Products Table */}
        <ProductTable
          products={watchedProducts}
          onQuantityChange={handleQuantityChange}
          onPriceChange={handlePriceChange}
          onRemoveProduct={handleRemoveProduct}
        />
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Request Reason *
          </label>
          <Controller
            name="requestReason"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={3}
                placeholder="Describe why these parts are needed..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
            )}
          />
          {errors.requestReason && (
            <p className="mt-1 text-sm text-red-600">{errors.requestReason.message}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isSubmitting || isLoading}
            onClick={(e) => {
              console.log('🖱️ Submit button clicked');
              console.log('📋 Current form data:', watchedProducts);
              console.log('🚫 Form errors:', errors);
              // Don't prevent default - let the form handle submission
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting || isLoading ? 'Submitting...' : 'Submit Request'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};