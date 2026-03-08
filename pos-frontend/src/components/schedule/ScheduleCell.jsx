import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { MdAdd as MdAddIcon } from "react-icons/md";

const ScheduleCell = ({ schedule, shiftTemplate, onClick, members, disabled = false }) => {
  const { _id: currentUserId } = useSelector((state) => state.user);

  if (!shiftTemplate) return null;

  const assignedMembers = schedule?.assignedMembers || [];
  const memberCount = assignedMembers.length;
  const isEmpty = !schedule || memberCount === 0;

  const getMemberColor = (memberId) => {
    if (!memberId) return '#4a4a4a';
    const colors = [
      '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#6366f1',
    ];
    let hash = 0;
    const idStr = memberId.toString();
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getMemberId = (assignedMember) => {
    if (assignedMember?.member && typeof assignedMember.member === 'object') {
      return assignedMember.member._id;
    }
    if (typeof assignedMember?.member === 'string') return assignedMember.member;
    if (assignedMember?._id) return assignedMember._id;
    return null;
  };

  const getMemberName = (assignedMember) => {
    if (assignedMember?.member && typeof assignedMember.member === 'object') {
      return assignedMember.member.name || "Unknown";
    }
    if (typeof assignedMember?.member === 'string') {
      const found = members?.find(m => m._id === assignedMember.member);
      return found?.name || `Member ${assignedMember.member.slice(-4)}`;
    }
    return assignedMember?.name || "Unknown";
  };

  const hasCurrentUser = assignedMembers.some(am => getMemberId(am) === currentUserId);

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full h-full min-h-[80px] p-2 rounded-lg transition-all border-2 text-left ${
        disabled
          ? hasCurrentUser
            ? "cursor-default border-yellow-500/40 bg-yellow-400/5"
            : "cursor-default opacity-70 border-[#3a3a3a] bg-[#1e1e1e]"
          : isEmpty
          ? "bg-[#1e1e1e] border-[#3a3a3a] hover:border-[#4ECDC4] hover:bg-[#252525] cursor-pointer"
          : "bg-[#2a2a2a] border-[#4a4a4a] hover:border-[#4ECDC4] cursor-pointer"
      }`}
      title={disabled ? (hasCurrentUser ? "Your shift" : "View only") : "Click to assign members"}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-lg"
          style={{ backgroundColor: shiftTemplate.color || "#4ECDC4" }}
        />
        <div className="flex-1 ml-1">
          <p className="text-xs font-semibold text-[#f5f5f5] truncate">
            {shiftTemplate.shortName || shiftTemplate.name}
          </p>
          <p className="text-xs text-[#ababab]">
            {shiftTemplate.startTime} - {shiftTemplate.endTime}
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center py-2">
          {!disabled ? (
            <div className="flex items-center space-x-1 text-[#6a6a6a]">
              <MdAddIcon size={16} />
              <span className="text-xs">Assign</span>
            </div>
          ) : (
            <span className="text-xs text-[#4a4a4a]">—</span>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {assignedMembers.slice(0, 3).map((assignedMember, index) => {
            const memberId = getMemberId(assignedMember);
            const memberName = getMemberName(assignedMember);
            const status = assignedMember?.status || "scheduled";
            const isMe = memberId === currentUserId;
            const memberColor = isMe ? '#f6b100' : getMemberColor(memberId);
            const opacityClass = status === 'absent' || status === 'cancelled' ? 'opacity-50' : 'opacity-100';

            return (
              <div
                key={memberId || index}
                className={`flex items-center space-x-1 rounded px-2 py-1 ${opacityClass}`}
                style={{ backgroundColor: `${memberColor}15` }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: memberColor }}
                />
                <span
                  className={`text-xs truncate ${isMe ? 'font-bold' : 'font-medium'}`}
                  style={{ color: memberColor }}
                >
                  {isMe ? `${memberName} ★` : memberName}
                </span>
              </div>
            );
          })}

          {memberCount > 3 && (
            <div className="text-xs text-[#4ECDC4] font-semibold px-2">
              +{memberCount - 3} more
            </div>
          )}
        </div>
      )}
    </button>
  );
};

ScheduleCell.propTypes = {
  schedule: PropTypes.shape({
    _id: PropTypes.string,
    date: PropTypes.string,
    shiftTemplate: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    assignedMembers: PropTypes.array,
    status: PropTypes.string,
    notes: PropTypes.string
  }),
  shiftTemplate: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    shortName: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    color: PropTypes.string
  }),
  onClick: PropTypes.func.isRequired,
  members: PropTypes.arrayOf(
    PropTypes.shape({ _id: PropTypes.string, name: PropTypes.string })
  ),
  disabled: PropTypes.bool
};

export default ScheduleCell;
