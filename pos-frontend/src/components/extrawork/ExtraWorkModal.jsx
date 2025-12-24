import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import { MdClose, MdAccessTime, MdAttachMoney } from "react-icons/md";
import { createExtraWork, clearError } from "../../redux/slices/extraWorkSlice";
import { fetchMembers } from "../../redux/slices/memberSlice";
import FullScreenLoader from "../shared/FullScreenLoader";
import { getLocalDateString } from "../../utils/dateUtils";

const ExtraWorkModal = ({ isOpen, onClose, memberId, date }) => {
  const dispatch = useDispatch();
  const { members } = useSelector((state) => state.members);
  const { createLoading, error } = useSelector((state) => state.extraWork);
  
  const [formData, setFormData] = useState({
    memberId: memberId || "",
    date: date ? getLocalDateString(new Date(date)) : getLocalDateString(new Date()),
    durationHours: "",
    workType: "overtime",
    description: "",
    hourlyRate: "",
    notes: ""
  });

  useEffect(() => {
    if (isOpen) {
      if (!members || members.length === 0) {
        dispatch(fetchMembers());
      }
      
      // Reset form data when modal opens
      setFormData({
        memberId: memberId || "",
        date: date ? getLocalDateString(new Date(date)) : getLocalDateString(new Date()),
        durationHours: "",
        workType: "overtime",
        description: "",
        hourlyRate: "",
        notes: ""
      });
    } else {
      // Clear form data when modal closes
      setFormData({
        memberId: "",
        date: getLocalDateString(new Date()),
        durationHours: "",
        workType: "overtime",
        description: "",
        hourlyRate: "",
        notes: ""
      });
    }
  }, [isOpen, memberId, date, members, dispatch]);

  useEffect(() => {
    // Set default hourly rate from member's salary if member is selected
    if (isOpen && memberId && members && members.length > 0) {
      const member = members.find(m => m._id === memberId);
      if (member && member.salary) {
        setFormData(prev => ({ ...prev, hourlyRate: member.salary }));
      }
    }
  }, [isOpen, memberId, members]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-update hourly rate when member changes
    if (name === "memberId" && value) {
      const member = members.find(m => m._id === value);
      if (member && member.salary) {
        setFormData(prev => ({ ...prev, hourlyRate: member.salary }));
      }
    }
  };

  const calculatePayment = () => {
    const duration = parseFloat(formData.durationHours) || 0;
    const rate = parseFloat(formData.hourlyRate) || 0;
    return (duration * rate).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.memberId || !formData.date || !formData.durationHours) {
      enqueueSnackbar("Please fill in all required fields", { variant: "error" });
      return;
    }

    const duration = parseFloat(formData.durationHours);
    if (isNaN(duration)) {
      enqueueSnackbar("Duration must be a valid number", { variant: "error" });
      return;
    }

    try {
      const submitData = {
        memberId: formData.memberId,
        date: formData.date,
        durationHours: duration,
        workType: formData.workType,
        description: formData.description,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        notes: formData.notes
      };

      await dispatch(createExtraWork(submitData)).unwrap();
      enqueueSnackbar("Extra work entry created successfully!", { variant: "success" });
      onClose();
    } catch (error) {
      enqueueSnackbar(error || "Failed to create extra work entry", { variant: "error" });
    }
  };

  const handleClose = () => {
    // Clear form data
    setFormData({
      memberId: "",
      date: getLocalDateString(new Date()),
      durationHours: "",
      workType: "overtime",
      description: "",
      hourlyRate: "",
      notes: ""
    });
    onClose();
  };

  if (!isOpen) return null;

  const activeMembers = members?.filter(m => m.isActive && m.role !== "Admin") || [];
  const workTypes = [
    { value: "overtime", label: "Overtime" },
    { value: "extra_shift", label: "Extra Shift" },
    { value: "emergency", label: "Emergency" },
    { value: "training", label: "Training" },
    { value: "event", label: "Special Event" },
    { value: "other", label: "Other" }
  ];

  const duration = parseFloat(formData.durationHours) || 0;
  const payment = parseFloat(calculatePayment()) || 0;
  const isNegative = duration < 0;

  return (
    <>
      {createLoading && <FullScreenLoader />}
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#2a2a2a] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#3a3a3a]">
            <div>
              <h2 className="text-xl font-bold text-[#f5f5f5]">
                Log Extra Work
              </h2>
              <p className="text-sm text-[#ababab] mt-1">
                Enter duration in hours (positive or negative)
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Member Selection */}
              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Member <span className="text-red-400">*</span>
                </label>
                <select
                  name="memberId"
                  value={formData.memberId}
                  onChange={handleChange}
                  required
                  disabled={!!memberId}
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#4ECDC4] disabled:opacity-50"
                >
                  <option value="">Select a member</option>
                  {activeMembers.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.name} {member.salary ? `($${member.salary}/hr)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#4ECDC4]"
                />
              </div>

              {/* Duration Input */}
              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Duration (hours) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="durationHours"
                  value={formData.durationHours}
                  onChange={handleChange}
                  required
                  step="0.01"
                  placeholder="e.g., 2.5 or -1.5"
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#4ECDC4]"
                />
                <p className="text-xs text-[#ababab] mt-1">
                  Enter positive value for extra work, negative value for deductions/corrections
                </p>
              </div>

              {/* Duration & Payment Preview */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#1e1e1e] rounded-lg border border-[#3a3a3a]">
                <div className="flex items-center gap-2">
                  <MdAccessTime className="text-[#4ECDC4]" size={20} />
                  <div className="flex-1">
                    <div className="text-xs text-[#ababab]">Duration</div>
                    <div className={`font-semibold ${
                      isNegative 
                        ? "text-red-400" 
                        : "text-[#f5f5f5]"
                    }`}>
                      {duration.toFixed(2)} hours
                      {isNegative && (
                        <span className="ml-2 text-xs text-red-400">(deduction)</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MdAttachMoney className="text-[#f6b100]" size={20} />
                  <div>
                    <div className="text-xs text-[#ababab]">Payment</div>
                    <div className={`font-semibold ${
                      payment < 0 
                        ? "text-red-400" 
                        : "text-[#f5f5f5]"
                    }`}>
                      ${payment.toFixed(2)}
                      {payment < 0 && (
                        <span className="ml-2 text-xs text-red-400">(deduction)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Info about negative duration */}
              {isNegative && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <p className="text-xs text-yellow-400">
                    ℹ️ Negative duration indicates a time deduction or correction. 
                    This will reduce the total hours/payment for this member.
                  </p>
                </div>
              )}

              {/* Work Type */}
              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Work Type
                </label>
                <select
                  name="workType"
                  value={formData.workType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#4ECDC4]"
                >
                  {workTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#4ECDC4]"
                />
                <p className="text-xs text-[#ababab] mt-1">
                  Leave empty to use member's default salary rate
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="e.g., Helped during dinner rush, Special event catering..."
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] placeholder-[#6a6a6a] focus:outline-none focus:border-[#4ECDC4] resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] placeholder-[#6a6a6a] focus:outline-none focus:border-[#4ECDC4] resize-none"
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 p-6 border-t border-[#3a3a3a]">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#f5f5f5] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={createLoading}
              className="px-6 py-2 bg-[#f6b100] hover:bg-[#f6b100]/90 text-[#1f1f1f] rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "Create Entry"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExtraWorkModal;

