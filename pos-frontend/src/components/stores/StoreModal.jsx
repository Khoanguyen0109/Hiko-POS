import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MdClose,
  MdSave,
  MdStore,
  MdPhone,
  MdLocationOn,
  MdCode,
  MdAccessTime,
} from "react-icons/md";
import { FormField, Modal, Button } from "../ui";
import { enqueueSnackbar } from "notistack";
import {
  createNewStore,
  updateExistingStore,
  clearStoreError,
} from "../../redux/slices/storeSlice";
import PropTypes from "prop-types";

const StoreModal = ({ isOpen, onClose, mode, store }) => {
  const dispatch = useDispatch();
  const { createLoading, updateLoading, error } = useSelector(
    (state) => state.store
  );

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    currency: "VND",
    timezone: "Asia/Ho_Chi_Minh",
    openTime: "",
    closeTime: "",
  });

  const [errors, setErrors] = useState({});

  const isEditMode = mode === "edit";
  const isLoading = createLoading || updateLoading;

  useEffect(() => {
    if (error) {
      dispatch(clearStoreError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (isEditMode && store) {
      setFormData({
        name: store.name || "",
        code: store.code || "",
        address: store.address || "",
        phone: store.phone || "",
        currency: store.settings?.currency || "VND",
        timezone: store.settings?.timezone || "Asia/Ho_Chi_Minh",
        openTime: store.settings?.openTime || "",
        closeTime: store.settings?.closeTime || "",
      });
    } else {
      setFormData({
        name: "",
        code: "",
        address: "",
        phone: "",
        currency: "VND",
        timezone: "Asia/Ho_Chi_Minh",
        openTime: "",
        closeTime: "",
      });
    }
    setErrors({});
  }, [isEditMode, store]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Store name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Store name must be at least 2 characters";
    }

    if (!isEditMode && !formData.code.trim()) {
      newErrors.code = "Store code is required";
    } else if (!isEditMode && formData.code.trim().length < 2) {
      newErrors.code = "Store code must be at least 2 characters";
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

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditMode) {
        const updateData = { id: store._id };
        if (formData.name !== store.name) updateData.name = formData.name;
        if (formData.address !== store.address)
          updateData.address = formData.address;
        if (formData.phone !== store.phone) updateData.phone = formData.phone;

        const settingsChanged =
          formData.currency !== (store.settings?.currency || "VND") ||
          formData.timezone !==
            (store.settings?.timezone || "Asia/Ho_Chi_Minh") ||
          formData.openTime !== (store.settings?.openTime || "") ||
          formData.closeTime !== (store.settings?.closeTime || "");

        if (settingsChanged) {
          updateData.settings = {
            currency: formData.currency,
            timezone: formData.timezone,
            openTime: formData.openTime,
            closeTime: formData.closeTime,
          };
        }

        const changedKeys = Object.keys(updateData).filter((k) => k !== "id");
        if (changedKeys.length === 0) {
          enqueueSnackbar("No changes detected", { variant: "info" });
          return;
        }

        await dispatch(updateExistingStore(updateData)).unwrap();
        enqueueSnackbar("Store updated successfully!", { variant: "success" });
      } else {
        const createData = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          settings: {
            currency: formData.currency,
            timezone: formData.timezone,
            openTime: formData.openTime,
            closeTime: formData.closeTime,
          },
        };

        await dispatch(createNewStore(createData)).unwrap();
        enqueueSnackbar("Store created successfully!", { variant: "success" });
      }

      onClose();
    } catch (err) {
      enqueueSnackbar(err || "Operation failed", { variant: "error" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1f1f] rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">
            {isEditMode ? "Edit Store" : "Add New Store"}
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
          <FormField
            label="Store Name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              handleInputChange({
                target: { name: "name", value: e.target.value },
              })
            }
            error={errors.name}
            placeholder="Enter store name"
            icon={<MdStore size={16} />}
            required
          />

          {!isEditMode && (
            <FormField
              label="Store Code"
              type="text"
              value={formData.code}
              onChange={(e) =>
                handleInputChange({
                  target: {
                    name: "code",
                    value: e.target.value.toUpperCase(),
                  },
                })
              }
              error={errors.code}
              placeholder="e.g. STORE01"
              icon={<MdCode size={16} />}
              required
              helpText="Unique identifier, auto-uppercased"
            />
          )}

          <FormField
            label="Address"
            type="text"
            value={formData.address}
            onChange={(e) =>
              handleInputChange({
                target: { name: "address", value: e.target.value },
              })
            }
            error={errors.address}
            placeholder="Store address"
            icon={<MdLocationOn size={16} />}
          />

          <FormField
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              handleInputChange({
                target: { name: "phone", value: e.target.value },
              })
            }
            error={errors.phone}
            placeholder="Store phone number"
            icon={<MdPhone size={16} />}
          />

          {/* Settings Section */}
          <div className="border-t border-[#343434] pt-4">
            <p className="text-[#ababab] text-xs font-medium uppercase tracking-wider mb-4">
              Settings
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100] transition-colors text-sm"
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                </select>
              </div>
              <div>
                <label className="block text-[#ababab] text-sm mb-1">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100] transition-colors text-sm"
                >
                  <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="America/New_York">America/New York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <FormField
                label="Open Time"
                type="time"
                value={formData.openTime}
                onChange={(e) =>
                  handleInputChange({
                    target: { name: "openTime", value: e.target.value },
                  })
                }
                icon={<MdAccessTime size={16} />}
              />
              <FormField
                label="Close Time"
                type="time"
                value={formData.closeTime}
                onChange={(e) =>
                  handleInputChange({
                    target: { name: "closeTime", value: e.target.value },
                  })
                }
                icon={<MdAccessTime size={16} />}
              />
            </div>
          </div>

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
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update Store"
                  : "Create Store"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

StoreModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit"]).isRequired,
  store: PropTypes.object,
};

export default StoreModal;
