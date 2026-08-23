import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdSave, MdCancel, MdInventory, MdInfo } from "react-icons/md";
import BottomSheet from "../shared/BottomSheet";
import Autocomplete from "../shared/Autocomplete";
import {
  buildStorageItemOptions,
  filterStorageItemOption,
  renderStorageItemOption,
} from "./storageItemAutocompleteUtils";
import { createStorageExportAction, editStorageExport } from "../../redux/slices/storageExportSlice";
import { fetchStorageItems } from "../../redux/slices/storageItemSlice";
import { fetchAllStores } from "../../redux/slices/storeSlice";
import RelatedStoreSelect from "./RelatedStoreSelect";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";

const EXPORT_REASONS = [
  { value: "production", label: "Production" },
  { value: "to_store", label: "To Store" },
];

const DEFAULT_EXPORT_REASON = "production";

const ExportModal = ({ 
  isOpen, 
  onClose, 
  mode = "create", 
  exportRecord = null, 
  onSuccess 
}) => {
  const dispatch = useDispatch();
  const { items: storageItems } = useSelector((state) => state.storageItems);
  const { allStores, activeStore } = useSelector((state) => state.store);

  const initialFormData = useMemo(() => ({
    storageItemId: "",
    quantity: 0,
    reason: DEFAULT_EXPORT_REASON,
    destinationStore: "",
    notes: ""
  }), []);

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get selected item details
  const selectedItem = useMemo(() => {
    return storageItems.find(item => item._id === formData.storageItemId);
  }, [storageItems, formData.storageItemId]);

  const storageItemOptions = useMemo(
    () => buildStorageItemOptions(storageItems.filter((item) => item.isActive)),
    [storageItems]
  );

  const otherStores = useMemo(
    () => (allStores || []).filter(
      (store) => store.isActive !== false && store._id !== activeStore?._id
    ),
    [allStores, activeStore]
  );

  const isToStore = formData.reason === "to_store";

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchStorageItems({ isActive: true }));
      dispatch(fetchAllStores());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (exportRecord && mode !== "create") {
      const validReason = EXPORT_REASONS.some((r) => r.value === exportRecord.reason)
        ? exportRecord.reason
        : DEFAULT_EXPORT_REASON;

      setFormData({
        storageItemId: exportRecord.storageItemId?._id || exportRecord.storageItemId || "",
        quantity: exportRecord.quantity || 0,
        reason: validReason,
        destinationStore: exportRecord.destinationStore?._id || exportRecord.destinationStore || "",
        notes: exportRecord.notes || ""
      });
    } else if (mode === "create") {
      setFormData(initialFormData);
    }
  }, [exportRecord, mode, initialFormData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === "reason" && value !== "to_store") {
        return { ...prev, reason: value, destinationStore: "" };
      }
      return {
        ...prev,
        [name]: name === "quantity" ? (parseFloat(value) || 0) : value
      };
    });
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

    if (formData.reason === "to_store" && !formData.destinationStore) {
      setError("Please select the destination store");
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
        destinationStore: formData.reason === "to_store" ? formData.destinationStore : undefined,
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

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create Export" : "Edit Export"}
      size="lg"
      bodyClassName="p-4 sm:p-6"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-500 bg-red-500/20 p-4 text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Storage Item Selection */}
          <div>
            <label className="block text-[#ababab] text-sm mb-2">
              <MdInventory className="inline mr-1" size={16} />
              Storage Item <span className="text-red-500">*</span>
            </label>
            <Autocomplete
              name="storageItemId"
              value={formData.storageItemId}
              onChange={handleInputChange}
              options={storageItemOptions}
              placeholder="Search storage item by name or code..."
              filterOption={filterStorageItemOption}
              renderOption={renderStorageItemOption}
              required
              noOptionsText="No storage items found"
            />
            {selectedItem && (
              <div className="mt-2 p-3 bg-[#1a1a1a] rounded-lg border border-[#343434]">
                <div className="flex items-center gap-2 text-sm">
                  <MdInfo className="text-brand" size={16} />
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
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-brand">
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
            <div className="rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-brand">
              <select
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                className="bg-transparent w-full text-white focus:outline-none"
              >
                {EXPORT_REASONS.map(({ value, label }) => (
                  <option key={value} value={value} className="bg-[#1f1f1f]">
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isToStore && (
            <RelatedStoreSelect
              name="destinationStore"
              value={formData.destinationStore}
              onChange={handleInputChange}
              stores={otherStores}
              label="Destination Store"
              placeholder="Select destination store"
            />
          )}

          {/* Notes */}
          <div>
            <label className="block text-[#ababab] text-sm mb-2">
              Notes
            </label>
            <div className="rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-brand">
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
              disabled={loading || !formData.storageItemId || !formData.quantity || (isToStore && !formData.destinationStore) || (selectedItem && formData.quantity > selectedItem.currentStock)}
              className="px-6 py-2 bg-brand text-[#f5f5f5] rounded-lg hover:bg-brand-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <MdSave />
              {loading ? "Saving..." : mode === "create" ? "Create Export" : "Update Export"}
            </button>
          </div>
        </form>
    </BottomSheet>
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
