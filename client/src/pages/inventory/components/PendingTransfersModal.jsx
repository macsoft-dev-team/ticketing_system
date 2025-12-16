import { useState, useEffect } from "react";
import { X, Package, CheckCircle, AlertCircle } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../../lib/constants/api";
import {Button} from "../../../components/ui/button";
import ReusableTable from "../../../components/ui/reusableTable";

/**
 * PENDING TRANSFERS LIST & RECEIVE MODAL
 * 
 * For SSC to view and receive pending transfers from MACSOFT
 */
export default function PendingTransfersModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetchPendingTransfers();
    }
  }, [open]);

  const fetchPendingTransfers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/inventory-transactions/transfer/pending`,
        {
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setTransfers(res.data.transfers);
      }
    } catch (err) {
      console.error("Failed to fetch pending transfers:", err);
      setError("Failed to load pending transfers");
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (transferId) => {
    setError("");
    try {
      setReceiving(true);

      const res = await axios.post(
        `${API_URL}/inventory-transactions/transfer/receive`,
        {
          transactionId: transferId,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        onSuccess?.();
        fetchPendingTransfers(); // Refresh list
        setSelectedTransfer(null);
      }
    } catch (err) {
      console.error("Failed to receive transfer:", err);
      setError(
        err.response?.data?.message || "Failed to receive transfer"
      );
    } finally {
      setReceiving(false);
    }
  };

  const handleClose = () => {
    setSelectedTransfer(null);
    setError("");
    onClose();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConditionBadge = (condition) => {
    const colors = {
      GOOD: "bg-green-100 text-green-800",
      DEFECTIVE: "bg-red-100 text-red-800",
      REPAIRABLE: "bg-yellow-100 text-yellow-800",
      SCRAP: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-sm text-xs font-medium ${colors[condition]}`}
      >
        {condition}
      </span>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Pending Transfers</h2>
            <p className="text-sm text-gray-500 mt-1">
              {transfers.length} transfer(s) waiting to be received
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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No pending transfers</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        From: {transfer.fromCenter?.name} (
                        {transfer.fromCenterCode})
                      </p>
                      <p className="text-sm text-gray-500">
                        Dispatched: {formatDate(transfer.createdAt)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleReceive(transfer.id)}
                      disabled={receiving}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {receiving ? "Receiving..." : "Receive Transfer"}
                    </Button>
                  </div>

                  <div className="p-4">
                    <table className="w-full border border-gray-200">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-700 *:px-2">
                          <th className="text-left py-2 text-sm font-medium text-white">
                            Product
                          </th>
                          <th className="text-left py-2 text-sm font-medium text-white">
                            Code
                          </th>
                          <th className="text-center py-2 text-sm font-medium text-white">
                            Condition
                          </th>
                          <th className="text-center py-2 text-sm font-medium text-white">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {transfer.items?.map((item) => (
                          <tr key={item.id} className="border-b border-gray-200 last:border-b-0 *:px-2">
                            <td className="py-2 text-sm">
                              {item.product?.name || "Unknown"}
                            </td>
                            <td className="py-2 text-sm text-gray-500">
                              {item.product?.productCode || "-"}
                            </td>
                            <td className="py-2 text-center">
                              {getConditionBadge(item.condition)}
                            </td>
                            <td className="py-2 text-center font-medium">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {transfer.remarks && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Remarks:</span>{" "}
                          {transfer.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Note:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Receiving a transfer will add items to your service center
                    inventory
                  </li>
                  <li>Verify items physically before accepting</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
