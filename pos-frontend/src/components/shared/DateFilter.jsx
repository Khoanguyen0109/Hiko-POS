import { useState } from "react";
import { MdCalendarToday, MdDateRange, MdToday } from "react-icons/md";
import { getTodayDate, formatDateForDisplay } from "../../utils";
import PropTypes from "prop-types";

const DateFilter = ({ onDateChange, initialStartDate, initialEndDate }) => {
  const [startDate, setStartDate] = useState(initialStartDate || getTodayDate());
  const [endDate, setEndDate] = useState(initialEndDate || getTodayDate());
  const [showCustomRange, setShowCustomRange] = useState(false);

  const handlePresetClick = (preset) => {
    const today = new Date();
    let start, end;

    switch (preset) {
      case 'today': {
        start = end = getTodayDate();
        break;
      }
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        start = end = yesterday.toISOString().split('T')[0];
        break;
      }
      case 'last7days': {
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        start = last7Days.toISOString().split('T')[0];
        end = getTodayDate();
        break;
      }
      case 'last30days': {
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        start = last30Days.toISOString().split('T')[0];
        end = getTodayDate();
        break;
      }
      case 'thisMonth': {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        start = firstDayOfMonth.toISOString().split('T')[0];
        end = getTodayDate();
        break;
      }
      default:
        return;
    }

    setStartDate(start);
    setEndDate(end);
    setShowCustomRange(false);
    onDateChange({ startDate: start, endDate: end });
  };

  const handleCustomDateChange = () => {
    onDateChange({ startDate, endDate });
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    // If end date is before start date, update end date
    if (newStartDate > endDate) {
      setEndDate(newStartDate);
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
  };

  const presets = [
    { key: 'today', label: 'Today', icon: MdToday },
    { key: 'yesterday', label: 'Yesterday', icon: MdCalendarToday },
    { key: 'last7days', label: 'Last 7 Days', icon: MdDateRange },
    { key: 'last30days', label: 'Last 30 Days', icon: MdDateRange },
    { key: 'thisMonth', label: 'This Month', icon: MdDateRange },
  ];

  return (
    <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#343434]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#f5f5f5] text-sm font-semibold flex items-center gap-2">
          <MdCalendarToday size={16} />
          Date Filter
        </h3>
        <button
          onClick={() => setShowCustomRange(!showCustomRange)}
          className="text-[#f6b100] text-xs font-medium hover:text-[#f6b100]/80 transition-colors"
        >
          {showCustomRange ? 'Quick Select' : 'Custom Range'}
        </button>
      </div>

      {!showCustomRange ? (
        // Preset buttons
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          {presets.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handlePresetClick(key)}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-[#262626] text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5] transition-all duration-200 border border-[#343434] hover:border-[#f6b100]"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      ) : (
        // Custom date range
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#ababab] text-xs font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[#ababab] text-xs font-medium mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={handleEndDateChange}
                className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100] transition-colors"
              />
            </div>
          </div>
          <button
            onClick={handleCustomDateChange}
            className="w-full px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg text-sm font-semibold hover:bg-[#f6b100]/90 transition-colors"
          >
            Apply Date Range
          </button>
        </div>
      )}

      {/* Current selection display */}
      <div className="mt-3 pt-3 border-t border-[#343434]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#ababab]">Selected Range:</span>
          <span className="text-[#f5f5f5] font-medium">
            {startDate === endDate 
              ? formatDateForDisplay(startDate)
              : `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`
            }
          </span>
        </div>
      </div>
    </div>
  );
};

DateFilter.propTypes = {
  onDateChange: PropTypes.func.isRequired,
  initialStartDate: PropTypes.string,
  initialEndDate: PropTypes.string,
};

export default DateFilter; 