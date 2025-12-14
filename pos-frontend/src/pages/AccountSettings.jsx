import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdPerson, MdEmail, MdPhone, MdLock, MdSave, MdVisibility, MdVisibilityOff, MdAttachMoney, MdCalendarToday, MdAccessTime } from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import { fetchOwnProfile, updateProfile, updatePassword, clearError } from "../redux/slices/memberSlice";
import { getMonthlySalary } from "../https/salaryApi";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import BackButton from "../components/shared/BackButton";

const AccountSettings = () => {
  const dispatch = useDispatch();
  const { profile, profileLoading, profileError, passwordLoading } = useSelector((state) => state.members);
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: ""
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Salary calculator state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salaryData, setSalaryData] = useState(null);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [showShiftDetails, setShowShiftDetails] = useState(false);

  useEffect(() => {
    document.title = "POS | Account Settings";
    dispatch(fetchOwnProfile());
  }, [dispatch]);

  const fetchSalaryData = useCallback(async () => {
    try {
      setSalaryLoading(true);
      const response = await getMonthlySalary(selectedYear, selectedMonth);
      setSalaryData(response.data.data);
    } catch (error) {
      console.error('Error fetching salary:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to fetch salary data', { variant: 'error' });
      setSalaryData(null);
    } finally {
      setSalaryLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  // Fetch salary data when month/year changes
  useEffect(() => {
    fetchSalaryData();
  }, [fetchSalaryData]);

  useEffect(() => {
    if (profileError) {
      enqueueSnackbar(profileError, { variant: "error" });
      dispatch(clearError());
    }
  }, [profileError, dispatch]);

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || ""
      });
    }
  }, [profile]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (profileData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }

    if (profileData.email.trim() && !/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!profileData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(profileData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid phone number (exactly 10 digits)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters long";
    }

    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    try {
      const updateData = {};
      if (profileData.name !== profile.name) updateData.name = profileData.name;
      if (profileData.email !== profile.email) updateData.email = profileData.email;
      if (profileData.phone !== profile.phone) updateData.phone = profileData.phone;

      if (Object.keys(updateData).length === 0) {
        enqueueSnackbar("No changes detected", { variant: "info" });
        return;
      }

      await dispatch(updateProfile(updateData)).unwrap();
      enqueueSnackbar("Profile updated successfully!", { variant: "success" });
      setIsEditing(false);
    } catch (error) {
      enqueueSnackbar(error || "Failed to update profile", { variant: "error" });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    try {
      await dispatch(updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })).unwrap();
      
      enqueueSnackbar("Password changed successfully!", { variant: "success" });
      
      // Reset password form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      enqueueSnackbar(error || "Failed to change password", { variant: "error" });
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || ""
    });
    setIsEditing(false);
    setErrors({});
  };

  if (profileLoading) {
    return <FullScreenLoader />;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <BackButton />
        <div>
          <h1 className="text-[#f5f5f5] text-2xl font-bold">Account Settings</h1>
          <p className="text-[#ababab] text-sm">Manage your account information and security</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Monthly Salary Calculator */}
        <div className="bg-gradient-to-br from-[#1f1f1f] to-[#1a1a1a] rounded-xl border border-[#343434] shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#4ECDC4]/10 to-[#f6b100]/10 p-6 border-b border-[#343434]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[#f5f5f5] text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#4ECDC4] to-[#f6b100] rounded-lg">
                    <MdAttachMoney size={24} className="text-[#1f1f1f]" />
                  </div>
                  Monthly Salary
                </h2>
                <p className="text-[#ababab] text-sm mt-2 ml-14">Track your earnings based on shifts worked</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Month and Year Selector - Enhanced */}
            <div className="bg-[#262626]/50 rounded-lg p-4 border border-[#3a3a3a]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-[#ababab] text-sm font-medium mb-2">
                    <MdCalendarToday size={16} />
                    Select Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-[#1f1f1f] text-[#f5f5f5] border border-[#3a3a3a] rounded-lg focus:outline-none focus:border-[#4ECDC4] focus:ring-2 focus:ring-[#4ECDC4]/20 transition-all cursor-pointer hover:border-[#4ECDC4]/50"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthDate = new Date(2000, i, 1);
                      return (
                        <option key={i + 1} value={i + 1}>
                          {monthDate.toLocaleString('en-US', { month: 'long' })}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-[#ababab] text-sm font-medium mb-2">
                    Select Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-[#1f1f1f] text-[#f5f5f5] border border-[#3a3a3a] rounded-lg focus:outline-none focus:border-[#4ECDC4] focus:ring-2 focus:ring-[#4ECDC4]/20 transition-all cursor-pointer hover:border-[#4ECDC4]/50"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Salary Summary */}
            {salaryLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#4ECDC4] mb-4"></div>
                <p className="text-[#ababab] text-sm">Loading salary data...</p>
              </div>
            ) : salaryData ? (
              <>
                {/* Summary Cards - Enhanced */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Shifts Card */}
                  <div className="bg-gradient-to-br from-[#262626] to-[#1f1f1f] rounded-xl p-5 border border-[#3a3a3a] hover:border-[#4ECDC4]/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[#ababab] text-xs font-medium uppercase tracking-wide">Total Shifts</p>
                      <MdCalendarToday className="text-[#6a6a6a]" size={18} />
                    </div>
                    <p className="text-[#f5f5f5] text-3xl font-bold">{salaryData.summary.totalShifts}</p>
                    <p className="text-[#6a6a6a] text-xs mt-2">shifts this month</p>
                  </div>

                  {/* Total Hours Card */}
                  <div className="bg-gradient-to-br from-[#262626] to-[#1f1f1f] rounded-xl p-5 border border-[#3a3a3a] hover:border-[#f6b100]/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[#ababab] text-xs font-medium uppercase tracking-wide">Total Hours</p>
                      <MdAccessTime className="text-[#6a6a6a]" size={18} />
                    </div>
                    <p className="text-[#f6b100] text-3xl font-bold">{salaryData.summary.totalHours}h</p>
                    <p className="text-[#6a6a6a] text-xs mt-2">hours worked</p>
                  </div>

                  {/* Hourly Rate Card */}
                  <div className="bg-gradient-to-br from-[#262626] to-[#1f1f1f] rounded-xl p-5 border border-[#3a3a3a] hover:border-[#4ECDC4]/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[#ababab] text-xs font-medium uppercase tracking-wide">Hourly Rate</p>
                      <MdAttachMoney className="text-[#6a6a6a]" size={18} />
                    </div>
                    <p className="text-[#f5f5f5] text-3xl font-bold">${salaryData.summary.hourlyRate}</p>
                    <p className="text-[#6a6a6a] text-xs mt-2">per hour</p>
                  </div>

                  {/* Total Salary Card - Highlighted */}
                  <div className="bg-gradient-to-br from-[#4ECDC4]/20 via-[#4ECDC4]/10 to-[#f6b100]/10 rounded-xl p-5 border-2 border-[#4ECDC4]/50 shadow-lg shadow-[#4ECDC4]/10 hover:shadow-[#4ECDC4]/20 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#4ECDC4]/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[#4ECDC4] text-xs font-bold uppercase tracking-wide">Total Salary</p>
                        <MdAttachMoney className="text-[#4ECDC4]" size={20} />
                      </div>
                      <p className="text-[#4ECDC4] text-4xl font-bold">${salaryData.summary.totalSalary.toLocaleString()}</p>
                      <p className="text-[#4ECDC4]/70 text-xs mt-2 font-medium">monthly earnings</p>
                    </div>
                  </div>
                </div>

                {/* Shift Details Toggle - Enhanced */}
                {salaryData.shifts && salaryData.shifts.length > 0 && (
                  <div className="bg-[#262626]/30 rounded-xl border border-[#3a3a3a] overflow-hidden">
                    <button
                      onClick={() => setShowShiftDetails(!showShiftDetails)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-[#262626]/50 hover:bg-[#2a2a2a] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-all ${showShiftDetails ? 'bg-[#4ECDC4]/20' : 'bg-[#3a3a3a]'}`}>
                          <MdCalendarToday size={18} className={showShiftDetails ? 'text-[#4ECDC4]' : 'text-[#ababab]'} />
                        </div>
                        <div className="text-left">
                          <span className="text-[#f5f5f5] font-semibold">Shift Details</span>
                          <p className="text-[#ababab] text-xs mt-0.5">{salaryData.shifts.length} shifts recorded</p>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg transition-all ${showShiftDetails ? 'bg-[#4ECDC4]/10 rotate-180' : 'bg-[#3a3a3a]'}`}>
                        <span className="text-[#ababab] font-bold">▼</span>
                      </div>
                    </button>

                    {/* Shift Details List - Enhanced */}
                    {showShiftDetails && (
                      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto bg-[#1f1f1f]/50">
                        {salaryData.shifts.map((shift, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-[#262626] rounded-lg hover:bg-[#2a2a2a] transition-all border border-[#3a3a3a] hover:border-[#4ECDC4]/30 group"
                          >
                            <div className="flex items-center gap-4 mb-3 sm:mb-0">
                              <div
                                className="w-1 h-12 rounded-full group-hover:shadow-lg transition-all"
                                style={{ 
                                  backgroundColor: shift.color,
                                  boxShadow: `0 0 10px ${shift.color}40`
                                }}
                              />
                              <div>
                                <p className="text-[#f5f5f5] font-semibold text-sm">
                                  {new Date(shift.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    weekday: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                                <p className="text-[#ababab] text-xs mt-0.5 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: shift.color }}></span>
                                  {shift.shiftName}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 sm:gap-6">
                              <div className="text-center sm:text-right">
                                <p className="text-[#6a6a6a] text-xs uppercase tracking-wide mb-1">Time</p>
                                <p className="text-[#f5f5f5] text-sm font-medium flex items-center gap-1 justify-center sm:justify-end">
                                  <MdAccessTime size={14} className="text-[#4ECDC4]" />
                                  <span className="text-xs">{shift.startTime}</span>
                                  <span className="text-[#6a6a6a]">-</span>
                                  <span className="text-xs">{shift.endTime}</span>
                                </p>
                              </div>
                              <div className="text-center sm:text-right">
                                <p className="text-[#6a6a6a] text-xs uppercase tracking-wide mb-1">Hours</p>
                                <p className="text-[#f6b100] text-lg font-bold">{shift.hours}h</p>
                              </div>
                              <div className="text-center sm:text-right">
                                <p className="text-[#6a6a6a] text-xs uppercase tracking-wide mb-1">Earned</p>
                                <p className="text-[#4ECDC4] text-lg font-bold">
                                  ${(shift.hours * salaryData.summary.hourlyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* No Shifts Message - Enhanced */}
                {salaryData.shifts && salaryData.shifts.length === 0 && (
                  <div className="text-center py-16 bg-[#262626]/30 rounded-xl border border-dashed border-[#3a3a3a]">
                    <div className="inline-block p-4 bg-[#1f1f1f] rounded-full mb-4">
                      <MdCalendarToday size={48} className="text-[#3a3a3a]" />
                    </div>
                    <p className="text-[#ababab] text-lg font-medium">No shifts assigned for this month</p>
                    <p className="text-[#6a6a6a] text-sm mt-2 max-w-md mx-auto">
                      Your salary will be calculated once shifts are assigned to you by the administrator
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-[#262626]/30 rounded-xl border border-dashed border-[#3a3a3a]">
                <p className="text-[#ababab] text-lg">Unable to load salary data</p>
                <p className="text-[#6a6a6a] text-sm mt-2">Please try again later or contact support</p>
              </div>
            )}
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="bg-[#1f1f1f] rounded-lg border border-[#343434]">
          <div className="p-6 border-b border-[#343434]">
            <h2 className="text-[#f5f5f5] text-xl font-semibold flex items-center gap-2">
              <MdPerson size={20} />
              Profile Information
            </h2>
            <p className="text-[#ababab] text-sm mt-1">
              Update your personal information and contact details
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">
                  <MdPerson className="inline mr-2" size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 bg-[#262626] border rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
                  value={profileData.email}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 bg-[#262626] border rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 bg-[#262626] border rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.phone ? "border-red-500" : "border-[#343434]"
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-red-400 text-sm">{errors.phone}</p>
                )}
              </div>

              {/* Role Field (Read-only) */}
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">
                  Role
                </label>
                <input
                  type="text"
                  value={profile?.role || "N/A"}
                  disabled
                  className="w-full px-4 py-3 bg-[#262626] border border-[#343434] rounded-lg text-[#ababab] cursor-not-allowed"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors flex items-center gap-2"
                >
                  <MdPerson size={16} />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {profileLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#1f1f1f] border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <MdSave size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={profileLoading}
                    className="px-6 py-3 bg-[#262626] text-[#f5f5f5] rounded-lg font-medium hover:bg-[#343434] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-[#1f1f1f] rounded-lg border border-[#343434]">
          <div className="p-6 border-b border-[#343434]">
            <h2 className="text-[#f5f5f5] text-xl font-semibold flex items-center gap-2">
              <MdLock size={20} />
              Change Password
            </h2>
            <p className="text-[#ababab] text-sm mt-1">
              Update your password to keep your account secure
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Password */}
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className={`w-full px-4 py-3 pr-12 bg-[#262626] border rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors ${
                      errors.currentPassword ? "border-red-500" : "border-[#343434]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#ababab] hover:text-[#f5f5f5] transition-colors"
                  >
                    {showPasswords.current ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-red-400 text-sm">{errors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min 6 characters)"
                    className={`w-full px-4 py-3 pr-12 bg-[#262626] border rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors ${
                      errors.newPassword ? "border-red-500" : "border-[#343434]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#ababab] hover:text-[#f5f5f5] transition-colors"
                  >
                    {showPasswords.new ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-red-400 text-sm">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    className={`w-full px-4 py-3 pr-12 bg-[#262626] border rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors ${
                      errors.confirmPassword ? "border-red-500" : "border-[#343434]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#ababab] hover:text-[#f5f5f5] transition-colors"
                  >
                    {showPasswords.confirm ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-red-400 text-sm">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {passwordLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#1f1f1f] border-t-transparent rounded-full animate-spin"></div>
                    Changing Password...
                  </>
                ) : (
                  <>
                    <MdLock size={16} />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Account Information */}
        <div className="bg-[#1f1f1f] rounded-lg border border-[#343434]">
          <div className="p-6 border-b border-[#343434]">
            <h2 className="text-[#f5f5f5] text-xl font-semibold">Account Information</h2>
            <p className="text-[#ababab] text-sm mt-1">Your account details and activity</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[#ababab] text-sm">Account ID</p>
                <p className="text-[#f5f5f5] font-mono text-sm">{profile?._id || "N/A"}</p>
              </div>
              <div>
                <p className="text-[#ababab] text-sm">Member Since</p>
                <p className="text-[#f5f5f5] text-sm">
                  {profile?.createdAt 
                    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : "N/A"
                  }
                </p>
              </div>
              <div>
                <p className="text-[#ababab] text-sm">Last Updated</p>
                <p className="text-[#f5f5f5] text-sm">
                  {profile?.updatedAt 
                    ? new Date(profile.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : "N/A"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings; 