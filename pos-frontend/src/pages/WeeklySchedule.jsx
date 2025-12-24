import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MdSettings, MdCalendarToday, MdAccessTime, MdFilterList, MdAttachMoney, MdCheckCircle, MdCancel } from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import BackButton from "../components/shared/BackButton";
import WeekNavigator from "../components/schedule/WeekNavigator";
import ScheduleCell from "../components/schedule/ScheduleCell";
import MemberAssignmentModal from "../components/schedule/MemberAssignmentModal";
import ExtraWorkModal from "../components/extrawork/ExtraWorkModal";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import { getCurrentWeekInfo, getWeekDates, formatDate, getDayName, getWeekNumber, getLocalDateString } from "../utils/dateUtils";
import {
  fetchSchedulesByWeek,
  createNewSchedule,
  clearError
} from "../redux/slices/scheduleSlice";
import {
  fetchActiveShiftTemplates,
  clearError as clearTemplateError
} from "../redux/slices/shiftTemplateSlice";
import { fetchMembers } from "../redux/slices/memberSlice";
import { fetchExtraWork, clearError as clearExtraWorkError } from "../redux/slices/extraWorkSlice";
import { ROUTES } from "../constants";

const WeeklySchedule = () => {
  const dispatch = useDispatch();
  const { schedules, loading, error, createLoading } = useSelector((state) => state.schedules);
  const { activeShiftTemplates, loading: templatesLoading } = useSelector(
    (state) => state.shiftTemplates
  );
  const { members } = useSelector((state) => state.members);
  const { extraWorkEntries, totalHours, totalPayment, loading: extraWorkLoading } = useSelector((state) => state.extraWork);
  const { role } = useSelector((state) => state.user);
  const isAdmin = role === "Admin";

  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekInfo());
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showExtraWorkModal, setShowExtraWorkModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedShiftTemplate, setSelectedShiftTemplate] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMemberForExtraWork, setSelectedMemberForExtraWork] = useState(null);
  const [extraWorkFilters, setExtraWorkFilters] = useState({
    memberId: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    document.title = "POS | Weekly Schedule";
    // Everyone can view schedules and templates
    dispatch(fetchActiveShiftTemplates());
    dispatch(fetchSchedulesByWeek(currentWeek));

    // Only admins need to fetch members (for assignment)
    if (isAdmin) {
      dispatch(fetchMembers());
    }
  }, [dispatch, isAdmin, currentWeek]);

  // Fetch extra work entries when filters change
  useEffect(() => {
    if (isAdmin) {
      const filters = {};
      if (extraWorkFilters.memberId) filters.memberId = extraWorkFilters.memberId;
      if (extraWorkFilters.startDate) filters.startDate = extraWorkFilters.startDate;
      if (extraWorkFilters.endDate) filters.endDate = extraWorkFilters.endDate;

      dispatch(fetchExtraWork(filters));
    }
  }, [dispatch, isAdmin, extraWorkFilters]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleWeekChange = (year, week) => {
    setCurrentWeek({ year, week });
  };

  // Find schedule for a specific date and shift template
  const findSchedule = (date, shiftTemplateId) => {
    if (!schedules || schedules.length === 0) return null;

    // Compare dates using LOCAL date strings (YYYY-MM-DD in Vietnam timezone)
    // This ensures calendar dates match schedule dates correctly
    const targetDateStr = getLocalDateString(date);

    return schedules.find(schedule => {
      // Backend sends dates as ISO strings, convert to local date string for comparison
      const scheduleDateStr = getLocalDateString(new Date(schedule.date));

      const scheduleTemplateId = typeof schedule.shiftTemplate === 'string'
        ? schedule.shiftTemplate
        : schedule.shiftTemplate?._id;

      return scheduleDateStr === targetDateStr && scheduleTemplateId === shiftTemplateId;
    });
  };

  // Handle clicking on a schedule cell
  const handleCellClick = async (date, shiftTemplate) => {
    console.log('date', date)
    // Only admins can assign members
    if (!isAdmin) {
      enqueueSnackbar("Only administrators can assign members to shifts", { variant: "warning" });
      return;
    }

    try {
      // Find existing schedule in local state
      const existingSchedule = findSchedule(date, shiftTemplate._id);

      if (existingSchedule) {
        // Open assignment modal for existing schedule
        setSelectedSchedule(existingSchedule);
        setSelectedShiftTemplate(shiftTemplate);
        setShowAssignmentModal(true);
      } else {
        // Try to create new schedule
        const dateStr = formatDate(date, "iso"); // ISO format: YYYY-MM-DD
        const scheduleDate = new Date(date);
        const year = scheduleDate.getFullYear();
        const weekNumber = getWeekNumber(scheduleDate);

        const result = await dispatch(createNewSchedule({
          date: dateStr, // ISO format
          shiftTemplateId: shiftTemplate._id,
          memberIds: [],
          year,
          weekNumber
        })).unwrap();

        // Check if schedule already existed (backend returns it)
        if (result.existed) {
          enqueueSnackbar("Opening existing schedule", { variant: "info" });
        }

        // Open assignment modal with schedule (new or existing)
        setSelectedSchedule(result.data);
        setSelectedShiftTemplate(shiftTemplate);
        setShowAssignmentModal(true);
      }
    } catch (error) {
      enqueueSnackbar(error || "Failed to access schedule", { variant: "error" });
    }
  };

  const handleCloseModal = () => {
    setShowAssignmentModal(false);
    setSelectedSchedule(null);
    setSelectedShiftTemplate(null);
    // Refresh schedules after assignment
    dispatch(fetchSchedulesByWeek(currentWeek));
  };

  const handleOpenExtraWorkModal = (date = null, memberId = null) => {
    if (!isAdmin) {
      enqueueSnackbar("Only administrators can log extra work", { variant: "warning" });
      return;
    }
    setSelectedDate(date);
    setSelectedMemberForExtraWork(memberId);
    setShowExtraWorkModal(true);
  };

  const handleCloseExtraWorkModal = () => {
    setShowExtraWorkModal(false);
    setSelectedDate(null);
    setSelectedMemberForExtraWork(null);
    // Refresh extra work list after creating entry
    const filters = {};
    if (extraWorkFilters.memberId) filters.memberId = extraWorkFilters.memberId;
    if (extraWorkFilters.startDate) filters.startDate = extraWorkFilters.startDate;
    if (extraWorkFilters.endDate) filters.endDate = extraWorkFilters.endDate;
    dispatch(fetchExtraWork(filters));
  };

  const handleFilterChange = (name, value) => {
    setExtraWorkFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setExtraWorkFilters({
      memberId: "",
      startDate: "",
      endDate: ""
    });
  };

  const getWorkTypeColor = (workType) => {
    const colors = {
      overtime: "bg-orange-900/20 text-orange-400 border-orange-700",
      extra_shift: "bg-blue-900/20 text-blue-400 border-blue-700",
      emergency: "bg-red-900/20 text-red-400 border-red-700",
      training: "bg-green-900/20 text-green-400 border-green-700",
      event: "bg-purple-900/20 text-purple-400 border-purple-700",
      other: "bg-gray-900/20 text-gray-400 border-gray-700"
    };
    return colors[workType] || colors.other;
  };

  const weekDates = getWeekDates(currentWeek.year, currentWeek.week);

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-4 border-b border-[#343434]">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">Weekly Schedule</h1>
            <p className="text-[#ababab] text-sm mt-1">
              Manage shift assignments for your team
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenExtraWorkModal()}
              className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors flex items-center gap-2"
            >
              <MdAccessTime size={16} /> Log Extra Work
            </button>
            <Link
              to={ROUTES.SHIFT_TEMPLATES}
              className="px-4 py-2 bg-[#262626] text-[#f5f5f5] rounded-lg font-medium hover:bg-[#343434] transition-colors flex items-center gap-2"
            >
              <MdSettings size={16} /> Manage Templates
            </Link>
          </div>
        )}
      </div>

      {/* Week Navigator */}
      <div className="px-10 py-6">
        <WeekNavigator
          year={currentWeek.year}
          week={currentWeek.week}
          onWeekChange={handleWeekChange}
        />
      </div>

      {/* Content */}
      <div className="px-10 pb-6">
        {loading || templatesLoading ? (
          <FullScreenLoader />
        ) : activeShiftTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-[#262626] rounded-full flex items-center justify-center mb-6">
              <MdCalendarToday size={40} className="text-[#ababab]" />
            </div>
            <h3 className="text-[#f5f5f5] text-xl font-semibold mb-2">
              No Shift Templates Available
            </h3>
            <p className="text-[#ababab] text-sm max-w-md mb-6">
              You need to create shift templates before you can manage schedules.
              Create templates like Morning, Afternoon, and Evening shifts.
            </p>
            <Link
              to={ROUTES.SHIFT_TEMPLATES}
              className="px-6 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors"
            >
              Create Shift Templates
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weekly Grid */}
            <div className="bg-[#1f1f1f] rounded-lg border border-[#343434] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-[#343434]">
                      <th className="px-4 py-3 text-left text-[#ababab] text-sm font-medium w-32">
                        Shift
                      </th>
                      {weekDates.map((date, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-center text-[#ababab] text-sm font-medium"
                        >
                          <div>{getDayName(date, "short")}</div>
                          <div className="text-[#f5f5f5] font-semibold mt-1">
                            {formatDate(date, "short")}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeShiftTemplates.map((template) => (
                      <tr
                        key={template._id}
                        className="border-b border-[#343434] last:border-0"
                      >
                        <td className="px-4 py-6 align-top">
                          <div className="flex items-start gap-2">
                            <div
                              className="w-3 h-3 rounded-full mt-1"
                              style={{ backgroundColor: template.color }}
                            />
                            <div>
                              <div className="text-[#f5f5f5] font-medium text-sm">
                                {template.name}
                              </div>
                              <div className="text-[#ababab] text-xs mt-1">
                                {template.startTime} - {template.endTime}
                              </div>
                              <div className="text-[#6a6a6a] text-xs mt-0.5">
                                {template.durationHours}h
                              </div>
                            </div>
                          </div>
                        </td>
                        {weekDates.map((date, dateIndex) => {
                          const schedule = findSchedule(date, template._id);

                          return (
                            <td
                              key={dateIndex}
                              className={`px-2 py-3 align-top bg-[#262626]/30 ${!isAdmin ? 'cursor-not-allowed' : ''}`}
                            >
                              <ScheduleCell
                                schedule={schedule}
                                shiftTemplate={template}
                                members={members}
                                onClick={() => handleCellClick(date, template)}
                                disabled={!isAdmin}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Instructions */}

            {/* Summary Stats */}
            {schedules && schedules.length > 0 && (
              <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
                <h4 className="text-[#f5f5f5] text-lg font-semibold mb-4">
                  📊 Week Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#262626] rounded-lg p-4">
                    <div className="text-[#ababab] text-xs mb-1">Total Shifts</div>
                    <div className="text-[#f5f5f5] text-2xl font-bold">
                      {schedules.length}
                    </div>
                  </div>
                  <div className="bg-[#262626] rounded-lg p-4">
                    <div className="text-[#ababab] text-xs mb-1">Assigned</div>
                    <div className="text-[#4ECDC4] text-2xl font-bold">
                      {schedules.filter(s => s.assignedMembers && s.assignedMembers.length > 0).length}
                    </div>
                  </div>
                  <div className="bg-[#262626] rounded-lg p-4">
                    <div className="text-[#ababab] text-xs mb-1">Empty</div>
                    <div className="text-[#f6b100] text-2xl font-bold">
                      {schedules.filter(s => !s.assignedMembers || s.assignedMembers.length === 0).length}
                    </div>
                  </div>
                  <div className="bg-[#262626] rounded-lg p-4">
                    <div className="text-[#ababab] text-xs mb-1">Total Members</div>
                    <div className="text-[#f5f5f5] text-2xl font-bold">
                      {new Set(schedules.flatMap(s => s.assignedMembers || []).map(am => {
                        const memberId = am?.member?._id || am?.member || am;
                        return typeof memberId === 'string' ? memberId : memberId?._id;
                      })).size}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Extra Work Entries View */}
            {isAdmin && (
              <div className="bg-[#1f1f1f] rounded-lg border border-[#343434] overflow-hidden">
                <div className="p-6 border-b border-[#343434]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-[#f5f5f5] text-lg font-semibold flex items-center gap-2">
                        <MdAccessTime className="text-[#f6b100]" size={20} />
                        Extra Work Entries
                      </h4>
                      <p className="text-[#ababab] text-sm mt-1">
                        View and filter logged extra work hours
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenExtraWorkModal()}
                      className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors flex items-center gap-2"
                    >
                      <MdAccessTime size={16} /> Log New Entry
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-[#ababab] mb-2">Filter by Member</label>
                      <select
                        value={extraWorkFilters.memberId}
                        onChange={(e) => handleFilterChange("memberId", e.target.value)}
                        className="w-full px-3 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#4ECDC4]"
                      >
                        <option value="">All Members</option>
                        {members?.filter(m => m.isActive && m.role !== "Admin").map(member => (
                          <option key={member._id} value={member._id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#ababab] mb-2">Start Date</label>
                      <input
                        type="date"
                        value={extraWorkFilters.startDate}
                        onChange={(e) => handleFilterChange("startDate", e.target.value)}
                        className="w-full px-3 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#4ECDC4]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#ababab] mb-2">End Date</label>
                      <input
                        type="date"
                        value={extraWorkFilters.endDate}
                        onChange={(e) => handleFilterChange("endDate", e.target.value)}
                        className="w-full px-3 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#4ECDC4]"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        className="w-full px-4 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#f5f5f5] rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <MdFilterList size={16} /> Clear Filters
                      </button>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  {extraWorkEntries.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="bg-[#262626] rounded-lg p-3">
                        <div className="text-[#ababab] text-xs mb-1">Total Entries</div>
                        <div className="text-[#f5f5f5] text-xl font-bold">{extraWorkEntries.length}</div>
                      </div>
                      <div className="bg-[#262626] rounded-lg p-3">
                        <div className="text-[#ababab] text-xs mb-1">Total Hours</div>
                        <div className={`text-xl font-bold ${totalHours < 0 ? "text-red-400" : "text-[#4ECDC4]"
                          }`}>
                          {totalHours.toFixed(2)}h
                        </div>
                      </div>
                      <div className="bg-[#262626] rounded-lg p-3">
                        <div className="text-[#ababab] text-xs mb-1">Total Payment</div>
                        <div className={`text-xl font-bold ${totalPayment < 0 ? "text-red-400" : "text-[#f6b100]"
                          }`}>
                          ${totalPayment.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Extra Work Entries Table */}
                <div className="overflow-x-auto">
                  {extraWorkLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ECDC4]"></div>
                    </div>
                  ) : extraWorkEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <MdAccessTime size={48} className="mx-auto text-[#6a6a6a] mb-4" />
                      <p className="text-[#ababab]">
                        No extra work entries found. Click "Log New Entry" to add one.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#343434] bg-[#262626]">
                          <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Date</th>
                          <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Member</th>
                          <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Duration</th>
                          <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Type</th>
                          <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Payment</th>
                          <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Status</th>
                          <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extraWorkEntries.map((entry) => (
                          <tr
                            key={entry._id}
                            className="border-b border-[#343434] hover:bg-[#262626] transition-colors"
                          >
                            <td className="px-4 py-3 text-[#f5f5f5] text-sm">
                              {formatDate(new Date(entry.date), "short")}
                            </td>
                            <td className="px-4 py-3 text-[#f5f5f5] text-sm">
                              {entry.member?.name || "Unknown"}
                            </td>
                            <td className={`px-4 py-3 text-sm font-medium ${entry.durationHours < 0 ? "text-red-400" : "text-[#4ECDC4]"
                              }`}>
                              {entry.durationHours.toFixed(2)}h
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getWorkTypeColor(entry.workType)}`}>
                                {entry.workType.replace('_', ' ')}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-sm font-medium ${entry.paymentAmount < 0 ? "text-red-400" : "text-[#f6b100]"
                              }`}>
                              ${entry.paymentAmount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${entry.isApproved
                                    ? 'bg-green-900/30 text-green-400'
                                    : 'bg-yellow-900/30 text-yellow-400'
                                  }`}>
                                  {entry.isApproved ? (
                                    <>
                                      <MdCheckCircle size={12} className="mr-1" /> Approved
                                    </>
                                  ) : (
                                    <>
                                      <MdCancel size={12} className="mr-1" /> Pending
                                    </>
                                  )}
                                </span>
                                {entry.isApproved && (
                                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${entry.isPaid
                                      ? 'bg-blue-900/30 text-blue-400'
                                      : 'bg-orange-900/30 text-orange-400'
                                    }`}>
                                    {entry.isPaid ? (
                                      <>
                                        <MdAttachMoney size={12} className="mr-1" /> Paid
                                      </>
                                    ) : (
                                      "Unpaid"
                                    )}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#ababab] text-sm max-w-xs truncate">
                              {entry.description || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Member Assignment Modal */}
      <MemberAssignmentModal
        isOpen={showAssignmentModal}
        onClose={handleCloseModal}
        schedule={selectedSchedule}
        shiftTemplate={selectedShiftTemplate}
        onLogExtraWork={handleOpenExtraWorkModal}
      />

      {/* Extra Work Modal */}
      <ExtraWorkModal
        isOpen={showExtraWorkModal}
        onClose={handleCloseExtraWorkModal}
        memberId={selectedMemberForExtraWork}
        date={selectedDate}
      />

      {/* Loading Overlay for Schedule Creation */}
      {createLoading && <FullScreenLoader />}
    </div>
  );
};

export default WeeklySchedule;

