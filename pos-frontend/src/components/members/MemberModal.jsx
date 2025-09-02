import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MdClose,
  MdSave,
  MdPerson,
  MdEmail,
  MdPhone,
  MdLock,
} from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import {
  createNewMember,
  updateExistingMember,
  clearError,
} from "../../redux/slices/memberSlice";
import PropTypes from "prop-types";
import { FaUserTag } from "react-icons/fa";

const MemberModal = ({ isOpen, onClose, mode, member }) => {
  const dispatch = useDispatch();
  const { createLoading, updateLoading, error } = useSelector(
    (state) => state.members
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "User",
  });

  const [errors, setErrors] = useState({});

  const isEditMode = mode === "edit";
  const isLoading = createLoading || updateLoading;

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (isEditMode && member) {
      setFormData({
        name: member.name || "",
        email: member.email || "",
        phone: member.phone || "",
        password: "", // Don't populate password in edit mode
        role: member.role || "User",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "User",
      });
    }
    setErrors({});
  }, [isEditMode, member]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid phone number (exactly 10 digits)";
    }

    if (!isEditMode && !formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode) {
        // For edit mode, only send fields that have changed
        const updateData = {};
        if (formData.name !== member.name) updateData.name = formData.name;
        if (formData.email !== member.email) updateData.email = formData.email;
        if (formData.phone !== member.phone) updateData.phone = formData.phone;
        if (formData.role !== member.role) updateData.role = formData.role;

        if (Object.keys(updateData).length === 0) {
          enqueueSnackbar("No changes detected", { variant: "info" });
          return;
        }

        await dispatch(
          updateExistingMember({
            id: member._id,
            memberData: updateData,
          })
        ).unwrap();

        enqueueSnackbar("Member updated successfully!", { variant: "success" });
      } else {
        // For create mode, send all required fields
        const createData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          role: formData.role,
        };

        await dispatch(createNewMember(createData)).unwrap();

        enqueueSnackbar("Member created successfully!", { variant: "success" });
      }

      onClose();
    } catch (error) {
      enqueueSnackbar(error || "Operation failed", { variant: "error" });
    }
  };

  const roleOptions = [
    {
      value: "Admin",
      label: "Admin",
      description: "Full access to all features",
    },
    {
      value: "User",
      label: "User",
      description: "Basic access to orders and menu",
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1f1f] rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">
            {isEditMode ? "Edit Member" : "Add New Member"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
          >
            <MdClose size={20} className="text-[#ababab]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">
              <MdPerson className="inline mr-2" size={16} />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter full name"
              className={`w-full px-4 py-3 bg-[#262626] border rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors ${
                errors.name ? "border-red-500" : "border-[#343434]"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-red-400 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">
              <MdEmail className="inline mr-2" size={16} />
              Email Address (Optional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address (optional)"
              className={`w-full px-4 py-3 bg-[#262626] border rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors ${
                errors.email ? "border-red-500" : "border-[#343434]"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-red-400 text-sm">{errors.email}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">
              <MdPhone className="inline mr-2" size={16} />
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter phone number (10 digits)"
              className={`w-full px-4 py-3 bg-[#262626] border rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors ${
                errors.phone ? "border-red-500" : "border-[#343434]"
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-red-400 text-sm">{errors.phone}</p>
            )}
          </div>

          {/* Password Field - Only for create mode */}
          {!isEditMode && (
            <div>
              <label className="block text-[#ababab] mb-2 text-sm font-medium">
                <MdLock className="inline mr-2" size={16} />
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password (min 6 characters)"
                className={`w-full px-4 py-3 bg-[#262626] border rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors ${
                  errors.password ? "border-red-500" : "border-[#343434]"
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-red-400 text-sm">{errors.password}</p>
              )}
            </div>
          )}

          {/* Role Field */}
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">
              <FaUserTag className="inline mr-2" size={16} />
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-[#262626] border rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100] transition-colors ${
                errors.role ? "border-red-500" : "border-[#343434]"
              }`}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-red-400 text-sm">{errors.role}</p>
            )}

            {/* Role description */}
            <div className="mt-2 p-3 bg-[#262626] rounded-lg border border-[#343434]">
              <p className="text-[#ababab] text-sm">
                <strong>{formData.role}:</strong>{" "}
                {
                  roleOptions.find((opt) => opt.value === formData.role)
                    ?.description
                }
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[#262626] text-[#f5f5f5] rounded-lg font-medium hover:bg-[#343434] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#1f1f1f] border-t-transparent rounded-full animate-spin"></div>
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <MdSave size={16} />
                  {isEditMode ? "Update Member" : "Create Member"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

MemberModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit"]).isRequired,
  member: PropTypes.object,
};

export default MemberModal;
