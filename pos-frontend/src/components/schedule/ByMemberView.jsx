import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdPerson, MdStore } from "react-icons/md";
import PropTypes from "prop-types";
import { fetchAllMembersWeek } from "../../redux/slices/scheduleSlice";
import { getWeekDates, formatDate, getDayName, getLocalDateString } from "../../utils/dateUtils";

const STORE_COLORS = [
  { bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
  { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
  { bg: "bg-orange-500/15", text: "text-orange-400", dot: "bg-orange-400" },
  { bg: "bg-pink-500/15", text: "text-pink-400", dot: "bg-pink-400" },
  { bg: "bg-teal-500/15", text: "text-teal-400", dot: "bg-teal-400" },
];

const ByMemberView = ({ year, week }) => {
  const dispatch = useDispatch();
  const { allMembersSchedules, allMembersLoading } = useSelector((state) => state.schedules);

  useEffect(() => {
    dispatch(fetchAllMembersWeek({ year, week }));
  }, [dispatch, year, week]);

  const weekDates = getWeekDates(year, week);

  // Build per-member per-day data
  const { memberRows, storeColorMap } = useMemo(() => {
    const memberMap = {};
    const storeSet = new Set();

    for (const sched of allMembersSchedules || []) {
      const dateStr = getLocalDateString(new Date(sched.date));
      const storeName = sched.store?.name || "Unknown";
      const storeId = sched.store?._id || "unknown";
      storeSet.add(storeId);

      const shift = sched.shiftTemplate;
      if (!shift) continue;

      for (const am of sched.assignedMembers || []) {
        const member = am.member;
        if (!member) continue;
        const mid = typeof member === 'string' ? member : member._id;
        const name = typeof member === 'object' ? member.name : mid;

        if (!memberMap[mid]) {
          memberMap[mid] = { name, shifts: {}, totalHours: 0 };
        }

        if (!memberMap[mid].shifts[dateStr]) {
          memberMap[mid].shifts[dateStr] = [];
        }

        memberMap[mid].shifts[dateStr].push({
          storeName,
          storeId,
          shiftName: shift.shortName || shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          durationHours: shift.durationHours || 0
        });
        memberMap[mid].totalHours += shift.durationHours || 0;
      }
    }

    // Assign colors to stores
    const storeIds = [...storeSet];
    const colorMap = {};
    storeIds.forEach((id, i) => {
      colorMap[id] = STORE_COLORS[i % STORE_COLORS.length];
    });

    const rows = Object.entries(memberMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { memberRows: rows, storeColorMap: colorMap };
  }, [allMembersSchedules]);

  if (allMembersLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ECDC4]"></div>
      </div>
    );
  }

  if (memberRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MdPerson size={48} className="text-[#6a6a6a] mb-4" />
        <h3 className="text-[#f5f5f5] text-lg font-semibold mb-2">No Schedules This Week</h3>
        <p className="text-[#ababab] text-sm">No members have been assigned to any shifts across all stores.</p>
      </div>
    );
  }

  // Store legend
  const storeEntries = Object.entries(storeColorMap);

  return (
    <div className="space-y-4">
      {/* Store Legend */}
      {storeEntries.length > 0 && (
        <div className="flex items-center gap-4 px-2 flex-wrap">
          {storeEntries.map(([storeId, colors]) => {
            const storeName = allMembersSchedules?.find(s => s.store?._id === storeId)?.store?.name || storeId;
            return (
              <div key={storeId} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <span className={`text-xs font-medium ${colors.text}`}>{storeName}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid */}
      <div className="bg-[#1f1f1f] rounded-lg border border-[#343434] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#343434]">
                <th className="px-4 py-3 text-left text-[#ababab] text-sm font-medium w-44">
                  Member
                </th>
                {weekDates.map((date, i) => (
                  <th key={i} className="px-3 py-3 text-center text-[#ababab] text-sm font-medium">
                    <div>{getDayName(date, "short")}</div>
                    <div className="text-[#f5f5f5] font-semibold mt-1">{formatDate(date, "short")}</div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-[#ababab] text-sm font-medium w-20">
                  Hours
                </th>
              </tr>
            </thead>
            <tbody>
              {memberRows.map((row) => (
                <tr key={row.id} className="border-b border-[#343434] last:border-0">
                  <td className="px-4 py-4 align-top">
                    <p className="text-[#f5f5f5] font-medium text-sm">{row.name}</p>
                  </td>
                  {weekDates.map((date, i) => {
                    const dateStr = getLocalDateString(date);
                    const dayShifts = row.shifts[dateStr] || [];

                    return (
                      <td key={i} className="px-2 py-3 align-top">
                        {dayShifts.length > 0 ? (
                          <div className="space-y-1">
                            {dayShifts.map((shift, si) => {
                              const colors = storeColorMap[shift.storeId] || STORE_COLORS[0];
                              return (
                                <div
                                  key={si}
                                  className={`${colors.bg} rounded px-2 py-1.5`}
                                >
                                  <div className="flex items-center gap-1">
                                    <MdStore size={10} className={colors.text} />
                                    <span className={`text-[10px] font-medium ${colors.text} truncate`}>
                                      {shift.storeName}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#ccc] font-medium mt-0.5">{shift.shiftName}</p>
                                  <p className="text-[10px] text-[#888]">{shift.startTime}-{shift.endTime}</p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="min-h-[40px] flex items-center justify-center">
                            <span className="text-[#3a3a3a] text-xs">—</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-4 align-top text-center">
                    <span className="text-[#4ECDC4] font-bold text-sm">{row.totalHours.toFixed(1)}h</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

ByMemberView.propTypes = {
  year: PropTypes.number.isRequired,
  week: PropTypes.number.isRequired
};

export default ByMemberView;
