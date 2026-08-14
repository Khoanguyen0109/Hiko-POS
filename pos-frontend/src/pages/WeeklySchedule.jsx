import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MdSettings, MdAccessTime, MdFilterList, MdPeople, MdPerson, MdStore, MdDelete } from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import FeaturePageHeader from "../components/shared/FeaturePageHeader";
import WeekNavigator from "../components/schedule/WeekNavigator";
import MemberAssignmentModal from "../components/schedule/MemberAssignmentModal";
import ByMemberView from "../components/schedule/ByMemberView";
import MyScheduleView from "../components/schedule/MyScheduleView";
import AllStoresWeekGrid from "../components/schedule/AllStoresWeekGrid";
import ExtraWorkModal from "../components/extrawork/ExtraWorkModal";
import ExtraWorkEntryCard from "../components/extrawork/ExtraWorkEntryCard";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import LoadingState from "../components/shared/LoadingState";
import EmptyState from "../components/shared/EmptyState";
import HeaderActionButton from "../components/shared/HeaderActionButton";
import ScheduleViewSwitcher from "../components/v2/ScheduleViewSwitcher";
import { useV2Ui } from "../hooks/useV2Ui";
import { getCurrentWeekInfo, getWeekDates, formatDate, getWeekNumber, getLocalDateString, isShiftOver } from "../utils/dateUtils";
import {
  fetchAllMembersWeek,
  createNewSchedule,
  clearError
} from "../redux/slices/scheduleSlice";
import { deleteExtraWork } from "../redux/slices/extraWorkSlice";
import { fetchAllActiveShiftTemplates } from "../redux/slices/shiftTemplateSlice";
import { fetchMembers } from "../redux/slices/memberSlice";
import { fetchExtraWork } from "../redux/slices/extraWorkSlice";
import { fetchAllStores } from "../redux/slices/storeSlice";
import { ROUTES } from "../constants";

const TABS = {
  BY_STORE: "by_store",
  BY_MEMBER: "by_member",
  MY_SCHEDULE: "my_schedule"
};

const SCHEDULE_VIEW_MODES = {
  COMPACT: "compact",
  FULL_WEEK: "fullWeek",
  CALENDAR: "calendar",
};

function getMonthGridDays(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const days = [];

  for (let i = 0; i < startOffset; i += 1) {
    days.push({
      date: new Date(year, month, i - startOffset + 1, 12),
      inMonth: false,
    });
  }

  for (let day = 1; day <= lastOfMonth.getDate(); day += 1) {
    days.push({ date: new Date(year, month, day, 12), inMonth: true });
  }

  while (days.length % 7 !== 0) {
    const trailingDay = days.length - startOffset - lastOfMonth.getDate() + 1;
    days.push({
      date: new Date(year, month + 1, trailingDay, 12),
      inMonth: false,
    });
  }

  return days;
}

const WeeklySchedule = () => {
  const dispatch = useDispatch();
  const { v2UiEnabled } = useV2Ui();
  const { allMembersSchedules, allMembersLoading, error, createLoading } = useSelector((state) => state.schedules);
  const { activeShiftTemplates, loading: templatesLoading } = useSelector(
    (state) => state.shiftTemplates
  );
  const { members } = useSelector((state) => state.members);
  const { allStores, activeStore, allStoresLoading } = useSelector((state) => state.store);
  const { extraWorkEntries, totalHours, totalPayment, loading: extraWorkLoading } = useSelector((state) => state.extraWork);
  const { role } = useSelector((state) => state.user);
  const isAdmin = role === "Admin";

  const [activeTab, setActiveTab] = useState(TABS.BY_STORE);
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekInfo());
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showExtraWorkModal, setShowExtraWorkModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedShiftTemplate, setSelectedShiftTemplate] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMemberForExtraWork, setSelectedMemberForExtraWork] = useState(null);
  const [extraWorkFilters, setExtraWorkFilters] = useState({
    memberId: "",
    startDate: "",
    endDate: ""
  });
  const [scheduleViewMode, setScheduleViewMode] = useState(SCHEDULE_VIEW_MODES.COMPACT);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);

  useEffect(() => {
    document.title = "POS | Weekly Schedule";
    dispatch(fetchAllActiveShiftTemplates());
    if (activeTab === TABS.BY_STORE) {
      dispatch(fetchAllMembersWeek(currentWeek));
      if (allStores.length === 0) dispatch(fetchAllStores());
    }
    if (isAdmin) {
      dispatch(fetchMembers());
    }
  }, [dispatch, isAdmin, currentWeek, activeTab, allStores.length, activeStore?._id]);

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
    setSelectedCalendarDay(null);
  }, [currentWeek.year, currentWeek.week]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleWeekChange = (year, week) => {
    setCurrentWeek({ year, week });
  };

  // Find a schedule for a specific store within the cross-store week data.
  const findScheduleForStore = (storeId, date, shiftTemplateId) => {
    if (!allMembersSchedules || allMembersSchedules.length === 0) return null;
    const targetDateStr = getLocalDateString(date);
    return allMembersSchedules.find(schedule => {
      const sId = typeof schedule.store === 'object' ? schedule.store?._id : schedule.store;
      if (sId !== storeId) return false;
      const scheduleDateStr = getLocalDateString(new Date(schedule.date));
      const scheduleTemplateId = typeof schedule.shiftTemplate === 'string'
        ? schedule.shiftTemplate
        : schedule.shiftTemplate?._id;
      return scheduleDateStr === targetDateStr && scheduleTemplateId === shiftTemplateId;
    });
  };

  // Cell click from the admin all-stores grid: open/create a schedule for the
  // clicked store without changing the active store.
  const handleCombinedCellClick = async (store, date, shiftTemplate) => {
    if (!isAdmin) return;

    if (isShiftOver(date, shiftTemplate.endTime)) {
      enqueueSnackbar("This shift has ended and can no longer be changed", { variant: "info" });
      return;
    }

    try {
      const existingSchedule = findScheduleForStore(store._id, date, shiftTemplate._id);
      if (existingSchedule) {
        setSelectedSchedule(existingSchedule);
        setSelectedShiftTemplate(shiftTemplate);
        setSelectedStore(store);
        setShowAssignmentModal(true);
      } else {
        const dateStr = formatDate(date, "iso");
        const scheduleDate = new Date(date);
        const year = scheduleDate.getFullYear();
        const weekNumber = getWeekNumber(scheduleDate);

        const result = await dispatch(createNewSchedule({
          date: dateStr,
          shiftTemplateId: shiftTemplate._id,
          memberIds: [],
          year,
          weekNumber,
          storeId: store._id
        })).unwrap();

        setSelectedSchedule(result.data);
        setSelectedShiftTemplate(shiftTemplate);
        setSelectedStore(store);
        setShowAssignmentModal(true);
      }
    } catch (err) {
      enqueueSnackbar(err || "Failed to access schedule", { variant: "error" });
    }
  };

  // Refresh the cross-store week data after an edit so the combined grid updates.
  const refreshAdminWeek = () => {
    dispatch(fetchAllMembersWeek(currentWeek));
  };

  const handleCloseModal = () => {
    setShowAssignmentModal(false);
    setSelectedSchedule(null);
    setSelectedShiftTemplate(null);
    setSelectedStore(null);
  };

  const handleOpenExtraWorkModal = (date = null, memberId = null) => {
    if (!isAdmin) return;
    setSelectedDate(date);
    setSelectedMemberForExtraWork(memberId);
    setShowExtraWorkModal(true);
  };

  const handleCloseExtraWorkModal = () => {
    setShowExtraWorkModal(false);
    setSelectedDate(null);
    setSelectedMemberForExtraWork(null);
  };

  const handleFilterChange = (name, value) => {
    setExtraWorkFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setExtraWorkFilters({ memberId: "", startDate: "", endDate: "" });
  };

  const handleDeleteExtraWork = async (id) => {
    if (!window.confirm("Are you sure you want to delete this extra work entry?")) return;
    try {
      await dispatch(deleteExtraWork(id)).unwrap();
      enqueueSnackbar("Extra work entry deleted", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err || "Failed to delete extra work entry", { variant: "error" });
    }
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

  const calendarMonth = useMemo(() => {
    const anchor = weekDates[0] || new Date();
    return { year: anchor.getFullYear(), month: anchor.getMonth() };
  }, [weekDates]);

  const calendarDays = useMemo(
    () => getMonthGridDays(calendarMonth.year, calendarMonth.month),
    [calendarMonth.month, calendarMonth.year]
  );

  const getSchedulesForDate = (date) => {
    const targetDateStr = getLocalDateString(date);

    return (allMembersSchedules || []).filter((schedule) => {
      return getLocalDateString(new Date(schedule.date)) === targetDateStr;
    });
  };

  const getScheduleStoreName = (schedule) => {
    const store = schedule?.store;
    if (store && typeof store === "object") return store.name || store.code || null;
    return null;
  };

  const renderAllStoresGrid = (layoutClassName = "") => (
    <div className={layoutClassName}>
      <AllStoresWeekGrid
        stores={allStores.filter((s) => s.isActive !== false)}
        schedules={allMembersSchedules}
        shiftTemplates={activeShiftTemplates}
        members={members}
        weekDates={weekDates}
        activeStoreId={activeStore?._id}
        onCellClick={handleCombinedCellClick}
        readOnly={!isAdmin}
      />
    </div>
  );

  const renderCalendarView = () => {
    const monthLabel = new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString(
      "en-US",
      { month: "long", year: "numeric" }
    );
    const selectedDaySchedules = selectedCalendarDay
      ? getSchedulesForDate(selectedCalendarDay)
      : [];

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[#343434] bg-[#1f1f1f] p-4">
          <h3 className="mb-4 text-lg font-semibold text-[#f5f5f5]">{monthLabel}</h3>
          <div className="mb-2 grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <div key={label} className="text-center text-[10px] font-medium uppercase text-[#6a6a6a]">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, inMonth }) => {
              const dateStr = getLocalDateString(date);
              const daySchedules = getSchedulesForDate(date);
              const isSelected =
                selectedCalendarDay &&
                getLocalDateString(selectedCalendarDay) === dateStr;
              const isToday = getLocalDateString(new Date()) === dateStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedCalendarDay(date)}
                  className={`min-h-[72px] rounded-lg border p-2 text-left transition-colors ${
                    isSelected
                      ? "border-brand bg-brand-10"
                      : "border-[#343434] bg-[#262626] hover:border-[#4a4a4a]"
                  } ${inMonth ? "" : "opacity-40"}`}
                >
                  <span
                    className={`text-sm font-semibold ${
                      isToday ? "text-brand" : "text-[#f5f5f5]"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {daySchedules.length > 0 ? (
                    <span className="mt-2 block text-[10px] font-medium text-[#4ECDC4]">
                      {daySchedules.length} shift{daySchedules.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {selectedCalendarDay ? (
          <div className="rounded-xl border border-[#343434] bg-[#1f1f1f] p-4">
            <h4 className="mb-3 text-base font-semibold text-[#f5f5f5]">
              {formatDate(selectedCalendarDay, "full")}
            </h4>
            {selectedDaySchedules.length === 0 ? (
              <p className="text-sm text-[#ababab]">No shifts scheduled for this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedDaySchedules.map((schedule) => {
                  const shift = schedule.shiftTemplate;
                  const shiftName =
                    typeof shift === "object"
                      ? shift?.name || shift?.shortName || "Shift"
                      : "Shift";
                  const startTime =
                    typeof shift === "object" ? shift?.startTime : null;
                  const endTime = typeof shift === "object" ? shift?.endTime : null;
                  const assignedCount = schedule.assignedMembers?.length || 0;
                  const storeName = getScheduleStoreName(schedule);

                  return (
                    <div
                      key={schedule._id}
                      className="rounded-lg border border-[#343434] bg-[#262626] p-3"
                    >
                      {storeName ? (
                        <p className="text-[10px] font-medium uppercase tracking-wide text-[#6a6a6a]">
                          {storeName}
                        </p>
                      ) : null}
                      <p className="text-sm font-medium text-[#f5f5f5]">{shiftName}</p>
                      {startTime && endTime ? (
                        <p className="mt-1 text-xs text-[#ababab]">
                          {startTime} - {endTime}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-[#4ECDC4]">
                        {assignedCount} member{assignedCount === 1 ? "" : "s"} assigned
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#ababab]">Tap a day to view shift details.</p>
        )}
      </div>
    );
  };

  const renderByStoreSchedule = () => {
    if (v2UiEnabled && scheduleViewMode === SCHEDULE_VIEW_MODES.FULL_WEEK) {
      return renderAllStoresGrid("overflow-x-auto");
    }

    if (v2UiEnabled && scheduleViewMode === SCHEDULE_VIEW_MODES.CALENDAR) {
      return renderCalendarView();
    }

    return renderAllStoresGrid();
  };

  // Tab definitions
  const tabs = [
    { key: TABS.BY_STORE, label: "By Store", icon: MdStore, show: true },
    { key: TABS.BY_MEMBER, label: "By Member", icon: MdPeople, show: isAdmin },
    { key: TABS.MY_SCHEDULE, label: "My Schedule", icon: MdPerson, show: !isAdmin },
  ].filter(t => t.show);

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24 overflow-x-hidden">
      <FeaturePageHeader
        title="Weekly Schedule"
        actions={
          isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => handleOpenExtraWorkModal()}
                className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-[#f5f5f5] transition-colors hover:bg-brand-hover sm:px-4 sm:text-sm"
              >
                <MdAccessTime size={16} />
                Log Extra Work
              </button>
              <Link
                to={ROUTES.SHIFT_TEMPLATES}
                className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-[#343434] bg-[#262626] px-3 py-2 text-xs font-medium text-[#f5f5f5] transition-colors hover:bg-[#343434] sm:px-4 sm:text-sm"
              >
                <MdSettings size={16} />
                Templates
              </Link>
            </>
          ) : null
        }
      />

      {/* Week Navigator + Tabs */}
      <div className="px-4 sm:px-10 py-6 space-y-4">
        <WeekNavigator
          year={currentWeek.year}
          week={currentWeek.week}
          onWeekChange={handleWeekChange}
        />

        {v2UiEnabled && activeTab === TABS.BY_STORE ? (
          <ScheduleViewSwitcher value={scheduleViewMode} onChange={setScheduleViewMode} />
        ) : null}

        {/* Tab Switcher */}
        {tabs.length > 1 ? (
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-[#141414] p-1 scrollbar-hide w-full sm:w-fit max-w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex min-h-[40px] min-w-[5.5rem] flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors sm:flex-none ${
                    isActive
                      ? "bg-[#262626] text-brand shadow-sm"
                      : "text-[#ababab] hover:bg-[#262626]/60 hover:text-[#f5f5f5]"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="px-4 sm:px-10 pb-6">
        {/* ── By Store Tab ── */}
        {activeTab === TABS.BY_STORE && (
          <>
            {allMembersLoading || templatesLoading || allStoresLoading ? (
              <FullScreenLoader />
            ) : (
              <div className="space-y-6">
                {renderByStoreSchedule()}

                {/* Summary Stats */}
                {!isAdmin && allMembersSchedules && allMembersSchedules.length > 0 && (
                  <div className="bg-[#1f1f1f] rounded-lg p-6 border border-[#343434]">
                    <h4 className="text-[#f5f5f5] text-lg font-semibold mb-4">
                      Week Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#262626] rounded-lg p-4">
                        <div className="text-[#ababab] text-xs mb-1">Total Shifts</div>
                        <div className="text-[#f5f5f5] text-2xl font-bold">{allMembersSchedules.length}</div>
                      </div>
                      <div className="bg-[#262626] rounded-lg p-4">
                        <div className="text-[#ababab] text-xs mb-1">Assigned</div>
                        <div className="text-[#4ECDC4] text-2xl font-bold">
                          {allMembersSchedules.filter(s => s.assignedMembers && s.assignedMembers.length > 0).length}
                        </div>
                      </div>
                      <div className="bg-[#262626] rounded-lg p-4">
                        <div className="text-[#ababab] text-xs mb-1">Empty</div>
                        <div className="text-brand text-2xl font-bold">
                          {allMembersSchedules.filter(s => !s.assignedMembers || s.assignedMembers.length === 0).length}
                        </div>
                      </div>
                      <div className="bg-[#262626] rounded-lg p-4">
                        <div className="text-[#ababab] text-xs mb-1">Total Members</div>
                        <div className="text-[#f5f5f5] text-2xl font-bold">
                          {new Set(allMembersSchedules.flatMap(s => s.assignedMembers || []).map(am => {
                            const memberId = am?.member?._id || am?.member || am;
                            return typeof memberId === 'string' ? memberId : memberId?._id;
                          })).size}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Extra Work Entries View (admin only) */}
                {isAdmin && (
                  <div className="bg-[#1f1f1f] rounded-lg border border-[#343434] overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-[#343434]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                          <h4 className="text-[#f5f5f5] text-lg font-semibold flex items-center gap-2">
                            <MdAccessTime className="text-brand" size={20} />
                            Extra Work Entries
                          </h4>
                          <p className="text-[#ababab] text-sm mt-1">
                            View and filter logged extra work hours
                          </p>
                        </div>
                        <HeaderActionButton
                          variant="primary"
                          icon={<MdAccessTime size={16} />}
                          onClick={() => handleOpenExtraWorkModal()}
                          className="w-full sm:w-auto"
                        >
                          Log New Entry
                        </HeaderActionButton>
                      </div>

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
                              <option key={member._id} value={member._id}>{member.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-[#ababab] mb-2">Start Date</label>
                          <input type="date" value={extraWorkFilters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)}
                            className="w-full px-3 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#4ECDC4]" />
                        </div>
                        <div>
                          <label className="block text-xs text-[#ababab] mb-2">End Date</label>
                          <input type="date" value={extraWorkFilters.endDate} onChange={(e) => handleFilterChange("endDate", e.target.value)}
                            className="w-full px-3 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#4ECDC4]" />
                        </div>
                        <div className="flex items-end">
                          <button onClick={clearFilters}
                            className="w-full px-4 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#f5f5f5] rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                            <MdFilterList size={16} /> Clear Filters
                          </button>
                        </div>
                      </div>

                      {extraWorkEntries.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="bg-[#262626] rounded-lg p-3">
                            <div className="text-[#ababab] text-xs mb-1">Total Entries</div>
                            <div className="text-[#f5f5f5] text-xl font-bold">{extraWorkEntries.length}</div>
                          </div>
                          <div className="bg-[#262626] rounded-lg p-3">
                            <div className="text-[#ababab] text-xs mb-1">Total Hours</div>
                            <div className={`text-xl font-bold ${totalHours < 0 ? "text-red-400" : "text-[#4ECDC4]"}`}>
                              {totalHours.toFixed(2)}h
                            </div>
                          </div>
                          <div className="bg-[#262626] rounded-lg p-3">
                            <div className="text-[#ababab] text-xs mb-1">Total Payment</div>
                            <div className={`text-xl font-bold ${totalPayment < 0 ? "text-red-400" : "text-brand"}`}>
                              ${totalPayment.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      {extraWorkLoading ? (
                        <LoadingState />
                      ) : extraWorkEntries.length === 0 ? (
                        <EmptyState icon={MdAccessTime} message="No extra work entries found." />
                      ) : (
                        <>
                          <div className="flex flex-col gap-2 p-3 md:hidden">
                            {extraWorkEntries.map((entry) => (
                              <ExtraWorkEntryCard
                                key={entry._id}
                                entry={entry}
                                onDelete={handleDeleteExtraWork}
                              />
                            ))}
                          </div>
                          <table className="hidden w-full md:table">
                          <thead>
                            <tr className="border-b border-[#343434] bg-[#262626]">
                              <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Date</th>
                              <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Member</th>
                              <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Duration</th>
                              <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Type</th>
                              <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Payment</th>
                              <th className="px-4 py-3 text-left text-[#ababab] text-xs font-medium">Description</th>
                              <th className="px-4 py-3 text-center text-[#ababab] text-xs font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extraWorkEntries.map((entry) => (
                              <tr key={entry._id} className="border-b border-[#343434] hover:bg-[#262626] transition-colors">
                                <td className="px-4 py-3 text-[#f5f5f5] text-sm">{formatDate(new Date(entry.date), "short")}</td>
                                <td className="px-4 py-3 text-[#f5f5f5] text-sm">{entry.member?.name || "Unknown"}</td>
                                <td className={`px-4 py-3 text-sm font-medium ${entry.durationHours < 0 ? "text-red-400" : "text-[#4ECDC4]"}`}>
                                  {entry.durationHours.toFixed(2)}h
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getWorkTypeColor(entry.workType)}`}>
                                    {entry.workType.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className={`px-4 py-3 text-sm font-medium ${entry.paymentAmount < 0 ? "text-red-400" : "text-brand"}`}>
                                  ${entry.paymentAmount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-[#ababab] text-sm max-w-xs truncate">{entry.description || "-"}</td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleDeleteExtraWork(entry._id)}
                                    className="p-2 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
                                    title="Delete entry"
                                  >
                                    <MdDelete size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── By Member Tab (admin only) ── */}
        {activeTab === TABS.BY_MEMBER && isAdmin && (
          <ByMemberView year={currentWeek.year} week={currentWeek.week} />
        )}

        {/* ── My Schedule Tab (member only) ── */}
        {activeTab === TABS.MY_SCHEDULE && !isAdmin && (
          <MyScheduleView year={currentWeek.year} week={currentWeek.week} />
        )}
      </div>

      {/* Modals */}
      <MemberAssignmentModal
        isOpen={showAssignmentModal}
        onClose={handleCloseModal}
        schedule={selectedSchedule}
        shiftTemplate={selectedShiftTemplate}
        store={selectedStore}
        onLogExtraWork={handleOpenExtraWorkModal}
        onSaved={isAdmin ? refreshAdminWeek : undefined}
      />

      <ExtraWorkModal
        isOpen={showExtraWorkModal}
        onClose={handleCloseExtraWorkModal}
        memberId={selectedMemberForExtraWork}
        date={selectedDate}
      />

      {createLoading && <FullScreenLoader />}
    </div>
  );
};

export default WeeklySchedule;
