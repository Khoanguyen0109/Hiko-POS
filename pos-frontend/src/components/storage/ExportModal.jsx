import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdClose, MdSave, MdCancel, MdInventory, MdInfo } from "react-icons/md";
import { createStorageExportAction, editStorageExport } from "../../redux/slices/storageExportSlice";
import { fetchStorageItems } from "../../redux/slices/storageItemSlice";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";

const REASON_OPTIONS = [
  { value: 'production', label: 'Production' },
  { value: 'waste', label: 'Waste' },
  { value: 'damage', label: 'Damage' },
  { value: 'theft', label: 'Theft' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'other', label: 'Other' }
];

const ExportModal = ({ 
  isOpen, 
  onClose, 
  mode = "create", 
  exportRecord = null, 
  onSuccess 
}) => {
  const dispatch = useDispatch();
  const { items: storageItems } = useSelector((state) => state.storageItems);

  const initialFormData = useMemo(() => ({
    storageItemId: "",
    quantity: 0,
    reason: "production",
    notes: ""
  }), []);

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get selected item details
  const selectedItem = useMemo(() => {
    return storageItems.find(item => item._id === formData.storageItemId);
  }, [storageItems, formData.storageItemId]);

  useEffect(() => {
    if (isOpen) {
      // Fetch storage items when modal opens
      dispatch(fetchStorageItems({ isActive: true }));
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (exportRecord && mode !== "create") {
      setFormData({
        storageItemId: exportRecord.storageItemId?._id || exportRecord.storageItemId || "",
        quantity: exportRecord.quantity || 0,
        reason: exportRecord.reason || "production",
        notes: exportRecord.notes || ""
      });
    } else if (mode === "create") {
      setFormData(initialFormData);
    }
  }, [exportRecord, mode, initialFormData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "quantity" ? (parseFloat(value) || 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.storageItemId) {
      setError("Please select a storage item");
      setLoading(false);
      return;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      setError("Quantity must be greater than 0");
      setLoading(false);
      return;
    }

    // Check stock availability
    if (selectedItem && formData.quantity > selectedItem.currentStock) {
      setError(`Insufficient stock. Available: ${selectedItem.currentStock} ${selectedItem.unit}`);
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        storageItemId: formData.storageItemId,
        quantity: formData.quantity,
        reason: formData.reason,
        notes: formData.notes || undefined
      };

      let result;
      if (mode === "create") {
        result = await dispatch(createStorageExportAction(submitData));
      } else {
        result = await dispatch(editStorageExport({ id: exportRecord._id, ...submitData }));
      }

      if (result.meta.requestStatus === 'fulfilled') {
        if (mode === "create") {
          setFormData(initialFormData);
          setError("");
          enqueueSnackbar("Export created successfully!", { variant: "success" });
        } else {
          enqueueSnackbar("Export updated successfully!", { variant: "success" });
        }
        onSuccess?.(result.payload);
        onClose();
      } else {
        throw new Error(result.payload || `Failed to ${mode} export`);
      }
    } catch (err) {
      const errorMsg = err.message || err.response?.data?.message || `Failed to ${mode} export`;
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeStorageItems = storageItems.filter(item => item.isActive);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#262626] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <h2 className="text-xl font-semibold text-[#f5f5f5]">
            {mode === "create" ? "Create Export" : "Edit Export"}
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
          <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Storage Item Selection */}
          <div>
            <label className="block text-[#ababab] text-sm mb-2">
              <MdInventory className="inline mr-1" size={16} />
              Storage Item <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
              <select
                name="storageItemId"
                value={formData.storageItemId}
                onChange={handleInputChange}
                required
                className="bg-transparent flex-1 text-white focus:outline-none"
              >
                <option value="" className="bg-[#1f1f1f]">Select storage item</option>
                {activeStorageItems.map(item => (
                  <option key={item._id} value={item._id} className="bg-[#1f1f1f]">
                    {item.name} ({item.code}) - Stock: {item.currentStock} {item.unit}
                  </option>
                ))}
              </select>
            </div>
            {selectedItem && (
              <div className="mt-2 p-3 bg-[#1a1a1a] rounded-lg border border-[#343434]">
                <div className="flex items-center gap-2 text-sm">
                  <MdInfo className="text-[#f6b100]" size={16} />
                  <span className="text-[#ababab]">
                    Current stock: <span className="text-[#f5f5f5] font-semibold">
                      {selectedItem.currentStock} {selectedItem.unit}
                    </span>
                  </span>
                </div>
                {selectedItem.currentStock <= selectedItem.minStock && (
                  <div className="mt-2 text-xs text-yellow-400">
                    ⚠️ Low stock alert! Current stock is at or below minimum ({selectedItem.minStock} {selectedItem.unit})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[#ababab] text-sm mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                max={selectedItem?.currentStock || undefined}
                className="bg-transparent flex-1 text-white focus:outline-none"
                placeholder="0"
              />
              {selectedItem && (
                <span className="text-[#ababab] ml-2">{selectedItem.unit}</span>
              )}
            </div>
            {selectedItem && formData.quantity > 0 && (
              <p className="text-[#ababab] text-xs mt-1">
                Remaining stock after export: {Math.max(0, selectedItem.currentStock - formData.quantity)} {selectedItem.unit}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[#ababab] text-sm mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
              <select
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                className="bg-transparent flex-1 text-white focus:outline-none"
              >
                {REASON_OPTIONS.map(reason => (
                  <option key={reason.value} value={reason.value} className="bg-[#1f1f1f]">
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[#ababab] text-sm mb-2">
              Notes
            </label>
            <div className="rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="bg-transparent flex-1 text-white focus:outline-none resize-none w-full"
                placeholder="Additional notes about this export"
              />
            </div>
          </div>

          {/* Actions */}
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
              disabled={loading || !formData.storageItemId || !formData.quantity || (selectedItem && formData.quantity > selectedItem.currentStock)}
              className="px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg hover:bg-[#e5a000] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <MdSave />
              {loading ? "Saving..." : mode === "create" ? "Create Export" : "Update Export"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ExportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit"]),
  exportRecord: PropTypes.object,
  onSuccess: PropTypes.func
};

export default ExportModal;
