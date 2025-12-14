import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdAdd, MdEdit, MdDelete, MdSearch, MdRefresh, MdToggleOn, MdToggleOff, MdAttachMoney } from "react-icons/md";
import { FaUser, FaEnvelope, FaPhone } from "react-icons/fa";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import { fetchMembers, removeMember, toggleActiveStatus, clearError } from "../redux/slices/memberSlice";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import BackButton from "../components/shared/BackButton";
import MemberModal from "../components/members/MemberModal";
import DeleteConfirmationModal from "../components/shared/DeleteConfirmationModal";

const Members = () => {
  const dispatch = useDispatch();
  const { members, loading, error, deleteLoading, toggleLoading } = useSelector((state) => state.members);
  const { role } = useSelector((state) => state.user);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filteredMembers, setFilteredMembers] = useState([]);

  const isAdmin = role === "Admin";

  useEffect(() => {
    document.title = "POS | Members";
    if (isAdmin) {
      dispatch(fetchMembers());
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (members.length > 0) {
      let filtered = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Apply status filter
      if (statusFilter === "active") {
        filtered = filtered.filter(member => member.isActive !== false);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(member => member.isActive === false);
      }

      setFilteredMembers(filtered);
    } else {
      setFilteredMembers([]);
    }
  }, [members, searchTerm, statusFilter]);

  const handleCreateMember = () => {
    setSelectedMember(null);
    setShowCreateModal(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleDeleteMember = (member) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const handleToggleActiveStatus = async (member) => {
    try {
      await dispatch(toggleActiveStatus(member._id)).unwrap();
      const statusText = member.isActive === false ? "activated" : "deactivated";
      enqueueSnackbar(`Member ${statusText} successfully!`, { variant: "success" });
    } catch (error) {
      enqueueSnackbar(error || "Failed to toggle member status", { variant: "error" });
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedMember) {
      try {
        await dispatch(removeMember(selectedMember._id)).unwrap();
        enqueueSnackbar("Member deleted successfully!", { variant: "success" });
        setShowDeleteModal(false);
        setSelectedMember(null);
      } catch (error) {
        enqueueSnackbar(error || "Failed to delete member", { variant: "error" });
      }
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedMember(null);
  };

  const handleRefresh = () => {
    dispatch(fetchMembers());
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">Access Denied</h2>
          <p className="text-[#ababab]">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-4 border-b border-[#343434]">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">Members</h1>
          <div className="flex items-center gap-2 text-sm text-[#ababab]">
            <span>•</span>
            <span>{filteredMembers.length} members found</span>
            {loading && <span className="text-[#f6b100]">• Loading...</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateMember}
            className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors flex items-center gap-2"
          >
            <MdAdd size={16} /> Add Member
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-[#262626] text-[#f5f5f5] rounded-lg font-medium hover:bg-[#343434] transition-colors flex items-center gap-2"
          >
            <MdRefresh size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-10 py-4 border-b border-[#343434] bg-[#1a1a1a]">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ababab]" size={20} />
            <input
              type="text"
              placeholder="Search members by name, email, phone, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100] transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100] transition-colors cursor-pointer min-w-[140px]"
            >
              <option value="all">All Members</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="px-10 py-6">
        {loading ? (
          <FullScreenLoader />
        ) : filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member._id}
                member={member}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                onToggleActive={handleToggleActiveStatus}
                toggleLoading={toggleLoading}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-[#262626] rounded-full flex items-center justify-center mb-4">
              <FaUser size={32} className="text-[#ababab]" />
            </div>
            <h3 className="text-[#f5f5f5] text-lg font-semibold mb-2">No Members Found</h3>
            <p className="text-[#ababab] text-sm max-w-md">
              {searchTerm
                ? `No members found matching "${searchTerm}". Try a different search term.`
                : "No members have been added yet. Click &apos;Add Member&apos; to create the first member account."}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateMember}
                className="mt-4 px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg text-sm font-medium hover:bg-[#f6b100]/90 transition-colors"
              >
                Add First Member
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <MemberModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          mode="create"
        />
      )}

      {showEditModal && selectedMember && (
        <MemberModal
          isOpen={showEditModal}
          onClose={handleModalClose}
          mode="edit"
          member={selectedMember}
        />
      )}

      {showDeleteModal && selectedMember && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Member"
          message={`Are you sure you want to delete "${selectedMember.name}"? This action cannot be undone.`}
          confirmText="Delete Member"
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

// Member Card Component
const MemberCard = ({ member, onEdit, onDelete, onToggleActive, toggleLoading }) => {
  const isActive = member.isActive !== false; // Default to true if undefined
  
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-900/20 text-red-400 border-red-700';
      case 'manager':
        return 'bg-blue-900/20 text-blue-400 border-blue-700';
      case 'staff':
        return 'bg-green-900/20 text-green-400 border-green-700';
      case 'user':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-700';
      default:
        return 'bg-gray-900/20 text-gray-400 border-gray-700';
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return '👑';
      case 'manager':
        return '👔';
      case 'staff':
        return '👷';
      case 'user':
        return '👤';
      default:
        return '👤';
    }
  };

  return (
    <div className={`bg-[#1f1f1f] rounded-lg p-6 border transition-all duration-200 ${
      isActive 
        ? 'border-[#343434] hover:border-[#f6b100]/30' 
        : 'border-red-900/50 opacity-75'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isActive ? 'bg-[#f6b100]' : 'bg-gray-600'
        }`}>
          <span className="text-[#1f1f1f] font-bold text-lg">
            {member.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleActive(member)}
            disabled={toggleLoading}
            className={`p-2 rounded-lg hover:bg-[#343434] transition-colors ${
              isActive 
                ? 'bg-[#262626] text-green-400' 
                : 'bg-[#262626] text-gray-500'
            }`}
            title={isActive ? "Deactivate Member" : "Activate Member"}
          >
            {isActive ? <MdToggleOn size={16} /> : <MdToggleOff size={16} />}
          </button>
          <button
            onClick={() => onEdit(member)}
            className="p-2 bg-[#262626] text-[#f6b100] rounded-lg hover:bg-[#343434] transition-colors"
            title="Edit Member"
          >
            <MdEdit size={16} />
          </button>
          <button
            onClick={() => onDelete(member)}
            className="p-2 bg-[#262626] text-red-400 rounded-lg hover:bg-[#343434] transition-colors"
            title="Delete Member"
          >
            <MdDelete size={16} />
          </button>
        </div>
      </div>

      {/* Member Info */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#f5f5f5] text-lg font-semibold">{member.name}</h3>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isActive 
                ? 'bg-green-900/30 text-green-400 border border-green-700' 
                : 'bg-red-900/30 text-red-400 border border-red-700'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(member.role)}`}>
            <span>{getRoleIcon(member.role)}</span>
            <span>{member.role}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[#ababab]">
            <FaEnvelope size={14} />
            <span className="text-sm">{member.email}</span>
          </div>
          <div className="flex items-center gap-3 text-[#ababab]">
            <FaPhone size={14} />
            <span className="text-sm">{member.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-[#f6b100]">
            <MdAttachMoney size={14} />
            <span className="text-sm font-medium">
              {member.salary ? `${member.salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '0.00'}
            </span>
          </div>
        </div>

        {/* Created Date */}
        <div className="pt-3 border-t border-[#343434]">
          <p className="text-[#ababab] text-xs">
            Created: {new Date(member.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

// PropTypes for MemberCard component
MemberCard.propTypes = {
  member: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string,
    phone: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    salary: PropTypes.number,
    isActive: PropTypes.bool,
    createdAt: PropTypes.string.isRequired
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleActive: PropTypes.func.isRequired,
  toggleLoading: PropTypes.bool.isRequired
};

export default Members; 