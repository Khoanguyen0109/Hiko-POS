import { useState, useEffect, memo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
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
        <MdInput size={64} className="text-[#343434] mx-auto mb-4" />
        <p className="text-[#ababab] text-lg">No imports found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {imports.map((importRecord) => (
        <motion.div
          key={importRecord._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434] hover:border-[#f6b100]/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-[#f5f5f5] font-semibold text-lg">
                  {importRecord.importNumber}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    importRecord.status === "completed"
                      ? "bg-green-900/30 text-green-400 border border-green-800"
                      : importRecord.status === "pending"
                      ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                      : "bg-red-900/30 text-red-400 border border-red-800"
                  }`}
                >
                  {importRecord.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-[#ababab] text-sm mb-1">Item</p>
                  <p className="text-[#f5f5f5] font-medium">
                    {importRecord.storageItemId?.name || "N/A"} ({importRecord.storageItemId?.code || "N/A"})
                  </p>
                </div>
                <div>
                  <p className="text-[#ababab] text-sm mb-1">Quantity</p>
                  <p className="text-[#f5f5f5] font-medium">
                    {importRecord.quantity} {importRecord.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[#ababab] text-sm mb-1">Unit Cost</p>
                  <p className="text-[#f5f5f5] font-medium">
                    {importRecord.unitCost?.toLocaleString("vi-VN")} VND
                  </p>
                </div>
                <div>
                  <p className="text-[#ababab] text-sm mb-1">Total Cost</p>
                  <p className="text-[#f6b100] font-bold text-lg">
                    {importRecord.totalCost?.toLocaleString("vi-VN")} VND
                  </p>
                </div>
                {importRecord.supplierName && (
                  <div>
                    <p className="text-[#ababab] text-sm mb-1">Supplier</p>
                    <p className="text-[#f5f5f5] font-medium">
                      {importRecord.supplierName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[#ababab] text-sm mb-1">Date</p>
                  <p className="text-[#f5f5f5] font-medium">
                    {new Date(importRecord.importDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>

              {importRecord.notes && (
                <div className="mt-4 pt-4 border-t border-[#343434]">
                  <p className="text-[#ababab] text-sm">{importRecord.notes}</p>
                </div>
              )}
            </div>

            {importRecord.status !== "cancelled" && (
              <button
                onClick={() => onCancel(importRecord._id)}
                className="ml-4 px-4 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
});

ImportList.displayName = 'ImportList';
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
        <MdOutput size={64} className="text-[#343434] mx-auto mb-4" />
        <p className="text-[#ababab] text-lg">No exports found</p>
      </div>
    );
  }

  const reasonLabels = {
    production: "Production",
    waste: "Waste",
    damage: "Damage",
    theft: "Theft",
    transfer: "Transfer",
    other: "Other"
  };

  return (
    <div className="space-y-4">
      {exports.map((exportRecord) => (
        <motion.div
          key={exportRecord._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434] hover:border-[#f6b100]/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-[#f5f5f5] font-semibold text-lg">
                  {exportRecord.exportNumber}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    exportRecord.status === "completed"
                      ? "bg-green-900/30 text-green-400 border border-green-800"
                      : exportRecord.status === "pending"
                      ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                      : "bg-red-900/30 text-red-400 border border-red-800"
                  }`}
                >
                  {exportRecord.status}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-800">
                  {reasonLabels[exportRecord.reason] || exportRecord.reason}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-[#ababab] text-sm mb-1">Item</p>
                  <p className="text-[#f5f5f5] font-medium">
                    {exportRecord.storageItemId?.name || "N/A"} ({exportRecord.storageItemId?.code || "N/A"})
                  </p>
                </div>
                <div>
                  <p className="text-[#ababab] text-sm mb-1">Quantity</p>
                  <p className="text-[#f5f5f5] font-medium">
                    {exportRecord.quantity} {exportRecord.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[#ababab] text-sm mb-1">Date</p>
                  <p className="text-[#f5f5f5] font-medium">
                    {new Date(exportRecord.exportDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div>
                  <p className="text-[#ababab] text-sm mb-1">Exported By</p>
                  <p className="text-[#f5f5f5] font-medium">
                    {exportRecord.exportedBy?.userName || "N/A"}
                  </p>
                </div>
              </div>

              {exportRecord.notes && (
                <div className="mt-4 pt-4 border-t border-[#343434]">
                  <p className="text-[#ababab] text-sm">{exportRecord.notes}</p>
                </div>
              )}
            </div>

            {exportRecord.status !== "cancelled" && (
              <button
                onClick={() => onCancel(exportRecord._id)}
                className="ml-4 px-4 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
});

ExportList.displayName = 'ExportList';
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
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-[#f5f5f5] mb-2">
                Storage Management
              </h1>
              <p className="text-[#ababab]">
                Manage imports and exports
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <>
                  <button
                    onClick={() => navigate("/storage/items")}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1f1f1f] text-[#f5f5f5] rounded-lg hover:bg-[#262626] border border-[#343434] transition-colors"
                  >
                    <MdSettings size={18} />
                    Manage Items
                  </button>
                  <button
                    onClick={() => navigate("/storage/suppliers")}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1f1f1f] text-[#f5f5f5] rounded-lg hover:bg-[#262626] border border-[#343434] transition-colors"
                  >
                    <MdBusiness size={18} />
                    Suppliers
                  </button>
                </>
              )}
              <button
                onClick={activeTab === "imports" ? handleCreateImport : handleCreateExport}
                className="flex items-center gap-2 px-6 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e5a000] transition-colors"
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
