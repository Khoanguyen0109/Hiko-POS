import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { MdClose, MdSave, MdCancel, MdInventory, MdCategory, MdScale, MdTrendingUp } from "react-icons/md";
import { createStorageItemAction, editStorageItem } from "../../redux/slices/storageItemSlice";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";

const UNIT_OPTIONS = ['kg', 'g', 'liter', 'ml', 'piece', 'pack', 'box', 'bag'];

const StorageItemModal = ({ 
  isOpen, 
  onClose, 
  mode = "create", 
  item = null, 
  onSuccess 
}) => {
  const dispatch = useDispatch();
  const initialFormData = useMemo(() => ({
    name: "",
    code: "",
    description: "",
    category: "Ingredient",
    unit: "kg",
    minStock: 0,
    maxStock: 1000,
    averageCost: 0,
    lastPurchaseCost: 0,
    isActive: true
  }), []);

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item && mode !== "create") {
      setFormData({
        name: item.name || "",
        code: item.code || "",
        description: item.description || "",
        category: item.category || "Ingredient",
        unit: item.unit || "kg",
        minStock: item.minStock || 0,
        maxStock: item.maxStock || 1000,
        averageCost: item.averageCost || 0,
        lastPurchaseCost: item.lastPurchaseCost || 0,
        isActive: item.isActive !== undefined ? item.isActive : true
      });
    } else if (mode === "create") {
      setFormData(initialFormData);
    }
  }, [item, mode, initialFormData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (type === "number" ? parseFloat(value) || 0 : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Item name is required");
      setLoading(false);
      return;
    }

    if (!formData.code.trim()) {
      setError("Item code is required");
      setLoading(false);
      return;
    }

    if (formData.maxStock < formData.minStock) {
      setError("Max stock must be greater than or equal to min stock");
      setLoading(false);
      return;
    }

    try {
      const submitData = { ...formData };
      
      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === "" || submitData[key] === null) {
          delete submitData[key];
        }
      });

      let result;
      if (mode === "create") {
        result = await dispatch(createStorageItemAction(submitData));
      } else {
        result = await dispatch(editStorageItem({ id: item._id, ...submitData }));
      }

      if (result.meta.requestStatus === 'fulfilled') {
        if (mode === "create") {
          setFormData(initialFormData);
          setError("");
          enqueueSnackbar("Storage item created successfully!", { variant: "success" });
        } else {
          enqueueSnackbar("Storage item updated successfully!", { variant: "success" });
        }
        onSuccess?.(result.payload);
        onClose();
      } else {
        throw new Error(result.payload || `Failed to ${mode} storage item`);
      }
    } catch (err) {
      const errorMsg = err.message || err.response?.data?.message || `Failed to ${mode} storage item`;
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isViewMode = mode === "view";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#262626] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <h2 className="text-xl font-semibold text-[#f5f5f5]">
            {mode === "create" ? "Add New Storage Item" : 
             mode === "edit" ? "Edit Storage Item" : "View Storage Item"}
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
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#f5f5f5] border-b border-[#343434] pb-2 flex items-center gap-2">
              <MdInventory /> Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                  <MdInventory className="text-[#ababab] mr-2" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    required
                    className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50"
                    placeholder="Enter item name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Item Code <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    required
                    className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50 uppercase"
                    placeholder="ITEM-001"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  <MdCategory className="inline mr-1" size={16} />
                  Category
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50"
                    placeholder="Ingredient"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  <MdScale className="inline mr-1" size={16} />
                  Unit <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    required
                    className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50"
                  >
                    {UNIT_OPTIONS.map(unit => (
                      <option key={unit} value={unit} className="bg-[#1f1f1f]">
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#ababab] text-sm mb-2">
                Description
              </label>
              <div className="rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  rows="2"
                  className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50 resize-none w-full"
                  placeholder="Item description"
                />
              </div>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#f5f5f5] border-b border-[#343434] pb-2 flex items-center gap-2">
              <MdTrendingUp /> Stock Levels
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Min Stock
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                  <input
                    type="number"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    min="0"
                    step="0.01"
                    className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Max Stock
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                  <input
                    type="number"
                    name="maxStock"
                    value={formData.maxStock}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    min="0"
                    step="0.01"
                    className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50"
                    placeholder="1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Current Stock
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] opacity-50">
                  <input
                    type="number"
                    value={item?.currentStock || 0}
                    disabled
                    className="bg-transparent flex-1 text-white focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <p className="text-[#ababab] text-xs mt-1">Auto-updated on import/export</p>
              </div>
            </div>
          </div>

          {/* Cost Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#f5f5f5] border-b border-[#343434] pb-2 flex items-center gap-2">
              <MdTrendingUp /> Cost Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Average Cost
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                  <input
                    type="number"
                    name="averageCost"
                    value={formData.averageCost}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    min="0"
                    step="0.01"
                    className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50"
                    placeholder="0"
                  />
                </div>
                <p className="text-[#ababab] text-xs mt-1">Auto-calculated on import</p>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Last Purchase Cost
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                  <input
                    type="number"
                    name="lastPurchaseCost"
                    value={formData.lastPurchaseCost}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    min="0"
                    step="0.01"
                    className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50"
                    placeholder="0"
                  />
                </div>
                <p className="text-[#ababab] text-xs mt-1">Updated on import</p>
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <label className="flex items-center text-[#ababab] text-sm">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                disabled={isViewMode}
                className="mr-2 rounded focus:ring-[#f6b100] focus:ring-2"
              />
              Active Item
            </label>
          </div>

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
                disabled={loading || !formData.name.trim() || !formData.code.trim()}
                className="px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg hover:bg-[#e5a000] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <MdSave />
                {loading ? "Saving..." : mode === "create" ? "Create Item" : "Update Item"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

StorageItemModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit", "view"]),
  item: PropTypes.object,
  onSuccess: PropTypes.func
};

export default StorageItemModal;
