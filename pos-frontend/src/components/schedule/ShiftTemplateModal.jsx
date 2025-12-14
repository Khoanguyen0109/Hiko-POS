import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdClose, MdSave, MdAccessTime, MdColorLens } from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import {
  createNewShiftTemplate,
  updateExistingShiftTemplate,
  clearError
} from "../../redux/slices/shiftTemplateSlice";

const ShiftTemplateModal = ({ isOpen, onClose, mode, template }) => {
  const dispatch = useDispatch();
  const { createLoading, updateLoading, error } = useSelector(
    (state) => state.shiftTemplates
  );

  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    startTime: "",
    endTime: "",
    color: "#f6b100",
    description: ""
  });

  const [errors, setErrors] = useState({});

  const isEditMode = mode === "edit";
  const isLoading = createLoading || updateLoading;

  useEffect(() => {
    if (isEditMode && template) {
      setFormData({
        name: template.name || "",
        shortName: template.shortName || "",
        startTime: template.startTime || "",
        endTime: template.endTime || "",
        color: template.color || "#f6b100",
        description: template.description || ""
      });
    } else {
      setFormData({
        name: "",
        shortName: "",
        startTime: "",
        endTime: "",
        color: "#f6b100",
        description: ""
      });
    }
    setErrors({});
  }, [isEditMode, template, isOpen]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.shortName.trim()) {
      newErrors.shortName = "Short name is required";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }

    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      
      if (startHour * 60 + startMin >= endHour * 60 + endMin) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode) {
        await dispatch(
          updateExistingShiftTemplate({
            id: template._id,
            data: formData
          })
        ).unwrap();
        enqueueSnackbar("Shift template updated successfully!", { variant: "success" });
      } else {
        await dispatch(createNewShiftTemplate(formData)).unwrap();
        enqueueSnackbar("Shift template created successfully!", { variant: "success" });
      }
      onClose();
    } catch (error) {
      enqueueSnackbar(error || "Operation failed", { variant: "error" });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const colors = [
    { name: "Gold", value: "#f6b100" },
    { name: "Red", value: "#FF6B6B" },
    { name: "Blue", value: "#4ECDC4" },
    { name: "Green", value: "#95E1D3" },
    { name: "Purple", value: "#A78BFA" },
    { name: "Orange", value: "#FB923C" }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1f1f] rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">
            {isEditMode ? "Edit Shift Template" : "Create Shift Template"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
          >
            <MdClose size={20} className="text-[#ababab]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[#ababab] text-sm font-medium mb-2">
              Shift Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Morning Shift"
              className={`w-full px-4 py-2 bg-[#262626] border ${
                errors.name ? 'border-red-500' : 'border-[#343434]'
              } rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors`}
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Short Name */}
          <div>
            <label className="block text-[#ababab] text-sm font-medium mb-2">
              Short Name *
            </label>
            <input
              type="text"
              name="shortName"
              value={formData.shortName}
              onChange={handleInputChange}
              placeholder="e.g., MORNING"
              className={`w-full px-4 py-2 bg-[#262626] border ${
                errors.shortName ? 'border-red-500' : 'border-[#343434]'
              } rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors uppercase`}
            />
            {errors.shortName && (
              <p className="text-red-400 text-sm mt-1">{errors.shortName}</p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#ababab] text-sm font-medium mb-2">
                <MdAccessTime className="inline mr-1" size={16} />
                Start Time *
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 bg-[#262626] border ${
                  errors.startTime ? 'border-red-500' : 'border-[#343434]'
                } rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100] transition-colors`}
              />
              {errors.startTime && (
                <p className="text-red-400 text-sm mt-1">{errors.startTime}</p>
              )}
            </div>
            <div>
              <label className="block text-[#ababab] text-sm font-medium mb-2">
                <MdAccessTime className="inline mr-1" size={16} />
                End Time *
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 bg-[#262626] border ${
                  errors.endTime ? 'border-red-500' : 'border-[#343434]'
                } rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100] transition-colors`}
              />
              {errors.endTime && (
                <p className="text-red-400 text-sm mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[#ababab] text-sm font-medium mb-2">
              <MdColorLens className="inline mr-1" size={16} />
              Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.color === color.value
                      ? 'ring-2 ring-[#f5f5f5] ring-offset-2 ring-offset-[#1f1f1f]'
                      : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#ababab] text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., Early morning operations"
              rows={3}
              className="w-full px-4 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#262626] text-[#f5f5f5] rounded-lg font-medium hover:bg-[#343434] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <MdSave size={16} />
              {isLoading 
                ? (isEditMode ? "Updating..." : "Creating...")
                : (isEditMode ? "Update" : "Create")
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ShiftTemplateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit"]).isRequired,
  template: PropTypes.object
};

export default ShiftTemplateModal;

