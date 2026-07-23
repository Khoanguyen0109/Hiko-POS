import PropTypes from "prop-types";

const FilterToggleButton = ({
  active,
  onClick,
  icon,
  label,
  hideLabelOnMobile = false,
  className = "",
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-h-[40px] items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
      active
        ? "bg-brand text-[#f5f5f5]"
        : "border border-[#343434] bg-[#262626] text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5]"
    } ${className}`}
  >
    {icon}
    {label ? (
      <span className={hideLabelOnMobile ? "hidden sm:inline" : undefined}>{label}</span>
    ) : null}
  </button>
);

FilterToggleButton.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.node,
  label: PropTypes.string,
  hideLabelOnMobile: PropTypes.bool,
  className: PropTypes.string,
};

export default FilterToggleButton;
