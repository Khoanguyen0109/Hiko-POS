import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { MdClose, MdSave, MdCancel, MdBusiness, MdPhone } from "react-icons/md";
import { createVendor, editVendor } from "../../redux/slices/spendingSlice";
import PropTypes from "prop-types";

const VendorModal = ({ 
  isOpen, 
  onClose, 
  mode = "create", 
  vendor = null, 
  onSuccess 
}) => {
  const dispatch = useDispatch();
  const initialFormData = useMemo(() => ({
    name: "",
    phone: "",
    isActive: true
  }), []);

  const [formData, setFormData] = useState(initialFormData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (vendor && mode !== "create") {
      setFormData({
        name: vendor.name || "",
        phone: vendor.phone || "",
        isActive: vendor.isActive !== undefined ? vendor.isActive : true
      });
    } else if (mode === "create") {
      // Reset form for create mode
      setFormData(initialFormData);
    }
  }, [vendor, mode, initialFormData]);

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
        result = await dispatch(createVendor(submitData));
      } else {
        result = await dispatch(editVendor({ vendorId: vendor._id, ...submitData }));
      }

      if (result.meta.requestStatus === 'fulfilled') {
        // Reset form only for create mode
        if (mode === "create") {
          setFormData(initialFormData);
          setError("");
        }
        onSuccess?.(result.payload);
        onClose();
      } else {
        throw new Error(result.payload?.message || `Failed to ${mode} vendor`);
      }
    } catch (err) {
      setError(err.message || err.response?.data?.message || `Failed to ${mode} vendor`);
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
            {mode === "create" ? "Add New Vendor" : 
             mode === "edit" ? "Edit Vendor" : "View Vendor"}
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
          <div className="mx-6 mt-4 p-4 bg-red-500 text-white rounded-lg">
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
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  required
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
                  placeholder="Enter vendor name"
                />
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  <MdPhone className="inline mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
                  placeholder="+84 123 456 789"
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
                Active Vendor
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#343434]">
            <h3 className="text-[#f5f5f5] font-medium mb-3">Preview</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[#f5f5f5] font-semibold text-lg">
                  {formData.name || "Vendor Name"}
                </h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  formData.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {formData.phone && (
                <p className="text-[#ababab] text-sm">
                  <strong>Phone:</strong> {formData.phone}
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
                disabled={loading}
                className="px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg hover:bg-[#e5a000] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdSave />
                {loading ? "Saving..." : mode === "create" ? "Create Vendor" : "Update Vendor"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

VendorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit", "view"]),
  vendor: PropTypes.object,
  onSuccess: PropTypes.func
};

export default VendorModal;
