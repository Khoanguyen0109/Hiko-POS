import { useState, useEffect, useCallback, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { IoMdAdd, IoMdMedkit, IoMdTrash } from "react-icons/io";
import { MdInventory, MdToggleOn, MdToggleOff } from "react-icons/md";
import {
  fetchStorageItems,
  removeStorageItem,
  editStorageItem,
} from "../redux/slices/storageItemSlice";
import { enqueueSnackbar } from "notistack";
import StorageItemModal from "../components/storage/StorageItemModal";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import FeaturePageHeader from "../components/shared/FeaturePageHeader";
import ErrorBanner from "../components/shared/ErrorBanner";
import EmptyState from "../components/shared/EmptyState";
import HeaderActionButton from "../components/shared/HeaderActionButton";

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
            ? "bg-brand text-[#f5f5f5]"
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

const STOCK_OPTIONS = [
  { value: "all", label: "All Stock" },
  { value: "low", label: "Low Stock" },
  { value: "out", label: "Out of Stock" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const StorageItems = () => {
  const dispatch = useDispatch();
  const { items: storageItems, loading, error } = useSelector((state) => state.storageItems);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterStock, setFilterStock] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchStorageItems({ isActive: "all" }));
  }, [dispatch]);

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
    dispatch(fetchStorageItems({ isActive: "all" }));
  }, [dispatch]);

  const handleCloseModal = useCallback(() => {
    setIsItemModalOpen(false);
    setEditingItem(null);
  }, []);

  const filteredItems = storageItems.filter((item) => {
    if (filterStatus === "active" && !item.isActive) return false;
    if (filterStatus === "inactive" && item.isActive) return false;
    const q = searchQuery.toLowerCase();
    if (q && !item.name.toLowerCase().includes(q) && !(item.code || "").toLowerCase().includes(q)) return false;
    if (filterStock === "low" && item.currentStock > item.minStock) return false;
    if (filterStock === "out" && item.currentStock !== 0) return false;
    return true;
  });

  if (loading && storageItems.length === 0) return <FullScreenLoader />;

  return (
    <div className="min-h-screen bg-[#1a1a1a] pb-20 overflow-x-hidden">
      <FeaturePageHeader
        title="Storage Items"
        subtitle="Manage your storage inventory items"
        actions={
          <HeaderActionButton
            variant="primary"
            icon={<IoMdAdd size={18} />}
            onClick={handleAddItem}
          >
            Add Item
          </HeaderActionButton>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-[#1f1f1f] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-brand"
          />
          <FilterGroup options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
          <FilterGroup options={STOCK_OPTIONS} value={filterStock} onChange={setFilterStock} />
        </div>

        {error ? <ErrorBanner message={error} /> : null}

        {/* Items Table */}
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={MdInventory}
            message={
              searchQuery
                ? "No items match your search"
                : filterStatus === "inactive"
                ? "No inactive storage items"
                : filterStatus === "active"
                ? "No active storage items"
                : "No storage items found"
            }
            action={
              !searchQuery
                ? { label: "Add Your First Item", onClick: handleAddItem }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#343434]">
            <table className="w-full min-w-[520px]">
              <thead className="bg-[#262626]">
                <tr>
                  <th className={`${thClass} sticky left-0 bg-[#262626] z-[1]`}>Item</th>
                  <th className={thClass}>Avg Cost</th>
                  <th className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#343434]">
                {filteredItems.map((item) => {
                  const isLow = item.isActive && item.currentStock <= item.minStock;
                  const isOut = item.isActive && item.currentStock === 0;
                  const rowBg = !item.isActive
                    ? "bg-[#262626] hover:bg-[#2e2e2e] border-l-4 border-l-[#555555] opacity-70"
                    : isOut
                    ? "bg-[#3b2222] hover:bg-[#4a2a2a] border-l-4 border-l-red-500"
                    : isLow
                    ? "bg-[#3b3520] hover:bg-[#4a4228] border-l-4 border-l-yellow-400"
                    : "bg-[#1f1f1f] hover:bg-[#262626]";
                  const stickyBg = !item.isActive
                    ? "bg-[#262626]"
                    : isOut
                    ? "bg-[#3b2222]"
                    : isLow
                    ? "bg-[#3b3520]"
                    : "bg-[#1f1f1f]";
                  return (
                    <tr key={item._id} className={`${rowBg} transition-colors`}>
                      <td className={`${tdClass} sticky left-0 ${stickyBg} z-[1] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-20 flex items-center justify-center flex-shrink-0">
                            <MdInventory size={16} className="text-brand" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{item.name}</p>
                              {!item.isActive ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-900/30 text-red-400 border border-red-800">
                                  Inactive
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-[#ababab]">{item.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        {(item.averageCost ?? 0).toLocaleString("vi-VN")}
                        <span className="ml-1 text-[#ababab] text-xs">
                          VND{item.unit ? `/${item.unit}` : ""}
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
