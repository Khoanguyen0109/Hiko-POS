import { MdPerson, MdAdd } from "react-icons/md";
import PropTypes from "prop-types";

const ScheduleCell = ({ schedule, shiftTemplate, onClick, members, disabled = false }) => {
  if (!shiftTemplate) return null;

  // Get member details from the assignedMembers array
  const assignedMembers = schedule?.assignedMembers || [];

  console.log('🔍 ScheduleCell Debug:', {
    scheduleId: schedule?._id,
    assignedMembers: assignedMembers,
    assignedMembersLength: assignedMembers.length,
    firstMember: assignedMembers[0],
    members: members
  });
  
  const memberCount = assignedMembers.length;

  // Determine if this is an empty schedule
  const isEmpty = !schedule || memberCount === 0;

  // Generate consistent color for each member based on their ID
  const getMemberColor = (memberId) => {
    if (!memberId) return '#4a4a4a';
    
    const colors = [
      '#ef4444', // red
      '#f59e0b', // orange
      '#10b981', // green
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f97316', // orange-red
      '#06b6d4', // cyan
      '#6366f1', // indigo
    ];
    
    // Create a simple hash from the member ID
    let hash = 0;
    const idStr = memberId.toString();
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use the hash to select a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full h-full min-h-[80px] p-2 rounded-lg transition-all border-2 text-left ${
        disabled 
          ? "cursor-not-allowed opacity-70"
          : isEmpty
          ? "bg-[#1e1e1e] border-[#3a3a3a] hover:border-[#4ECDC4] hover:bg-[#252525] cursor-pointer"
          : "bg-[#2a2a2a] border-[#4a4a4a] hover:border-[#4ECDC4] cursor-pointer"
      }`}
      title={disabled ? "Only administrators can assign members" : "Click to assign members"}
    >
      {/* Shift Template Info */}
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

      {/* Assigned Members */}
      {isEmpty ? (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center space-x-1 text-[#6a6a6a]">
            <MdAdd size={16} />
            <span className="text-xs">Assign</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Show first 3 members */}
          {assignedMembers.slice(0, 3).map((assignedMember, index) => {
            // assignedMember structure: { member: ObjectId or Object, status: string }
            let memberName = "Unknown";
            let memberId = null;
            
            // Check if member is populated (object with _id and name)
            if (assignedMember?.member && typeof assignedMember.member === 'object') {
              memberName = assignedMember.member.name || "Unknown";
              memberId = assignedMember.member._id;
            } 
            // Check if member is just an ID string
            else if (typeof assignedMember?.member === 'string') {
              memberId = assignedMember.member;
              // Try to find in members list
              const foundMember = members?.find(m => m._id === memberId);
              memberName = foundMember?.name || `Member ${memberId.slice(-4)}`;
            }
            // Fallback if structure is different
            else if (assignedMember?._id) {
              memberId = assignedMember._id;
              memberName = assignedMember.name || "Unknown";
            }
            
            const status = assignedMember?.status || "scheduled";
            const memberColor = getMemberColor(memberId);
            
            // Adjust opacity based on status
            const opacityClass = status === 'absent' || status === 'cancelled' ? 'opacity-50' : 'opacity-100';
            
            return (
              <div
                key={memberId || index}
                className={`flex items-center space-x-1 rounded px-2 py-1 ${opacityClass}`}
                style={{ backgroundColor: `${memberColor}15` }} // 15 is hex for ~8% opacity
              >
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: memberColor }}
                />
                <span 
                  className="text-xs font-medium truncate"
                  style={{ color: memberColor }}
                >
                  {memberName}
                </span>
              </div>
            );
          })}
          
          {/* Show +N more if there are additional members */}
          {memberCount > 3 && (
            <div className="text-xs text-[#4ECDC4] font-semibold px-2">
              +{memberCount - 3} more
            </div>
          )}
        </div>
      )}

      {/* Schedule Status Indicator (optional) */}
      {schedule?.status && schedule.status !== 'scheduled' && (
        <div className="mt-2 pt-2 border-t border-[#3a3a3a]">
          <span className={`text-xs px-2 py-0.5 rounded ${
            schedule.status === 'confirmed' ? 'bg-green-500 bg-opacity-20 text-green-400' :
            schedule.status === 'completed' ? 'bg-blue-500 bg-opacity-20 text-blue-400' :
            schedule.status === 'cancelled' ? 'bg-red-500 bg-opacity-20 text-red-400' :
            'bg-gray-500 bg-opacity-20 text-gray-400'
          }`}>
            {schedule.status}
          </span>
        </div>
      )}
    </button>
  );
};

ScheduleCell.propTypes = {
  schedule: PropTypes.shape({
    _id: PropTypes.string,
    date: PropTypes.string,
    shiftTemplate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    assignedMembers: PropTypes.arrayOf(
      PropTypes.shape({
        member: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            _id: PropTypes.string,
            name: PropTypes.string,
            email: PropTypes.string,
            phone: PropTypes.string,
            role: PropTypes.string
          })
        ]),
        status: PropTypes.string,
        notes: PropTypes.string,
        clockIn: PropTypes.string,
        clockOut: PropTypes.string
      })
    ),
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
    PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string
    })
  ),
  disabled: PropTypes.bool
};

export default ScheduleCell;

