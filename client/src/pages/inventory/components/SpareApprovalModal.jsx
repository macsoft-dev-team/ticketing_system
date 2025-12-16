import { useState } from "react";
import { X, CheckCircle, XCircle, AlertCircle, Package } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../../api";
import {Button} from "../../../components/ui/button";

/**
 * SPARE APPROVAL MODAL
 * 
 * For CUSTOMER_SERVICE_HEAD / MACSOFT_HEAD to approve spare requests
 * Auto-deducts inventory on approval
 */
export default function SpareApprovalModal({ open, onClose, onSuccess, spareRequest }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [approvalItems, setApprovalItems] = useState([]);

  // Initialize approval items when modal opens
  useState(() => {
    if (spareRequest?.spareItems) {
      setApprovalItems(
        spareRequest.spareItems.map((item) => ({
          ...item,
          approved: true,
        }))
      );
    }
  }, [spareRequest]);

  const toggleItemApproval = (itemId) => {
    setApprovalItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, approved: !item.approved } : item
      )
    );
  };

  const handleApprove = async () => {
    setError("");
    const approvedItems = approvalItems.filter((item) => item.approved);

    if (approvedItems.length === 0) {
      setError("At least one item must be approved");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_URL}/inventory-transactions/spare-approval`,
        {
          spareRequestId: spareRequest.id,
          approvedItems,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        onSuccess?.();
        handleClose();
      }
    } catch (err) {
      console.error("Failed to approve spare request:", err);
      setError(
        err.response?.data?.message || "Failed to approve spare request"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);

      // Update spare request status to REJECTED
      await axios.put(
        `${API_URL}/spare-requests/${spareRequest.id}`,
        {
          status: "REJECTED",
        },
        { withCredentials: true }
      );

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Failed to reject spare request:", err);
      setError(
        err.response?.data?.message || "Failed to reject spare request"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    setApprovalItems([]);
    onClose();
  };

  if (!open || !spareRequest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Approve Spare Request</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ticket: {spareRequest.ticketCode} | Status: {spareRequest.status}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Requested Items
            </label>

            {approvalItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 border rounded-md ${
                  item.approved
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={item.approved}
                    onChange={() => toggleItemApproval(item.id)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.product?.name || "Unknown Product"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Code: {item.product?.productCode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-semibold text-gray-900">
                      {item.quantity}
                    </p>
                  </div>
                  {item.approved ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Approving will automatically deduct GOOD inventory from the
                    assigned service center
                  </li>
                  <li>
                    Ensure sufficient inventory is available before approval
                  </li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReject}
              disabled={loading}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Reject"}
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Approve & Deduct Inventory"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
