import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdStore, MdAccessTime, MdCalendarToday } from "react-icons/md";
import PropTypes from "prop-types";
import { fetchMySchedulesAllStores } from "../../redux/slices/scheduleSlice";
import { getWeekDates, getDayName, formatDate, getLocalDateString } from "../../utils/dateUtils";

const MyScheduleView = ({ year, week }) => {
  const dispatch = useDispatch();
  const { myAllStoresSchedules, myAllStoresLoading } = useSelector((state) => state.schedules);
  const { _id: currentUserId } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchMySchedulesAllStores({ year, week }));
  }, [dispatch, year, week]);

  const weekDates = getWeekDates(year, week);

  const daySchedules = useMemo(() => {
    const map = {};
    for (const date of weekDates) {
      map[getLocalDateString(date)] = [];
    }

    for (const sched of myAllStoresSchedules || []) {
      const dateStr = getLocalDateString(new Date(sched.date));
      if (!map[dateStr]) continue;

      const shift = sched.shiftTemplate;
      if (!shift) continue;

      map[dateStr].push({
        storeName: sched.store?.name || "Unknown",
        storeCode: sched.store?.code || "",
        shiftName: shift.name || shift.shortName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        durationHours: shift.durationHours || 0,
        color: shift.color || "#f6b100"
      });
    }

    return map;
  }, [myAllStoresSchedules, weekDates]);

  const totalShifts = Object.values(daySchedules).reduce((sum, arr) => sum + arr.length, 0);
  const totalHours = Object.values(daySchedules)
    .flat()
    .reduce((sum, s) => sum + s.durationHours, 0);

  if (myAllStoresLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {weekDates.map((date) => {
        const dateStr = getLocalDateString(date);
        const shifts = daySchedules[dateStr] || [];
        const isToday = getLocalDateString(new Date()) === dateStr;

        return (
          <div key={dateStr}>
            {/* Day Header */}
            <div className={`flex items-center gap-2 mb-2 ${isToday ? 'text-[#f6b100]' : 'text-[#ababab]'}`}>
              <MdCalendarToday size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {getDayName(date, "long")} {formatDate(date, "short")}
                {isToday && <span className="ml-2 text-[10px] bg-[#f6b100]/20 px-1.5 py-0.5 rounded">Today</span>}
              </span>
            </div>

            {/* Shift Cards */}
            {shifts.length > 0 ? (
              <div className="space-y-2">
                {shifts.map((shift, i) => (
                  <div
                    key={i}
                    className="bg-[#1f1f1f] rounded-lg p-4 border border-[#343434] flex items-center gap-4"
                  >
                    <div
                      className="w-1 h-12 rounded-full flex-shrink-0"
                      style={{ backgroundColor: shift.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#f5f5f5] font-medium text-sm">
                        {shift.shiftName}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[#ababab] flex items-center gap-1">
                          <MdAccessTime size={12} />
                          {shift.startTime} - {shift.endTime}
                        </span>
                        <span className="text-xs text-[#888]">
                          {shift.durationHours}h
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#262626] rounded-lg px-3 py-1.5 flex-shrink-0">
                      <MdStore size={14} className="text-purple-400" />
                      <span className="text-xs text-[#ccc] font-medium">{shift.storeName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-dashed border-[#2a2a2a] text-center">
                <span className="text-[#4a4a4a] text-sm">Day Off</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Week Summary */}
      <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#343434] mt-4">
        <div className="flex items-center justify-between">
          <span className="text-[#ababab] text-sm">This week</span>
          <div className="flex items-center gap-4">
            <span className="text-[#f5f5f5] text-sm font-medium">{totalShifts} shift{totalShifts !== 1 ? 's' : ''}</span>
            <span className="text-[#4ECDC4] text-sm font-bold">{totalHours.toFixed(1)} hours</span>
          </div>
        </div>
      </div>
    </div>
  );
};

MyScheduleView.propTypes = {
  year: PropTypes.number.isRequired,
  week: PropTypes.number.isRequired
};

export default MyScheduleView;
