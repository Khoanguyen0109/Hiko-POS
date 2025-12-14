import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdRefresh,
  MdAccessTime,
  MdToggleOn,
  MdToggleOff
} from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import BackButton from "../components/shared/BackButton";
import ShiftTemplateModal from "../components/schedule/ShiftTemplateModal";
import DeleteConfirmationModal from "../components/shared/DeleteConfirmationModal";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import {
  fetchShiftTemplates,
  removeShiftTemplate,
  toggleShiftTemplateStatus,
  clearError
} from "../redux/slices/shiftTemplateSlice";

const ShiftTemplates = () => {
  const dispatch = useDispatch();
  const { shiftTemplates, loading, error, deleteLoading } = useSelector(
    (state) => state.shiftTemplates
  );
  const { role } = useSelector((state) => state.user);
  const isAdmin = role === "Admin";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    document.title = "POS | Shift Templates";
    if (isAdmin) {
      dispatch(fetchShiftTemplates());
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreateClick = () => {
    setSelectedTemplate(null);
    setShowCreateModal(true);
  };

  const handleEditClick = (template) => {
    setSelectedTemplate(template);
    setShowEditModal(true);
  };

  const handleDeleteClick = (template) => {
    setSelectedTemplate(template);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedTemplate) {
      try {
        await dispatch(removeShiftTemplate(selectedTemplate._id)).unwrap();
        enqueueSnackbar("Shift template deleted successfully!", {
          variant: "success"
        });
        setShowDeleteModal(false);
        setSelectedTemplate(null);
      } catch (error) {
        enqueueSnackbar(error || "Failed to delete shift template", {
          variant: "error"
        });
      }
    }
  };

  const handleToggleStatus = async (template) => {
    try {
      await dispatch(toggleShiftTemplateStatus(template._id)).unwrap();
      const statusText = template.isActive ? "deactivated" : "activated";
      enqueueSnackbar(`Shift template ${statusText} successfully!`, {
        variant: "success"
      });
    } catch (error) {
      enqueueSnackbar(error || "Failed to toggle status", { variant: "error" });
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedTemplate(null);
  };

  const handleRefresh = () => {
    dispatch(fetchShiftTemplates());
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">
            Access Denied
          </h2>
          <p className="text-[#ababab]">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-4 border-b border-[#343434]">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
              Shift Templates
            </h1>
            <p className="text-[#ababab] text-sm mt-1">
              {shiftTemplates.length} templates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateClick}
            className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors flex items-center gap-2"
          >
            <MdAdd size={16} /> Add Template
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-[#262626] text-[#f5f5f5] rounded-lg font-medium hover:bg-[#343434] transition-colors flex items-center gap-2"
          >
            <MdRefresh size={16} className={loading ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-10 py-6">
        {loading ? (
          <FullScreenLoader />
        ) : shiftTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shiftTemplates.map((template) => (
              <ShiftTemplateCard
                key={template._id}
                template={template}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-[#262626] rounded-full flex items-center justify-center mb-6">
              <MdAccessTime size={40} className="text-[#ababab]" />
            </div>
            <h3 className="text-[#f5f5f5] text-xl font-semibold mb-2">
              No Shift Templates
            </h3>
            <p className="text-[#ababab] text-sm max-w-md mb-6">
              Create your first shift template to start managing schedules.
              Common templates include Morning, Afternoon, and Evening shifts.
            </p>
            <button
              onClick={handleCreateClick}
              className="px-6 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors"
            >
              Create First Template
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <ShiftTemplateModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          mode="create"
        />
      )}

      {showEditModal && selectedTemplate && (
        <ShiftTemplateModal
          isOpen={showEditModal}
          onClose={handleModalClose}
          mode="edit"
          template={selectedTemplate}
        />
      )}

      {showDeleteModal && selectedTemplate && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Shift Template"
          message={`Are you sure you want to delete "${selectedTemplate.name}"? This action cannot be undone.`}
          confirmText="Delete Template"
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

// Shift Template Card Component
const ShiftTemplateCard = ({ template, onEdit, onDelete, onToggleStatus }) => {
  const isActive = template.isActive !== false;

  return (
    <div
      className={`bg-[#1f1f1f] rounded-lg p-6 border transition-all ${
        isActive
          ? "border-[#343434] hover:border-[#f6b100]/30"
          : "border-red-900/50 opacity-75"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: template.color }}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStatus(template)}
            className={`p-2 rounded-lg hover:bg-[#343434] transition-colors ${
              isActive
                ? "bg-[#262626] text-green-400"
                : "bg-[#262626] text-gray-500"
            }`}
            title={isActive ? "Deactivate" : "Activate"}
          >
            {isActive ? (
              <MdToggleOn size={16} />
            ) : (
              <MdToggleOff size={16} />
            )}
          </button>
          <button
            onClick={() => onEdit(template)}
            className="p-2 bg-[#262626] text-[#f6b100] rounded-lg hover:bg-[#343434] transition-colors"
            title="Edit"
          >
            <MdEdit size={16} />
          </button>
          <button
            onClick={() => onDelete(template)}
            className="p-2 bg-[#262626] text-red-400 rounded-lg hover:bg-[#343434] transition-colors"
            title="Delete"
          >
            <MdDelete size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[#f5f5f5] text-lg font-semibold mb-1">
            {template.name}
          </h3>
          <p className="text-[#ababab] text-sm">{template.shortName}</p>
        </div>

        <div className="flex items-center gap-2 text-[#f6b100]">
          <MdAccessTime size={16} />
          <span className="text-sm font-medium">
            {template.startTime} - {template.endTime}
          </span>
        </div>

        <div className="text-[#ababab] text-sm">
          Duration: {template.durationHours?.toFixed(1)} hours
        </div>

        {template.description && (
          <div className="pt-2 border-t border-[#343434]">
            <p className="text-[#ababab] text-sm">{template.description}</p>
          </div>
        )}

        <div
          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
            isActive
              ? "bg-green-900/30 text-green-400"
              : "bg-red-900/30 text-red-400"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </div>
      </div>
    </div>
  );
};

ShiftTemplateCard.propTypes = {
  template: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    shortName: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
    color: PropTypes.string,
    description: PropTypes.string,
    durationHours: PropTypes.number,
    isActive: PropTypes.bool
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired
};

export default ShiftTemplates;

