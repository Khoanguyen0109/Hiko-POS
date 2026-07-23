import PropTypes from "prop-types";
import BottomSheet from "./BottomSheet";

const Modal = ({ isOpen, onClose, title, children }) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      bodyClassName="p-6"
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
};

export default Modal;
