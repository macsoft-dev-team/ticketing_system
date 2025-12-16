import { useState, useEffect } from "react";
import { X, Plus, Trash2, AlertCircle, Send, ArrowRight } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../../lib/constants/api";
import {Button} from "../../../components/ui/button";
import Select from "../../../components/ui/select";
import { useAuth } from "../../../lib/hooks/useAuth";

/**
 * TRANSFER DISPATCH MODAL
 * 
 * MACSOFT: Can dispatch transfers immediately (inventory deducted)
 * SSC: Can request transfers (pending MACSOFT approval, no inventory change)
 */
export default function TransferDispatchModal({ open, onClose, onSuccess }) {
  const { user } = useAuth();
  const isMacsoftRole = ["MACSOFT_ADMIN", "MACSOFT_HEAD"].includes(user?.role);
  
  const [loading, setLoading] = useState(false);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [fromCenterCode, setFromCenterCode] = useState("");
  const [toCenterCode, setToCenterCode] = useState("");
  
  // Added items list (the cart)
  const [items, setItems] = useState([]);
  
  // Current input fields (the form)
  const [currentProduct, setCurrentProduct] = useState("");
  const [currentCondition, setCurrentCondition] = useState("GOOD");
  const [currentQuantity, setCurrentQuantity] = useState(1);
  
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const conditions = [
    { label: "Good", value: "GOOD" },
    { label: "Defective", value: "DEFECTIVE" },
    { label: "Repairable", value: "REPAIRABLE" },
    { label: "Scrap", value: "SCRAP" },
  ];

  useEffect(() => {
    if (open) {
      fetchServiceCenters();
      fetchProducts();
      
      // For SSC roles, pre-set their own center as FROM center
      if (!isMacsoftRole && user?.centerCode) {
        setFromCenterCode(user.centerCode);
      }
    }
  }, [open, isMacsoftRole, user]);

  const fetchServiceCenters = async () => {
    try {
      const res = await axios.get(`${API_URL}/service-centers`, {
        withCredentials: true,
      });
      console.log("Service Centers API response:", res.data);
      if (res.data.serviceCenters && Array.isArray(res.data.serviceCenters)) {
        console.log("Setting service centers:", res.data.serviceCenters);
        // Sort: MACSOFT centers first, then others
        const sorted = res.data.serviceCenters.sort((a, b) => {
          if (a.isMacsoft && !b.isMacsoft) return -1;
          if (!a.isMacsoft && b.isMacsoft) return 1;
          return a.name.localeCompare(b.name);
        });
        setServiceCenters(sorted);
      } else {
        console.warn("No service centers found in response");
        setServiceCenters([]);
      }
    } catch (err) {
      console.error("Failed to fetch service centers:", err);
      setServiceCenters([]);
    }
  };

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
    }
  };

  const fetchInventory = async (centerCode) => {
    if (!centerCode) return;
    try {
      const res = await axios.get(
        `${API_URL}/inventory?centerCode=${centerCode}`,
        {
          withCredentials: true,
        }
      );
      if (res.data.success) {
        setInventory(res.data.inventory);
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    }
  };

  // Fetch inventory when fromCenterCode changes
  useEffect(() => {
    if (fromCenterCode) {
      fetchInventory(fromCenterCode);
    }
  }, [fromCenterCode]);

  const addItem = () => {
    setError("");
    
    if (!currentProduct) {
      setError("Please select a product");
      return;
    }
    
    if (currentQuantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    
    const available = getAvailableQuantity(currentProduct, currentCondition);
    if (currentQuantity > available) {
      setError(`Insufficient stock. Available: ${available}`);
      return;
    }
    
    // Check if product with same condition already exists
    const existingIndex = items.findIndex(
      item => item.productId === currentProduct && item.condition === currentCondition
    );
    
    if (existingIndex >= 0) {
      // Update existing item quantity
      const updated = [...items];
      updated[existingIndex].quantity += parseInt(currentQuantity);
      setItems(updated);
    } else {
      // Add new item
      setItems([
        ...items,
        {
          productId: currentProduct,
          condition: currentCondition,
          quantity: parseInt(currentQuantity),
        },
      ]);
    }
    
    // Clear input fields
    setCurrentProduct("");
    setCurrentCondition("GOOD");
    setCurrentQuantity(1);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const getAvailableQuantity = (productId, condition) => {
    const inv = inventory.find(
      (i) => i.productId === parseInt(productId) && i.condition === condition
    );
    if (!inv) return 0;
    return inv.quantity || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fromCenterCode) {
      setError("Please select a source service center");
      return;
    }

    if (!toCenterCode) {
      setError("Please select a destination service center");
      return;
    }

    if (fromCenterCode === toCenterCode) {
      setError("Source and destination centers cannot be the same");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one item to transfer");
      return;
    }

    // All items are already validated when added, so no need to check again

    try {
      setLoading(true);

      const preparedItems = items.map((item) => ({
        productId: parseInt(item.productId),
        condition: item.condition,
        quantity: parseInt(item.quantity),
      }));

      const res = await axios.post(
        `${API_URL}/inventory-transactions/transfer/dispatch`,
        {
          fromCenterCode,
          toCenterCode,
          items: preparedItems,
          remarks,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        onSuccess?.();
        handleClose();
      }
    } catch (err) {
      console.error("Failed to dispatch transfer:", err);
      setError(
        err.response?.data?.message || "Failed to dispatch transfer"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFromCenterCode("");
    setToCenterCode("");
    setItems([]);
    setCurrentProduct("");
    setCurrentCondition("GOOD");
    setCurrentQuantity(1);
    setRemarks("");
    setError("");
    setInventory([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {isMacsoftRole ? "Dispatch Transfer" : "Request Transfer"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isMacsoftRole 
                ? "Transfer products between any service centers" 
                : "Request transfer approval from MACSOFT"}
            </p>
          </div>
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

          {/* Transfer Direction Indicator 
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-start content-center gap-4">
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-blue-900">From</span>
                <div className="mt-1 px-4 py-2 bg-white border-2 border-blue-600 text-blue-900 rounded-md font-semibold min-w-[200px] text-center">
                  {fromCenterCode 
                    ? serviceCenters.find(c => c.centerCode === fromCenterCode)?.name || fromCenterCode
                    : "Select Source"}
                </div>
              </div>
              <div>
                <div className="invisible">ok</div>
                <ArrowRight className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-blue-900">To</span>
                <div className="mt-1 px-4 py-2 bg-white border-2 border-blue-600 text-blue-900 rounded-md font-semibold min-w-[200px] text-center">
                  {toCenterCode 
                    ? serviceCenters.find(c => c.centerCode === toCenterCode)?.name || toCenterCode
                    : "Select Destination"}
                </div>
              </div>
            </div>
          </div>
*/}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                From Service Center * {serviceCenters.length > 0 && `(${serviceCenters.length} available)`}
              </label>
              <Select
                value={fromCenterCode}
                onChange={(e) => setFromCenterCode(e.target.value)}
                options={[
                  { label: serviceCenters.length === 0 ? "Loading..." : "Select Source Center", value: "" },
                  ...serviceCenters.map((center) => ({
                    label: `${center.name} (${center.centerCode})${center.isMacsoft ? ' - HSC' : ' - SSC'}`,
                    value: center.centerCode,
                  })),
                ]}
                className="w-full"
                disabled={!isMacsoftRole}
              />
              {!isMacsoftRole && (
                <p className="text-xs text-gray-500 mt-1">
                  Transfers can only be requested from your own center
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                To Service Center * {serviceCenters.length > 0 && `(${serviceCenters.filter(c => c.centerCode !== fromCenterCode).length} available)`}
              </label>
              <Select
                value={toCenterCode}
                onChange={(e) => setToCenterCode(e.target.value)}
                options={[
                  { label: !fromCenterCode ? "Select source first" : (serviceCenters.length === 0 ? "Loading..." : "Select Destination Center"), value: "" },
                  ...serviceCenters
                    .filter(c => c.centerCode !== fromCenterCode)
                    .map((center) => ({
                      label: `${center.name} (${center.centerCode})${center.isMacsoft ? ' - HSC' : ' - SSC'}`,
                      value: center.centerCode,
                    })),
                ]}
                className="w-full"
                disabled={!fromCenterCode}
              />
              {fromCenterCode && serviceCenters.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {serviceCenters.filter(c => c.centerCode !== fromCenterCode).length} centers available
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Add Transfer Items
              </label>
            </div>

            {/* Input Section */}
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Product * {products.length > 0 && `(${products.length} available)`}
                  </label>
                  <Select
                    value={currentProduct}
                    onChange={(e) => setCurrentProduct(e.target.value)}
                    options={[
                      { label: products.length === 0 ? "Loading..." : "Select Product", value: "" },
                      ...products.map((p) => ({
                        label: `${p.name} (${p.productCode})`,
                        value: p.id.toString(),
                      })),
                    ]}
                    className="w-full"
                  />
                  {currentProduct && (
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      ✓ {products.find(p => p.id.toString() === currentProduct)?.name}
                    </p>
                  )}
                </div>

                <div className="col-span-3">
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
                  {currentProduct && (
                    <p className={`text-xs mt-1 ${
                      getAvailableQuantity(currentProduct, currentCondition) < currentQuantity 
                        ? 'text-red-600' 
                        : 'text-gray-500'
                    }`}>
                      Available: {getAvailableQuantity(currentProduct, currentCondition)}
                    </p>
                  )}
                </div>

                <div className="col-span-2 flex items-end">
                  <Button
                    type="button"
                    onClick={addItem}
                    disabled={!fromCenterCode}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Items List Table */}
          {items.length > 0 && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  Items to Transfer ({items.length})
                </h3>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Product</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Condition</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Quantity</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Available</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Status</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.filter(item => item.productId).map((item, index) => {
                    const product = products.find(p => p.id.toString() === item.productId);
                    const available = getAvailableQuantity(item.productId, item.condition);
                    const hasStock = available >= item.quantity;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium text-gray-900">{product?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{product?.productCode}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {item.condition}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              if (newQty > available) {
                                setError(`Insufficient stock for ${product?.name}. Available: ${available}`);
                              } else {
                                setError("");
                              }
                              updateItem(index, "quantity", newQty);
                            }}
                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${hasStock ? 'text-green-600' : 'text-red-600'}`}>
                            {available}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasStock ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Low Stock
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Remove item"
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
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional notes about this transfer"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className={`${isMacsoftRole ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'} border rounded-md p-4`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`w-5 h-5 ${isMacsoftRole ? 'text-blue-600' : 'text-yellow-600'} mt-0.5`} />
              <div className={`text-sm ${isMacsoftRole ? 'text-blue-800' : 'text-yellow-800'}`}>
                <p className="font-medium mb-1">
                  {isMacsoftRole ? "Note:" : "Important:"}
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {isMacsoftRole ? (
                    <>
                      <li>Inventory will be deducted from source center immediately</li>
                      <li>Destination center must RECEIVE the transfer to add to their inventory</li>
                      <li>All conditions can be transferred (GOOD, DEFECTIVE, etc.)</li>
                    </>
                  ) : (
                    <>
                      <li>This request requires MACSOFT approval</li>
                      <li>Inventory will NOT be deducted until approved</li>
                      <li>You will be notified when approved or rejected</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 text-sm ${
                isMacsoftRole ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-yellow-600 hover:bg-yellow-700'
              } text-white rounded-md disabled:opacity-50`}
            >
              <Send className="w-4 h-4" />
              {loading ? "Processing..." : isMacsoftRole ? "Dispatch Transfer" : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
