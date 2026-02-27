import { useState, useEffect, useCallback, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { IoMdAdd, IoMdMedkit, IoMdTrash } from "react-icons/io";
import { MdInventory, MdToggleOn, MdToggleOff, MdWarning } from "react-icons/md";
import {
  fetchStorageItems,
  removeStorageItem,
  editStorageItem,
} from "../redux/slices/storageItemSlice";
import { enqueueSnackbar } from "notistack";
import StorageItemModal from "../components/storage/StorageItemModal";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import BackButton from "../components/shared/BackButton";

const thClass = "px-4 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider";
const tdClass = "px-4 py-3 text-sm text-[#f5f5f5] whitespace-nowrap";

const FilterGroup = memo(({ options, value, onChange }) => (
  <div className="flex gap-1.5">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          value === opt.value
            ? "bg-[#f6b100] text-[#1f1f1f]"
            : "bg-[#1f1f1f] text-[#ababab] border border-[#343434] hover:bg-[#262626]"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
));
FilterGroup.displayName = "FilterGroup";
FilterGroup.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const STOCK_OPTIONS = [
  { value: "all", label: "All Stock" },
  { value: "low", label: "Low Stock" },
  { value: "out", label: "Out of Stock" },
];


const StorageItems = () => {
  const dispatch = useDispatch();
  const { items: storageItems, loading, error } = useSelector((state) => state.storageItems);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchStorageItems({ isActive: filterStatus === "all" ? undefined : filterStatus === "active" }));
  }, [dispatch, filterStatus]);

  const handleAddItem = useCallback(() => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  }, []);

  const handleEditItem = useCallback((item) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  }, []);

  const handleDeleteItem = useCallback(async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) return;
    try {
      const result = await dispatch(removeStorageItem(item._id));
      if (removeStorageItem.fulfilled.match(result)) {
        enqueueSnackbar("Storage item deleted successfully!", { variant: "success" });
      } else {
        enqueueSnackbar(result.payload || "Failed to delete storage item", { variant: "error" });
      }
    } catch {
      enqueueSnackbar("An unexpected error occurred", { variant: "error" });
    }
  }, [dispatch]);

  const handleToggleStatus = useCallback(async (item) => {
    try {
      const result = await dispatch(editStorageItem({ id: item._id, ...item, isActive: !item.isActive }));
      if (editStorageItem.fulfilled.match(result)) {
        enqueueSnackbar(`Item ${result.payload.isActive ? "activated" : "deactivated"}!`, { variant: "success" });
      } else {
        enqueueSnackbar(result.payload || "Failed to update status", { variant: "error" });
      }
    } catch {
      enqueueSnackbar("An unexpected error occurred", { variant: "error" });
    }
  }, [dispatch]);

  const handleModalSuccess = useCallback(() => {
    dispatch(fetchStorageItems({ isActive: filterStatus === "all" ? undefined : filterStatus === "active" }));
  }, [dispatch, filterStatus]);

  const handleCloseModal = useCallback(() => {
    setIsItemModalOpen(false);
    setEditingItem(null);
  }, []);

  const filteredItems = storageItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    if (q && !item.name.toLowerCase().includes(q) && !item.code.toLowerCase().includes(q)) return false;
    if (filterStatus === "active" && !item.isActive) return false;
    if (filterStatus === "inactive" && item.isActive) return false;
    if (filterStock === "low" && item.currentStock > item.minStock) return false;
    if (filterStock === "out" && item.currentStock !== 0) return false;
    return true;
  });

  if (loading && storageItems.length === 0) return <FullScreenLoader />;

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <BackButton />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] mb-1">Storage Items</h1>
              <p className="text-[#ababab] text-sm">Manage your storage inventory items</p>
            </div>
            <button
              onClick={handleAddItem}
              className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e5a000] transition-colors text-sm sm:text-base"
            >
              <IoMdAdd size={20} />
              Add Item
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-[#1f1f1f] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
          />
          <FilterGroup options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
          <FilterGroup options={STOCK_OPTIONS} value={filterStock} onChange={setFilterStock} />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-lg text-sm">{error}</div>
        )}

        {/* Items Table */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <MdInventory size={48} className="text-[#343434] mx-auto mb-3" />
            <p className="text-[#ababab]">
              {searchQuery ? "No items match your search" : "No storage items found"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddItem}
                className="mt-4 px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e5a000] transition-colors text-sm"
              >
                Add Your First Item
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#343434]">
            <table className="w-full min-w-[600px]">
              <thead className="bg-[#262626]">
                <tr>
                  <th className={`${thClass} sticky left-0 bg-[#262626] z-[1]`}>Item</th>
                  <th className={thClass}>Stock</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#343434]">
                {filteredItems.map((item) => {
                  const isLow = item.currentStock <= item.minStock;
                  const isOut = item.currentStock === 0;
                  const rowBg = isOut
                    ? "bg-[#3b2222] hover:bg-[#4a2a2a] border-l-4 border-l-red-500"
                    : isLow
                    ? "bg-[#3b3520] hover:bg-[#4a4228] border-l-4 border-l-yellow-400"
                    : "bg-[#1f1f1f] hover:bg-[#262626]";
                  const stickyBg = isOut ? "bg-[#3b2222]" : isLow ? "bg-[#3b3520]" : "bg-[#1f1f1f]";
                  return (
                    <tr key={item._id} className={`${rowBg} transition-colors`}>
                      <td className={`${tdClass} sticky left-0 ${stickyBg} z-[1] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#f6b100]/20 flex items-center justify-center flex-shrink-0">
                            <MdInventory size={16} className="text-[#f6b100]" />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-[#ababab]">{item.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-2">
                          {isOut && <MdWarning size={14} className="text-red-400 flex-shrink-0" />}
                          {isLow && !isOut && <MdWarning size={14} className="text-yellow-400 flex-shrink-0" />}
                          <span className={isOut ? "text-red-400 font-bold" : isLow ? "text-yellow-300 font-semibold" : ""}>
                            {item.currentStock} {item.unit}
                          </span>
                          <span className="text-[#ababab] text-xs">/ {item.maxStock}</span>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.isActive
                            ? "bg-green-900/30 text-green-400 border border-green-800"
                            : "bg-red-900/30 text-red-400 border border-red-800"
                        }`}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`p-1.5 rounded transition-colors ${
                              item.isActive
                                ? "text-green-400 hover:bg-green-900/30"
                                : "text-red-400 hover:bg-red-900/30"
                            }`}
                            title={item.isActive ? "Deactivate" : "Activate"}
                          >
                            {item.isActive ? <MdToggleOn size={18} /> : <MdToggleOff size={18} />}
                          </button>
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-1.5 rounded text-blue-400 hover:bg-blue-900/30 transition-colors"
                            title="Edit"
                          >
                            <IoMdMedkit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 rounded text-red-400 hover:bg-red-900/30 transition-colors"
                            title="Delete"
                          >
                            <IoMdTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
