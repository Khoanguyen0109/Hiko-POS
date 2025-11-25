import { GrRadialSelected } from "react-icons/gr";
import PropTypes from "prop-types";

const CategoryCard = ({ category, isSelected, dishCount, onSelect, isAllCategory = false }) => {
  return (
    <div
      className="flex flex-col items-start justify-between p-2 sm:p-3 rounded-lg h-[50px] sm:h-[70px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md"
      style={{
        backgroundColor: isAllCategory ? "#f6b100" : category.color,
        opacity: isSelected ? 1 : 0.8,
      }}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between w-full">
        <h3 className={`${isAllCategory ? 'text-[#1f1f1f]' : 'text-white'} text-xs sm:text-base font-semibold truncate pr-2`}>
          {isAllCategory ? "All" : category.name}
        </h3>
        {isSelected && (
          <GrRadialSelected
            className={`${isAllCategory ? 'text-[#1f1f1f]' : 'text-white'} flex-shrink-0`}
            size={12}
          />
        )}
      </div>
      <p className={`${isAllCategory ? 'text-[#1f1f1f]/80' : 'text-white/80'} text-xs sm:text-sm font-medium`}>
        {dishCount} Dishes
      </p>
    </div>
  );
};

CategoryCard.propTypes = {
  category: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    color: PropTypes.string,
  }),
  isSelected: PropTypes.bool.isRequired,
  dishCount: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  isAllCategory: PropTypes.bool,
};

export default CategoryCard;

