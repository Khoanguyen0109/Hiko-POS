import { useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  MdStore,
  MdExpandMore,
  MdExpandLess,
  MdUnfoldMore,
  MdUnfoldLess,
  MdCheckCircle
} from "react-icons/md";
import ScheduleCell from "./ScheduleCell";
import { formatDate, getDayName, getLocalDateString, isShiftOver } from "../../utils/dateUtils";

// Resolve a populated-or-raw store reference to its id string.
const storeIdOf = (ref) => {
  if (!ref) return null;
  return typeof ref === "object" ? ref._id : ref;
};

const memberIdOf = (am) => {
  const m = am?.member ?? am;
  if (!m) return null;
  return typeof m === "object" ? m._id : m;
};

/**
 * Admin combined view: one editable weekly grid per store, stacked vertically.
 * Lets an admin see and edit every store's schedule on a single page without
 * switching the global active store.
 */
const AllStoresWeekGrid = ({
  stores,
  schedules,
  shiftTemplates,
  members,
  weekDates,
  activeStoreId,
  onCellClick
}) => {
  const sectionRefs = useRef({});
  const [collapsed, setCollapsed] = useState(() => new Set());

  // Index schedules as map[storeId][dateStr][templateId] = schedule, and gather
  // per-store stats in a single pass.
  const { byStore, statsByStore } = useMemo(() => {
    const map = {};
    const stats = {};

    for (const sched of schedules || []) {
      const sId = storeIdOf(sched.store);
      if (!sId) continue;

      const dateStr = getLocalDateString(new Date(sched.date));
      const tId = storeIdOf(sched.shiftTemplate);

      if (!map[sId]) map[sId] = {};
      if (!map[sId][dateStr]) map[sId][dateStr] = {};
      if (tId) map[sId][dateStr][tId] = sched;

      if (!stats[sId]) stats[sId] = { shifts: 0, assigned: 0, staff: new Set(), hours: 0 };
      const s = stats[sId];
      s.shifts += 1;
      const assignedMembers = sched.assignedMembers || [];
      if (assignedMembers.length > 0) s.assigned += 1;
      const duration = sched.shiftTemplate?.durationHours || 0;
      for (const am of assignedMembers) {
        const mid = memberIdOf(am);
        if (mid) s.staff.add(mid);
        s.hours += duration;
      }
    }

    return { byStore: map, statsByStore: stats };
  }, [schedules]);

  // Active store first, then alphabetical — keeps the admin's default context on top.
  const orderedStores = useMemo(() => {
    const list = [...(stores || [])];
    list.sort((a, b) => {
      if (a._id === activeStoreId) return -1;
      if (b._id === activeStoreId) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
    return list;
  }, [stores, activeStoreId]);

  const allCollapsed = orderedStores.length > 0 && collapsed.size >= orderedStores.length;

  const toggleStore = (storeId) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  };

  const toggleAll = () => {
    setCollapsed(allCollapsed ? new Set() : new Set(orderedStores.map((s) => s._id)));
  };

  const jumpToStore = (storeId) => {
    // Make sure the section is expanded, then scroll it into view.
    setCollapsed((prev) => {
      if (!prev.has(storeId)) return prev;
      const next = new Set(prev);
      next.delete(storeId);
      return next;
    });
    const el = sectionRefs.current[storeId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (orderedStores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MdStore size={48} className="text-[#6a6a6a] mb-4" />
        <h3 className="text-[#f5f5f5] text-lg font-semibold mb-2">No Stores Found</h3>
        <p className="text-[#ababab] text-sm">Create a store to start scheduling shifts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: jump-to-store chips + expand/collapse all */}
      <div className="bg-[#1f1f1f] rounded-lg border border-[#343434] p-3 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <span className="text-[#6a6a6a] text-xs uppercase tracking-wider mr-1">Jump to</span>
          {orderedStores.map((store) => {
            const isActive = store._id === activeStoreId;
            const st = statsByStore[store._id];
            return (
              <button
                key={store._id}
                onClick={() => jumpToStore(store._id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  isActive
                    ? "bg-[#f6b100]/15 border-[#f6b100]/40 text-[#f6b100]"
                    : "bg-[#262626] border-[#343434] text-[#ababab] hover:text-[#f5f5f5] hover:border-[#4a4a4a]"
                }`}
                title={`Go to ${store.name}`}
              >
                <MdStore size={13} />
                <span className="max-w-[140px] truncate">{store.name}</span>
                {st?.assigned > 0 && (
                  <span className="text-[10px] opacity-80">({st.assigned})</span>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={toggleAll}
          className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-[#262626] hover:bg-[#343434] text-[#f5f5f5] rounded-lg text-sm transition-colors"
        >
          {allCollapsed ? <MdUnfoldMore size={16} /> : <MdUnfoldLess size={16} />}
          {allCollapsed ? "Expand all" : "Collapse all"}
        </button>
      </div>

      {/* One grid per store */}
      {orderedStores.map((store) => {
        const isActive = store._id === activeStoreId;
        const isCollapsed = collapsed.has(store._id);
        const st = statsByStore[store._id] || { shifts: 0, assigned: 0, staff: new Set(), hours: 0 };
        const staffCount = st.staff?.size || 0;

        return (
          <div
            key={store._id}
            ref={(el) => { sectionRefs.current[store._id] = el; }}
            className={`bg-[#1f1f1f] rounded-lg border overflow-hidden scroll-mt-4 ${
              isActive ? "border-[#f6b100]/40" : "border-[#343434]"
            }`}
          >
            {/* Store header */}
            <button
              onClick={() => toggleStore(store._id)}
              className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-[#262626]/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? "bg-[#f6b100]/20" : "bg-[#262626]"
                }`}>
                  <MdStore className={isActive ? "text-[#f6b100]" : "text-[#ababab]"} size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[#f5f5f5] font-semibold truncate">{store.name}</h4>
                    {isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-[#f6b100] bg-[#f6b100]/10 px-1.5 py-0.5 rounded">
                        <MdCheckCircle size={11} /> Current
                      </span>
                    )}
                  </div>
                  <p className="text-[#6a6a6a] text-xs mt-0.5">{store.code}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-[#4ECDC4] font-bold">{st.assigned}</div>
                    <div className="text-[#6a6a6a]">assigned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#f5f5f5] font-bold">{staffCount}</div>
                    <div className="text-[#6a6a6a]">staff</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#f6b100] font-bold">{st.hours.toFixed(0)}h</div>
                    <div className="text-[#6a6a6a]">hours</div>
                  </div>
                </div>
                {isCollapsed ? (
                  <MdExpandMore className="text-[#ababab]" size={22} />
                ) : (
                  <MdExpandLess className="text-[#ababab]" size={22} />
                )}
              </div>
            </button>

            {/* Weekly grid */}
            {!isCollapsed && (
              <div className="overflow-x-auto border-t border-[#343434]">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-[#343434]">
                      <th className="px-4 py-3 text-left text-[#ababab] text-sm font-medium w-32">
                        Shift
                      </th>
                      {weekDates.map((date, index) => (
                        <th key={index} className="px-4 py-3 text-center text-[#ababab] text-sm font-medium">
                          <div>{getDayName(date, "short")}</div>
                          <div className="text-[#f5f5f5] font-semibold mt-1">{formatDate(date, "short")}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shiftTemplates.map((template) => (
                      <tr key={template._id} className="border-b border-[#343434] last:border-0">
                        <td className="px-4 py-6 align-top">
                          <div className="flex items-start gap-2">
                            <div
                              className="w-3 h-3 rounded-full mt-1 shrink-0"
                              style={{ backgroundColor: template.color }}
                            />
                            <div>
                              <div className="text-[#f5f5f5] font-medium text-sm">{template.name}</div>
                              <div className="text-[#ababab] text-xs mt-1">
                                {template.startTime} - {template.endTime}
                              </div>
                              <div className="text-[#6a6a6a] text-xs mt-0.5">{template.durationHours}h</div>
                            </div>
                          </div>
                        </td>
                        {weekDates.map((date, dateIndex) => {
                          const dateStr = getLocalDateString(date);
                          const schedule = byStore[store._id]?.[dateStr]?.[template._id] || null;
                          const shiftEnded = isShiftOver(date, template.endTime);
                          return (
                            <td key={dateIndex} className="px-2 py-3 align-top bg-[#262626]/30">
                              <ScheduleCell
                                schedule={schedule}
                                shiftTemplate={template}
                                members={members}
                                onClick={() => onCellClick(store, date, template)}
                                disabled={shiftEnded}
                                disabledTitle={shiftEnded ? "Shift ended" : undefined}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

AllStoresWeekGrid.propTypes = {
  stores: PropTypes.array.isRequired,
  schedules: PropTypes.array,
  shiftTemplates: PropTypes.array.isRequired,
  members: PropTypes.array,
  weekDates: PropTypes.array.isRequired,
  activeStoreId: PropTypes.string,
  onCellClick: PropTypes.func.isRequired
};

export default AllStoresWeekGrid;
