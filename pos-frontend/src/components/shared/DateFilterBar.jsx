import PropTypes from "prop-types";

const DateFilterBar = ({
  dateFilter,
  customDateRange,
  dateFilterOptions,
  onFilterChange,
  onCustomDateChange,
  compact = false,
  title = "Date Filter",
  description = "Filter data by time period",
  className = "",
}) => (
  <div className={compact ? className : `mb-6 ${className}`}>
    <div
      className={
        compact
          ? "flex flex-col gap-2.5"
          : "rounded-lg border border-[#343434] bg-[#1a1a1a] p-3 sm:p-4"
      }
    >
      {!compact && (title || description) ? (
        <div>
          {title ? (
            <h3 className="mb-0.5 text-base font-semibold text-[#f5f5f5] sm:mb-1 sm:text-lg">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className="text-xs text-[#ababab] sm:text-sm">{description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {dateFilterOptions.map(({ value, label, icon, shortLabel }) => (
          <button
            key={value}
            type="button"
            onClick={() => onFilterChange(value)}
            className={`flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:text-sm ${
              dateFilter === value
                ? "bg-brand text-[#f5f5f5]"
                : "bg-[#262626] text-[#f5f5f5] hover:bg-[#343434]"
            }`}
          >
            {icon ? <span className="text-base sm:text-lg">{icon}</span> : null}
            {shortLabel ? (
              <>
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </>
            ) : (
              <span>{label}</span>
            )}
          </button>
        ))}
      </div>

      {dateFilter === "custom" ? (
        <div className="flex flex-col gap-2 border-t border-[#343434] pt-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <div className="flex flex-col">
              <label className="mb-1.5 text-xs text-[#ababab]">From</label>
              <input
                type="date"
                value={customDateRange.startDate}
                max={customDateRange.endDate || undefined}
                onChange={(e) => onCustomDateChange("startDate", e.target.value)}
                className="w-full rounded-lg border border-[#343434] bg-[#262626] px-3 py-2 text-sm text-[#f5f5f5] focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1.5 text-xs text-[#ababab]">To</label>
              <input
                type="date"
                value={customDateRange.endDate}
                min={customDateRange.startDate || undefined}
                onChange={(e) => onCustomDateChange("endDate", e.target.value)}
                className="w-full rounded-lg border border-[#343434] bg-[#262626] px-3 py-2 text-sm text-[#f5f5f5] focus:border-brand focus:outline-none"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  </div>
);

DateFilterBar.propTypes = {
  dateFilter: PropTypes.string.isRequired,
  customDateRange: PropTypes.shape({
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
  dateFilterOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
      shortLabel: PropTypes.string,
      icon: PropTypes.node,
    })
  ).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onCustomDateChange: PropTypes.func.isRequired,
  compact: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  className: PropTypes.string,
};

export default DateFilterBar;
