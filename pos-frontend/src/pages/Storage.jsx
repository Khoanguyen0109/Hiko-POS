import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { IoMdAdd } from "react-icons/io";
import { MdInput, MdOutput, MdSettings, MdBusiness, MdInventory, MdToday, MdDateRange, MdCalendarMonth, MdFilterList } from "react-icons/md";
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
import DateFilterBar from "../components/shared/DateFilterBar";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import FeaturePageHeader from "../components/shared/FeaturePageHeader";
import LoadingState from "../components/shared/LoadingState";
import EmptyState from "../components/shared/EmptyState";
import ErrorBanner from "../components/shared/ErrorBanner";
import HeaderActionButton from "../components/shared/HeaderActionButton";
import FilterToggleButton from "../components/shared/FilterToggleButton";
import RecordStatusBadge from "../components/shared/RecordStatusBadge";
import { useNavigate } from "react-router-dom";
import StorageStockCard from "../components/v2/StorageStockCard";
import { useV2Ui } from "../hooks/useV2Ui";
import { getStoredUser } from "../utils/auth";
import { logger } from "../utils/logger";
import { getDateRangeByPeriodVietnam } from "../utils/dateUtils";

const thClass = "px-4 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider";
const tdClass = "px-4 py-3 text-sm text-[#f5f5f5] whitespace-nowrap";

const CancelButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-1 text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800 rounded transition-colors"
  >
    Cancel
  </button>
);
CancelButton.propTypes = { onClick: PropTypes.func.isRequired };

const ImportList = memo(({ imports, loading, onCancel }) => {
  if (loading) return <LoadingState message="Loading imports..." />;
  if (imports.length === 0) return <EmptyState icon={MdInput} message="No imports found" />;

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
              <td className={`${tdClass} text-brand font-semibold`}>{r.totalCost?.toLocaleString("vi-VN")}</td>
              <td className={tdClass}>{r.supplierName || "—"}</td>
              <td className={tdClass}>{new Date(r.importDate).toLocaleDateString("vi-VN")}</td>
              <td className={tdClass}><RecordStatusBadge status={r.status} /></td>
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

const EXPORT_REASON_LABELS = {
  production: "Production",
  to_store: "To Store",
};

const ExportList = memo(({ exports, loading, onCancel }) => {
  if (loading) return <LoadingState message="Loading exports..." />;
  if (exports.length === 0) return <EmptyState icon={MdOutput} message="No exports found" />;

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
              <td className={tdClass}>{EXPORT_REASON_LABELS[r.reason] || r.reason || "N/A"}</td>
              <td className={tdClass}>{r.exportedBy?.userName || "N/A"}</td>
              <td className={tdClass}>{new Date(r.exportDate).toLocaleDateString("vi-VN")}</td>
              <td className={tdClass}><RecordStatusBadge status={r.status} /></td>
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
  if (loading) return <LoadingState message="Loading stock..." />;

  const activeItems = items.filter((item) => item.isActive);
  if (activeItems.length === 0) return <EmptyState icon={MdInventory} message="No items in storage" />;

  return (
    <div className="overflow-x-auto rounded-lg border border-[#343434]">
      <table className="w-full min-w-[420px]">
        <thead className="bg-[#262626]">
          <tr>
            <th className={`${thClass} sticky left-0 bg-[#262626] z-[1]`}>Item</th>
            <th className={thClass}>Current Stock</th>
            <th className={thClass}>Avg Cost</th>
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
                  {item.unit ? (
                    <span className="ml-1 text-[#ababab]">{item.unit}</span>
                  ) : null}
                </td>
                <td className={tdClass}>
                  {(item.averageCost ?? 0).toLocaleString("vi-VN")}
                  <span className="ml-1 text-[#ababab] text-xs">
                    VND{item.unit ? `/${item.unit}` : ""}
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

const StockCardList = memo(({ items, loading }) => {
  if (loading) return <LoadingState message="Loading stock..." />;

  const activeItems = items.filter((item) => item.isActive);
  if (activeItems.length === 0) {
    return <EmptyState icon={MdInventory} message="No items in storage" />;
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {activeItems.map((item) => (
        <StorageStockCard key={item._id} item={item} />
      ))}
    </div>
  );
});
StockCardList.displayName = "StockCardList";
StockCardList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
};

const StorageMobileFab = ({ activeTab, onImport, onExport }) => (
  <div
    className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-2 md:hidden"
    style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
  >
    {activeTab === "stock" ? (
      <>
        <button
          type="button"
          onClick={onImport}
          className="flex min-h-[48px] items-center gap-2 rounded-full bg-[#262626] px-4 py-2 text-sm font-semibold text-[#f5f5f5] shadow-lg border border-[#343434]"
        >
          <MdInput size={18} />
          Import
        </button>
        <button
          type="button"
          onClick={onExport}
          className="flex min-h-[48px] items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-[#f5f5f5] shadow-lg"
        >
          <MdOutput size={18} />
          Export
        </button>
      </>
    ) : (
      <button
        type="button"
        onClick={activeTab === "imports" ? onImport : onExport}
        className="flex min-h-[48px] items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-[#f5f5f5] shadow-lg"
      >
        <IoMdAdd size={20} />
        New {activeTab === "imports" ? "Import" : "Export"}
      </button>
    )}
  </div>
);
StorageMobileFab.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onImport: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
};

const Storage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { v2UiEnabled } = useV2Ui();
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
  const [dateFilter, setDateFilter] = useState("week");
  const [customDateRange, setCustomDateRange] = useState({ startDate: "", endDate: "" });
  const [showDateFilter, setShowDateFilter] = useState(true);

  const dateFilterOptions = useMemo(() => [
    { value: "today", label: "Today", icon: <MdToday /> },
    { value: "week", label: "This Week", icon: <MdDateRange /> },
    { value: "month", label: "This Month", icon: <MdCalendarMonth /> },
    { value: "custom", label: "Custom", icon: <MdDateRange /> },
  ], []);

  const dateParams = useMemo(() => {
    if (dateFilter === "custom") {
      if (!customDateRange.startDate || !customDateRange.endDate) return null;
      return {
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate,
      };
    }

    const periodMap = {
      today: "today",
      week: "thisWeek",
      month: "thisMonth",
    };
    const { start, end } = getDateRangeByPeriodVietnam(periodMap[dateFilter] || "today");
    return { startDate: start, endDate: end };
  }, [dateFilter, customDateRange]);

  const activeDateLabel = useMemo(() => {
    if (!dateParams) return "Select dates";
    if (dateParams.startDate === dateParams.endDate) {
      return new Date(`${dateParams.startDate}T12:00:00`).toLocaleDateString("vi-VN");
    }
    return `${new Date(`${dateParams.startDate}T12:00:00`).toLocaleDateString("vi-VN")} – ${new Date(`${dateParams.endDate}T12:00:00`).toLocaleDateString("vi-VN")}`;
  }, [dateParams]);

  useEffect(() => { dispatch(fetchStorageItems({ isActive: true })); }, [dispatch]);

  useEffect(() => {
    if (!dateParams) return;
    if (activeTab === "imports") dispatch(fetchStorageImports(dateParams));
    if (activeTab === "exports") dispatch(fetchStorageExports(dateParams));
  }, [dispatch, dateParams, activeTab]);

  const handleCreateImport = useCallback(() => { setEditingImport(null); setIsImportModalOpen(true); }, []);
  const handleCreateExport = useCallback(() => { setEditingExport(null); setIsExportModalOpen(true); }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === "imports" || tab === "exports") setShowDateFilter(true);
  }, []);

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
        if (dateParams) dispatch(fetchStorageImports(dateParams));
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
        if (dateParams) dispatch(fetchStorageExports(dateParams));
      } else {
        enqueueSnackbar(result.payload || "Failed to cancel export", { variant: "error" });
      }
    } catch (err) {
      logger.error("Error cancelling export:", err);
      enqueueSnackbar("An unexpected error occurred", { variant: "error" });
    }
  }, [dispatch, dateParams]);

  const handleModalSuccess = useCallback(() => {
    if (!dateParams) return;
    if (activeTab === "imports") dispatch(fetchStorageImports(dateParams));
    else if (activeTab === "exports") dispatch(fetchStorageExports(dateParams));
  }, [dispatch, activeTab, dateParams]);

  if (storageItemsLoading && storageItems.length === 0 && activeTab === "stock") return <FullScreenLoader />;
  if (importsLoading && imports.length === 0 && activeTab === "imports") return <FullScreenLoader />;
  if (exportsLoading && exports.length === 0 && activeTab === "exports") return <FullScreenLoader />;

  return (
    <div className="min-h-screen bg-[#1a1a1a] pb-20 overflow-x-hidden">
      <FeaturePageHeader
        title="Storage Management"
        subtitle="Manage imports and exports"
        tabs={[
          { id: "stock", label: "Stock", icon: MdInventory },
          { id: "imports", label: "Imports", icon: MdInput },
          { id: "exports", label: "Exports", icon: MdOutput },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        actions={
          <>
            {activeTab !== "stock" ? (
              <FilterToggleButton
                active={showDateFilter}
                onClick={() => setShowDateFilter((prev) => !prev)}
                icon={<MdFilterList size={16} />}
                label="Date"
                hideLabelOnMobile
              />
            ) : null}
            {isAdmin ? (
              <>
                <HeaderActionButton
                  variant="secondary"
                  icon={<MdSettings size={16} />}
                  onClick={() => navigate("/storage/items")}
                >
                  Items
                </HeaderActionButton>
                <HeaderActionButton
                  variant="secondary"
                  icon={<MdBusiness size={16} />}
                  onClick={() => navigate("/storage/suppliers")}
                >
                  Suppliers
                </HeaderActionButton>
              </>
            ) : null}
            {activeTab !== "stock" ? (
              <HeaderActionButton
                variant="primary"
                icon={<IoMdAdd size={18} />}
                onClick={activeTab === "imports" ? handleCreateImport : handleCreateExport}
              >
                New {activeTab === "imports" ? "Import" : "Export"}
              </HeaderActionButton>
            ) : null}
          </>
        }
      >
        {activeTab !== "stock" && showDateFilter ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[#ababab]">
              Showing {activeTab === "imports" ? "imports" : "exports"} for{" "}
              <span className="font-medium text-[#f5f5f5]">{activeDateLabel}</span>
            </p>
            <DateFilterBar
              compact
              title=""
              description=""
              dateFilter={dateFilter}
              customDateRange={customDateRange}
              dateFilterOptions={dateFilterOptions}
              onFilterChange={handleDateFilterChange}
              onCustomDateChange={handleCustomDateChange}
            />
          </div>
        ) : null}
      </FeaturePageHeader>

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">

        {storageItemsError && activeTab === "stock" && <ErrorBanner message={storageItemsError} />}
        {importsError && activeTab === "imports" && <ErrorBanner message={importsError} />}
        {exportsError && activeTab === "exports" && <ErrorBanner message={exportsError} />}

        {activeTab === "stock" && v2UiEnabled ? (
          <>
            <div className="md:hidden">
              <StockCardList items={storageItems} loading={storageItemsLoading} />
            </div>
            <div className="hidden md:block">
              <StockList items={storageItems} loading={storageItemsLoading} />
            </div>
          </>
        ) : null}
        {activeTab === "stock" && !v2UiEnabled ? (
          <StockList items={storageItems} loading={storageItemsLoading} />
        ) : null}
        {activeTab === "imports" && dateParams && (
          <ImportList imports={imports} loading={importsLoading} onCancel={handleCancelImport} />
        )}
        {activeTab === "imports" && !dateParams && (
          <EmptyState icon={MdInput} message="Select both start and end dates to view imports" />
        )}
        {activeTab === "exports" && dateParams && (
          <ExportList exports={exports} loading={exportsLoading} onCancel={handleCancelExport} />
        )}
        {activeTab === "exports" && !dateParams && (
          <EmptyState icon={MdOutput} message="Select both start and end dates to view exports" />
        )}

        {v2UiEnabled ? (
          <StorageMobileFab
            activeTab={activeTab}
            onImport={handleCreateImport}
            onExport={handleCreateExport}
          />
        ) : null}

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
