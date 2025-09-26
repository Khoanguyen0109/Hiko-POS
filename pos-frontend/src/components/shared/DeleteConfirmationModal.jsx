import { MdClose, MdWarning } from "react-icons/md";
import PropTypes from "prop-types";
import { Button } from "../ui";

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Delete", 
  cancelText = "Cancel",
  loading = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1f1f] rounded-lg w-full max-w-md border border-[#343434]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-900/20 rounded-full flex items-center justify-center">
              <MdWarning size={20} className="text-red-400" />
            </div>
            <h2 className="text-[#f5f5f5] text-xl font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-[#262626] rounded-lg transition-colors disabled:opacity-50"
          >
            <MdClose size={20} className="text-[#ababab]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[#ababab] text-sm leading-relaxed mb-6">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
              loading={loading}
              className="flex-1"
            >
              {loading ? "Deleting..." : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  loading: PropTypes.bool
};

export default DeleteConfirmationModal; 