import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdClose, MdSave, MdCancel, MdInventory, MdAttachMoney, MdBusiness } from "react-icons/md";
import { createStorageImportAction, editStorageImport } from "../../redux/slices/storageImportSlice";
import { fetchStorageItems } from "../../redux/slices/storageItemSlice";
import { fetchActiveSuppliers } from "../../redux/slices/supplierSlice";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";

const ImportModal = ({ 
  isOpen, 
  onClose, 
  mode = "create", 
  importRecord = null, 
  onSuccess 
}) => {
  const dispatch = useDispatch();
  const { items: storageItems } = useSelector((state) => state.storageItems);
  const { activeSuppliers } = useSelector((state) => state.suppliers);

  const initialFormData = useMemo(() => ({
    storageItemId: "",
    quantity: 0,
    unitCost: 0,
    supplierId: "",
    supplierInvoice: "",
    notes: ""
  }), []);

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Calculate total cost
  const totalCost = useMemo(() => {
    return (formData.quantity || 0) * (formData.unitCost || 0);
  }, [formData.quantity, formData.unitCost]);

  // Get selected item details
  const selectedItem = useMemo(() => {
    return storageItems.find(item => item._id === formData.storageItemId);
  }, [storageItems, formData.storageItemId]);

  // Get selected supplier details
  const selectedSupplier = useMemo(() => {
    return activeSuppliers.find(supplier => supplier._id === formData.supplierId);
  }, [activeSuppliers, formData.supplierId]);

  useEffect(() => {
    if (isOpen) {
      // Fetch storage items and suppliers when modal opens
      dispatch(fetchStorageItems({ isActive: true }));
      dispatch(fetchActiveSuppliers());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (importRecord && mode !== "create") {
      setFormData({
        storageItemId: importRecord.storageItemId?._id || importRecord.storageItemId || "",
        quantity: importRecord.quantity || 0,
        unitCost: importRecord.unitCost || 0,
        supplierId: importRecord.supplierId?._id || importRecord.supplierId || "",
        supplierInvoice: importRecord.supplierInvoice || "",
        notes: importRecord.notes || ""
      });
    } else if (mode === "create") {
      setFormData(initialFormData);
    }
  }, [importRecord, mode, initialFormData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "quantity" || name === "unitCost" 
        ? (parseFloat(value) || 0) 
        : value
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

    if (!formData.unitCost || formData.unitCost < 0) {
      setError("Unit cost must be a non-negative number");
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        storageItemId: formData.storageItemId,
        quantity: formData.quantity,
        unitCost: formData.unitCost,
        supplierId: formData.supplierId || undefined,
        supplierInvoice: formData.supplierInvoice || undefined,
        notes: formData.notes || undefined
      };

      let result;
      if (mode === "create") {
        result = await dispatch(createStorageImportAction(submitData));
      } else {
        result = await dispatch(editStorageImport({ id: importRecord._id, ...submitData }));
      }

      if (result.meta.requestStatus === 'fulfilled') {
        if (mode === "create") {
          setFormData(initialFormData);
          setError("");
          enqueueSnackbar("Import created successfully!", { variant: "success" });
        } else {
          enqueueSnackbar("Import updated successfully!", { variant: "success" });
        }
        onSuccess?.(result.payload);
        onClose();
      } else {
        throw new Error(result.payload || `Failed to ${mode} import`);
      }
    } catch (err) {
      const errorMsg = err.message || err.response?.data?.message || `Failed to ${mode} import`;
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
            {mode === "create" ? "Create Import" : "Edit Import"}
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
              <p className="text-[#ababab] text-xs mt-1">
                Current stock: {selectedItem.currentStock} {selectedItem.unit} | 
                Average cost: {selectedItem.averageCost?.toLocaleString('vi-VN')} VND
              </p>
            )}
          </div>

          {/* Quantity and Unit Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="bg-transparent flex-1 text-white focus:outline-none"
                  placeholder="0"
                />
                {selectedItem && (
                  <span className="text-[#ababab] ml-2">{selectedItem.unit}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[#ababab] text-sm mb-2">
                Unit Cost (VND) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                <MdAttachMoney className="text-[#ababab] mr-2" size={18} />
                <input
                  type="number"
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="bg-transparent flex-1 text-white focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Total Cost Display (Auto-calculated) */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#343434]">
            <div className="flex items-center justify-between">
              <span className="text-[#ababab] font-medium">Total Cost:</span>
              <span className="text-[#f6b100] text-xl font-bold">
                {totalCost.toLocaleString('vi-VN')} VND
              </span>
            </div>
            <p className="text-[#ababab] text-xs mt-1">
              Auto-calculated: {formData.quantity || 0} × {formData.unitCost || 0}
            </p>
          </div>

          {/* Supplier Selection */}
          <div>
            <label className="block text-[#ababab] text-sm mb-2">
              <MdBusiness className="inline mr-1" size={16} />
              Supplier <span className="text-xs text-[#ababab]">(Optional)</span>
            </label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleInputChange}
                className="bg-transparent flex-1 text-white focus:outline-none"
              >
                <option value="" className="bg-[#1f1f1f]">Select supplier (optional)</option>
                {activeSuppliers.map(supplier => (
                  <option key={supplier._id} value={supplier._id} className="bg-[#1f1f1f]">
                    {supplier.name} {supplier.code ? `(${supplier.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {selectedSupplier && (
              <p className="text-[#ababab] text-xs mt-1">
                {selectedSupplier.email && `Email: ${selectedSupplier.email} | `}
                {selectedSupplier.phone && `Phone: ${selectedSupplier.phone}`}
              </p>
            )}
          </div>

          {/* Supplier Invoice */}
          <div>
            <label className="block text-[#ababab] text-sm mb-2">
              Supplier Invoice Number
            </label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
              <input
                type="text"
                name="supplierInvoice"
                value={formData.supplierInvoice}
                onChange={handleInputChange}
                className="bg-transparent flex-1 text-white focus:outline-none"
                placeholder="Invoice number (optional)"
              />
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
                placeholder="Additional notes"
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
              disabled={loading || !formData.storageItemId || !formData.quantity || !formData.unitCost}
              className="px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg hover:bg-[#e5a000] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <MdSave />
              {loading ? "Saving..." : mode === "create" ? "Create Import" : "Update Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ImportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit"]),
  importRecord: PropTypes.object,
  onSuccess: PropTypes.func
};

export default ImportModal;
