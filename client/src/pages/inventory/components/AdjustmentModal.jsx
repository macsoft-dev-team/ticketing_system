import { useState, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import Input from "../../../components/ui/input";
import Select from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import { API_URL } from "../../../lib/constants/api";
import { AlertTriangle } from "lucide-react";

const CONDITIONS = [
  { value: "GOOD", label: "Good" },
  { value: "DEFECTIVE", label: "Defective" },
  { value: "REPAIRABLE", label: "Repairable" },
  { value: "SCRAP", label: "Scrap" },
];

const ADJUSTMENT_TYPES = [
  { value: "ADD", label: "Add (+)" },
  { value: "SUBTRACT", label: "Subtract (-)" },
  { value: "SET", label: "Set to exact value" },
];

export default function AdjustmentModal({
  open,
  onClose,
  onSuccess,
  inventoryData = [],
}) {
  const [formData, setFormData] = useState({
    productId: "",
    centerCode: "",
    condition: "GOOD",
    adjustmentType: "ADD",
    quantity: 0,
    reason: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [centers, setCenters] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentStock, setCurrentStock] = useState(null);

  // Fetch products and centers when modal opens
  useEffect(() => {
    if (open) {
      fetchProducts();
      fetchCenters();
    }
  }, [open]);

  // Update current stock when selection changes
  useEffect(() => {
    if (formData.productId && formData.centerCode && formData.condition) {
      const found = inventoryData.find(
        (item) =>
          item.productId == formData.productId &&
          item.centerCode === formData.centerCode &&
          item.condition === formData.condition
      );
      setCurrentStock(found ? found.quantity : 0);
    } else {
      setCurrentStock(null);
    }
  }, [formData.productId, formData.centerCode, formData.condition, inventoryData]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

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
    if (!formData.condition) {
      newErrors.condition = "Condition is required";
    }
    if (!formData.adjustmentType) {
      newErrors.adjustmentType = "Adjustment type is required";
    }
    if (formData.quantity < 0) {
      newErrors.quantity = "Quantity cannot be negative";
    }
    if (formData.quantity === 0 || formData.quantity === "") {
      newErrors.quantity = "Quantity is required";
    }

    // Validate subtract doesn't go below 0
    if (formData.adjustmentType === "SUBTRACT" && currentStock !== null) {
      if (parseInt(formData.quantity) > currentStock) {
        newErrors.quantity = `Cannot subtract more than current stock (${currentStock})`;
      }
    }

    // Validate SET value is not negative
    if (formData.adjustmentType === "SET" && parseInt(formData.quantity) < 0) {
      newErrors.quantity = "Cannot set to negative value";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateNewQuantity = () => {
    if (currentStock === null) return "N/A";
    const qty = parseInt(formData.quantity) || 0;
    
    switch (formData.adjustmentType) {
      case "ADD":
        return currentStock + qty;
      case "SUBTRACT":
        return Math.max(0, currentStock - qty);
      case "SET":
        return qty;
      default:
        return currentStock;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        productId: parseInt(formData.productId),
        centerCode: formData.centerCode,
        condition: formData.condition,
        adjustmentType: formData.adjustmentType,
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
      };

      await axios.post(`${API_URL}/inventory/adjust`, payload, {
        withCredentials: true,
      });

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Adjustment failed", err);
      const errorMessage = err.response?.data?.message || "Failed to adjust inventory";
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      productId: "",
      centerCode: "",
      condition: "GOOD",
      adjustmentType: "ADD",
      quantity: 0,
      reason: "",
    });
    setErrors({});
    setCurrentStock(null);
    onClose();
  };

  // Prepare dropdown options
  const productOptions = products.map((product) => ({
    label: `${product.name} (${product.productCode})`,
    value: product.id.toString(),
  }));
  productOptions.unshift({ label: "Select Product", value: "" });

  const centerOptions = centers.map((center) => ({
    label: `${center.name} (${center.centerCode})`,
    value: center.centerCode,
  }));
  centerOptions.unshift({ label: "Select Service Center", value: "" });

  const conditionOptions = CONDITIONS.map((c) => ({
    label: c.label,
    value: c.value,
  }));

  const adjustmentTypeOptions = ADJUSTMENT_TYPES.map((t) => ({
    label: t.label,
    value: t.value,
  }));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto modal-content">
        <DialogHeader>
          <DialogTitle className="uppercase flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-600" />
            Inventory Adjustment
          </DialogTitle>
        </DialogHeader>

        <div className="bg-purple-50 border my-4 border-purple-200 text-purple-700 px-4 py-3 rounded mb-4">
          <strong>Note:</strong> Adjustments are used to correct inventory discrepancies. 
          All adjustments are logged for audit purposes.
        </div>

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
                disabled={isSubmitting}
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
              </Label>
              <Select
                id="centerCode"
                name="centerCode"
                value={formData.centerCode}
                onChange={handleChange}
                options={centerOptions}
                placeholder="Select Service Center"
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                direction="down"
              />
            </div>

            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label htmlFor="adjustmentType">
                Adjustment Type <span className="text-red-500">*</span>
              </Label>
              <Select
                id="adjustmentType"
                name="adjustmentType"
                value={formData.adjustmentType}
                onChange={handleChange}
                options={adjustmentTypeOptions}
                placeholder="Select Adjustment Type"
                disabled={isSubmitting}
                direction="down"
              />
            </div>

            {/* Current Stock Display */}
            <div className="space-y-2">
              <Label>Current Stock</Label>
              <div className="p-2 bg-gray-100 rounded border border-gray-200 text-center font-semibold">
                {currentStock !== null ? currentStock : "Select product, center & condition"}
              </div>
            </div>

            {/* New Stock Preview */}
            <div className="space-y-2">
              <Label>New Stock (Preview)</Label>
              <div className={`p-2 rounded border border-gray-200 text-center font-semibold ${
                calculateNewQuantity() !== "N/A" && calculateNewQuantity() < 0 
                  ? "bg-red-100 text-red-700" 
                  : "bg-green-100 text-green-700"
              }`}>
                {calculateNewQuantity()}
              </div>
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
                disabled={isSubmitting}
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reason">
                Reason <span className="text-xs text-gray-500">(recommended)</span>
              </Label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Enter reason for adjustment (e.g., Stock count correction, Damaged items found, etc.)"
                disabled={isSubmitting}
                className="w-full p-2 border rounded-md min-h-[80px] resize-none border-gray-200 text-sm ring-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Providing a reason helps with auditing and tracking inventory changes.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adjusting...
                </>
              ) : (
                "Apply Adjustment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
