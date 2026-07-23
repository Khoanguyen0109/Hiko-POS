import PropTypes from "prop-types";

const ErrorBanner = ({ message, className = "mb-6" }) => (
  <div
    className={`rounded-lg border border-red-500 bg-red-500/20 p-4 text-red-400 ${className}`}
    role="alert"
  >
    {message}
  </div>
);

ErrorBanner.propTypes = {
  message: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default ErrorBanner;
