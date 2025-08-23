import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { IoMdAdd, IoMdMedkit, IoMdTrash } from "react-icons/io";
import { MdCategory, MdToggleOn, MdToggleOff } from "react-icons/md";
import {
  fetchCategories,
  removeCategory,
  editCategory,
} from "../redux/slices/categorySlice";
import { enqueueSnackbar } from "notistack";
import CategoryModal from "../components/dashboard/CategoryModal";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import PropTypes from "prop-types";
import BackButton from "../components/shared/BackButton";

const CategoryCard = ({ category, onEdit, onDelete, onToggleStatus }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[#1f1f1f] rounded-[20px] p-6 hover:bg-[#252525] transition-colors duration-200 border border-transparent hover:border-[#343434] relative"
    >
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Toggle Status Button */}
        <button
          onClick={() => onToggleStatus(category)}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            category.isActive
              ? "bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-800"
              : "bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800"
          }`}
          title={
            category.isActive ? "Deactivate category" : "Activate category"
          }
        >
          {category.isActive ? (
            <MdToggleOn size={18} />
          ) : (
            <MdToggleOff size={18} />
          )}
        </button>

        {/* Edit Button */}
        <button
          onClick={() => onEdit(category)}
          className="p-2 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-800 transition-colors duration-200"
          title="Edit category"
        >
          <IoMdMedkit size={18} />
        </button>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(category)}
          className="p-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800 transition-colors duration-200"
          title="Delete category"
        >
          <IoMdTrash size={18} />
        </button>
      </div>

      {/* Category Content */}
      <div className="pr-32">
        {/* Category Header */}
        <div className="flex items-center gap-4 mb-4">
          {/* Category Color Indicator */}
          <div
            className="w-12 h-12 rounded-full border-2 border-[#343434] flex items-center justify-center"
            style={{ backgroundColor: category.color }}
          >
            <MdCategory size={20} className="text-white" />
          </div>

          {/* Category Info */}
          <div className="flex-1">
            <h3 className="text-[#f5f5f5] text-lg font-semibold mb-1">
              {category.name}
            </h3>
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  category.isActive
                    ? "bg-green-900/30 text-green-400 border border-green-800"
                    : "bg-red-900/30 text-red-400 border border-red-800"
                }`}
              >
                {category.isActive ? "Active" : "Inactive"}
              </span>
              <span className="text-[#ababab] text-xs">
                Created: {new Date(category.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Category Description */}
        {category.description && (
          <div className="mb-4">
            <p className="text-[#ababab] text-sm leading-relaxed">
              {category.description}
            </p>
          </div>
        )}

        {/* Category Preview */}
        <div className="mt-4 pt-4 border-t border-[#343434]">
          <p className="text-[#ababab] text-xs mb-2">Preview:</p>
          <div
            className="p-3 rounded-lg text-white font-semibold text-center text-sm"
            style={{ backgroundColor: category.color }}
          >
            {category.name}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

CategoryCard.propTypes = {
  category: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    color: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
};

const Categories = () => {
  const dispatch = useDispatch();
  const {
    items: categories,
    loading,
    error,
  } = useSelector((state) => state.categories);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (category) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${category.name}"? This action cannot be undone.`
      )
    ) {
      try {
        const resultAction = await dispatch(removeCategory(category._id));
        if (removeCategory.fulfilled.match(resultAction)) {
          enqueueSnackbar("Category deleted successfully!", {
            variant: "success",
          });
        } else {
          const errorMessage =
            resultAction.payload || "Failed to delete category";
          enqueueSnackbar(errorMessage, { variant: "error" });
        }
      } catch {
        enqueueSnackbar("An unexpected error occurred", { variant: "error" });
      }
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      const updatedData = { ...category, isActive: !category.isActive };
      const resultAction = await dispatch(
        editCategory({ id: category._id, categoryData: updatedData })
      );

      if (editCategory.fulfilled.match(resultAction)) {
        const newStatus = resultAction.payload.isActive;
        enqueueSnackbar(
          `Category ${newStatus ? "activated" : "deactivated"} successfully!`,
          { variant: "success" }
        );
      } else {
        const errorMessage =
          resultAction.payload || "Failed to toggle category status";
        enqueueSnackbar(errorMessage, { variant: "error" });
      }
    } catch {
      enqueueSnackbar("An unexpected error occurred", { variant: "error" });
    }
  };

  // Filter categories based on status
  const filteredCategories = categories.filter((category) => {
    if (filterStatus === "active") return category.isActive;
    if (filterStatus === "inactive") return !category.isActive;
    return true; // all
  });

  const getStatusCounts = () => {
    const active = categories.filter((cat) => cat.isActive).length;
    const inactive = categories.filter((cat) => !cat.isActive).length;
    return { active, inactive, total: categories.length };
  };

  const statusCounts = getStatusCounts();

  if (loading && categories.length === 0) {
    return <FullScreenLoader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Error loading categories</p>
          <button
            onClick={() => dispatch(fetchCategories())}
            className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e09900] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
              Categories
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#f6b100] rounded-lg">
              <MdCategory size={28} className="text-[#1f1f1f]" />
            </div>
            <div>
              <h1 className="text-[#f5f5f5] text-2xl font-bold">Categories</h1>
              <p className="text-[#ababab] text-sm">
                Manage your dish categories
              </p>
            </div>
          </div>

          {/* Add Category Button */}
          <button
            onClick={handleAddCategory}
            className="flex items-center gap-2 px-4 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e09900] transition-colors"
          >
            <IoMdAdd size={20} />
            Add Category
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1f1f1f] p-4 rounded-lg border border-[#343434]">
            <h3 className="text-[#ababab] text-sm font-medium">
              Total Categories
            </h3>
            <p className="text-[#f5f5f5] text-2xl font-bold">
              {statusCounts.total}
            </p>
          </div>
          <div className="bg-[#1f1f1f] p-4 rounded-lg border border-[#343434]">
            <h3 className="text-[#ababab] text-sm font-medium">
              Active Categories
            </h3>
            <p className="text-green-400 text-2xl font-bold">
              {statusCounts.active}
            </p>
          </div>
          <div className="bg-[#1f1f1f] p-4 rounded-lg border border-[#343434]">
            <h3 className="text-[#ababab] text-sm font-medium">
              Inactive Categories
            </h3>
            <p className="text-red-400 text-2xl font-bold">
              {statusCounts.inactive}
            </p>
          </div>
          <div className="bg-[#1f1f1f] p-4 rounded-lg border border-[#343434]">
            <h3 className="text-[#ababab] text-sm font-medium">Success Rate</h3>
            <p className="text-[#f6b100] text-2xl font-bold">
              {statusCounts.total > 0
                ? Math.round((statusCounts.active / statusCounts.total) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-3">
          <span className="text-[#ababab] text-sm font-medium">Filter:</span>
          {["all", "active", "inactive"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-[#f6b100] text-[#1f1f1f]"
                  : "bg-[#1f1f1f] text-[#ababab] hover:bg-[#252525] hover:text-[#f5f5f5] border border-[#343434]"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== "all" && (
                <span className="ml-1">
                  (
                  {status === "active"
                    ? statusCounts.active
                    : statusCounts.inactive}
                  )
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <MdCategory size={64} className="text-[#343434] mx-auto mb-4" />
            <h3 className="text-[#ababab] text-lg font-medium mb-2">
              {filterStatus === "all"
                ? "No categories found"
                : `No ${filterStatus} categories found`}
            </h3>
            <p className="text-[#ababab] text-sm mb-6">
              {filterStatus === "all"
                ? "Get started by creating your first category"
                : `Try changing the filter or create a new category`}
            </p>
            {filterStatus === "all" && (
              <button
                onClick={handleAddCategory}
                className="px-6 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e09900] transition-colors"
              >
                Create First Category
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category._id}
                category={category}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && categories.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-[#1f1f1f] p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f6b100] mx-auto"></div>
            <p className="text-[#f5f5f5] text-sm mt-2">Loading...</p>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <CategoryModal
          setIsCategoryModalOpen={setIsCategoryModalOpen}
          editingCategory={editingCategory}
        />
      )}
    </div>
  );
};

export default Categories;
