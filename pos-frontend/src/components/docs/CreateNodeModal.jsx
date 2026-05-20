import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import FormField from "../ui/FormField";

const CreateNodeModal = ({
  isOpen,
  onClose,
  onSubmit,
  type,
  loading,
  parentTitle,
}) => {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setError("");
    }
  }, [isOpen]);

  const handleClose = () => {
    setTitle("");
    setError("");
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required");
      return;
    }
    onSubmit(trimmed);
  };

  const isFolder = type === "folder";
  const label = isFolder ? "Folder" : "Document";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`New ${label}`}
      size="sm"
      footerActions={[
        {
          label: "Cancel",
          variant: "secondary",
          onClick: handleClose,
        },
        {
          label: `Create ${label}`,
          variant: "primary",
          onClick: handleSubmit,
          loading,
        },
      ]}
    >
      {parentTitle && (
        <p className="text-sm text-[#ababab] mb-4">
          Inside: <span className="text-[#f5f5f5]">{parentTitle}</span>
        </p>
      )}
      <FormField
        label="Title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (error) setError("");
        }}
        placeholder={`Enter ${label.toLowerCase()} title`}
        required
        error={error}
        autoFocus
      />
    </Modal>
  );
};

CreateNodeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  type: PropTypes.oneOf(["folder", "doc"]).isRequired,
  loading: PropTypes.bool,
  parentTitle: PropTypes.string,
};

export default CreateNodeModal;
