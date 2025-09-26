import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { MdClose } from 'react-icons/md';
import Button from './Button';

/**
 * Enhanced Modal Component
 * 
 * Replaces all hardcoded modal styles with consistent design system.
 * Uses design tokens and provides flexible sizing and footer actions.
 * 
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal content
 * @param {string} size - Modal size (sm, md, lg, xl, fullscreen)
 * @param {boolean} showCloseButton - Show X close button in header
 * @param {boolean} closeOnBackdrop - Allow closing by clicking backdrop
 * @param {Array} footerActions - Array of action buttons for footer
 * @param {string} className - Additional CSS classes
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  footerActions = [],
  className = ""
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg", 
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    fullscreen: "max-w-[95vw] max-h-[95vh]"
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="modal-overlay"
      onClick={handleBackdropClick}
    >
      <motion.div 
        className={`modal-content ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <h2 className="text-xl text-[#f5f5f5] font-semibold">
              {title}
            </h2>
          </div>
          
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-[#262626] rounded-lg"
              icon={<MdClose size={20} />}
            />
          )}
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {children}
        </div>

        {/* Modal Footer */}
        {footerActions.length > 0 && (
          <div className="modal-footer">
            {footerActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'secondary'}
                size={action.size || 'md'}
                onClick={action.onClick}
                loading={action.loading}
                disabled={action.disabled}
                className={action.className}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'fullscreen']),
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
      className: PropTypes.string
    })
  ),
  className: PropTypes.string
};

export default Modal;
