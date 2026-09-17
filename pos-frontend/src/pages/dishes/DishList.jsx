import { useMemo } from "react";
import Dish from "../../components/dishes/Dish";
import PropTypes from "prop-types";
import { useGetDishesQuery } from "../../redux/api/endpoints/catalogEndpoints";
import { unwrapList } from "../../redux/api/queryResult";

const DishList = ({ filterStatus, onEditDish, onRecipeDish }) => {
  const { data: dishesResult, isLoading } = useGetDishesQuery();
  const items = unwrapList(dishesResult);

  // Filter dishes based on the filterStatus prop
  const filteredDishes = useMemo(() => {
    if (!items) return [];
    
    switch (filterStatus) {
      case "active":
        return items.filter(dish => dish.isAvailable === true);
      case "inactive":
        return items.filter(dish => dish.isAvailable === false);
      case "all":
      default:
        return items;
    }
  }, [items, filterStatus]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-[#ababab] text-lg">Loading dishes...</div>
      </div>
    );
  }

  if (filteredDishes.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-[#ababab] text-lg">
          {filterStatus === "all" 
            ? "No dishes found" 
            : `No ${filterStatus} dishes found`
          }
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-6 lg:px-10 py-4">
      {filteredDishes.map((dish) => (
        <Dish key={dish._id} dish={dish} onEdit={onEditDish} onRecipe={onRecipeDish} />
      ))}
    </div>
  );
};

DishList.propTypes = {
  filterStatus: PropTypes.oneOf(["all", "active", "inactive"]).isRequired,
  onEditDish: PropTypes.func,
  onRecipeDish: PropTypes.func,
};

export default DishList;
