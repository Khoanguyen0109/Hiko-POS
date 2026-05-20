import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import FormField from "../ui/FormField";

const RenameNodeModal = ({
  isOpen,
  onClose,
  onSubmit,
  node,
  loading,
}) => {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && node) {
      setTitle(node.title || "");
      setError("");
    }
    if (!isOpen) {
      setTitle("");
      setError("");
    }
  }, [isOpen, node]);

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
    if (trimmed === node?.title) {
      handleClose();
      return;
    }
    onSubmit(trimmed);
  };

  if (!node) return null;

  const label = node.type === "folder" ? "Folder" : "Document";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Rename ${label}`}
      size="sm"
      footerActions={[
        {
          label: "Cancel",
          variant: "secondary",
          onClick: handleClose,
        },
        {
          label: "Save",
          variant: "primary",
          onClick: handleSubmit,
          loading,
        },
      ]}
    >
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

RenameNodeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  node: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string,
  }),
  loading: PropTypes.bool,
};

export default RenameNodeModal;
