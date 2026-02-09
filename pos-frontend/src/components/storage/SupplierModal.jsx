import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { MdClose, MdSave, MdCancel, MdBusiness, MdEmail, MdPhone, MdLocationOn, MdDescription } from "react-icons/md";
import { createSupplierAction, editSupplier } from "../../redux/slices/supplierSlice";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";

const SupplierModal = ({ 
  isOpen, 
  onClose, 
  mode = "create", 
  supplier = null, 
  onSuccess 
}) => {
  const dispatch = useDispatch();
  const initialFormData = useMemo(() => ({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    notes: "",
    isActive: true
  }), []);

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (supplier && mode !== "create") {
      setFormData({
        name: supplier.name || "",
        code: supplier.code || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        taxId: supplier.taxId || "",
        notes: supplier.notes || "",
        isActive: supplier.isActive !== undefined ? supplier.isActive : true
      });
    } else if (mode === "create") {
      setFormData(initialFormData);
    }
  }, [supplier, mode, initialFormData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Supplier name is required");
      setLoading(false);
      return;
    }

    if (formData.name.trim().length < 2) {
      setError("Supplier name must be at least 2 characters");
      setLoading(false);
      return;
    }

    try {
      const submitData = { ...formData };
      
      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === "" || submitData[key] === null) {
          delete submitData[key];
        }
      });

      let result;
      if (mode === "create") {
        result = await dispatch(createSupplierAction(submitData));
      } else {
        result = await dispatch(editSupplier({ id: supplier._id, ...submitData }));
      }

      if (result.meta.requestStatus === 'fulfilled') {
        if (mode === "create") {
          setFormData(initialFormData);
          setError("");
          enqueueSnackbar("Supplier created successfully!", { variant: "success" });
        } else {
          enqueueSnackbar("Supplier updated successfully!", { variant: "success" });
        }
        onSuccess?.(result.payload);
        onClose();
      } else {
        throw new Error(result.payload || `Failed to ${mode} supplier`);
      }
    } catch (err) {
      const errorMsg = err.message || err.response?.data?.message || `Failed to ${mode} supplier`;
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isViewMode = mode === "view";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#262626] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <h2 className="text-xl font-semibold text-[#f5f5f5]">
            {mode === "create" ? "Add New Supplier" : 
             mode === "edit" ? "Edit Supplier" : "View Supplier"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#f5f5f5] border-b border-[#343434] pb-2 flex items-center gap-2">
              <MdBusiness /> Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                  <MdBusiness className="text-[#ababab] mr-2" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    required
                    className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50"
                    placeholder="Enter supplier name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Supplier Code <span className="text-xs text-[#ababab]">(Optional)</span>
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50 uppercase"
                    placeholder="SUPPLIER-001"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  <MdEmail className="inline mr-1" size={16} />
                  Email
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50"
                    placeholder="supplier@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  <MdPhone className="inline mr-1" size={16} />
                  Phone
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50"
                    placeholder="+84 123 456 789"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#ababab] text-sm mb-2">
                <MdLocationOn className="inline mr-1" size={16} />
                Address
              </label>
              <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50"
                  placeholder="Enter supplier address"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#ababab] text-sm mb-2">
                Tax ID
              </label>
              <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50"
                  placeholder="Enter tax identification number"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#ababab] text-sm mb-2">
                <MdDescription className="inline mr-1" size={16} />
                Notes
              </label>
              <div className="rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-[#f6b100]">
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  rows="3"
                  className="bg-transparent flex-1 text-white focus:outline-none disabled:opacity-50 resize-none w-full"
                  placeholder="Additional notes about the supplier"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center text-[#ababab] text-sm">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="mr-2 rounded focus:ring-[#f6b100] focus:ring-2"
                />
                Active Supplier
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#343434]">
            <h3 className="text-[#f5f5f5] font-medium mb-3">Preview</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[#f5f5f5] font-semibold text-lg">
                  {formData.name || "Supplier Name"}
                </h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  formData.isActive ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-gray-500/20 text-gray-400 border border-gray-500'
                }`}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {formData.code && (
                <p className="text-[#ababab] text-sm">
                  <strong>Code:</strong> {formData.code}
                </p>
              )}
              {formData.email && (
                <p className="text-[#ababab] text-sm">
                  <strong>Email:</strong> {formData.email}
                </p>
              )}
              {formData.phone && (
                <p className="text-[#ababab] text-sm">
                  <strong>Phone:</strong> {formData.phone}
                </p>
              )}
              {formData.address && (
                <p className="text-[#ababab] text-sm">
                  <strong>Address:</strong> {formData.address}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isViewMode && (
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#343434]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-[#1a1a1a] text-[#f5f5f5] rounded-lg hover:bg-[#343434] transition-colors flex items-center gap-2"
              >
                <MdCancel /> Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg hover:bg-[#e5a000] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <MdSave />
                {loading ? "Saving..." : mode === "create" ? "Create Supplier" : "Update Supplier"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

SupplierModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit", "view"]),
  supplier: PropTypes.object,
  onSuccess: PropTypes.func
};

export default SupplierModal;
