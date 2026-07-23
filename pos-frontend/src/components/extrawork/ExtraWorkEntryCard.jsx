import PropTypes from "prop-types";
import { MdDelete } from "react-icons/md";
import { formatDate } from "../../utils/dateUtils";

const WORK_TYPE_COLORS = {
  overtime: "bg-orange-900/20 text-orange-400 border-orange-700",
  extra_shift: "bg-blue-900/20 text-blue-400 border-blue-700",
  emergency: "bg-red-900/20 text-red-400 border-red-700",
  training: "bg-green-900/20 text-green-400 border-green-700",
  event: "bg-purple-900/20 text-purple-400 border-purple-700",
  other: "bg-gray-900/20 text-gray-400 border-gray-700",
};

const getWorkTypeColor = (workType) =>
  WORK_TYPE_COLORS[workType] || WORK_TYPE_COLORS.other;

const ExtraWorkEntryCard = ({ entry, onDelete }) => {
  const durationNegative = entry.durationHours < 0;
  const paymentNegative = entry.paymentAmount < 0;

  return (
    <div className="rounded-lg border border-[#343434] bg-[#1f1f1f] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#f5f5f5]">
            {entry.member?.name || "Unknown"}
          </p>
          <p className="mt-0.5 text-xs text-[#ababab]">
            {formatDate(new Date(entry.date), "short")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(entry._id)}
          className="shrink-0 rounded-lg p-2 text-red-400 transition-colors hover:bg-red-900/20"
          title="Delete entry"
        >
          <MdDelete size={18} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#262626] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-[#ababab]">Duration</p>
          <p
            className={`mt-0.5 text-base font-bold tabular-nums ${
              durationNegative ? "text-red-400" : "text-[#4ECDC4]"
            }`}
          >
            {entry.durationHours.toFixed(2)}h
          </p>
        </div>
        <div className="rounded-lg bg-[#262626] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-[#ababab]">Payment</p>
          <p
            className={`mt-0.5 text-base font-bold tabular-nums ${
              paymentNegative ? "text-red-400" : "text-brand"
            }`}
          >
            ${entry.paymentAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {entry.workType ? (
        <div className="mt-3">
          <span
            className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${getWorkTypeColor(entry.workType)}`}
          >
            {entry.workType.replace("_", " ")}
          </span>
        </div>
      ) : null}

      {entry.description ? (
        <p className="mt-3 line-clamp-2 text-xs text-[#ababab]">{entry.description}</p>
      ) : null}
    </div>
  );
};

ExtraWorkEntryCard.propTypes = {
  entry: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    member: PropTypes.shape({ name: PropTypes.string }),
    durationHours: PropTypes.number.isRequired,
    workType: PropTypes.string.isRequired,
    paymentAmount: PropTypes.number.isRequired,
    description: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default ExtraWorkEntryCard;
