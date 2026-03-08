import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import { MdClose, MdPerson, MdCheck, MdAccessTime, MdWarning, MdBlock } from "react-icons/md";
import { fetchMembers } from "../../redux/slices/memberSlice";
import { batchAssignMembers } from "../../redux/slices/scheduleSlice";
import { checkScheduleConflicts } from "../../https/scheduleApi";
import FullScreenLoader from "../shared/FullScreenLoader";

const MemberAssignmentModal = ({ isOpen, onClose, schedule, shiftTemplate, onLogExtraWork }) => {
  const dispatch = useDispatch();
  const { members, loading: membersLoading } = useSelector((state) => state.members);
  const { assignLoading } = useSelector((state) => state.schedules);
  const { activeStore } = useSelector((state) => state.store);

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [conflicts, setConflicts] = useState({});
  const [conflictsLoading, setConflictsLoading] = useState(false);
  const initialMembersRef = useRef([]);

  const getAssignedMemberIds = useCallback((assignedMembers) => {
    if (!assignedMembers) return [];
    return assignedMembers.map(am => {
      if (typeof am === 'object' && am.member) {
        return typeof am.member === 'string' ? am.member : am.member._id;
      }
      return typeof am === 'string' ? am : am._id;
    });
  }, []);

  // Fetch conflicts for all active members when modal opens
  useEffect(() => {
    if (!isOpen || !schedule || !shiftTemplate) return;

    const ids = getAssignedMemberIds(schedule?.assignedMembers);
    initialMembersRef.current = ids;
    setSelectedMembers(ids);

    if (!members || members.length === 0) {
      dispatch(fetchMembers());
    }

    const loadConflicts = async () => {
      setConflictsLoading(true);
      try {
        const activeIds = members
          ?.filter(m => m.isActive)
          .map(m => m._id) || [];
        if (activeIds.length === 0) { setConflictsLoading(false); return; }

        const shiftTemplateId = typeof shiftTemplate === 'object' ? shiftTemplate._id : shiftTemplate;
        const { data } = await checkScheduleConflicts({
          memberIds: activeIds,
          date: schedule.date,
          shiftTemplateId,
          excludeScheduleId: schedule._id
        });

        const map = {};
        for (const c of data.data || []) {
          map[c.memberId] = c;
        }
        setConflicts(map);
      } catch {
        // Silently fail — conflicts are advisory
      } finally {
        setConflictsLoading(false);
      }
    };

    if (members && members.length > 0) {
      loadConflicts();
    }
  }, [isOpen, schedule, shiftTemplate, dispatch, getAssignedMemberIds, members]);

  // Get store members (members assigned to the current store)
  const storeMembers = members?.filter(m => {
    if (!m.isActive) return false;
    // Filter by store assignment if available
    if (m.assignedStores && m.assignedStores.length > 0 && activeStore) {
      return m.assignedStores.some(s => s._id === activeStore._id && s.isActive);
    }
    return true;
  }) || [];

  const filteredMembers = storeMembers.filter(
    member =>
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleMember = (memberId) => {
    if (conflicts[memberId]) return; // Block conflicting members
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const hasChanges = () => {
    const initial = [...initialMembersRef.current].sort();
    const current = [...selectedMembers].sort();
    if (initial.length !== current.length) return true;
    return initial.some((id, i) => id !== current[i]);
  };

  const handleSave = async () => {
    if (!hasChanges()) { onClose(); return; }

    try {
      await dispatch(batchAssignMembers({
        scheduleId: schedule._id,
        memberIds: selectedMembers
      })).unwrap();
      enqueueSnackbar("Member assignments updated", { variant: "success" });
      setSearchQuery("");
      onClose();
    } catch (error) {
      if (typeof error === 'string' && error.includes('conflict')) {
        enqueueSnackbar(error, { variant: "warning" });
      } else {
        enqueueSnackbar(error || "Failed to update assignments", { variant: "error" });
      }
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setConflicts({});
    onClose();
  };

  if (!isOpen) return null;

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric"
    });
  };

  return (
    <>
      {assignLoading && <FullScreenLoader />}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#2a2a2a] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#3a3a3a]">
            <div>
              <h2 className="text-xl font-bold text-[#f5f5f5]">
                Assign Members to Shift
              </h2>
              {schedule && shiftTemplate && (
                <p className="text-sm text-[#ababab] mt-1">
                  {shiftTemplate.name} &bull; {formatDate(schedule.date)} &bull; {shiftTemplate.startTime} - {shiftTemplate.endTime}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-[#3a3a3a]">
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg text-[#f5f5f5] placeholder-[#6a6a6a] focus:outline-none focus:border-[#4ECDC4]"
            />
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto p-6">
            {membersLoading || conflictsLoading ? (
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
              <div className="space-y-2">
                {filteredMembers.map((member) => {
                  const isSelected = selectedMembers.includes(member._id);
                  const conflict = conflicts[member._id];
                  const isBlocked = !!conflict;

                  return (
                    <button
                      key={member._id}
                      onClick={() => handleToggleMember(member._id)}
                      disabled={isBlocked}
                      className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${
                        isBlocked
                          ? "bg-red-900/10 border-2 border-red-900/30 cursor-not-allowed opacity-60"
                          : isSelected
                          ? "bg-[#4ECDC4] bg-opacity-20 border-2 border-[#4ECDC4] cursor-pointer"
                          : "bg-[#1e1e1e] border-2 border-[#3a3a3a] hover:border-[#4a4a4a] cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isBlocked ? "bg-red-900/30"
                            : isSelected ? "bg-[#4ECDC4]"
                            : "bg-[#3a3a3a]"
                          }`}
                        >
                          {isBlocked
                            ? <MdBlock size={20} className="text-red-400" />
                            : <MdPerson size={20} className="text-[#f5f5f5]" />
                          }
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-[#f5f5f5]">
                            {member.name}
                          </p>
                          {isBlocked ? (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                              <MdWarning size={12} />
                              {conflict.conflictStore} &bull; {conflict.conflictShift} ({conflict.conflictTime})
                            </p>
                          ) : (
                            <p className="text-sm text-[#ababab]">
                              {member.email || member.phone}
                            </p>
                          )}
                          {member.role && !isBlocked && (
                            <span className="text-xs text-[#6a6a6a]">{member.role}</span>
                          )}
                        </div>
                      </div>

                      {isSelected && !isBlocked && (
                        <div className="w-6 h-6 rounded-full bg-[#4ECDC4] flex items-center justify-center">
                          <MdCheck size={16} className="text-[#1e1e1e]" />
                        </div>
                      )}
                      {isBlocked && (
                        <span className="text-xs text-red-400 font-medium px-2 py-1 bg-red-900/20 rounded">
                          Conflict
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-[#3a3a3a]">
            <div className="text-sm text-[#ababab]">
              {selectedMembers.length} member(s) selected
              {hasChanges() && (
                <span className="ml-2 text-[#f6b100]">&bull; unsaved changes</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {onLogExtraWork && schedule && selectedMembers.length > 0 && (
                <button
                  onClick={() => { handleClose(); onLogExtraWork(schedule.date, selectedMembers[0]); }}
                  className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors flex items-center gap-2"
                >
                  <MdAccessTime size={16} /> Log Extra Work
                </button>
              )}
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#f5f5f5] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={assignLoading}
                className="px-6 py-2 bg-[#4ECDC4] hover:bg-[#4ECDC4]/90 text-[#1e1e1e] font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {assignLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

MemberAssignmentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  schedule: PropTypes.shape({
    _id: PropTypes.string,
    date: PropTypes.string,
    assignedMembers: PropTypes.array,
  }),
  shiftTemplate: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
  }),
  onLogExtraWork: PropTypes.func,
};

export default MemberAssignmentModal;
