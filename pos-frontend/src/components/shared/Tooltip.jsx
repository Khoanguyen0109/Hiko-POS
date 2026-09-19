import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

const SHOW_DELAY_MS = 150;

const Tooltip = ({ label, disabled = false, children, className = "" }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const showTimerRef = useRef(null);

  const clearShowTimer = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  };

  const hide = useCallback(() => {
    clearShowTimer();
    setVisible(false);
  }, []);

  const show = useCallback(() => {
    if (disabled || !label || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
    clearShowTimer();
    showTimerRef.current = setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);
  }, [disabled, label]);

  useEffect(() => () => clearShowTimer(), []);

  useEffect(() => {
    if (disabled) hide();
  }, [disabled, hide]);

  useEffect(() => {
    if (!visible) return undefined;

    const dismiss = () => hide();
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [visible, hide]);

  return (
    <div
      ref={triggerRef}
      className={className}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {!disabled && visible && label
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[1070] whitespace-nowrap rounded-md border border-[#343434] bg-[#262626] px-2.5 py-1 text-xs font-medium text-[#f5f5f5] shadow-lg"
              style={{
                top: coords.top,
                left: coords.left,
                transform: "translateY(-50%)",
              }}
            >
              {label}
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

Tooltip.propTypes = {
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Tooltip;
