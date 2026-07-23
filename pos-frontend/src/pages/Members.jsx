import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdAdd, MdEdit, MdDelete, MdSearch, MdRefresh, MdToggleOn, MdToggleOff, MdAttachMoney, MdStore } from "react-icons/md";
import { FaUser, FaEnvelope, FaPhone } from "react-icons/fa";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import { fetchMembers, removeMember, toggleActiveStatus, clearError, updateMemberInList } from "../redux/slices/memberSlice";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import FeaturePageHeader from "../components/shared/FeaturePageHeader";
import MemberModal from "../components/members/MemberModal";
import DeleteConfirmationModal from "../components/shared/DeleteConfirmationModal";
import StoreAssignmentModal from "../components/members/StoreAssignmentModal";

const Members = () => {
  const dispatch = useDispatch();
  const { members, loading, error, deleteLoading, toggleLoading } = useSelector((state) => state.members);
  const { role } = useSelector((state) => state.user);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
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

  const handleManageStores = (member) => {
    setSelectedMember(member);
    setShowStoreModal(true);
  };

  const handleStoreAssignmentUpdated = (memberId, updatedStores) => {
    dispatch(updateMemberInList({
      _id: memberId,
      assignedStores: updatedStores
    }));
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowStoreModal(false);
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
    <div className="min-h-screen bg-[#0f0f0f] overflow-x-hidden pb-20">
      <FeaturePageHeader
        title="Members"
        subtitle={
          <span className="flex items-center gap-2">
            <span>{filteredMembers.length} members found</span>
            {loading ? <span className="text-brand">• Loading...</span> : null}
          </span>
        }
        actions={
          <>
            <button
              type="button"
              onClick={handleCreateMember}
              className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-[#f5f5f5] transition-colors hover:bg-brand-hover sm:px-4 sm:text-sm"
            >
              <MdAdd size={16} />
              Add Member
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-[#343434] bg-[#262626] px-3 py-2 text-xs font-medium text-[#f5f5f5] transition-colors hover:bg-[#343434] disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              <MdRefresh size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </>
        }
      >
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative max-w-md flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ababab]" size={20} />
            <input
              type="text"
              placeholder="Search members by name, email, phone, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#343434] bg-[#262626] py-2 pl-10 pr-4 text-[#f5f5f5] placeholder-[#ababab] transition-colors focus:border-brand focus:outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[140px] cursor-pointer rounded-lg border border-[#343434] bg-[#262626] px-4 py-2 text-[#f5f5f5] transition-colors focus:border-brand focus:outline-none"
            >
              <option value="all">All Members</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </FeaturePageHeader>

      {/* Members Grid */}
      <div className="px-4 sm:px-10 py-6">
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
                onManageStores={handleManageStores}
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
                className="mt-4 px-4 py-2 bg-brand text-[#f5f5f5] rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors"
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

      {showStoreModal && selectedMember && (
        <StoreAssignmentModal
          isOpen={showStoreModal}
          onClose={handleModalClose}
          member={selectedMember}
          onUpdated={handleStoreAssignmentUpdated}
        />
      )}
    </div>
  );
};

// Member Card Component
const MemberCard = ({ member, onEdit, onDelete, onToggleActive, onManageStores, toggleLoading }) => {
  const isActive = member.isActive !== false;
  const assignedStores = (member.assignedStores || []).filter(s => s.isActive);

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

  const getStoreRoleColor = (role) => {
    switch (role) {
      case 'Owner': return 'text-yellow-400';
      case 'Manager': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-[#1f1f1f] rounded-lg p-6 border transition-all duration-200 ${
      isActive 
        ? 'border-[#343434] hover:border-brand-30' 
        : 'border-red-900/50 opacity-75'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isActive ? 'bg-brand' : 'bg-gray-600'
        }`}>
          <span className="text-[#f5f5f5] font-bold text-lg">
            {member.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onManageStores(member)}
            className="p-2 bg-[#262626] text-purple-400 rounded-lg hover:bg-[#343434] transition-colors"
            title="Manage Store Access"
          >
            <MdStore size={16} />
          </button>
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
            className="p-2 bg-[#262626] text-brand rounded-lg hover:bg-[#343434] transition-colors"
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
          <div className="flex items-center gap-3 text-brand">
            <MdAttachMoney size={14} />
            <span className="text-sm font-medium">
              {member.salary ? `${member.salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '0.00'}
            </span>
          </div>
        </div>

        {/* Assigned Stores */}
        <div className="pt-3 border-t border-[#343434]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#ababab] text-xs font-medium uppercase tracking-wider">
              Stores ({assignedStores.length})
            </p>
          </div>
          {assignedStores.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {assignedStores.map((store) => (
                <span
                  key={store._id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#262626] border border-[#3a3a3a] text-xs"
                  title={`${store.name} (${store.storeRole})`}
                >
                  <MdStore size={10} className="text-purple-400" />
                  <span className="text-[#ccc] truncate max-w-[80px]">{store.name}</span>
                  <span className={`text-[10px] ${getStoreRoleColor(store.storeRole)}`}>
                    {store.storeRole}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[#666] text-xs italic">No stores assigned</p>
          )}
        </div>

        {/* Created Date */}
        <div className="pt-2">
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

MemberCard.propTypes = {
  member: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string,
    phone: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    salary: PropTypes.number,
    isActive: PropTypes.bool,
    createdAt: PropTypes.string.isRequired,
    assignedStores: PropTypes.array,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleActive: PropTypes.func.isRequired,
  onManageStores: PropTypes.func.isRequired,
  toggleLoading: PropTypes.bool.isRequired
};

export default Members; 