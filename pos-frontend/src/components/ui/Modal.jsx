import PropTypes from "prop-types";
import BottomSheet from "../shared/BottomSheet";
import Button from "./Button";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  footerActions = [],
  className = "",
}) => {
  const footer =
    footerActions.length > 0 ? (
      <div className="flex flex-wrap gap-3">
        {footerActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || "secondary"}
            size={action.size || "md"}
            onClick={action.onClick}
            loading={action.loading}
            disabled={action.disabled}
            className={`flex-1 ${action.className || ""}`}
          >
            {action.label}
          </Button>
        ))}
      </div>
    ) : null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size === "fullscreen" ? "full" : size}
      showCloseButton={showCloseButton}
      closeOnBackdrop={closeOnBackdrop}
      className={className}
      bodyClassName="p-6"
      footer={footer}
    >
      {children}
    </BottomSheet>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl", "fullscreen"]),
  showCloseButton: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  footerActions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      variant: PropTypes.string,
      size: PropTypes.string,
      loading: PropTypes.bool,
      disabled: PropTypes.bool,
      className: PropTypes.string,
    })
  ),
  className: PropTypes.string,
};

export default Modal;
