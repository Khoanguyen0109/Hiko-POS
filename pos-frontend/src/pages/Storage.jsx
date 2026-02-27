import { useState, useEffect, memo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { IoMdAdd } from "react-icons/io";
import { MdInput, MdOutput, MdSettings, MdBusiness } from "react-icons/md";
import {
  fetchStorageImports,
  cancelStorageImportAction,
} from "../redux/slices/storageImportSlice";
import {
  fetchStorageExports,
  cancelStorageExportAction,
} from "../redux/slices/storageExportSlice";
import { enqueueSnackbar } from "notistack";
import ImportModal from "../components/storage/ImportModal";
import ExportModal from "../components/storage/ExportModal";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import BackButton from "../components/shared/BackButton";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../utils/auth";
import { logger } from "../utils/logger";

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

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.cancelled}`}>
    {status}
  </span>
);
StatusBadge.propTypes = { status: PropTypes.string.isRequired };

const thClass = "px-4 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider";
const tdClass = "px-4 py-3 text-sm text-[#f5f5f5] whitespace-nowrap";

const ImportList = memo(({ imports, loading, onCancel }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100] mx-auto mb-4"></div>
        <p className="text-[#ababab]">Loading imports...</p>
      </div>
    );
  }

  if (imports.length === 0) {
    return (
      <div className="text-center py-12">
        <MdInput size={48} className="text-[#343434] mx-auto mb-3" />
        <p className="text-[#ababab]">No imports found</p>
      </div>
    );
  }

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
                <span className="text-[#ababab] ml-1 text-xs">({r.storageItemId?.code || "N/A"})</span>
              </td>
              <td className={tdClass}>{r.quantity} {r.unit}</td>
              <td className={tdClass}>{r.unitCost?.toLocaleString("vi-VN")}</td>
              <td className={`${tdClass} text-[#f6b100] font-semibold`}>{r.totalCost?.toLocaleString("vi-VN")}</td>
              <td className={tdClass}>{r.supplierName || "—"}</td>
              <td className={tdClass}>{new Date(r.importDate).toLocaleDateString("vi-VN")}</td>
              <td className={tdClass}><StatusBadge status={r.status} /></td>
              <td className={`${tdClass} text-right`}>
                {r.status !== "cancelled" && (
                  <button
                    onClick={() => onCancel(r._id)}
                    className="px-3 py-1 text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800 rounded transition-colors"
                  >
                    Cancel
                  </button>
                )}
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
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100] mx-auto mb-4"></div>
        <p className="text-[#ababab]">Loading exports...</p>
      </div>
    );
  }

  if (exports.length === 0) {
    return (
      <div className="text-center py-12">
        <MdOutput size={48} className="text-[#343434] mx-auto mb-3" />
        <p className="text-[#ababab]">No exports found</p>
      </div>
    );
  }

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
                <span className="text-[#ababab] ml-1 text-xs">({r.storageItemId?.code || "N/A"})</span>
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
                {r.status !== "cancelled" && (
                  <button
                    onClick={() => onCancel(r._id)}
                    className="px-3 py-1 text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800 rounded transition-colors"
                  >
                    Cancel
                  </button>
                )}
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

const Storage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user?.role === "Admin";

  const {
    items: imports,
    loading: importsLoading,
    error: importsError,
  } = useSelector((state) => state.storageImports);

  const {
    items: exports,
    loading: exportsLoading,
    error: exportsError,
  } = useSelector((state) => state.storageExports);

  const [activeTab, setActiveTab] = useState("imports");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingImport, setEditingImport] = useState(null);
  const [editingExport, setEditingExport] = useState(null);

  useEffect(() => {
    dispatch(fetchStorageImports({}));
    dispatch(fetchStorageExports({}));
  }, [dispatch]);

  const handleCreateImport = useCallback(() => {
    setEditingImport(null);
    setIsImportModalOpen(true);
  }, []);

  const handleCreateExport = useCallback(() => {
    setEditingExport(null);
    setIsExportModalOpen(true);
  }, []);

  const handleCancelImport = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to cancel this import?")) {
      try {
        const result = await dispatch(cancelStorageImportAction(id));
        if (cancelStorageImportAction.fulfilled.match(result)) {
          enqueueSnackbar("Import cancelled successfully!", { variant: "success" });
          dispatch(fetchStorageImports({}));
        } else {
          enqueueSnackbar(result.payload || "Failed to cancel import", { variant: "error" });
        }
      } catch (err) {
        logger.error("Error cancelling import:", err);
        enqueueSnackbar("An unexpected error occurred", { variant: "error" });
      }
    }
  }, [dispatch]);

  const handleCancelExport = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to cancel this export?")) {
      try {
        const result = await dispatch(cancelStorageExportAction(id));
        if (cancelStorageExportAction.fulfilled.match(result)) {
          enqueueSnackbar("Export cancelled successfully!", { variant: "success" });
          dispatch(fetchStorageExports({}));
        } else {
          enqueueSnackbar(result.payload || "Failed to cancel export", { variant: "error" });
        }
      } catch (err) {
        logger.error("Error cancelling export:", err);
        enqueueSnackbar("An unexpected error occurred", { variant: "error" });
      }
    }
  }, [dispatch]);

  const handleModalSuccess = useCallback(() => {
    if (activeTab === "imports") {
      dispatch(fetchStorageImports({}));
    } else {
      dispatch(fetchStorageExports({}));
    }
  }, [dispatch, activeTab]);

  if (importsLoading && imports.length === 0 && activeTab === "imports") {
    return <FullScreenLoader />;
  }

  if (exportsLoading && exports.length === 0 && activeTab === "exports") {
    return <FullScreenLoader />;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <BackButton />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] mb-1">
                Storage Management
              </h1>
              <p className="text-[#ababab] text-sm sm:text-base">
                Manage imports and exports
              </p>
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
              <button
                onClick={activeTab === "imports" ? handleCreateImport : handleCreateExport}
                className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e5a000] transition-colors text-sm sm:text-base"
              >
                <IoMdAdd size={20} />
                New {activeTab === "imports" ? "Import" : "Export"}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#343434] mb-6">
          <div className="flex gap-1 overflow-x-auto pb-2 -mb-px scrollbar-hide">
            <button
              className={`
                px-4 py-2.5 sm:px-6 sm:py-3 rounded-t-lg text-[#f5f5f5] font-medium text-sm whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-2 ${
                  activeTab === "imports"
                    ? "bg-[#262626] border-b-2 border-[#f6b100]"
                    : "bg-[#1a1a1a] hover:bg-[#262626]"
                }`}
              onClick={() => setActiveTab("imports")}
            >
              <MdInput size={18} />
              Imports
            </button>
            <button
              className={`
                px-4 py-2.5 sm:px-6 sm:py-3 rounded-t-lg text-[#f5f5f5] font-medium text-sm whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-2 ${
                  activeTab === "exports"
                    ? "bg-[#262626] border-b-2 border-[#f6b100]"
                    : "bg-[#1a1a1a] hover:bg-[#262626]"
                }`}
              onClick={() => setActiveTab("exports")}
            >
              <MdOutput size={18} />
              Exports
            </button>
          </div>
        </div>

        {/* Error Messages */}
        {importsError && activeTab === "imports" && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-lg">
            {importsError}
          </div>
        )}
        {exportsError && activeTab === "exports" && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-lg">
            {exportsError}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "imports" && (
          <ImportList
            imports={imports}
            loading={importsLoading}
            onCancel={handleCancelImport}
          />
        )}

        {activeTab === "exports" && (
          <ExportList
            exports={exports}
            loading={exportsLoading}
            onCancel={handleCancelExport}
          />
        )}

        {/* Modals */}
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            setEditingImport(null);
          }}
          mode={editingImport ? "edit" : "create"}
          importRecord={editingImport}
          onSuccess={handleModalSuccess}
        />

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => {
            setIsExportModalOpen(false);
            setEditingExport(null);
          }}
          mode={editingExport ? "edit" : "create"}
          exportRecord={editingExport}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
};

export default Storage;
