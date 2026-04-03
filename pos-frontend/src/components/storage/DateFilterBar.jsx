import PropTypes from "prop-types";

const DateFilterBar = ({
  dateFilter,
  customDateRange,
  dateFilterOptions,
  onFilterChange,
  onCustomDateChange,
}) => (
  <div className="mb-6">
    <div className="bg-[#1a1a1a] rounded-lg p-3 sm:p-4 border border-[#343434]">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-0.5 sm:mb-1">
            Date Filter
          </h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Filter data by time period</p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          {dateFilterOptions.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => onFilterChange(value)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                dateFilter === value
                  ? "bg-[#f6b100] text-[#1f1f1f]"
                  : "bg-[#262626] text-[#f5f5f5] hover:bg-[#343434]"
              }`}
            >
              <span className="text-base sm:text-lg">{icon}</span>
              <span className="hidden xs:inline sm:inline">{label}</span>
              <span className="xs:hidden">{label.split(" ").pop()}</span>
            </button>
          ))}
        </div>

        {dateFilter === "custom" && (
          <div className="flex flex-col gap-2 pt-2 border-t border-[#343434]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="flex flex-col">
                <label className="text-[#ababab] text-xs mb-1.5">From Date</label>
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => onCustomDateChange("startDate", e.target.value)}
                  className="bg-[#262626] text-[#f5f5f5] border border-[#343434] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f6b100] w-full"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[#ababab] text-xs mb-1.5">To Date</label>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => onCustomDateChange("endDate", e.target.value)}
                  className="bg-[#262626] text-[#f5f5f5] border border-[#343434] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f6b100] w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
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
      icon: PropTypes.node,
    })
  ).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onCustomDateChange: PropTypes.func.isRequired,
};

export default DateFilterBar;
