import PropTypes from "prop-types";

export const RECORD_STATUS_STYLES = {
  completed: "bg-green-900/30 text-green-400 border border-green-800",
  pending: "bg-yellow-900/30 text-yellow-400 border border-yellow-800",
  cancelled: "bg-red-900/30 text-red-400 border border-red-800",
  active: "bg-green-900/30 text-green-400 border border-green-800",
  inactive: "bg-red-900/30 text-red-400 border border-red-800",
};

const RecordStatusBadge = ({ status, className = "" }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-xs font-medium ${RECORD_STATUS_STYLES[status] || RECORD_STATUS_STYLES.cancelled} ${className}`}
  >
    {status}
  </span>
);

RecordStatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default RecordStatusBadge;
