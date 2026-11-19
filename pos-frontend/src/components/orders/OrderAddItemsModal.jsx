import { useState } from "react";
import { enqueueSnackbar } from "notistack";
import { MdRestaurantMenu } from "react-icons/md";
import { useGetCategoriesQuery, useGetDishesQuery, useGetToppingsQuery } from "../../redux/api/endpoints";
import { unwrapList } from "../../redux/api/queryResult";
import DishSelectionModal from "../menu/DishSelectionModal";
import BottomSheet from "../shared/BottomSheet";
import defaultDishImage from "../../assets/images/hyderabadibiryani.jpg";
import { formatPriceK } from "../../utils";
import { buildStandaloneToppingItem, POS_TOPPING_CATEGORY } from "../../utils/toppingOrderItem";
import PropTypes from "prop-types";

const OrderAddItemsModal = ({ onClose, onAddItem }) => {
  const { data: categoriesResult } = useGetCategoriesQuery();
  const { data: dishesResult } = useGetDishesQuery();
  const { data: toppingsResult } = useGetToppingsQuery();
  const categories = unwrapList(categoriesResult);
  const dishes = unwrapList(dishesResult);
  const toppings = unwrapList(toppingsResult).filter((topping) => topping.isAvailable);

  const [selectedDish, setSelectedDish] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const activeCategories = categories.filter((cat) => cat.isActive);
  const filteredDishes =
    selectedCategory === "all"
      ? dishes.filter((d) => d.isAvailable)
      : dishes.filter(
          (d) => d.category?._id === selectedCategory?._id && d.isAvailable
        );

  const isToppingCategory = selectedCategory === POS_TOPPING_CATEGORY;

  const handleDishClick = (dish) => {
    setSelectedDish(dish);
  };

  const handleToppingClick = (topping) => {
    onAddItem(buildStandaloneToppingItem(topping));
    enqueueSnackbar(`${topping.name} đã thêm vào đơn!`, { variant: "success" });
  };

  const handleAddToOrder = (orderItem) => {
    onAddItem(orderItem);
    setSelectedDish(null);
  };

  const handleCloseDishModal = () => {
    setSelectedDish(null);
  };

  const title = (
    <h2 className="flex items-center gap-2 text-base font-semibold text-[#f5f5f5]">
      <MdRestaurantMenu size={20} />
      Add items to order
    </h2>
  );

  return (
    <>
      <BottomSheet
        isOpen
        onClose={onClose}
        title={title}
        size="lg"
        bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-[#343434] px-3 py-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === "all"
                  ? "bg-brand text-[#f5f5f5]"
                  : "bg-[#262626] text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5]"
              }`}
            >
              All
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory?._id === cat._id
                    ? "bg-brand text-[#f5f5f5]"
                    : "bg-[#262626] text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5]"
                }`}
              >
                {cat.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedCategory(POS_TOPPING_CATEGORY)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                isToppingCategory
                  ? "bg-brand text-[#f5f5f5]"
                  : "bg-[#262626] text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5]"
              }`}
            >
              Topping
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {isToppingCategory ? (
              toppings.length === 0 ? (
                <div className="text-center py-8 text-[#ababab]">
                  <MdRestaurantMenu size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No available toppings</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {toppings.map((topping) => (
                    <button
                      key={topping._id}
                      type="button"
                      onClick={() => handleToppingClick(topping)}
                      className="flex flex-col p-2 rounded-lg bg-[#262626] border border-[#343434] hover:border-brand hover:bg-[#2a2a2a] transition-colors text-left"
                    >
                      <h3 className="text-[#f5f5f5] font-medium text-xs line-clamp-2 leading-tight">
                        {topping.name}
                      </h3>
                      <p className="text-brand text-xs font-bold mt-1">
                        {formatPriceK(topping.price)}
                      </p>
                    </button>
                  ))}
                </div>
              )
            ) : filteredDishes.length === 0 ? (
              <div className="text-center py-8 text-[#ababab]">
                <MdRestaurantMenu size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No available dishes</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {filteredDishes.map((dish) => (
                  <button
                    key={dish._id}
                    type="button"
                    onClick={() => handleDishClick(dish)}
                    disabled={!dish.isAvailable}
                    className="flex flex-col p-2 rounded-lg bg-[#262626] border border-[#343434] hover:border-brand hover:bg-[#2a2a2a] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-full aspect-square rounded-md bg-[#343434] mb-1.5 overflow-hidden">
                      <img
                        src={dish.image || defaultDishImage}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = defaultDishImage;
                        }}
                      />
                    </div>
                    <h3 className="text-[#f5f5f5] font-medium text-xs line-clamp-2 leading-tight">
                      {dish.name}
                    </h3>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {selectedDish && (
        <DishSelectionModal
          dish={selectedDish}
          selectedCategory={selectedCategory === "all" ? null : selectedCategory}
          onClose={handleCloseDishModal}
          onAddToOrder={handleAddToOrder}
        />
      )}
    </>
  );
};

OrderAddItemsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
};

export default OrderAddItemsModal;
