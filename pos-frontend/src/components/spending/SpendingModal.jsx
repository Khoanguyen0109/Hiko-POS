import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { MdClose, MdSave, MdCancel } from "react-icons/md";
import { createSpending, editSpending } from "../../redux/slices/spendingSlice";
import { formatVND } from "../../utils";
import PropTypes from "prop-types";

const SpendingModal = ({ 
  isOpen, 
  onClose, 
  mode = "create", 
  spending = null, 
  categories = [], 
  vendors = [],
  onSuccess 
}) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    currency: "VND",
    category: "",
    vendor: "",
    vendorName: "",
    paymentStatus: "pending",
    paymentMethod: "cash",
    paymentDate: new Date().toISOString().split('T')[0],
    paymentReference: "",
    receiptNumber: "",
    invoiceNumber: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (spending && mode !== "create") {
      setFormData({
        title: spending.title || "",
        amount: spending.amount?.toString() || "",
        currency: spending.currency || "VND",
        category: spending.category?._id || "",
        vendor: spending.vendor?._id || "",
        vendorName: spending.vendorName || "",
        paymentStatus: spending.paymentStatus || "pending",
        paymentMethod: spending.paymentMethod || "cash",
        paymentDate: spending.paymentDate ? new Date(spending.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentReference: spending.paymentReference || "",
        receiptNumber: spending.receiptNumber || "",
        invoiceNumber: spending.invoiceNumber || ""
      });
    }
  }, [spending, mode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate ? new Date(formData.paymentDate).toISOString() : null
      };

      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === "" || submitData[key] === null) {
          delete submitData[key];
        }
      });

      let result;
      if (mode === "create") {
        result = await dispatch(createSpending(submitData));
      } else {
        result = await dispatch(editSpending({ spendingId: spending._id, ...submitData }));
      }

      if (result.meta.requestStatus === 'fulfilled') {
        onSuccess?.(result.payload.data);
        onClose();
      } else {
        throw new Error(result.payload?.message || `Failed to ${mode} spending record`);
      }
    } catch (err) {
      setError(err.message || err.response?.data?.message || `Failed to ${mode} spending record`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isViewMode = mode === "view";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#262626] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <h2 className="text-xl font-semibold text-[#f5f5f5]">
            {mode === "create" ? "Add New Expense" : 
             mode === "edit" ? "Edit Expense" : "View Expense"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-500 text-white rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#f5f5f5] border-b border-[#343434] pb-2">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  required
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
                  placeholder="Enter expense title"
                />
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  required
                  min="0"
                  step="0.01"
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Categorization */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#f5f5f5] border-b border-[#343434] pb-2">
              Categorization
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  required
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-2">Vendor</label>
                <select
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">Vendor Name (if not in list)</label>
                <input
                  type="text"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
                  placeholder="Enter vendor name"
                />
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#f5f5f5] border-b border-[#343434] pb-2">
              Payment Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-2">Payment Status</label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="check">Check</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">Payment Date</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-2">Payment Reference</label>
                <input
                  type="text"
                  name="paymentReference"
                  value={formData.paymentReference}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
                  placeholder="Transaction ID, Check number, etc."
                />
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">Receipt/Invoice Number</label>
                <input
                  type="text"
                  name="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
                  placeholder="Receipt or invoice number"
                />
              </div>
            </div>
          </div>

          {/* Summary (for view mode) */}
          {isViewMode && formData.amount && (
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#343434]">
              <h3 className="text-lg font-medium text-[#f5f5f5] mb-3">Summary</h3>
              <div className="text-sm">
                <div className="pt-2 border-t border-[#343434]">
                  <span className="text-[#ababab]">Total Amount:</span>
                  <span className="text-[#f6b100] ml-2 font-semibold text-lg">
                    {formatVND(parseFloat(formData.amount))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {!isViewMode && (
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#343434]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-[#1a1a1a] text-[#f5f5f5] rounded-lg hover:bg-[#343434] transition-colors flex items-center gap-2"
              >
                <MdCancel /> Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg hover:bg-[#e5a000] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdSave />
                {loading ? "Saving..." : mode === "create" ? "Create Expense" : "Update Expense"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

SpendingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit", "view"]),
  spending: PropTypes.object,
  categories: PropTypes.array,
  vendors: PropTypes.array,
  onSuccess: PropTypes.func
};

export default SpendingModal;
