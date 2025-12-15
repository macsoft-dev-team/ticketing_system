import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, Package, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import Input from "../../../components/ui/input";
import Select from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import { API_URL } from "../../../lib/constants/api";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useAuth } from "../../../lib/hooks/useAuth";

// MACSOFT roles that can view/manage ALL service centers
const MACSOFT_ROLES = ["MACSOFT_ADMIN", "MACSOFT_HEAD", "MACSOFT_SUPPORT"];

export default function BulkTransactionModal({ 
  open, 
  onClose, 
  onSuccess,
  inventoryData = []
}) {
  const { user, canAccess } = useAuth();
  
  // Transaction header state
  const [transactionType, setTransactionType] = useState('RECEIPT');
  const [centerCode, setCenterCode] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [billNo, setBillNo] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Item form state
  const [currentItem, setCurrentItem] = useState({ productId: '', condition: 'GOOD', quantity: 1 });
  const [items, setItems] = useState([]);
  const [itemErrors, setItemErrors] = useState({});
  
  // Dropdown data
  const [products, setProducts] = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', description: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', description: '' });

  // Check if user is MACSOFT role (can see all centers)
  const isMacsoftRole = canAccess(MACSOFT_ROLES);
  
  // Get user's service center code (for service center technicians)
  const userCenterCode = user?.centerCode || null;

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (open) {
      fetchDropdownData();
      // Reset form
      resetForm();
    }
  }, [open]);

  // Auto-set centerCode for service center technicians
  useEffect(() => {
    if (open && !isMacsoftRole && userCenterCode) {
      setCenterCode(userCenterCode);
    }
  }, [open, isMacsoftRole, userCenterCode]);

  const resetForm = () => {
    setTransactionType('RECEIPT');
    setCenterCode(isMacsoftRole ? '' : userCenterCode || '');
    setInvoiceNo('');
    setBillNo('');
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setTicketId('');
    setRemarks('');
    setItems([]);
    setCurrentItem({ productId: '', condition: 'GOOD', quantity: 1 });
    setItemErrors({});
  };

  const fetchDropdownData = async () => {
    try {
      const [productsRes, centersRes, ticketsRes] = await Promise.all([
        axios.get(`${API_URL}/products`, { withCredentials: true }).catch(() => null),
        axios.get(`${API_URL}/service-centers`, { withCredentials: true }).catch(() => null),
        axios.get(`${API_URL}/tickets?status=OPEN,IN_PROGRESS`, { withCredentials: true }).catch(() => null)
      ]);

      if (productsRes?.data?.products) {
        setProducts(productsRes.data.products);
      } else {
        extractProductsFromInventory();
      }

      if (centersRes?.data?.serviceCenters) {
        setServiceCenters(centersRes.data.serviceCenters);
      } else {
        extractCentersFromInventory();
      }

      if (ticketsRes?.data?.tickets) {
        setTickets(ticketsRes.data.tickets);
      }
    } catch (err) {
      console.error('Failed to fetch dropdown data:', err);
    }
  };

  const extractProductsFromInventory = () => {
    if (!inventoryData.length) return;
    const productMap = new Map();
    inventoryData.forEach(item => {
      if (item.productId && !productMap.has(item.productId)) {
        productMap.set(item.productId, {
          id: item.productId,
          name: item.productname || item.productName,
          productCode: item.productCode
        });
      }
    });
    setProducts(Array.from(productMap.values()));
  };

  const extractCentersFromInventory = () => {
    if (!inventoryData.length) return;
    const centerMap = new Map();
    inventoryData.forEach(item => {
      if (item.centerCode && !centerMap.has(item.centerCode)) {
        centerMap.set(item.centerCode, {
          centerCode: item.centerCode,
          name: item.centerInfo || item.centerName
        });
      }
    });
    setServiceCenters(Array.from(centerMap.values()));
  };

  const showAlert = (title, description) => {
    setAlertDialog({ open: true, title, description });
  };

  const validateItem = () => {
    const errors = {};
    if (!currentItem.productId) errors.productId = 'Product is required';
    if (!currentItem.condition) errors.condition = 'Condition is required';
    if (!currentItem.quantity || currentItem.quantity < 1) errors.quantity = 'Quantity must be at least 1';
    
    // Check for duplicate product+condition combination
    const isDuplicate = items.some(
      item => item.productId === currentItem.productId && item.condition === currentItem.condition
    );
    if (isDuplicate) {
      errors.productId = 'This product with same condition already exists';
    }
    
    setItemErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addItem = () => {
    if (!validateItem()) return;
    
    const selectedProduct = products.find(p => p.id == currentItem.productId);
    
    setItems(prev => [...prev, {
      id: Date.now(),
      productId: currentItem.productId,
      productName: selectedProduct?.name || selectedProduct?.productName || 'Unknown',
      productCode: selectedProduct?.productCode || '',
      condition: currentItem.condition,
      quantity: parseInt(currentItem.quantity)
    }]);
    
    setCurrentItem({ productId: '', condition: 'GOOD', quantity: 1 });
    setItemErrors({});
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      if (field === 'productId') {
        const selectedProduct = products.find(p => p.id == value);
        updatedItem.productName = selectedProduct?.name || selectedProduct?.productName || 'Unknown';
        updatedItem.productCode = selectedProduct?.productCode || '';
      }
      
      return updatedItem;
    }));
  };

  const validateTransaction = () => {
    if (!centerCode) {
      showAlert('Validation Error', 'Please select a service center');
      return false;
    }
    if (items.length === 0) {
      showAlert('Validation Error', 'Please add at least one item to the transaction');
      return false;
    }
    return true;
  };

  const processTransaction = async () => {
    try {
      setIsSubmitting(true);

      const payload = {
        transactionType,
        centerCode,
        invoiceNo: invoiceNo || null,
        billNo: billNo || null,
        receiptDate: transactionType === 'RECEIPT' && receiptDate ? new Date(receiptDate).toISOString() : null,
        deliveryDate: transactionType === 'DELIVERY' && deliveryDate ? new Date(deliveryDate).toISOString() : null,
        ticketId: ticketId ? parseInt(ticketId) : null,
        remarks: remarks || null,
        items: items.map(item => ({
          productId: parseInt(item.productId),
          condition: item.condition,
          quantity: parseInt(item.quantity)
        }))
      };

      const response = await axios.post(`${API_URL}/inventory/transaction`, payload, { 
        withCredentials: true 
      });

      if (response.data.success) {
        showAlert('Success', `Transaction processed successfully. ${items.length} item(s) ${transactionType === 'RECEIPT' ? 'received' : 'delivered'}.`);
        onSuccess?.();
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      const errorMessage = error.response?.data?.message || 'Failed to process transaction';
      showAlert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!validateTransaction()) return;

    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    
    setConfirmDialog({
      open: true,
      title: 'Confirm Transaction',
      description: `Process ${transactionType === 'RECEIPT' ? 'RECEIPT (Stock In)' : 'DELIVERY (Stock Out)'} with ${items.length} item(s), total quantity: ${totalQty}?`,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        processTransaction();
      }
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  // Filter service centers for non-MACSOFT users
  const filteredServiceCenters = isMacsoftRole 
    ? serviceCenters 
    : serviceCenters.filter(c => c.centerCode === userCenterCode);

  // Dropdown options
  const productOptions = [
    { label: 'Select Product', value: '' },
    ...products.map(p => ({
      label: `${p.name || p.productName} ${p.productCode ? `(${p.productCode})` : ''}`,
      value: p.id.toString()
    }))
  ];

  const serviceCenterOptions = [
    { label: 'Select Service Center', value: '' },
    ...filteredServiceCenters.map(c => ({
      label: `${c.name || c.centerName} (${c.centerCode})`,
      value: c.centerCode
    }))
  ];

  const conditionOptions = [
    { label: 'Good', value: 'GOOD' },
    { label: 'Defective', value: 'DEFECTIVE' },
    { label: 'Repairable', value: 'REPAIRABLE' },
    { label: 'Scrap', value: 'SCRAP' }
  ];

  const ticketOptions = [
    { label: 'No Ticket (Optional)', value: '' },
    ...tickets.map(t => ({
      label: `${t.ticketCode} - ${t.title?.substring(0, 30) || 'Untitled'}${t.title?.length > 30 ? '...' : ''}`,
      value: t.id.toString()
    }))
  ];

  const getConditionBadgeClass = (condition) => {
    switch (condition) {
      case 'GOOD': return 'bg-green-100 text-green-800';
      case 'DEFECTIVE': return 'bg-red-100 text-red-800';
      case 'REPAIRABLE': return 'bg-yellow-100 text-yellow-800';
      case 'SCRAP': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden modal-content">
          <DialogHeader>
            <DialogTitle className="uppercase flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory Transaction {isSubmitting && '(Processing...)'}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 overflow-y-auto max-h-[calc(95vh-180px)]">
            {/* Transaction Type Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setTransactionType('RECEIPT')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  transactionType === 'RECEIPT'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
              RECEIPT (Stock In)
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('DELIVERY')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  transactionType === 'DELIVERY'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
              DELIVERY (Stock Out)
              </button>
            </div>

            {/* Transaction Header Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Transaction Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Service Center */}
                <div className="space-y-2">
                  <Label>
                    Service Center <span className="text-red-500">*</span>
                    {!isMacsoftRole && userCenterCode && (
                      <span className="text-xs text-gray-500 ml-2">(Your center)</span>
                    )}
                  </Label>
                  <Select
                    value={centerCode}
                    onChange={(e) => setCenterCode(e.target.value)}
                    options={serviceCenterOptions}
                    disabled={isSubmitting || (!isMacsoftRole && userCenterCode)}
                    direction="down"
                  />
                </div>

                {/* Invoice No (for RECEIPT) */}
                {transactionType === 'RECEIPT' && (
                  <div className="space-y-2">
                    <Label>Invoice No</Label>
                    <Input
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      placeholder="Enter invoice number"
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                {/* Bill No (for DELIVERY) */}
                {transactionType === 'DELIVERY' && (
                  <div className="space-y-2">
                    <Label>Bill No</Label>
                    <Input
                      value={billNo}
                      onChange={(e) => setBillNo(e.target.value)}
                      placeholder="Enter bill number"
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                {/* Receipt Date (for RECEIPT) */}
                {transactionType === 'RECEIPT' && (
                  <div className="space-y-2">
                    <Label>Receipt Date</Label>
                    <Input
                      type="date"
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                {/* Delivery Date (for DELIVERY) */}
                {transactionType === 'DELIVERY' && (
                  <div className="space-y-2">
                    <Label>Delivery Date</Label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                {/* Related Ticket */}
      {/*           <div className="space-y-2">
                  <Label>Related Ticket (Optional)</Label>
                  <Select
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    options={ticketOptions}
                    disabled={isSubmitting}
                    direction="down"
                  />
                </div> */}

                {/* Remarks */}
                <div className="space-y-2 md:col-span-3">
                  <Label>Remarks</Label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter any additional notes or remarks"
                    disabled={isSubmitting}
                    className="w-full p-2 border border-gray-200 rounded-md min-h-[60px] resize-none text-sm"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Add Items Section */}
            <div className="border border-gray-200  rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-4">Add Items</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Product */}
                <div className="space-y-2">
                  <Label>Product <span className="text-red-500">*</span>{itemErrors.productId && (
                    <p className="text-red-500 text-xs">{itemErrors.productId}</p>
                  )}</Label>
                 
                  <Select
                    value={currentItem.productId}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, productId: e.target.value }))}
                    options={productOptions}
                    disabled={isSubmitting}
                    direction="down"
                    className={itemErrors.productId ? 'border-red-500' : ''}
                  />
                 
                </div>

                {/* Condition */}
                <div className="space-y-2">
                  <Label>Condition <span className="text-red-500">*</span></Label>
                  <Select
                    value={currentItem.condition}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, condition: e.target.value }))}
                    options={conditionOptions}
                    disabled={isSubmitting}
                    direction="down"
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label>Quantity <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    disabled={isSubmitting}
                    className={itemErrors.quantity ? 'border-red-500' : ''}
                  />
                  {itemErrors.quantity && (
                    <p className="text-red-500 text-xs">{itemErrors.quantity}</p>
                  )}
                </div>

                {/* Add Button */}
                <Button
                  type="button"
                  onClick={addItem}
                  disabled={isSubmitting}
                  className="h-10"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </div>
            </div>

            {/* Items List */}
            <div className="border rounded-lg border-gray-200 ">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200  rounded-t-lg">
                <h3 className="font-medium text-gray-900">
                  Transaction Items ({items.length})
                </h3>
              </div>
              
              {items.length > 0 ? (
                <div className="overflow-auto max-h-60">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-4 py-2 text-sm font-medium">{item.productName}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{item.productCode || '-'}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getConditionBadgeClass(item.condition)}`}>
                              {item.condition}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                              disabled={isSubmitting}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Remove"
                              disabled={isSubmitting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="4" className="px-4 py-2 text-sm font-medium text-right">Total Quantity:</td>
                        <td className="px-4 py-2 text-sm font-bold">
                          {items.reduce((sum, item) => sum + item.quantity, 0)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  No items added yet. Use the form above to add items.
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {items.length > 0 && (
                <span>
                  {transactionType === 'RECEIPT' ? '📥' : '📤'} {items.length} item(s), 
                  Total: {items.reduce((sum, item) => sum + item.quantity, 0)} units
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || items.length === 0}
                className={transactionType === 'RECEIPT' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  `Process ${transactionType === 'RECEIPT' ? 'Receipt' : 'Delivery'}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        confirmText="Confirm"
        cancelText="Cancel"
      />

      {/* Alert Dialog */}
      <ConfirmDialog
        open={alertDialog.open}
        title={alertDialog.title}
        description={alertDialog.description}
        onConfirm={() => setAlertDialog(prev => ({ ...prev, open: false }))}
        onCancel={() => setAlertDialog(prev => ({ ...prev, open: false }))}
        confirmText="OK"
        cancelText="Close"
      />
    </>
  );
}
