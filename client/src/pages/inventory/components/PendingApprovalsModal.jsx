import { useState, useEffect } from "react";
import { X, Check, XCircle, AlertCircle, Package } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../../lib/constants/api";
import { Button } from "../../../components/ui/button";

/**
 * PENDING APPROVALS MODAL
 * For MACSOFT_ADMIN / MACSOFT_HEAD to approve/reject SSC transfer requests
 */
export default function PendingApprovalsModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPendingApprovals();
    }
  }, [open]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/inventory-transactions/history?status=PENDING_APPROVAL`,
        { withCredentials: true }
      );

      if (res.data.success) {
        setRequests(res.data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch pending approvals:", err);
      setError("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transactionId) => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.post(
        `${API_URL}/inventory-transactions/transfer/approve`,
        { transactionId },
        { withCredentials: true }
      );

      if (res.data.success) {
        await fetchPendingApprovals();
        onSuccess?.();
      }
    } catch (err) {
      console.error("Failed to approve transfer:", err);
      setError(err.response?.data?.message || "Failed to approve transfer");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(
        `${API_URL}/inventory-transactions/transfer/reject`,
        {
          transactionId: selectedRequest.id,
          rejectionReason,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        setShowRejectDialog(false);
        setSelectedRequest(null);
        setRejectionReason("");
        await fetchPendingApprovals();
        onSuccess?.();
      }
    } catch (err) {
      console.error("Failed to reject transfer:", err);
      setError(err.response?.data?.message || "Failed to reject transfer");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedRequest(null);
    setRejectionReason("");
    setError("");
    setShowRejectDialog(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Pending Transfer Approvals</h2>
            <p className="text-sm text-gray-500 mt-1">
              Review and approve transfer requests from service centers
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {loading && requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Loading pending approvals...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No pending approval requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="bg-yellow-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Transfer Request #{request.id}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        From <span className="font-semibold text-pink-500">{request.fromCenter?.name}</span> → 
                        To <span className="font-semibold text-emerald-600">{request.toCenter?.name}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Requested by {request.createdByUser?.name} on{" "}
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectDialog(true);
                        }}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                          Product
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">
                          Condition
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {request.items?.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <p className="font-medium text-gray-900">
                                {item.product?.name || item.productName || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.product?.productCode}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {item.condition}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-semibold text-gray-900">
                              {item.quantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Remarks */}
                  {request.remarks && (
                    <div className="bg-gray-50 px-4 py-3 border-t">
                      <p className="text-xs font-medium text-gray-600">Remarks:</p>
                      <p className="text-sm text-gray-700 mt-1">{request.remarks}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Reject Transfer Request</h3>
            
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedRequest(null);
                  setRejectionReason("");
                  setError("");
                }}
                disabled={loading}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
