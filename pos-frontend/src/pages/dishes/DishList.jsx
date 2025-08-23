import { useEffect } from "react";
import { fetchDishes } from "../../redux/slices/dishSlice";
import { useDispatch, useSelector } from "react-redux";
import Dish from "../../components/dishes/Dish";

const DishList = () => {
  const { items, loading } = useSelector((state) => state.dishes);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchDishes());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-2-16 py-4 overflow-y-scroll scrollbar-hide w-full">
      {items.map((dish) => (
        <Dish key={dish.id} dish={dish} />
      ))}
    </div>
  );
};

export default DishList;
