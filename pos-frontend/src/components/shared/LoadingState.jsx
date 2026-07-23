import PropTypes from "prop-types";

const SPINNER_SIZES = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

const LoadingState = ({
  message,
  size = "md",
  className = "",
  centered = true,
}) => (
  <div
    className={`${centered ? "py-12 text-center" : "flex items-center justify-center py-12"} ${className}`}
    role="status"
    aria-live="polite"
  >
    <div
      className={`animate-spin rounded-full border-b-2 border-brand ${SPINNER_SIZES[size]} ${centered ? "mx-auto mb-4" : ""}`}
    />
    {message ? (
      <p className={`text-[#ababab] ${centered ? "" : "ml-3"}`}>{message}</p>
    ) : null}
  </div>
);

LoadingState.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  centered: PropTypes.bool,
};

export default LoadingState;
