import PropTypes from "prop-types";

const VARIANT_CLASSES = {
  primary:
    "bg-brand text-[#f5f5f5] hover:bg-brand-hover font-semibold sm:px-4",
  secondary:
    "border border-[#343434] bg-[#1f1f1f] text-[#f5f5f5] hover:bg-[#262626] font-medium",
};

const HeaderActionButton = ({
  variant = "secondary",
  icon,
  children,
  className = "",
  ...props
}) => (
  <button
    type="button"
    className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors sm:text-sm ${VARIANT_CLASSES[variant]} ${className}`}
    {...props}
  >
    {icon}
    {children}
  </button>
);

HeaderActionButton.propTypes = {
  variant: PropTypes.oneOf(["primary", "secondary"]),
  icon: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default HeaderActionButton;
