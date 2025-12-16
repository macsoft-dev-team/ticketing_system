import { useState, useEffect } from "react";
import { X, Plus, Trash2, AlertCircle } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../../lib/constants/api";
import { Button } from "../../../components/ui/button";
import Select from "../../../components/ui/select";
import { useAuth } from "../../../lib/hooks/useAuth";

/**
 * CUSTOMER RETURN MODAL
 * 
 * For SERVICE_CENTER_TECHNICIAN to record customer returns
 * - ProductId is OPTIONAL (can be unknown)
 * - Condition is MANDATORY
 * - If product unknown, provide description in remarks
 */
export default function CustomerReturnModal({ open, onClose, onSuccess }) {
  const { canAccess, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [selectedCenterCode, setSelectedCenterCode] = useState("");
  
  // Added items list (the cart)
  const [items, setItems] = useState([]);
  
  // Current input fields (the form)
  const [currentProductId, setCurrentProductId] = useState("");
  const [currentProductName, setCurrentProductName] = useState("");
  const [currentCondition, setCurrentCondition] = useState("DEFECTIVE");
  const [currentQuantity, setCurrentQuantity] = useState(1);
  
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  
  // Check if user is MACSOFT
  const isMacsoftRole = canAccess(["MACSOFT_ADMIN", "MACSOFT_HEAD", "MACSOFT_SUPPORT"]);

  const conditions = [
    { label: "Defective", value: "DEFECTIVE" },
    { label: "Repairable", value: "REPAIRABLE" },
    { label: "Scrap", value: "SCRAP" },
    { label: "Good", value: "GOOD" },
  ];

  useEffect(() => {
    if (open) {
      fetchProducts();
      if (isMacsoftRole) {
        fetchServiceCenters();
      } else {
        // For SSC users, set their service center automatically
        setSelectedCenterCode(user?.centerCode || "");
      }
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`, {
        withCredentials: true,
      });
      console.log("Products API response:", res.data);
      if (res.data.products) {
        console.log("Setting products:", res.data.products);
        setProducts(res.data.products);
      } else {
        console.warn("No products found in response");
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products. Please try again.");
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

  const addItem = () => {
    setError("");
    
    // Validate that either productId or productName is provided
    if (!currentProductId && !currentProductName) {
      setError("Please select a product or enter a product name/description");
      return;
    }
    
    if (currentQuantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    
    // Add new item to cart
    setItems([
      ...items,
      {
        productId: currentProductId,
        productName: currentProductName,
        condition: currentCondition,
        quantity: parseInt(currentQuantity),
      },
    ]);
    
    // Clear input fields
    setCurrentProductId("");
    setCurrentProductName("");
    setCurrentCondition("DEFECTIVE");
    setCurrentQuantity(1);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate service center for MACSOFT
    if (isMacsoftRole && !selectedCenterCode) {
      setError("Please select a service center");
      return;
    }

    // Validate items
    if (items.length === 0) {
      setError("Please add at least one item to the return");
      return;
    }

    try {
      setLoading(true);

      // Prepare items
      const preparedItems = items.map((item) => ({
        productId: item.productId ? parseInt(item.productId) : null,
        productName: item.productName || null,
        condition: item.condition,
        quantity: parseInt(item.quantity),
      }));

      const payload = {
        items: preparedItems,
        remarks,
      };
      
      // Add centerCode for MACSOFT users
      if (isMacsoftRole) {
        payload.centerCode = selectedCenterCode;
      }

      const res = await axios.post(
        `${API_URL}/inventory-transactions/return`,
        payload,
        { withCredentials: true }
      );

      if (res.data.success) {
        onSuccess?.();
        handleClose();
      }
    } catch (err) {
      console.error("Failed to create return transaction:", err);
      setError(err.response?.data?.message || "Failed to create return transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setItems([]);
    setCurrentProductId("");
    setCurrentProductName("");
    setCurrentCondition("DEFECTIVE");
    setCurrentQuantity(1);
    setRemarks("");
    setError("");
    setSelectedCenterCode("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Customer Return</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Service Center Selection - MACSOFT Only */}
          {isMacsoftRole && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Service Center *
              </label>
              <Select
                value={selectedCenterCode}
                onChange={(e) => setSelectedCenterCode(e.target.value)}
                options={[
                  { label: "Select Service Center", value: "" },
                  ...serviceCenters.map((center) => ({
                    label: `${center.name} (${center.centerCode})`,
                    value: center.centerCode,
                  })),
                ]}
                className="w-full"
              />
            </div>
          )}

          {/* Add Item Form */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
            <label className="text-sm font-semibold text-blue-900 block">
              Add Return Item
            </label>
            
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-4">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Product (Optional) {products.length > 0 && `(${products.length} available)`}
                </label>
                <Select
                  value={currentProductId}
                  onChange={(e) => {
                    setCurrentProductId(e.target.value);
                    if (e.target.value) setCurrentProductName("");
                  }}
                  disabled={!!currentProductName}
                  options={[
                    { label: "Select Product", value: "" },
                    ...products.map((p) => ({
                      label: `${p.name} (${p.productCode})`,
                      value: p.id.toString(),
                    })),
                  ]}
                  className="w-full"
                />
              </div>

              <div className="col-span-3">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Or Product Name
                </label>
                <input
                  type="text"
                  value={currentProductName}
                  onChange={(e) => {
                    setCurrentProductName(e.target.value);
                    if (e.target.value) setCurrentProductId("");
                  }}
                  disabled={!!currentProductId}
                  placeholder="Unknown product"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Condition *
                </label>
                <Select
                  value={currentCondition}
                  onChange={(e) => setCurrentCondition(e.target.value)}
                  options={conditions}
                  className="w-full"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-1 flex items-end">
                <Button
                  type="button"
                  onClick={addItem}
                  className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Items Cart */}
          {items.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Items to Return ({items.length})
              </label>
              <div className="space-y-2">
                {items.map((item, index) => {
                  const product = products.find(p => p.id === parseInt(item.productId));
                  const displayName = product ? `${product.name} (${product.productCode})` : item.productName || "Unknown Product";
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{displayName}</p>
                          <p className="text-xs text-gray-500">
                            Condition: {conditions.find(c => c.value === item.condition)?.label} • Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-300 rounded-md">
              No items added yet. Use the form above to add items.
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Remarks / Description
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional notes about the return (especially for unknown products)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Create Return"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
