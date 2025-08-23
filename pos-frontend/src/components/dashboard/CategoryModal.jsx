import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { MdCategory, MdColorLens } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { createCategory, editCategory } from "../../redux/slices/categorySlice";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";

// Predefined color options for categories
const COLOR_OPTIONS = [
  { name: "Red", value: "#b73e3e" },
  { name: "Purple", value: "#5b45b0" },
  { name: "Magenta", value: "#7f167f" },
  { name: "Brown", value: "#735f32" },
  { name: "Navy", value: "#1d2569" },
  { name: "Green", value: "#285430" },
  { name: "Yellow", value: "#f6b100" },
  { name: "Blue", value: "#025cca" },
  { name: "Crimson", value: "#be3e3f" },
  { name: "Lime", value: "#02ca3a" },
];

const CategoryModal = ({ setIsCategoryModalOpen, editingCategory }) => {
  const dispatch = useDispatch();
  const { loading: categoryLoading } = useSelector((state) => state.categories);

  const [categoryData, setCategoryData] = useState({
    name: "",
    description: "",
    color: COLOR_OPTIONS[0].value,
    isActive: true,
  });

  // Initialize form with editing data
  useEffect(() => {
    if (editingCategory) {
      setCategoryData({
        name: editingCategory.name || "",
        description: editingCategory.description || "",
        color: editingCategory.color || COLOR_OPTIONS[0].value,
        isActive: editingCategory.isActive !== undefined ? editingCategory.isActive : true,
      });
    }
  }, [editingCategory]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleColorSelect = (color) => {
    setCategoryData((prev) => ({ ...prev, color }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!categoryData.name.trim()) {
      enqueueSnackbar("Category name is required", { variant: "error" });
      return;
    }

    if (categoryData.name.trim().length < 2) {
      enqueueSnackbar("Category name must be at least 2 characters", {
        variant: "error",
      });
      return;
    }

    // Prepare data for submission
    const submitData = {
      name: categoryData.name.trim(),
      description: categoryData.description.trim() || "",
      color: categoryData.color,
      isActive: categoryData.isActive,
    };

    try {
      let resultAction;
      
      if (editingCategory) {
        // Edit existing category
        resultAction = await dispatch(editCategory({ 
          id: editingCategory._id, 
          categoryData: submitData 
        }));
        
        if (editCategory.fulfilled.match(resultAction)) {
          setIsCategoryModalOpen(false);
          enqueueSnackbar("Category updated successfully!", {
            variant: "success",
          });
        } else {
          const errorMessage = resultAction.payload || "Failed to update category";
          enqueueSnackbar(errorMessage, { variant: "error" });
        }
      } else {
        // Create new category
        resultAction = await dispatch(createCategory(submitData));

        if (createCategory.fulfilled.match(resultAction)) {
          setIsCategoryModalOpen(false);
          enqueueSnackbar("Category created successfully!", {
            variant: "success",
          });
          // Reset form
          setCategoryData({
            name: "",
            description: "",
            color: COLOR_OPTIONS[0].value,
            isActive: true,
          });
        } else {
          const errorMessage = resultAction.payload || "Failed to create category";
          enqueueSnackbar(errorMessage, { variant: "error" });
        }
      }
    } catch {
      enqueueSnackbar("An unexpected error occurred", { variant: "error" });
    }
  };

  const handleCloseModal = () => {
    setIsCategoryModalOpen(false);
  };

  const getSelectedColorName = () => {
    const selectedColor = COLOR_OPTIONS.find(
      (color) => color.value === categoryData.color
    );
    return selectedColor ? selectedColor.name : "Custom";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-[#262626] p-6 rounded-lg shadow-lg w-[420px] max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f6b100] rounded-lg">
              <MdCategory size={24} className="text-[#1f1f1f]" />
            </div>
            <h2 className="text-[#f5f5f5] text-xl font-semibold">
              {editingCategory ? "Edit Category" : "Add Category"}
            </h2>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-[#f5f5f5] hover:text-red-500 transition-colors"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Name */}
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">
              Category Name *
            </label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
              <input
                type="text"
                name="name"
                value={categoryData.name}
                onChange={handleInputChange}
                placeholder="Enter category name"
                className="bg-transparent flex-1 text-white focus:outline-none"
                required
                maxLength={50}
              />
            </div>
            <p className="text-[#ababab] text-xs mt-1">
              {categoryData.name.length}/50 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">
              Description <span className="text-xs">(Optional)</span>
            </label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
              <textarea
                name="description"
                value={categoryData.description}
                onChange={handleInputChange}
                placeholder="Enter category description"
                rows="3"
                className="bg-transparent flex-1 text-white focus:outline-none resize-none"
                maxLength={200}
              />
            </div>
            <p className="text-[#ababab] text-xs mt-1">
              {categoryData.description.length}/200 characters
            </p>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-[#ababab] mb-3 text-sm font-medium">
              <MdColorLens className="inline mr-2" size={16} />
              Category Color
            </label>

            {/* Selected Color Preview */}
            <div className="mb-4 p-3 bg-[#1f1f1f] rounded-lg border border-[#343434]">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-[#343434]"
                  style={{ backgroundColor: categoryData.color }}
                ></div>
                <div>
                  <p className="text-[#f5f5f5] font-medium">
                    {getSelectedColorName()}
                  </p>
                  <p className="text-[#ababab] text-xs">
                    {categoryData.color}
                  </p>
                </div>
              </div>
            </div>

            {/* Color Options Grid */}
            <div className="grid grid-cols-5 gap-3">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleColorSelect(color.value)}
                  className={`relative w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                    categoryData.color === color.value
                      ? "border-[#f6b100] shadow-lg scale-110"
                      : "border-[#343434] hover:border-[#f6b100]"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {categoryData.color === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 bg-[#1f1f1f] rounded-lg border border-[#343434]">
            <div>
              <label className="text-[#f5f5f5] font-medium">
                Active Category
              </label>
              <p className="text-[#ababab] text-xs">
                Active categories will be available for dish assignment
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={categoryData.isActive}
                onChange={handleInputChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#343434] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f6b100]"></div>
            </label>
          </div>

          {/* Preview Card */}
          <div className="p-4 bg-[#1f1f1f] rounded-lg border border-[#343434]">
            <h3 className="text-[#ababab] text-sm font-medium mb-3">
              Preview:
            </h3>
            <div
              className="p-4 rounded-lg text-white font-semibold text-center"
              style={{ backgroundColor: categoryData.color }}
            >
              {categoryData.name || "Category Name"}
            </div>
            {categoryData.description && (
              <p className="text-[#ababab] text-sm mt-2 text-center">
                {categoryData.description}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={categoryLoading || !categoryData.name.trim()}
            className="w-full rounded-lg mt-6 mb-4 py-3 text-lg bg-yellow-400 text-gray-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-500 transition-colors"
          >
{categoryLoading 
              ? (editingCategory ? "Updating Category..." : "Creating Category...") 
              : (editingCategory ? "Update Category" : "Create Category")}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

CategoryModal.propTypes = {
  setIsCategoryModalOpen: PropTypes.func.isRequired,
  editingCategory: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    color: PropTypes.string,
    isActive: PropTypes.bool,
  }),
};

export default CategoryModal;
