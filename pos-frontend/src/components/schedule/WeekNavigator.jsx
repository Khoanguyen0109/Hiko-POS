import PropTypes from "prop-types";
import { MdChevronLeft, MdChevronRight, MdToday } from "react-icons/md";
import { getWeekRangeString, getCurrentWeekInfo } from "../../utils/dateUtils";

const WeekNavigator = ({ year, week, onWeekChange }) => {
  const { year: currentYear, week: currentWeek } = getCurrentWeekInfo();
  const isCurrentWeek = year === currentYear && week === currentWeek;

  const handlePrevious = () => {
    let newWeek = week - 1;
    let newYear = year;
    
    if (newWeek < 1) {
      newWeek = 52;
      newYear = year - 1;
    }
    
    onWeekChange(newYear, newWeek);
  };

  const handleNext = () => {
    let newWeek = week + 1;
    let newYear = year;
    
    if (newWeek > 52) {
      newWeek = 1;
      newYear = year + 1;
    }
    
    onWeekChange(newYear, newWeek);
  };

  const handleToday = () => {
    onWeekChange(currentYear, currentWeek);
  };

  return (
    <div className="flex items-center justify-between bg-[#1f1f1f] rounded-lg p-4 border border-[#343434]">
      <button
        onClick={handlePrevious}
        className="p-2 bg-[#262626] text-[#f5f5f5] rounded-lg hover:bg-[#343434] transition-colors"
        title="Previous Week"
      >
        <MdChevronLeft size={20} />
      </button>

      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-[#f5f5f5] text-lg font-semibold">
            Week {week}, {year}
          </div>
          <div className="text-[#ababab] text-sm mt-1">
            {getWeekRangeString(year, week)}
          </div>
        </div>

        {!isCurrentWeek && (
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#f6b100]/90 transition-colors flex items-center gap-2"
          >
            <MdToday size={16} />
            <span className="hidden sm:inline">Today</span>
          </button>
        )}
      </div>

      <button
        onClick={handleNext}
        className="p-2 bg-[#262626] text-[#f5f5f5] rounded-lg hover:bg-[#343434] transition-colors"
        title="Next Week"
      >
        <MdChevronRight size={20} />
      </button>
    </div>
  );
};

WeekNavigator.propTypes = {
  year: PropTypes.number.isRequired,
  week: PropTypes.number.isRequired,
  onWeekChange: PropTypes.func.isRequired
};

export default WeekNavigator;

