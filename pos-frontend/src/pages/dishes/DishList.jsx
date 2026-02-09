import { useEffect, useMemo } from "react";
import { fetchDishes } from "../../redux/slices/dishSlice";
import { useDispatch, useSelector } from "react-redux";
import Dish from "../../components/dishes/Dish";
import PropTypes from "prop-types";

const DishList = ({ filterStatus, onEditDish }) => {
  const { items, loading } = useSelector((state) => state.dishes);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchDishes());
  }, [dispatch]);

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

  if (loading) {
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
        <Dish key={dish._id} dish={dish} onEdit={onEditDish} />
      ))}
    </div>
  );
};

DishList.propTypes = {
  filterStatus: PropTypes.oneOf(["all", "active", "inactive"]).isRequired,
  onEditDish: PropTypes.func,
};

export default DishList;
