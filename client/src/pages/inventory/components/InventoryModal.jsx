import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import Input from "../../../components/ui/input";
import Select from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import { API_URL } from "../../../lib/constants/api";
import { useAuth } from "../../../lib/hooks/useAuth";
import { Package, Clock, User, FileText } from "lucide-react";

const CONDITIONS = [
  { value: "GOOD", label: "Good" },
  { value: "DEFECTIVE", label: "Defective" },
  { value: "REPAIRABLE", label: "Repairable" },
  { value: "SCRAP", label: "Scrap" },
];

// MACSOFT roles that can view/manage ALL service centers
const MACSOFT_ROLES = ["MACSOFT_ADMIN", "MACSOFT_HEAD", "MACSOFT_SUPPORT"];

export default function InventoryModal({
  open,
  onClose,
  onSuccess,
  mode = "create", // create | edit | view
  initialData = null,
}) {
  const { user, canAccess } = useAuth();
  
  const [formData, setFormData] = useState({
    productId: "",
    centerCode: "",
    condition: "GOOD",
    quantity: 0,
    minStock: 0,
    maxStock: "",
    location: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [centers, setCenters] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  
  // Check if user is MACSOFT role (can see all centers)
  const isMacsoftRole = canAccess(MACSOFT_ROLES);
  
  // Get user's service center code (for service center technicians)
  const userCenterCode = user?.centerCode || null;
  
 
 

  // Fetch products and centers for dropdown when modal opens
  useEffect(() => {
    if (open && !isView) {
      fetchProducts();
      fetchCenters();
    } else if (open && isView && initialData) {
      // Fetch transaction history for the product in view mode
      fetchTransactionHistory();
    }
  }, [open, isView, initialData]);

  // Auto-set centerCode for service center technicians
  useEffect(() => {
    if (open && !isMacsoftRole && userCenterCode && !initialData) {
      setFormData(prev => ({ ...prev, centerCode: userCenterCode }));
    }
  }, [open, isMacsoftRole, userCenterCode, initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        productId: initialData.productId || "",
        centerCode: initialData.centerCode || "",
        condition: initialData.condition || "GOOD",
        quantity: initialData.quantity || 0,
        minStock: initialData.minStock || 0,
        maxStock: initialData.maxStock || "",
        location: initialData.location || "",
      });
    } else {
      setFormData({
        productId: "",
        centerCode: "",
        condition: "GOOD",
        quantity: 0,
        minStock: 0,
        maxStock: "",
        location: "",
      });
    }
    setErrors({});
  }, [initialData, open]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`, {
        withCredentials: true,
      });
      if (res.data) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const fetchCenters = async () => {
    try {
      const res = await axios.get(`${API_URL}/service-centers`, {
        withCredentials: true,
      });
      if (res.data) {
        setCenters(res.data.serviceCenters || []);
      }
    } catch (err) {
      console.error("Failed to fetch service centers:", err);
    }
  };

  const fetchTransactionHistory = async () => {
    if (!initialData?.productId || !initialData?.centerCode) return;
    
    setLoadingTransactions(true);
    try {
      const res = await axios.get(`${API_URL}/inventory/transactions`, {
        params: {
          productId: initialData.productId,
          centerCode: initialData.centerCode,
          limit: 20
        },
        withCredentials: true,
      });
      if (res.data?.success) {
        setTransactionHistory(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch transaction history:", err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.productId) {
      newErrors.productId = "Product is required";
    }
    if (!formData.centerCode) {
      newErrors.centerCode = "Service center is required";
    }
    if (formData.quantity < 0) {
      newErrors.quantity = "Quantity cannot be negative";
    }
    if (formData.minStock < 0) {
      newErrors.minStock = "Minimum stock cannot be negative";
    }
    if (formData.maxStock && parseInt(formData.maxStock) < parseInt(formData.minStock)) {
      newErrors.maxStock = "Maximum stock cannot be less than minimum stock";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity) || 0,
        minStock: parseInt(formData.minStock) || 0,
        maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
      };

      if (isEdit) {
        await axios.put(`${API_URL}/inventory`, payload, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_URL}/inventory`, payload, {
          withCredentials: true,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Inventory save failed", err);
      const errorMessage = err.response?.data?.message || "Failed to save inventory";
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      // Clear transaction history when closing
      setTransactionHistory([]);
      setLoadingTransactions(false);
      onClose();
    }
  };

  // Prepare dropdown options
  const productOptions = products.map((product) => ({
    label: `${product.name} (${product.productCode})`,
    value: product.id.toString(),
  }));
  productOptions.unshift({ label: "Select Product", value: "" });

  // For service center technicians, only show their own center
  const filteredCenters = isMacsoftRole 
    ? centers 
    : centers.filter(c => c.centerCode === userCenterCode);
  
  const centerOptions = filteredCenters.map((center) => ({
    label: `${center.name} (${center.centerCode})`,
    value: center.centerCode,
  }));
  
  // Only add placeholder for MACSOFT roles who need to choose
  if (isMacsoftRole) {
    centerOptions.unshift({ label: "Select Service Center", value: "" });
  }

  const conditionOptions = CONDITIONS.map((c) => ({
    label: c.label,
    value: c.value,
  }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto modal-content">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {isView
              ? "Inventory Details"
              : isEdit
              ? "Edit Inventory"
              : "Add Inventory"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product */}
            <div className="space-y-2">
              <Label htmlFor="productId">
                Product <span className="text-red-500">*</span>
              </Label>
              <Select
                id="productId"
                name="productId"
                value={formData.productId.toString()}
                onChange={handleChange}
                options={productOptions}
                placeholder="Select Product"
                disabled={isSubmitting || isView}
                direction="down"
                className={errors.productId ? "border-red-500" : ""}
              />
              {errors.productId && (
                <p className="text-red-500 text-xs mt-1">{errors.productId}</p>
              )}
            </div>

            {/* Service Center */}
            <div className="space-y-2">
              <Label htmlFor="centerCode">
                Service Center <span className="text-red-500">*</span>
                {!isMacsoftRole && userCenterCode && (
                  <span className="text-xs text-gray-500 ml-2">(Your center)</span>
                )}
              </Label>
              <Select
                id="centerCode"
                name="centerCode"
                value={formData.centerCode}
                onChange={handleChange}
                options={centerOptions}
                placeholder="Select Service Center"
                disabled={isSubmitting || isView || (!isMacsoftRole && userCenterCode)}
                direction="down"
                className={errors.centerCode ? "border-red-500" : ""}
              />
              {errors.centerCode && (
                <p className="text-red-500 text-xs mt-1">{errors.centerCode}</p>
              )}
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <Label htmlFor="condition">
                Condition <span className="text-red-500">*</span>
              </Label>
              <Select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                options={conditionOptions}
                placeholder="Select Condition"
                disabled={isSubmitting || isView}
                direction="down"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                disabled={isSubmitting || isView}
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Min Stock */}
            <div className="space-y-2">
              <Label htmlFor="minStock">
                Minimum Stock <span className="text-red-500">*</span>
              </Label>
              <Input
                id="minStock"
                name="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={handleChange}
                placeholder="Enter minimum stock"
                disabled={isSubmitting || isView}
                className={errors.minStock ? "border-red-500" : ""}
              />
              {errors.minStock && (
                <p className="text-red-500 text-xs mt-1">{errors.minStock}</p>
              )}
            </div>

            {/* Max Stock */}
            <div className="space-y-2">
              <Label htmlFor="maxStock">
                Maximum Stock <span className="text-xs text-gray-500">(optional)</span>
              </Label>
              <Input
                id="maxStock"
                name="maxStock"
                type="number"
                min="0"
                value={formData.maxStock}
                onChange={handleChange}
                placeholder="Enter maximum stock"
                disabled={isSubmitting || isView}
                className={errors.maxStock ? "border-red-500" : ""}
              />
              {errors.maxStock && (
                <p className="text-red-500 text-xs mt-1">{errors.maxStock}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">
                Location / Rack <span className="text-xs text-gray-500">(optional)</span>
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location or rack number"
                disabled={isSubmitting || isView}
              />
              <p className="text-xs text-gray-500">
                Specify where this inventory is stored (e.g., Rack A-01, Shelf 3)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {!isView && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFormData({
                    productId: "",
                    centerCode: "",
                    condition: "GOOD",
                    quantity: 0,
                    minStock: 0,
                    maxStock: "",
                    location: "",
                  });
                  setErrors({});
                  setIsSubmitting(false);
                  onClose();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEdit ? "Updating..." : "Creating..."}
                  </>
                ) : isEdit ? (
                  "Update Inventory"
                ) : (
                  "Add Inventory"
                )}
              </Button>
            </div>
          )}

          {/* Transaction History for view mode */}
          {isView && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Transaction History</h3>
              </div>
              
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading transactions...</span>
                </div>
              ) : transactionHistory.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactionHistory.map((transaction) => (
                    <div key={transaction.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-sm uppercase tracking-wide">
                            {transaction.transactionType}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.transactionType === 'RECEIPT' 
                              ? 'bg-green-100 text-green-800'
                              : transaction.transactionType === 'DELIVERY'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.transactionType}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {transaction.invoiceNo && (
                          <div>
                            <span className="text-gray-600">Invoice:</span>
                            <span className="ml-1 font-medium">{transaction.invoiceNo}</span>
                          </div>
                        )}
                        {transaction.billNo && (
                          <div>
                            <span className="text-gray-600">Bill:</span>
                            <span className="ml-1 font-medium">{transaction.billNo}</span>
                          </div>
                        )}
                        {transaction.ticketCode && (
                          <div>
                            <span className="text-gray-600">Ticket:</span>
                            <span className="ml-1 font-medium">{transaction.ticketCode}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Created by:</span>
                          <span className="ml-1 font-medium">{transaction.createdBy || 'Unknown'}</span>
                        </div>
                      </div>
                      
                      {transaction.items && transaction.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <div className="text-xs text-gray-600 mb-2">Items:</div>
                          {transaction.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm bg-white rounded px-3 py-2 mb-1">
                              <div>
                                <span className="font-medium">{item.productName || 'Unknown Product'}</span>
                                <span className="text-gray-500 ml-2">({item.productCode})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  item.condition === 'GOOD' 
                                    ? 'bg-green-100 text-green-800'
                                    : item.condition === 'DEFECTIVE'
                                    ? 'bg-red-100 text-red-800'
                                    : item.condition === 'REPAIRABLE'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.condition}
                                </span>
                                <span className="font-medium">Qty: {item.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {transaction.remarks && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="text-xs text-gray-600 block">Remarks:</span>
                              <span className="text-sm text-gray-800">{transaction.remarks}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No transaction history found for this product.</p>
                </div>
              )}
            </div>
          )}

          {/* Close button for view mode */}
          {isView && (
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
