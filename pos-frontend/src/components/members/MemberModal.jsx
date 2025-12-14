import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MdClose,
  MdSave,
  MdPerson,
  MdEmail,
  MdPhone,
  MdLock,
  MdAttachMoney,
} from "react-icons/md";
import { FormField, FormSelect, Modal, Button } from "../ui";
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
    salary: 0,
  });

  const [errors, setErrors] = useState({});

  const isEditMode = mode === "edit";
  const isLoading = createLoading || updateLoading;

  // useEffect(() => {
  //   if (error) {
  //     dispatch(clearError());
  //   }
  // }, [error, dispatch]);

  useEffect(() => {
    if (isEditMode && member) {
      setFormData({
        name: member.name || "",
        email: member.email || "",
        phone: member.phone || "",
        password: "", // Don't populate password in edit mode
        role: member.role || "User",
        salary: member.salary || 0,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "User",
        salary: 0,
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

    if (formData.salary !== undefined && formData.salary < 0) {
      newErrors.salary = "Salary cannot be negative";
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
        if (formData.salary !== member.salary) updateData.salary = formData.salary;

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
          salary: formData.salary || 0,
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
          <FormField
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange({ target: { name: 'name', value: e.target.value } })}
            error={errors.name}
            placeholder="Enter full name"
            icon={<MdPerson size={16} />}
            required
          />

          {/* Email Field */}
          <FormField
            label="Email Address (Optional)"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange({ target: { name: 'email', value: e.target.value } })}
            error={errors.email}
            placeholder="Enter email address (optional)"
            icon={<MdEmail size={16} />}
          />

          {/* Phone Field */}
          <FormField
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange({ target: { name: 'phone', value: e.target.value } })}
            error={errors.phone}
            placeholder="Enter phone number (10 digits)"
            icon={<MdPhone size={16} />}
            required
          />

          {/* Password Field - Only for create mode */}
          {!isEditMode && (
            <FormField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange({ target: { name: 'password', value: e.target.value } })}
              error={errors.password}
              placeholder="Enter password (min 6 characters)"
              icon={<MdLock size={16} />}
              required
              helpText="Minimum 6 characters required"
            />
          )}

          {/* Role Field */}
          <FormSelect
            label="Role"
            value={formData.role}
            onChange={(e) => handleInputChange({ target: { name: 'role', value: e.target.value } })}
            options={roleOptions}
            error={errors.role}
            icon={<FaUserTag size={16} />}
            required
            placeholder="Select a role"
            helpText={
              formData.role ? 
              `${formData.role}: ${roleOptions.find((opt) => opt.value === formData.role)?.description}` :
              "Choose the appropriate role for this member"
            }
          />

          {/* Salary Field */}
          <FormField
            label="Salary"
            type="number"
            value={formData.salary}
            onChange={(e) => handleInputChange({ target: { name: 'salary', value: Number(e.target.value) } })}
            error={errors.salary}
            placeholder="Enter salary amount"
            icon={<MdAttachMoney size={16} />}
            helpText="Monthly salary in your currency"
            min="0"
            step="0.01"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
              icon={<MdSave size={16} />}
              className="flex-1"
            >
              {isLoading 
                ? (isEditMode ? "Updating..." : "Creating...")
                : (isEditMode ? "Update Member" : "Create Member")
              }
            </Button>
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
