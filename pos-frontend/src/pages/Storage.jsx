import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { IoMdAdd } from "react-icons/io";
import { MdInput, MdOutput, MdSettings, MdBusiness, MdInventory, MdToday, MdDateRange, MdCalendarMonth } from "react-icons/md";
import {
  fetchStorageImports,
  cancelStorageImportAction,
} from "../redux/slices/storageImportSlice";
import {
  fetchStorageExports,
  cancelStorageExportAction,
} from "../redux/slices/storageExportSlice";
import { fetchStorageItems } from "../redux/slices/storageItemSlice";
import { enqueueSnackbar } from "notistack";
import ImportModal from "../components/storage/ImportModal";
import ExportModal from "../components/storage/ExportModal";
import DateFilterBar from "../components/storage/DateFilterBar";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import BackButton from "../components/shared/BackButton";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../utils/auth";
import { logger } from "../utils/logger";
import { getTodayDate } from "../utils";

const STATUS_STYLES = {
  completed: "bg-green-900/30 text-green-400 border border-green-800",
  pending: "bg-yellow-900/30 text-yellow-400 border border-yellow-800",
  cancelled: "bg-red-900/30 text-red-400 border border-red-800",
};

const REASON_LABELS = {
  production: "Production",
  waste: "Waste",
  damage: "Damage",
  theft: "Theft",
  transfer: "Transfer",
  other: "Other",
};

const thClass = "px-4 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider";
const tdClass = "px-4 py-3 text-sm text-[#f5f5f5] whitespace-nowrap";

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.cancelled}`}>
    {status}
  </span>
);
StatusBadge.propTypes = { status: PropTypes.string.isRequired };

const TableLoader = ({ message }) => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100] mx-auto mb-4" />
    <p className="text-[#ababab]">{message}</p>
  </div>
);
TableLoader.propTypes = { message: PropTypes.string.isRequired };

const TableEmpty = ({ icon: Icon, message }) => (
  <div className="text-center py-12">
    <Icon size={48} className="text-[#343434] mx-auto mb-3" />
    <p className="text-[#ababab]">{message}</p>
  </div>
);
TableEmpty.propTypes = {
  icon: PropTypes.elementType.isRequired,
  message: PropTypes.string.isRequired,
};

const CancelButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-1 text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800 rounded transition-colors"
  >
    Cancel
  </button>
);
CancelButton.propTypes = { onClick: PropTypes.func.isRequired };

const ErrorBanner = ({ message }) => (
  <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-lg">
    {message}
  </div>
);
ErrorBanner.propTypes = { message: PropTypes.string.isRequired };

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-t-lg text-[#f5f5f5] font-medium text-sm whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-2 ${
      active ? "bg-[#262626] border-b-2 border-[#f6b100]" : "bg-[#1a1a1a] hover:bg-[#262626]"
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);
TabButton.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
};

const ImportList = memo(({ imports, loading, onCancel }) => {
  if (loading) return <TableLoader message="Loading imports..." />;
  if (imports.length === 0) return <TableEmpty icon={MdInput} message="No imports found" />;

  return (
    <div className="overflow-x-auto rounded-lg border border-[#343434]">
      <table className="w-full min-w-[700px]">
        <thead className="bg-[#262626]">
          <tr>
            <th className={`${thClass} sticky left-0 bg-[#262626] z-[1]`}>Item</th>
            <th className={thClass}>Qty</th>
            <th className={thClass}>Unit Cost</th>
            <th className={thClass}>Total</th>
            <th className={thClass}>Supplier</th>
            <th className={thClass}>Date</th>
            <th className={thClass}>Status</th>
            <th className={`${thClass} text-right`}>Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#343434]">
          {imports.map((r) => (
            <tr key={r._id} className="bg-[#1f1f1f] hover:bg-[#262626] transition-colors">
              <td className={`${tdClass} sticky left-0 bg-[#1f1f1f] z-[1] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                <span className="font-medium">{r.storageItemId?.name || "N/A"}</span>
              </td>
              <td className={tdClass}>{r.quantity} {r.unit}</td>
              <td className={tdClass}>{r.unitCost?.toLocaleString("vi-VN")}</td>
              <td className={`${tdClass} text-[#f6b100] font-semibold`}>{r.totalCost?.toLocaleString("vi-VN")}</td>
              <td className={tdClass}>{r.supplierName || "—"}</td>
              <td className={tdClass}>{new Date(r.importDate).toLocaleDateString("vi-VN")}</td>
              <td className={tdClass}><StatusBadge status={r.status} /></td>
              <td className={`${tdClass} text-right`}>
                {r.status !== "cancelled" && <CancelButton onClick={() => onCancel(r._id)} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
ImportList.displayName = "ImportList";
ImportList.propTypes = {
  imports: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
};

const ExportList = memo(({ exports, loading, onCancel }) => {
  if (loading) return <TableLoader message="Loading exports..." />;
  if (exports.length === 0) return <TableEmpty icon={MdOutput} message="No exports found" />;

  return (
    <div className="overflow-x-auto rounded-lg border border-[#343434]">
      <table className="w-full min-w-[700px]">
        <thead className="bg-[#262626]">
          <tr>
            <th className={`${thClass} sticky left-0 bg-[#262626] z-[1]`}>Item</th>
            <th className={thClass}>Qty</th>
            <th className={thClass}>Reason</th>
            <th className={thClass}>Exported By</th>
            <th className={thClass}>Date</th>
            <th className={thClass}>Status</th>
            <th className={`${thClass} text-right`}>Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#343434]">
          {exports.map((r) => (
            <tr key={r._id} className="bg-[#1f1f1f] hover:bg-[#262626] transition-colors">
              <td className={`${tdClass} sticky left-0 bg-[#1f1f1f] z-[1] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                <span className="font-medium">{r.storageItemId?.name || "N/A"}</span>
              </td>
              <td className={tdClass}>{r.quantity} {r.unit}</td>
              <td className={tdClass}>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-800">
                  {REASON_LABELS[r.reason] || r.reason}
                </span>
              </td>
              <td className={tdClass}>{r.exportedBy?.userName || "N/A"}</td>
              <td className={tdClass}>{new Date(r.exportDate).toLocaleDateString("vi-VN")}</td>
              <td className={tdClass}><StatusBadge status={r.status} /></td>
              <td className={`${tdClass} text-right`}>
                {r.status !== "cancelled" && <CancelButton onClick={() => onCancel(r._id)} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
ExportList.displayName = "ExportList";
ExportList.propTypes = {
  exports: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
};

const StockList = memo(({ items, loading }) => {
  if (loading) return <TableLoader message="Loading stock..." />;

  const activeItems = items.filter((item) => item.isActive);
  if (activeItems.length === 0) return <TableEmpty icon={MdInventory} message="No items in storage" />;

  return (
    <div className="overflow-x-auto rounded-lg border border-[#343434]">
      <table className="w-full min-w-[300px]">
        <thead className="bg-[#262626]">
          <tr>
            <th className={`${thClass} sticky left-0 bg-[#262626] z-[1]`}>Item</th>
            <th className={thClass}>Current Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#343434]">
          {activeItems.map((item) => {
            const isOut = item.currentStock === 0;
            const isLow = !isOut && item.currentStock <= item.minStock;
            return (
              <tr
                key={item._id}
                className={`transition-colors ${
                  isOut
                    ? "bg-red-950/20 hover:bg-red-950/30"
                    : isLow
                    ? "bg-yellow-950/15 hover:bg-yellow-950/25"
                    : "bg-[#1f1f1f] hover:bg-[#262626]"
                }`}
              >
                <td className={`${tdClass} sticky left-0 z-[1] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] ${
                  isOut ? "bg-red-950/20" : isLow ? "bg-yellow-950/15" : "bg-[#1f1f1f]"
                }`}>
                  <span className="font-medium">{item.name}</span>
                </td>
                <td className={tdClass}>
                  <span className={`font-bold ${isOut ? "text-red-400" : isLow ? "text-yellow-400" : "text-green-400"}`}>
                    {item.currentStock}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
StockList.displayName = "StockList";
StockList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
};

const Storage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user?.role === "Admin";

  const { items: imports, loading: importsLoading, error: importsError } = useSelector((state) => state.storageImports);
  const { items: exports, loading: exportsLoading, error: exportsError } = useSelector((state) => state.storageExports);
  const { items: storageItems, loading: storageItemsLoading, error: storageItemsError } = useSelector((state) => state.storageItems);

  const [activeTab, setActiveTab] = useState("stock");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingImport, setEditingImport] = useState(null);
  const [editingExport, setEditingExport] = useState(null);
  const [dateFilter, setDateFilter] = useState("today");
  const [customDateRange, setCustomDateRange] = useState({ startDate: "", endDate: "" });

  const dateFilterOptions = useMemo(() => [
    { value: "today", label: "Today", icon: <MdToday /> },
    { value: "week", label: "This Week", icon: <MdDateRange /> },
    { value: "month", label: "This Month", icon: <MdCalendarMonth /> },
    { value: "custom", label: "Custom Range", icon: <MdDateRange /> },
  ], []);

  const getDateRange = useCallback((filter) => {
    const today = getTodayDate();
    if (filter === "today") return { startDate: today, endDate: today };
    if (filter === "week") {
      const d = new Date(today + "T00:00:00+07:00");
      const day = d.getDay();
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      return { startDate: d.toISOString().slice(0, 10), endDate: today };
    }
    if (filter === "month") return { startDate: today.slice(0, 7) + "-01", endDate: today };
    return {};
  }, []);

  const dateParams = useMemo(() => {
    if (dateFilter === "custom") {
      const params = {};
      if (customDateRange.startDate) params.startDate = customDateRange.startDate;
      if (customDateRange.endDate) params.endDate = customDateRange.endDate;
      return params;
    }
    return getDateRange(dateFilter);
  }, [dateFilter, customDateRange, getDateRange]);

  useEffect(() => { dispatch(fetchStorageItems({})); }, [dispatch]);

  useEffect(() => {
    dispatch(fetchStorageImports(dateParams));
    dispatch(fetchStorageExports(dateParams));
  }, [dispatch, dateParams]);

  const handleCreateImport = useCallback(() => { setEditingImport(null); setIsImportModalOpen(true); }, []);
  const handleCreateExport = useCallback(() => { setEditingExport(null); setIsExportModalOpen(true); }, []);

  const handleDateFilterChange = useCallback((value) => {
    setDateFilter(value);
    if (value !== "custom") setCustomDateRange({ startDate: "", endDate: "" });
  }, []);

  const handleCustomDateChange = useCallback((field, value) => {
    setCustomDateRange((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCancelImport = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to cancel this import?")) return;
    try {
      const result = await dispatch(cancelStorageImportAction(id));
      if (cancelStorageImportAction.fulfilled.match(result)) {
        enqueueSnackbar("Import cancelled successfully!", { variant: "success" });
        dispatch(fetchStorageImports(dateParams));
      } else {
        enqueueSnackbar(result.payload || "Failed to cancel import", { variant: "error" });
      }
    } catch (err) {
      logger.error("Error cancelling import:", err);
      enqueueSnackbar("An unexpected error occurred", { variant: "error" });
    }
  }, [dispatch, dateParams]);

  const handleCancelExport = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to cancel this export?")) return;
    try {
      const result = await dispatch(cancelStorageExportAction(id));
      if (cancelStorageExportAction.fulfilled.match(result)) {
        enqueueSnackbar("Export cancelled successfully!", { variant: "success" });
        dispatch(fetchStorageExports(dateParams));
      } else {
        enqueueSnackbar(result.payload || "Failed to cancel export", { variant: "error" });
      }
    } catch (err) {
      logger.error("Error cancelling export:", err);
      enqueueSnackbar("An unexpected error occurred", { variant: "error" });
    }
  }, [dispatch, dateParams]);

  const handleModalSuccess = useCallback(() => {
    if (activeTab === "imports") dispatch(fetchStorageImports(dateParams));
    else dispatch(fetchStorageExports(dateParams));
  }, [dispatch, activeTab, dateParams]);

  if (storageItemsLoading && storageItems.length === 0 && activeTab === "stock") return <FullScreenLoader />;
  if (importsLoading && imports.length === 0 && activeTab === "imports") return <FullScreenLoader />;
  if (exportsLoading && exports.length === 0 && activeTab === "exports") return <FullScreenLoader />;

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <BackButton />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] mb-1">Storage Management</h1>
              <p className="text-[#ababab] text-sm sm:text-base">Manage imports and exports</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {isAdmin && (
                <>
                  <button
                    onClick={() => navigate("/storage/items")}
                    className="flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2 bg-[#1f1f1f] text-[#f5f5f5] rounded-lg hover:bg-[#262626] border border-[#343434] transition-colors"
                    title="Manage Items"
                  >
                    <MdSettings size={18} />
                    <span className="hidden sm:inline text-sm">Manage Items</span>
                  </button>
                  <button
                    onClick={() => navigate("/storage/suppliers")}
                    className="flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2 bg-[#1f1f1f] text-[#f5f5f5] rounded-lg hover:bg-[#262626] border border-[#343434] transition-colors"
                    title="Suppliers"
                  >
                    <MdBusiness size={18} />
                    <span className="hidden sm:inline text-sm">Suppliers</span>
                  </button>
                </>
              )}
              {activeTab !== "stock" && (
                <button
                  onClick={activeTab === "imports" ? handleCreateImport : handleCreateExport}
                  className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e5a000] transition-colors text-sm sm:text-base"
                >
                  <IoMdAdd size={20} />
                  New {activeTab === "imports" ? "Import" : "Export"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#343434] mb-6">
          <div className="flex gap-1 overflow-x-auto pb-2 -mb-px scrollbar-hide">
            <TabButton active={activeTab === "stock"} onClick={() => setActiveTab("stock")} icon={MdInventory} label="Stock" />
            <TabButton active={activeTab === "imports"} onClick={() => setActiveTab("imports")} icon={MdInput} label="Imports" />
            <TabButton active={activeTab === "exports"} onClick={() => setActiveTab("exports")} icon={MdOutput} label="Exports" />
          </div>
        </div>

        {activeTab !== "stock" && (
          <DateFilterBar
            dateFilter={dateFilter}
            customDateRange={customDateRange}
            dateFilterOptions={dateFilterOptions}
            onFilterChange={handleDateFilterChange}
            onCustomDateChange={handleCustomDateChange}
          />
        )}

        {storageItemsError && activeTab === "stock" && <ErrorBanner message={storageItemsError} />}
        {importsError && activeTab === "imports" && <ErrorBanner message={importsError} />}
        {exportsError && activeTab === "exports" && <ErrorBanner message={exportsError} />}

        {activeTab === "stock" && <StockList items={storageItems} loading={storageItemsLoading} />}
        {activeTab === "imports" && <ImportList imports={imports} loading={importsLoading} onCancel={handleCancelImport} />}
        {activeTab === "exports" && <ExportList exports={exports} loading={exportsLoading} onCancel={handleCancelExport} />}

        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => { setIsImportModalOpen(false); setEditingImport(null); }}
          mode={editingImport ? "edit" : "create"}
          importRecord={editingImport}
          onSuccess={handleModalSuccess}
        />
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => { setIsExportModalOpen(false); setEditingExport(null); }}
          mode={editingExport ? "edit" : "create"}
          exportRecord={editingExport}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
};

export default Storage;
