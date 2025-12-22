import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import { MdClose, MdPerson, MdCheck, MdAccessTime } from "react-icons/md";
import { fetchMembers } from "../../redux/slices/memberSlice";
import { assignMember, unassignMember } from "../../redux/slices/scheduleSlice";
import FullScreenLoader from "../shared/FullScreenLoader";
import ExtraWorkModal from "../extrawork/ExtraWorkModal";

const MemberAssignmentModal = ({ isOpen, onClose, schedule, shiftTemplate, onLogExtraWork }) => {
  const dispatch = useDispatch();
  const { members, loading: membersLoading } = useSelector((state) => state.members);
  const { assignLoading } = useSelector((state) => state.schedules);
  
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Fetch members if not already loaded
      if (!members || members.length === 0) {
        dispatch(fetchMembers());
      }
      
      // Pre-select members already assigned to this schedule
      if (schedule?.assignedMembers) {
        const memberIds = schedule.assignedMembers.map(am => {
          // assignedMembers has structure: { member, status }
          if (typeof am === 'object' && am.member) {
            return typeof am.member === 'string' ? am.member : am.member._id;
          }
          return typeof am === 'string' ? am : am._id;
        });
        setSelectedMembers(memberIds);
      } else {
        setSelectedMembers([]);
      }
    }
  }, [isOpen, schedule, members, dispatch]);

  // Filter active members and by search query
  const activeMembers = members?.filter(
    member => member.isActive && 
    (member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     member.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const handleToggleMember = async (memberId) => {
    const isCurrentlySelected = selectedMembers.includes(memberId);

    try {
      if (isCurrentlySelected) {
        // Unassign member
        const result = await dispatch(unassignMember({
          scheduleId: schedule._id,
          memberId
        })).unwrap();
        
        setSelectedMembers(prev => prev.filter(id => id !== memberId));
        enqueueSnackbar("Member unassigned successfully", { variant: "success" });
      } else {
        // Assign member
        const result = await dispatch(assignMember({
          scheduleId: schedule._id,
          memberId
        })).unwrap();
        
        setSelectedMembers(prev => [...prev, memberId]);
        enqueueSnackbar("Member assigned successfully", { variant: "success" });
      }
    } catch (error) {
      enqueueSnackbar(
        error || "Failed to update member assignment",
        { variant: "error" }
      );
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  if (!isOpen) return null;

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
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
                  {shiftTemplate.name} • {formatDate(schedule.date)} • {shiftTemplate.startTime} - {shiftTemplate.endTime}
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
            {membersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ECDC4]"></div>
              </div>
            ) : activeMembers.length === 0 ? (
              <div className="text-center py-12">
                <MdPerson size={48} className="mx-auto text-[#6a6a6a] mb-4" />
                <p className="text-[#ababab]">
                  {searchQuery ? "No members found matching your search" : "No active members available"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeMembers.map((member) => {
                  const isSelected = selectedMembers.includes(member._id);
                  
                  return (
                    <button
                      key={member._id}
                      onClick={() => handleToggleMember(member._id)}
                      disabled={assignLoading}
                      className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${
                        isSelected
                          ? "bg-[#4ECDC4] bg-opacity-20 border-2 border-[#4ECDC4]"
                          : "bg-[#1e1e1e] border-2 border-[#3a3a3a] hover:border-[#4a4a4a]"
                      } ${assignLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isSelected ? "bg-[#4ECDC4]" : "bg-[#3a3a3a]"
                          }`}
                        >
                          <MdPerson size={20} className="text-[#f5f5f5]" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-[#f5f5f5]">
                            {member.name}
                          </p>
                          <p className="text-sm text-[#ababab]">
                            {member.email}
                          </p>
                          {member.role && (
                            <span className="text-xs text-[#6a6a6a]">
                              {member.role}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#4ECDC4] flex items-center justify-center">
                          <MdCheck size={16} className="text-[#1e1e1e]" />
                        </div>
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
              {selectedMembers.length} member(s) assigned
            </div>
            <div className="flex items-center gap-3">
              {onLogExtraWork && schedule && selectedMembers.length > 0 && (
                <button
                  onClick={() => {
                    handleClose();
                    onLogExtraWork(schedule.date, selectedMembers[0]);
                  }}
                  className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors flex items-center gap-2"
                  title="Log extra work for assigned members"
                >
                  <MdAccessTime size={16} /> Log Extra Work
                </button>
              )}
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#f5f5f5] rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberAssignmentModal;

