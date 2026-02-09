import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { IoMdAdd, IoMdMedkit, IoMdTrash } from "react-icons/io";
import { MdBusiness, MdToggleOn, MdToggleOff, MdEmail, MdPhone, MdLocationOn } from "react-icons/md";
import {
  fetchSuppliers,
  removeSupplier,
  editSupplier,
} from "../redux/slices/supplierSlice";
import { enqueueSnackbar } from "notistack";
import SupplierModal from "../components/storage/SupplierModal";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import PropTypes from "prop-types";
import BackButton from "../components/shared/BackButton";

const SupplierCard = ({ supplier, onEdit, onDelete, onToggleStatus }) => {
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
          onClick={() => onToggleStatus(supplier)}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            supplier.isActive
              ? "bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-800"
              : "bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800"
          }`}
          title={
            supplier.isActive ? "Deactivate supplier" : "Activate supplier"
          }
        >
          {supplier.isActive ? (
            <MdToggleOn size={18} />
          ) : (
            <MdToggleOff size={18} />
          )}
        </button>

        {/* Edit Button */}
        <button
          onClick={() => onEdit(supplier)}
          className="p-2 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-800 transition-colors duration-200"
          title="Edit supplier"
        >
          <IoMdMedkit size={18} />
        </button>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(supplier)}
          className="p-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800 transition-colors duration-200"
          title="Delete supplier"
        >
          <IoMdTrash size={18} />
        </button>
      </div>

      {/* Supplier Content */}
      <div className="pr-32">
        {/* Supplier Header */}
        <div className="flex items-center gap-4 mb-4">
          {/* Supplier Icon */}
          <div className="w-12 h-12 rounded-full border-2 border-[#343434] bg-[#f6b100]/20 flex items-center justify-center">
            <MdBusiness size={20} className="text-[#f6b100]" />
          </div>

          {/* Supplier Info */}
          <div className="flex-1">
            <h3 className="text-[#f5f5f5] text-lg font-semibold mb-1">
              {supplier.name}
            </h3>
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  supplier.isActive
                    ? "bg-green-900/30 text-green-400 border border-green-800"
                    : "bg-red-900/30 text-red-400 border border-red-800"
                }`}
              >
                {supplier.isActive ? "Active" : "Inactive"}
              </span>
              {supplier.code && (
                <span className="text-[#ababab] text-xs">
                  Code: {supplier.code}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Supplier Details */}
        <div className="space-y-2">
          {supplier.email && (
            <div className="flex items-center gap-2 text-[#ababab] text-sm">
              <MdEmail size={16} />
              <span>{supplier.email}</span>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2 text-[#ababab] text-sm">
              <MdPhone size={16} />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-2 text-[#ababab] text-sm">
              <MdLocationOn size={16} />
              <span>{supplier.address}</span>
            </div>
          )}
          {supplier.taxId && (
            <div className="text-[#ababab] text-xs">
              Tax ID: {supplier.taxId}
            </div>
          )}
        </div>

        {/* Notes */}
        {supplier.notes && (
          <div className="mt-4 pt-4 border-t border-[#343434]">
            <p className="text-[#ababab] text-xs mb-1">Notes:</p>
            <p className="text-[#ababab] text-sm">{supplier.notes}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

SupplierCard.propTypes = {
  supplier: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    address: PropTypes.string,
    taxId: PropTypes.string,
    notes: PropTypes.string,
    isActive: PropTypes.bool.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
};

const Suppliers = () => {
  const dispatch = useDispatch();
  const {
    items: suppliers,
    loading,
    error,
  } = useSelector((state) => state.suppliers);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchSuppliers({ isActive: filterStatus === "all" ? undefined : filterStatus === "active" }));
  }, [dispatch, filterStatus]);

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setIsSupplierModalOpen(true);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setIsSupplierModalOpen(true);
  };

  const handleDeleteSupplier = async (supplier) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`
      )
    ) {
      try {
        const resultAction = await dispatch(removeSupplier(supplier._id));
        if (removeSupplier.fulfilled.match(resultAction)) {
          enqueueSnackbar("Supplier deleted successfully!", {
            variant: "success",
          });
        } else {
          const errorMessage =
            resultAction.payload || "Failed to delete supplier";
          enqueueSnackbar(errorMessage, { variant: "error" });
        }
      } catch {
        enqueueSnackbar("An unexpected error occurred", { variant: "error" });
      }
    }
  };

  const handleToggleStatus = async (supplier) => {
    try {
      const resultAction = await dispatch(
        editSupplier({ id: supplier._id, isActive: !supplier.isActive })
      );

      if (editSupplier.fulfilled.match(resultAction)) {
        const newStatus = resultAction.payload.isActive;
        enqueueSnackbar(
          `Supplier ${newStatus ? "activated" : "deactivated"} successfully!`,
          { variant: "success" }
        );
      } else {
        const errorMessage =
          resultAction.payload || "Failed to update supplier status";
        enqueueSnackbar(errorMessage, { variant: "error" });
      }
    } catch {
      enqueueSnackbar("An unexpected error occurred", { variant: "error" });
    }
  };

  const handleModalSuccess = () => {
    dispatch(fetchSuppliers({ isActive: filterStatus === "all" ? undefined : filterStatus === "active" }));
  };

  const handleCloseModal = () => {
    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
  };

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.code && supplier.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && supplier.isActive) ||
      (filterStatus === "inactive" && !supplier.isActive);

    return matchesSearch && matchesStatus;
  });

  if (loading && suppliers.length === 0) {
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
                Supplier Management
              </h1>
              <p className="text-[#ababab]">
                Manage your suppliers and vendors
              </p>
            </div>
            <button
              onClick={handleAddSupplier}
              className="flex items-center gap-2 px-6 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e5a000] transition-colors"
            >
              <IoMdAdd size={20} />
              Add Supplier
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search suppliers by name, code, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#1f1f1f] border border-[#343434] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-[#f6b100] text-[#1f1f1f]"
                  : "bg-[#1f1f1f] text-[#ababab] border border-[#343434]"
              }`}
            >
              All
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
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Suppliers Grid */}
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <MdBusiness size={64} className="text-[#343434] mx-auto mb-4" />
            <p className="text-[#ababab] text-lg">
              {searchQuery
                ? "No suppliers found matching your search"
                : "No suppliers found"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddSupplier}
                className="mt-4 px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e5a000] transition-colors"
              >
                Add Your First Supplier
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier._id}
                supplier={supplier}
                onEdit={handleEditSupplier}
                onDelete={handleDeleteSupplier}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}

        {/* Supplier Modal */}
        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={handleCloseModal}
          mode={editingSupplier ? "edit" : "create"}
          supplier={editingSupplier}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
};

export default Suppliers;
