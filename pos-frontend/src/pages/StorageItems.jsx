import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { IoMdAdd, IoMdMedkit, IoMdTrash } from "react-icons/io";
import { MdInventory, MdToggleOn, MdToggleOff, MdWarning, MdTrendingUp } from "react-icons/md";
import {
  fetchStorageItems,
  removeStorageItem,
  editStorageItem,
} from "../redux/slices/storageItemSlice";
import { enqueueSnackbar } from "notistack";
import StorageItemModal from "../components/storage/StorageItemModal";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import PropTypes from "prop-types";
import BackButton from "../components/shared/BackButton";

const StorageItemCard = ({ item, onEdit, onDelete, onToggleStatus }) => {
  const isLowStock = item.currentStock <= item.minStock;
  const stockPercentage = item.maxStock > 0 
    ? (item.currentStock / item.maxStock) * 100 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-[#1f1f1f] rounded-[20px] p-6 hover:bg-[#252525] transition-colors duration-200 border ${
        isLowStock ? "border-yellow-500/50" : "border-transparent hover:border-[#343434]"
      } relative`}
    >
      {/* Low Stock Badge */}
      {isLowStock && (
        <div className="absolute top-4 left-4 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <MdWarning size={14} />
          Low Stock
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Toggle Status Button */}
        <button
          onClick={() => onToggleStatus(item)}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            item.isActive
              ? "bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-800"
              : "bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800"
          }`}
          title={
            item.isActive ? "Deactivate item" : "Activate item"
          }
        >
          {item.isActive ? (
            <MdToggleOn size={18} />
          ) : (
            <MdToggleOff size={18} />
          )}
        </button>

        {/* Edit Button */}
        <button
          onClick={() => onEdit(item)}
          className="p-2 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-800 transition-colors duration-200"
          title="Edit item"
        >
          <IoMdMedkit size={18} />
        </button>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(item)}
          className="p-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800 transition-colors duration-200"
          title="Delete item"
        >
          <IoMdTrash size={18} />
        </button>
      </div>

      {/* Item Content */}
      <div className={`pr-32 ${isLowStock ? "pt-8" : ""}`}>
        {/* Item Header */}
        <div className="flex items-center gap-4 mb-4">
          {/* Item Icon */}
          <div className="w-12 h-12 rounded-full border-2 border-[#343434] bg-[#f6b100]/20 flex items-center justify-center">
            <MdInventory size={20} className="text-[#f6b100]" />
          </div>

          {/* Item Info */}
          <div className="flex-1">
            <h3 className="text-[#f5f5f5] text-lg font-semibold mb-1">
              {item.name}
            </h3>
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.isActive
                    ? "bg-green-900/30 text-green-400 border border-green-800"
                    : "bg-red-900/30 text-red-400 border border-red-800"
                }`}
              >
                {item.isActive ? "Active" : "Inactive"}
              </span>
              <span className="text-[#ababab] text-xs">
                Code: {item.code}
              </span>
              <span className="text-[#ababab] text-xs">
                {item.category}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Information */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#ababab] text-sm">Current Stock</span>
            <span className={`text-lg font-semibold ${
              isLowStock ? "text-yellow-400" : "text-[#f5f5f5]"
            }`}>
              {item.currentStock} {item.unit}
            </span>
          </div>
          
          {/* Stock Bar */}
          <div className="w-full bg-[#343434] rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${
                stockPercentage < 20
                  ? "bg-red-500"
                  : stockPercentage < 50
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#ababab]">
            <span>Min: {item.minStock} {item.unit}</span>
            <span>Max: {item.maxStock} {item.unit}</span>
          </div>
        </div>

        {/* Cost Information */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#343434]">
          <div>
            <div className="flex items-center gap-1 text-[#ababab] text-xs mb-1">
              <MdTrendingUp size={14} />
              Average Cost
            </div>
            <p className="text-[#f5f5f5] font-semibold">
              {item.averageCost?.toLocaleString('vi-VN') || 0} VND
            </p>
          </div>
          <div>
            <div className="text-[#ababab] text-xs mb-1">Last Purchase</div>
            <p className="text-[#f5f5f5] font-semibold">
              {item.lastPurchaseCost?.toLocaleString('vi-VN') || 0} VND
            </p>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <div className="mt-4 pt-4 border-t border-[#343434]">
            <p className="text-[#ababab] text-xs mb-1">Description:</p>
            <p className="text-[#ababab] text-sm">{item.description}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

StorageItemCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    category: PropTypes.string,
    unit: PropTypes.string.isRequired,
    currentStock: PropTypes.number.isRequired,
    minStock: PropTypes.number.isRequired,
    maxStock: PropTypes.number.isRequired,
    averageCost: PropTypes.number,
    lastPurchaseCost: PropTypes.number,
    description: PropTypes.string,
    isActive: PropTypes.bool.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
};

const StorageItems = () => {
  const dispatch = useDispatch();
  const {
    items: storageItems,
    loading,
    error,
  } = useSelector((state) => state.storageItems);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive
  const [filterStock, setFilterStock] = useState("all"); // all, low, out
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchStorageItems({ isActive: filterStatus === "all" ? undefined : filterStatus === "active" }));
  }, [dispatch, filterStatus]);

  const handleAddItem = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = async (item) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${item.name}"? This action cannot be undone.`
      )
    ) {
      try {
        const resultAction = await dispatch(removeStorageItem(item._id));
        if (removeStorageItem.fulfilled.match(resultAction)) {
          enqueueSnackbar("Storage item deleted successfully!", {
            variant: "success",
          });
        } else {
          const errorMessage =
            resultAction.payload || "Failed to delete storage item";
          enqueueSnackbar(errorMessage, { variant: "error" });
        }
      } catch {
        enqueueSnackbar("An unexpected error occurred", { variant: "error" });
      }
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      const updatedData = { ...item, isActive: !item.isActive };
      const resultAction = await dispatch(
        editStorageItem({ id: item._id, ...updatedData })
      );

      if (editStorageItem.fulfilled.match(resultAction)) {
        const newStatus = resultAction.payload.isActive;
        enqueueSnackbar(
          `Storage item ${newStatus ? "activated" : "deactivated"} successfully!`,
          { variant: "success" }
        );
      } else {
        const errorMessage =
          resultAction.payload || "Failed to update storage item status";
        enqueueSnackbar(errorMessage, { variant: "error" });
      }
    } catch {
      enqueueSnackbar("An unexpected error occurred", { variant: "error" });
    }
  };

  const handleModalSuccess = () => {
    dispatch(fetchStorageItems({ isActive: filterStatus === "all" ? undefined : filterStatus === "active" }));
  };

  const handleCloseModal = () => {
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  // Filter items based on search query and stock status
  const filteredItems = storageItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && item.isActive) ||
      (filterStatus === "inactive" && !item.isActive);

    const matchesStock =
      filterStock === "all" ||
      (filterStock === "low" && item.currentStock <= item.minStock) ||
      (filterStock === "out" && item.currentStock === 0) ||
      (filterStock === "inStock" && item.currentStock > item.minStock);

    return matchesSearch && matchesStatus && matchesStock;
  });

  if (loading && storageItems.length === 0) {
    return <FullScreenLoader />;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <BackButton />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-[#f5f5f5] mb-2">
                Storage Items Management
              </h1>
              <p className="text-[#ababab]">
                Manage your storage inventory items
              </p>
            </div>
            <button
              onClick={handleAddItem}
              className="flex items-center gap-2 px-6 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e5a000] transition-colors"
            >
              <IoMdAdd size={20} />
              Add Item
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search items by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#1f1f1f] border border-[#343434] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
            />
          </div>

          {/* Status and Stock Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === "all"
                    ? "bg-[#f6b100] text-[#1f1f1f]"
                    : "bg-[#1f1f1f] text-[#ababab] border border-[#343434]"
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setFilterStatus("active")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === "active"
                    ? "bg-[#f6b100] text-[#1f1f1f]"
                    : "bg-[#1f1f1f] text-[#ababab] border border-[#343434]"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus("inactive")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === "inactive"
                    ? "bg-[#f6b100] text-[#1f1f1f]"
                    : "bg-[#1f1f1f] text-[#ababab] border border-[#343434]"
                }`}
              >
                Inactive
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterStock("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStock === "all"
                    ? "bg-[#f6b100] text-[#1f1f1f]"
                    : "bg-[#1f1f1f] text-[#ababab] border border-[#343434]"
                }`}
              >
                All Stock
              </button>
              <button
                onClick={() => setFilterStock("low")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStock === "low"
                    ? "bg-[#f6b100] text-[#1f1f1f]"
                    : "bg-[#1f1f1f] text-[#ababab] border border-[#343434]"
                }`}
              >
                Low Stock
              </button>
              <button
                onClick={() => setFilterStock("out")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStock === "out"
                    ? "bg-[#f6b100] text-[#1f1f1f]"
                    : "bg-[#1f1f1f] text-[#ababab] border border-[#343434]"
                }`}
              >
                Out of Stock
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <MdInventory size={64} className="text-[#343434] mx-auto mb-4" />
            <p className="text-[#ababab] text-lg">
              {searchQuery
                ? "No items found matching your search"
                : "No storage items found"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddItem}
                className="mt-4 px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e5a000] transition-colors"
              >
                Add Your First Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <StorageItemCard
                key={item._id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}

        {/* Storage Item Modal */}
        <StorageItemModal
          isOpen={isItemModalOpen}
          onClose={handleCloseModal}
          mode={editingItem ? "edit" : "create"}
          item={editingItem}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
};

export default StorageItems;
