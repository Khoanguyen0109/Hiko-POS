import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdRefresh,
  MdToggleOn,
  MdToggleOff,
  MdStore,
  MdLocationOn,
  MdPhone,
  MdCode,
  MdAccessTime,
} from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import {
  fetchAllStores,
  removeStore,
  updateExistingStore,
  clearStoreError,
} from "../redux/slices/storeSlice";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import BackButton from "../components/shared/BackButton";
import StoreModal from "../components/stores/StoreModal";
import DeleteConfirmationModal from "../components/shared/DeleteConfirmationModal";

const Stores = () => {
  const dispatch = useDispatch();
  const {
    allStores,
    allStoresLoading: loading,
    error,
    deleteLoading,
    updateLoading,
  } = useSelector((state) => state.store);
  const { role } = useSelector((state) => state.user);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [filteredStores, setFilteredStores] = useState([]);

  const isAdmin = role === "Admin";

  useEffect(() => {
    document.title = "POS | Stores";
    if (isAdmin) {
      dispatch(fetchAllStores());
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearStoreError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (allStores.length > 0) {
      let filtered = allStores.filter(
        (store) =>
          store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          store.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (store.address || "").toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (statusFilter === "active") {
        filtered = filtered.filter((s) => s.isActive !== false);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((s) => s.isActive === false);
      }

      setFilteredStores(filtered);
    } else {
      setFilteredStores([]);
    }
  }, [allStores, searchTerm, statusFilter]);

  const handleCreateStore = () => {
    setSelectedStore(null);
    setShowCreateModal(true);
  };

  const handleEditStore = (store) => {
    setSelectedStore(store);
    setShowEditModal(true);
  };

  const handleDeleteStore = (store) => {
    setSelectedStore(store);
    setShowDeleteModal(true);
  };

  const handleToggleActive = async (store) => {
    try {
      await dispatch(
        updateExistingStore({
          id: store._id,
          isActive: !store.isActive,
        })
      ).unwrap();
      const statusText = store.isActive ? "deactivated" : "activated";
      enqueueSnackbar(`Store ${statusText} successfully!`, {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar(err || "Failed to toggle store status", {
        variant: "error",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedStore) {
      try {
        await dispatch(removeStore(selectedStore._id)).unwrap();
        enqueueSnackbar("Store deleted successfully!", { variant: "success" });
        setShowDeleteModal(false);
        setSelectedStore(null);
      } catch (err) {
        enqueueSnackbar(err || "Failed to delete store", { variant: "error" });
      }
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedStore(null);
  };

  const handleRefresh = () => {
    dispatch(fetchAllStores());
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">
            Access Denied
          </h2>
          <p className="text-[#ababab]">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-4 border-b border-[#343434]">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Stores
          </h1>
          <div className="flex items-center gap-2 text-sm text-[#ababab]">
            <span>•</span>
            <span>{filteredStores.length} stores found</span>
            {loading && <span className="text-[#f6b100]">• Loading...</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateStore}
            className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors flex items-center gap-2"
          >
            <MdAdd size={16} /> Add Store
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-[#262626] text-[#f5f5f5] rounded-lg font-medium hover:bg-[#343434] transition-colors flex items-center gap-2"
          >
            <MdRefresh size={16} className={loading ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-10 py-4 border-b border-[#343434] bg-[#1a1a1a]">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <MdSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ababab]"
              size={20}
            />
            <input
              type="text"
              placeholder="Search stores by name, code, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100] transition-colors cursor-pointer min-w-[140px]"
            >
              <option value="all">All Stores</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="px-10 py-6">
        {loading ? (
          <FullScreenLoader />
        ) : filteredStores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStores.map((store) => (
              <StoreCard
                key={store._id}
                store={store}
                onEdit={handleEditStore}
                onDelete={handleDeleteStore}
                onToggleActive={handleToggleActive}
                toggleLoading={updateLoading}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-[#262626] rounded-full flex items-center justify-center mb-4">
              <MdStore size={32} className="text-[#ababab]" />
            </div>
            <h3 className="text-[#f5f5f5] text-lg font-semibold mb-2">
              No Stores Found
            </h3>
            <p className="text-[#ababab] text-sm max-w-md">
              {searchTerm
                ? `No stores found matching "${searchTerm}". Try a different search term.`
                : "No stores have been created yet. Click 'Add Store' to create your first store."}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateStore}
                className="mt-4 px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg text-sm font-medium hover:bg-[#f6b100]/90 transition-colors"
              >
                Add First Store
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <StoreModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          mode="create"
        />
      )}

      {showEditModal && selectedStore && (
        <StoreModal
          isOpen={showEditModal}
          onClose={handleModalClose}
          mode="edit"
          store={selectedStore}
        />
      )}

      {showDeleteModal && selectedStore && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Store"
          message={`Are you sure you want to deactivate "${selectedStore.name}" (${selectedStore.code})? This will soft-delete the store.`}
          confirmText="Delete Store"
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

const StoreCard = ({ store, onEdit, onDelete, onToggleActive, toggleLoading }) => {
  const isActive = store.isActive !== false;

  return (
    <div
      className={`bg-[#1f1f1f] rounded-lg p-6 border transition-all duration-200 ${
        isActive
          ? "border-[#343434] hover:border-[#f6b100]/30"
          : "border-red-900/50 opacity-75"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isActive ? "bg-[#f6b100]" : "bg-gray-600"
          }`}
        >
          <MdStore size={24} className="text-[#1f1f1f]" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleActive(store)}
            disabled={toggleLoading}
            className={`p-2 rounded-lg hover:bg-[#343434] transition-colors ${
              isActive
                ? "bg-[#262626] text-green-400"
                : "bg-[#262626] text-gray-500"
            }`}
            title={isActive ? "Deactivate Store" : "Activate Store"}
          >
            {isActive ? <MdToggleOn size={16} /> : <MdToggleOff size={16} />}
          </button>
          <button
            onClick={() => onEdit(store)}
            className="p-2 bg-[#262626] text-[#f6b100] rounded-lg hover:bg-[#343434] transition-colors"
            title="Edit Store"
          >
            <MdEdit size={16} />
          </button>
          <button
            onClick={() => onDelete(store)}
            className="p-2 bg-[#262626] text-red-400 rounded-lg hover:bg-[#343434] transition-colors"
            title="Delete Store"
          >
            <MdDelete size={16} />
          </button>
        </div>
      </div>

      {/* Store Info */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#f5f5f5] text-lg font-semibold">
              {store.name}
            </h3>
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                isActive
                  ? "bg-green-900/30 text-green-400 border border-green-700"
                  : "bg-red-900/30 text-red-400 border border-red-700"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border bg-blue-900/20 text-blue-400 border-blue-700">
            <MdCode size={14} />
            <span>{store.code}</span>
          </div>
        </div>

        <div className="space-y-2">
          {store.address && (
            <div className="flex items-center gap-3 text-[#ababab]">
              <MdLocationOn size={14} />
              <span className="text-sm truncate">{store.address}</span>
            </div>
          )}
          {store.phone && (
            <div className="flex items-center gap-3 text-[#ababab]">
              <MdPhone size={14} />
              <span className="text-sm">{store.phone}</span>
            </div>
          )}
          {store.owner && (
            <div className="flex items-center gap-3 text-[#f6b100]">
              <span className="text-sm font-medium">
                Owner: {store.owner.name || "N/A"}
              </span>
            </div>
          )}
          {(store.settings?.openTime || store.settings?.closeTime) && (
            <div className="flex items-center gap-3 text-[#ababab]">
              <MdAccessTime size={14} />
              <span className="text-sm">
                {store.settings.openTime || "--:--"} -{" "}
                {store.settings.closeTime || "--:--"}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#343434] flex items-center justify-between">
          <p className="text-[#ababab] text-xs">
            Created:{" "}
            {new Date(store.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          {store.settings?.currency && (
            <span className="text-xs text-[#ababab] bg-[#262626] px-2 py-0.5 rounded">
              {store.settings.currency}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

StoreCard.propTypes = {
  store: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    address: PropTypes.string,
    phone: PropTypes.string,
    isActive: PropTypes.bool,
    owner: PropTypes.shape({
      name: PropTypes.string,
    }),
    settings: PropTypes.shape({
      currency: PropTypes.string,
      timezone: PropTypes.string,
      openTime: PropTypes.string,
      closeTime: PropTypes.string,
    }),
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleActive: PropTypes.func.isRequired,
  toggleLoading: PropTypes.bool.isRequired,
};

export default Stores;
