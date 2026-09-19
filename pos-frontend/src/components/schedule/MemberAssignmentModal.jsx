import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import { MdPerson, MdCheck, MdAccessTime, MdWarning, MdBlock, MdStore } from "react-icons/md";
import BottomSheet from "../shared/BottomSheet";
import {
  useGetAllMembersQuery,
  useBatchAssignMembersMutation,
  useCheckScheduleConflictsMutation,
  useCreateScheduleMutation,
} from "../../redux/api/endpoints";
import { unwrapList } from "../../redux/api/queryResult";
import { getLocalDateString, getWeekNumber, isShiftOver } from "../../utils/dateUtils";

const MemberCard = memo(function MemberCard({
  member,
  isSelected,
  conflict,
  shiftEnded,
  onToggle,
}) {
  const hasConflict = !!conflict;
  const isBlocked = hasConflict || shiftEnded;

  return (
    <button
      type="button"
      onClick={() => onToggle(member._id)}
      disabled={isBlocked}
      className={`relative flex w-full flex-row items-center gap-3 rounded-xl border-2 p-3 text-left transition-all sm:min-h-[116px] sm:flex-col sm:items-start sm:gap-2 ${
        hasConflict
          ? "cursor-not-allowed border-red-900/30 bg-red-900/10 opacity-60"
          : shiftEnded
          ? isSelected
            ? "cursor-not-allowed border-[#4ECDC4] bg-[#4ECDC4]/20 opacity-80"
            : "cursor-not-allowed border-[#3a3a3a] bg-[#1e1e1e] opacity-80"
          : isSelected
          ? "cursor-pointer border-[#4ECDC4] bg-[#4ECDC4]/15"
          : "cursor-pointer border-[#3a3a3a] bg-[#1e1e1e] hover:border-[#4a4a4a] hover:bg-[#252525]"
      }`}
    >
      {isSelected && !hasConflict ? (
        <div className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#4ECDC4]">
          <MdCheck size={14} className="text-[#1e1e1e]" />
        </div>
      ) : null}
      {hasConflict ? (
        <span className="absolute top-2.5 right-2.5 rounded bg-red-900/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
          Conflict
        </span>
      ) : null}

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          hasConflict ? "bg-red-900/30"
          : isSelected ? "bg-[#4ECDC4]"
          : "bg-[#3a3a3a]"
        }`}
      >
        {hasConflict
          ? <MdBlock size={18} className="text-red-400" />
          : <MdPerson size={18} className="text-[#f5f5f5]" />
        }
      </div>

      <div className="min-w-0 w-full pr-6">
        <p className="truncate text-sm font-semibold text-[#f5f5f5]">
          {member.name}
        </p>
        {hasConflict ? (
          <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-red-400">
            <MdWarning size={12} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">
              {conflict.conflictStore} · {conflict.conflictShift} ({conflict.conflictTime})
            </span>
          </p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-[#ababab]">
            {member.email || member.phone}
          </p>
        )}
        {member.role && !hasConflict ? (
          <span className="mt-1 inline-block truncate text-[11px] text-[#6a6a6a]">{member.role}</span>
        ) : null}
      </div>
    </button>
  );
});

MemberCard.propTypes = {
  member: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    role: PropTypes.string,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  conflict: PropTypes.shape({
    conflictStore: PropTypes.string,
    conflictShift: PropTypes.string,
    conflictTime: PropTypes.string,
  }),
  shiftEnded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

const getAssignedMemberIds = (assignedMembers) => {
  if (!assignedMembers) return [];
  return assignedMembers.map((am) => {
    if (typeof am === "object" && am.member) {
      return typeof am.member === "string" ? am.member : am.member._id;
    }
    return typeof am === "string" ? am : am._id;
  });
};

const MemberAssignmentModal = ({ isOpen, onClose, schedule, shiftTemplate, store, onLogExtraWork }) => {
  const { activeStore } = useSelector((state) => state.store);
  const { data: membersResult, isLoading: membersLoading } = useGetAllMembersQuery(
    { isActive: true },
    { skip: !isOpen }
  );
  const members = useMemo(() => unwrapList(membersResult), [membersResult]);
  const [batchAssignMembers, { isLoading: assignLoading }] = useBatchAssignMembersMutation();
  const [createSchedule, { isLoading: createLoading }] = useCreateScheduleMutation();
  const [checkScheduleConflicts] = useCheckScheduleConflictsMutation();

  const targetStore = store || activeStore;
  const isSaving = assignLoading || createLoading;

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [conflicts, setConflicts] = useState({});
  const [conflictsLoading, setConflictsLoading] = useState(false);
  const initialMembersRef = useRef([]);

  const shiftEnded = schedule && shiftTemplate
    ? isShiftOver(schedule.date, shiftTemplate.endTime)
    : false;

  useEffect(() => {
    if (!isOpen || !schedule) return;

    const ids = getAssignedMemberIds(schedule.assignedMembers);
    initialMembersRef.current = ids;
    setSelectedMembers(ids);
    setConflicts({});
  }, [isOpen, schedule]);

  useEffect(() => {
    if (!isOpen || !schedule || !shiftTemplate || members.length === 0) return;

    let cancelled = false;

    const loadConflicts = async () => {
      setConflictsLoading(true);
      try {
        const activeIds = members
          .filter((m) => m.isActive !== false)
          .map((m) => m._id);
        if (activeIds.length === 0) return;

        const shiftTemplateId = typeof shiftTemplate === "object" ? shiftTemplate._id : shiftTemplate;
        const result = await checkScheduleConflicts({
          memberIds: activeIds,
          date: schedule.date,
          shiftTemplateId,
          excludeScheduleId: schedule._id,
        }).unwrap();

        if (cancelled) return;

        const conflictList = Array.isArray(result) ? result : unwrapList(result);
        const map = {};
        for (const conflict of conflictList || []) {
          map[conflict.memberId] = conflict;
        }
        setConflicts(map);
        setSelectedMembers((prev) => prev.filter((id) => !map[id]));
      } catch {
        // Conflicts are advisory; the list stays usable.
      } finally {
        if (!cancelled) setConflictsLoading(false);
      }
    };

    loadConflicts();
    return () => {
      cancelled = true;
    };
  }, [isOpen, schedule, shiftTemplate, members, checkScheduleConflicts]);

  const storeMembers = useMemo(() => {
    return members.filter((m) => {
      if (m.isActive === false) return false;
      if (m.assignedStores && m.assignedStores.length > 0 && targetStore) {
        return m.assignedStores.some((s) => s._id === targetStore._id && s.isActive);
      }
      return true;
    });
  }, [members, targetStore]);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return storeMembers;
    return storeMembers.filter(
      (member) =>
        member.name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query)
    );
  }, [storeMembers, searchQuery]);

  const selectedMemberSet = useMemo(() => new Set(selectedMembers), [selectedMembers]);

  const conflictsRef = useRef(conflicts);
  conflictsRef.current = conflicts;

  const handleToggleMember = useCallback((memberId) => {
    if (shiftEnded) return;
    if (conflictsRef.current[memberId]) return;
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }, [shiftEnded]);

  const hasChanges = () => {
    const initial = [...initialMembersRef.current].sort();
    const current = [...selectedMembers].sort();
    if (initial.length !== current.length) return true;
    return initial.some((id, i) => id !== current[i]);
  };

  const handleSave = async () => {
    if (shiftEnded) return;
    if (!hasChanges()) { onClose(); return; }

    try {
      if (schedule._id) {
        await batchAssignMembers({
          scheduleId: schedule._id,
          memberIds: selectedMembers,
          storeId: targetStore?._id,
        }).unwrap();
      } else {
        const scheduleDate = new Date(schedule.date);
        await createSchedule({
          date: getLocalDateString(schedule.date),
          shiftTemplateId: typeof shiftTemplate === "object" ? shiftTemplate._id : shiftTemplate,
          memberIds: selectedMembers,
          year: schedule.year || scheduleDate.getFullYear(),
          weekNumber: schedule.weekNumber || getWeekNumber(scheduleDate),
          storeId: targetStore?._id,
        }).unwrap();
      }
      enqueueSnackbar("Member assignments updated", { variant: "success" });
      setSearchQuery("");
      onClose();
    } catch (error) {
      const message = error?.data || error;
      if (typeof message === "string" && message.includes("conflict")) {
        enqueueSnackbar(message, { variant: "warning" });
      } else {
        enqueueSnackbar(message || "Failed to update assignments", { variant: "error" });
      }
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setConflicts({});
    onClose();
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric"
    });
  };

  const title = (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-[#f5f5f5]">
          Assign Members to Shift
        </h2>
        {targetStore && (
          <span className="flex items-center gap-1 rounded bg-brand-10 px-2 py-1 text-xs font-medium text-brand">
            <MdStore size={13} /> {targetStore.name}
          </span>
        )}
      </div>
      {schedule && shiftTemplate && (
        <p className="mt-1 text-sm text-[#ababab]">
          {shiftTemplate.name} &bull; {formatDate(schedule.date)} &bull; {shiftTemplate.startTime} - {shiftTemplate.endTime}
        </p>
      )}
    </div>
  );

  const footer = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-[#ababab]">
          {selectedMembers.length} member{selectedMembers.length === 1 ? "" : "s"} selected
        </span>
        {hasChanges() ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
            Unsaved changes
          </span>
        ) : null}
      </div>

      {onLogExtraWork && schedule && selectedMembers.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            handleClose();
            onLogExtraWork(schedule.date, selectedMembers[0]);
          }}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/20"
        >
          <MdAccessTime size={18} />
          Log Extra Work
        </button>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <button
          type="button"
          onClick={handleClose}
          className="min-h-[44px] rounded-lg border border-[#343434] bg-[#262626] px-4 py-2.5 text-sm font-medium text-[#f5f5f5] transition-colors hover:bg-[#343434] sm:order-1 sm:min-w-[7rem]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || shiftEnded}
          className="min-h-[44px] rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-[#f5f5f5] transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 sm:order-2 sm:min-w-[7rem]"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      footer={footer}
      size="xl"
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
    >
      {shiftEnded && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-[#4a4a4a] bg-[#3a3a3a]/50 px-4 py-3 text-sm text-[#ababab]">
          <MdBlock size={16} className="shrink-0 text-brand" />
          This shift has ended. Assignments can no longer be changed.
        </div>
      )}

      <div className="border-b border-[#3a3a3a] p-6">
        <input
          type="text"
          placeholder="Search members by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={shiftEnded}
          className="w-full rounded-lg border border-[#3a3a3a] bg-[#1e1e1e] px-4 py-2 text-[#f5f5f5] placeholder-[#6a6a6a] focus:border-[#4ECDC4] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {membersLoading && members.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ECDC4]"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <MdPerson size={48} className="mx-auto text-[#6a6a6a] mb-4" />
            <p className="text-[#ababab]">
              {searchQuery ? "No members found matching your search" : "No active members available for this store"}
            </p>
          </div>
        ) : (
          <div>
            {conflictsLoading ? (
              <p className="text-xs text-[#6a6a6a] pb-3">Checking conflicts…</p>
            ) : null}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member._id}
                  member={member}
                  isSelected={selectedMemberSet.has(member._id)}
                  conflict={conflicts[member._id]}
                  shiftEnded={shiftEnded}
                  onToggle={handleToggleMember}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

MemberAssignmentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  schedule: PropTypes.shape({
    _id: PropTypes.string,
    date: PropTypes.string,
    assignedMembers: PropTypes.array,
    year: PropTypes.number,
    weekNumber: PropTypes.number,
  }),
  shiftTemplate: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
  }),
  store: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
  }),
  onLogExtraWork: PropTypes.func,
};

export default MemberAssignmentModal;
