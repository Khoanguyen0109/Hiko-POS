import PropTypes from "prop-types";

const SCHEDULE_VIEW_MODES = {
  COMPACT: "compact",
  FULL_WEEK: "fullWeek",
  CALENDAR: "calendar",
};

const VIEW_OPTIONS = [
  { value: SCHEDULE_VIEW_MODES.COMPACT, label: "Compact" },
  { value: SCHEDULE_VIEW_MODES.FULL_WEEK, label: "Full week" },
  { value: SCHEDULE_VIEW_MODES.CALENDAR, label: "Calendar" },
];

const ScheduleViewSwitcher = ({ value, onChange }) => (
  <div
    className="flex w-full max-w-full gap-1 overflow-x-auto rounded-lg bg-[#1a1a1a] p-1 sm:w-fit"
    role="tablist"
    aria-label="Schedule view mode"
  >
    {VIEW_OPTIONS.map((option) => {
      const isActive = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(option.value)}
          className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all ${
            isActive
              ? "bg-brand text-[#f5f5f5]"
              : "text-[#ababab] hover:bg-[#262626] hover:text-[#f5f5f5]"
          }`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

ScheduleViewSwitcher.propTypes = {
  value: PropTypes.oneOf(["compact", "fullWeek", "calendar"]).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ScheduleViewSwitcher;
