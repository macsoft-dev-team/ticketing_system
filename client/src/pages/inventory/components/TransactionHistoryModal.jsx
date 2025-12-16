import { useState, useEffect } from "react";
import { X, Calendar, Package, ArrowRight, Filter } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../../lib/constants/api";
import {Button} from "../../../components/ui/button";
import Select from "../../../components/ui/select";
import ReusableTable from "../../../components/ui/reusableTable";

/**
 * TRANSACTION HISTORY MODAL
 * 
 * View all inventory transactions with filtering
 */
export default function TransactionHistoryModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    transactionType: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const transactionTypes = [
    { label: "All Types", value: "" },
    { label: "Receipt", value: "RECEIPT" },
    { label: "Delivery", value: "DELIVERY" },
    { label: "Return", value: "RETURN" },
    { label: "Ticket Issue", value: "TICKET_ISSUE" },
    { label: "Transfer", value: "TRANSFER" },
    { label: "Adjustment", value: "ADJUSTMENT" },
  ];

  const statuses = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Received", value: "RECEIVED" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  useEffect(() => {
    if (open) {
      fetchTransactions();
    }
  }, [open, filters, currentPage]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.transactionType) params.append("transactionType", filters.transactionType);
      if (filters.status) params.append("status", filters.status);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("skip", ((currentPage - 1) * 20).toString());
      params.append("take", "20");

      const res = await axios.get(
        `${API_URL}/inventory-transactions/history?${params.toString()}`,
        {
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setTransactions(res.data.transactions);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      transactionType: "",
      status: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
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

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      RECEIVED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-sm text-xs font-medium ${colors[status]}`}
      >
        {status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const colors = {
      RECEIPT: "bg-green-100 text-green-800",
      DELIVERY: "bg-blue-100 text-blue-800",
      RETURN: "bg-purple-100 text-purple-800",
      TICKET_ISSUE: "bg-orange-100 text-orange-800",
      TRANSFER: "bg-indigo-100 text-indigo-800",
      ADJUSTMENT: "bg-gray-100 text-gray-800",
    };
    const labels = {
      RECEIPT: "Receipt",
      DELIVERY: "Delivery",
      RETURN: "Return",
      TICKET_ISSUE: "Ticket Issue",
      TRANSFER: "Transfer",
      ADJUSTMENT: "Adjustment",
    };
    return (
      <span
        className={`px-2 py-1 rounded-sm text-xs font-medium ${colors[type]}`}
      >
        {labels[type]}
      </span>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Transaction History</h2>
            <p className="text-sm text-gray-500 mt-1">
              View all inventory transactions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Transaction Type
                </label>
                <Select
                  value={filters.transactionType}
                  onChange={(e) =>
                    handleFilterChange("transactionType", e.target.value)
                  }
                  options={transactionTypes}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Status
                </label>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  options={statuses}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={clearFilters}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        {getTypeBadge(transaction.transactionType)}
                      </div>
                      <div>
                        {getStatusBadge(transaction.status)}
                      </div>
                      {transaction.transactionType === "TRANSFER" && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{transaction.fromCenter?.name}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span>{transaction.toCenter?.name}</span>
                        </div>
                      )}
                      {transaction.ticket && (
                        <div className="text-sm text-gray-600">
                          Ticket: {transaction.ticket.ticketCode}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>

                  <div className="p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-medium text-gray-700">
                            Product
                          </th>
                          <th className="text-center py-2 font-medium text-gray-700">
                            Condition
                          </th>
                          <th className="text-center py-2 font-medium text-gray-700">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaction.items?.map((item) => (
                          <tr key={item.id} className="border-b last:border-b-0">
                            <td className="py-2">
                              {item.product?.name || item.productName || "Unknown"}
                            </td>
                            <td className="py-2 text-center">
                              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                                {item.condition}
                              </span>
                            </td>
                            <td className="py-2 text-center font-medium">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {transaction.remarks && (
                      <div className="mt-3 pt-3 border-t text-sm">
                        <span className="font-medium text-gray-700">Remarks:</span>{" "}
                        <span className="text-gray-600">{transaction.remarks}</span>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Created by: {transaction.createdByUser?.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
