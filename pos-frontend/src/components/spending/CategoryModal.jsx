import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { MdClose, MdSave, MdCancel, MdColorLens } from "react-icons/md";
import { createSpendingCategory, editSpendingCategory } from "../../redux/slices/spendingSlice";
import PropTypes from "prop-types";

const CategoryModal = ({ 
  isOpen, 
  onClose, 
  mode = "create", 
  category = null, 
  onSuccess 
}) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Predefined color options
  const colorOptions = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#F97316", // Orange
    "#06B6D4", // Cyan
    "#84CC16", // Lime
    "#EC4899", // Pink
    "#6366F1", // Indigo
    "#14B8A6", // Teal
    "#F43F5E", // Rose
    "#64748B", // Slate
    "#7C3AED", // Violet
    "#6B7280"  // Gray
  ];

  useEffect(() => {
    if (category && mode !== "create") {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        color: category.color || "#3B82F6",
        isActive: category.isActive !== undefined ? category.isActive : true
      });
    }
  }, [category, mode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let result;
      if (mode === "create") {
        result = await dispatch(createSpendingCategory(formData));
      } else {
        result = await dispatch(editSpendingCategory({ categoryId: category._id, ...formData }));
      }

      if (result.meta.requestStatus === 'fulfilled') {
        onSuccess?.(result.payload);
        onClose();
      } else {
        throw new Error(result.payload?.message || `Failed to ${mode} category`);
      }
    } catch (err) {
      setError(err.message || err.response?.data?.message || `Failed to ${mode} category`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isViewMode = mode === "view";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#262626] rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <h2 className="text-xl font-semibold text-[#f5f5f5]">
            {mode === "create" ? "Add New Category" : 
             mode === "edit" ? "Edit Category" : "View Category"}
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
          <div>
            <label className="block text-[#ababab] text-sm mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isViewMode}
              required
              className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="block text-[#ababab] text-sm mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isViewMode}
              rows={3}
              className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
              placeholder="Enter category description"
            />
          </div>

          <div>
            <label className="block text-[#ababab] text-sm mb-2">
              <MdColorLens className="inline mr-1" />
              Color
            </label>
            <div className="space-y-3">
              {/* Color Preview */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-[#343434]"
                  style={{ backgroundColor: formData.color }}
                ></div>
                <span className="text-[#f5f5f5] font-medium">{formData.color}</span>
              </div>

              {/* Color Options */}
              {!isViewMode && (
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color 
                          ? "border-[#f6b100] scale-110" 
                          : "border-[#343434] hover:border-[#ababab]"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}

              {/* Custom Color Input */}
              {!isViewMode && (
                <div>
                  <label className="block text-[#ababab] text-xs mb-1">Custom Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    className="w-full h-10 bg-[#1a1a1a] border border-[#343434] rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

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
              Active Category
            </label>
          </div>

          {/* Preview */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#343434]">
            <h3 className="text-[#f5f5f5] font-medium mb-2">Preview</h3>
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: formData.color }}
              ></div>
              <div>
                <p className="text-[#f5f5f5] font-medium">
                  {formData.name || "Category Name"}
                </p>
                {formData.description && (
                  <p className="text-[#ababab] text-sm">{formData.description}</p>
                )}
              </div>
              <span className={`ml-auto px-2 py-1 rounded text-xs font-medium ${
                formData.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
              }`}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
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
                disabled={loading}
                className="px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg hover:bg-[#e5a000] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdSave />
                {loading ? "Saving..." : mode === "create" ? "Create Category" : "Update Category"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

CategoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit", "view"]),
  category: PropTypes.object,
  onSuccess: PropTypes.func
};

export default CategoryModal;
