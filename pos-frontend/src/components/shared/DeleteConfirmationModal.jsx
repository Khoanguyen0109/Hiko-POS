import { MdWarning } from "react-icons/md";
import PropTypes from "prop-types";
import { Button } from "../ui";
import BottomSheet from "./BottomSheet";

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
}) => {
  const headerTitle = (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/20">
        <MdWarning size={20} className="text-red-400" />
      </div>
      <h2 className="text-xl font-semibold text-[#f5f5f5]">{title}</h2>
    </div>
  );

  const footer = (
    <div className="flex items-center gap-3">
      <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
        {cancelText}
      </Button>
      <Button variant="danger" onClick={onConfirm} loading={loading} className="flex-1">
        {loading ? "Deleting..." : confirmText}
      </Button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={headerTitle}
      size="sm"
      footer={footer}
      bodyClassName="p-6"
    >
      <p className="text-sm leading-relaxed text-[#ababab]">{message}</p>
    </BottomSheet>
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
  loading: PropTypes.bool,
};

export default DeleteConfirmationModal;
