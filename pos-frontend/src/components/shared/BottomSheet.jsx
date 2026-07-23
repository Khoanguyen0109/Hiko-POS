import { useEffect } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { MdClose } from "react-icons/md";

const maxWidthClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[100vw]",
};

const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "lg",
  maxHeight = "90dvh",
  showDragHandle = true,
  showCloseButton = true,
  closeOnBackdrop = true,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  zIndexClass = "z-50",
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const maxWidthClass = maxWidthClasses[size] || maxWidthClasses.lg;

  return (
    <div className={`fixed inset-0 ${zIndexClass}`}>
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        className={`absolute inset-x-0 bottom-0 mx-auto flex w-full ${maxWidthClass} flex-col overflow-hidden rounded-t-2xl border border-[#343434] bg-[#1a1a1a] shadow-2xl ${className}`}
        style={{
          maxHeight,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(event) => event.stopPropagation()}
      >
        {showDragHandle ? (
          <div className="flex shrink-0 justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-[#555]" aria-hidden="true" />
          </div>
        ) : null}

        {title || showCloseButton ? (
          <div
            className={`flex shrink-0 items-center justify-between border-b border-[#343434] px-4 py-3 ${headerClassName}`}
          >
            <div className="min-w-0 flex-1 pr-2">
              {typeof title === "string" ? (
                <h2 className="truncate text-lg font-semibold text-[#f5f5f5]">{title}</h2>
              ) : (
                title
              )}
            </div>
            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-[#ababab] transition-colors hover:bg-[#262626] hover:text-[#f5f5f5]"
                aria-label="Close"
              >
                <MdClose size={20} />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={`min-h-0 flex-1 overflow-y-auto scrollbar-hide ${bodyClassName}`}>
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-[#343434] bg-[#1a1a1a] px-4 py-3">
            {footer}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};

BottomSheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node,
  footer: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl", "full"]),
  maxHeight: PropTypes.string,
  showDragHandle: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  zIndexClass: PropTypes.string,
};

export default BottomSheet;
