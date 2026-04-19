import { useState, useEffect } from "react";
import { MdSearch, MdClose, MdRestaurantMenu } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchDishes } from "../../redux/slices/dishSlice";
import defaultDishImage from "../../assets/images/hyderabadibiryani.jpg";
import DishBottomSheet from "./DishBottomSheet";
import { formatPriceK } from "../../utils";

const CATEGORY_EMOJIS = {
  matcha: "🍵",
  "trà": "🍵",
  tra: "🍵",
  "cà phê": "☕",
  "ca phe": "☕",
  coffee: "☕",
  topping: "🧁",
  tea: "🍵",
};

const DISH_BG_COLORS = [
  "#2d4a3a",
  "#3a5a3a",
  "#2e3f5a",
  "#4a5a3a",
  "#4a2d5a",
  "#5a3f2d",
  "#3a2d4a",
  "#2d4a4a",
  "#4a3a2d",
  "#2d3a4a",
];

const getCategoryEmoji = (name) => {
  if (!name) return "🍽️";
  const key = name.toLowerCase().trim();
  return CATEGORY_EMOJIS[key] || "🍽️";
};

const getDishBgColor = (index) => DISH_BG_COLORS[index % DISH_BG_COLORS.length];

const MenuContainer = () => {
  const dispatch = useDispatch();

  const { items: categories, loading: categoriesLoading } = useSelector(
    (state) => state.categories
  );
  const { items: dishes, loading: dishesLoading } = useSelector(
    (state) => state.dishes
  );

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [selectedDish, setSelectedDish] = useState(null);
  const [initialVariant, setInitialVariant] = useState(null);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchDishes());
  }, [dispatch]);

  useEffect(() => {
    if (dishes.length > 0) {
      let filtered = [];

      if (selectedCategory === "all") {
        filtered = dishes.filter((dish) => dish.isAvailable);
      } else if (selectedCategory && typeof selectedCategory === "object") {
        filtered = dishes.filter(
          (dish) =>
            dish.category._id === selectedCategory._id && dish.isAvailable
        );
      }

      if (searchTerm.trim()) {
        filtered = filtered.filter((dish) =>
          dish.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredDishes([...filtered].reverse());
    }
  }, [selectedCategory, dishes, searchTerm]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleDishClick = (dish, variant = null) => {
    setSelectedDish(dish);
    setInitialVariant(variant);
    setIsDishModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDishModalOpen(false);
    setSelectedDish(null);
    setInitialVariant(null);
  };

  const activeCategories = [...categories.filter((cat) => cat.isActive)].reverse();

  if (categoriesLoading || dishesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100] mx-auto mb-4"></div>
          <p className="text-[#ababab] text-lg">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Category Tabs */}
      <div className="px-4 sm:px-6 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {activeCategories.map((category) => {
            const isSelected =
              selectedCategory !== "all" &&
              selectedCategory?._id === category._id;

            return (
              <button
                key={category._id}
                onClick={() =>
                  handleCategorySelect(isSelected ? "all" : category)
                }
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  isSelected
                    ? "bg-[#f6b100] text-[#1f1f1f]"
                    : "bg-[#2a2a2a] text-[#ababab] hover:bg-[#343434]"
                }`}
              >
                <span>{getCategoryEmoji(category.name)}</span>
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="relative">
          <MdSearch
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ababab]"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm món..."
            className="w-full bg-[#2a2a2a] text-[#f5f5f5] pl-10 pr-10 py-2.5 rounded-xl border-none focus:outline-none focus:ring-1 focus:ring-[#f6b100] transition-colors text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ababab] hover:text-[#f5f5f5] transition-colors"
            >
              <MdClose size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Dish Grid */}
      <div className="px-4 sm:px-6 pb-4">
        {filteredDishes.length === 0 ? (
          <div className="text-center py-12">
            <MdRestaurantMenu
              size={64}
              className="text-[#343434] mx-auto mb-4"
            />
            <h3 className="text-[#ababab] text-lg font-medium mb-2">
              {searchTerm ? "No dishes found" : "No dishes available"}
            </h3>
            <p className="text-[#ababab] text-sm">
              {searchTerm ? (
                <>
                  No dishes match &quot;{searchTerm}&quot;
                  {selectedCategory !== "all" && selectedCategory && (
                    <> in {selectedCategory.name} category</>
                  )}
                </>
              ) : selectedCategory === "all" ? (
                "No dishes available at the moment"
              ) : selectedCategory && typeof selectedCategory === "object" ? (
                `No available dishes in ${selectedCategory.name} category`
              ) : (
                "No dishes available at the moment"
              )}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-medium hover:bg-[#e09900] transition-colors text-sm"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredDishes.map((dish, index) => {
              const bgColor = dish.category?.color || getDishBgColor(index);
              const categoryName = dish.category?.name;

              return (
                <div
                  key={dish._id}
                  onClick={() => handleDishClick(dish)}
                  className="flex flex-col bg-[#1a1a1a] rounded-xl cursor-pointer hover:scale-[1.02] transition-transform duration-200 overflow-hidden"
                >
                  {/* Image Area */}
                  <div
                    className="relative w-full aspect-[4/3] flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: bgColor }}
                  >
                    <img
                      src={dish.image || defaultDishImage}
                      alt={dish.name}
                      className="h-[80%] w-[80%] object-contain drop-shadow-lg"
                      onError={(e) => {
                        e.target.src = defaultDishImage;
                      }}
                    />
                    {categoryName && (
                      <span
                        className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold text-white"
                        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                      >
                        {categoryName}
                      </span>
                    )}
                  </div>

                  {/* Info Area */}
                  <div className="px-2.5 pt-2 pb-2.5">
                    <h3 className="text-[#f5f5f5] text-sm font-semibold leading-tight line-clamp-1 mb-2">
                      {dish.name}
                    </h3>

                    {dish.hasSizeVariants && dish.sizeVariants?.length > 0 ? (
                      <div className="flex gap-1.5">
                        {dish.sizeVariants.map((variant) => (
                          <div
                            key={variant.size}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDishClick(dish, variant);
                            }}
                            className="flex-1 flex flex-col items-center bg-[#2a2a2a] rounded-lg py-1.5 hover:bg-[#333] transition-colors"
                          >
                            <span className="text-[#ababab] text-[10px] leading-none">
                              {variant.size}
                            </span>
                            <span className="text-[#f6b100] text-sm font-bold leading-tight">
                              {formatPriceK(variant.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex">
                        <div className="flex-1 flex flex-col items-center bg-[#2a2a2a] rounded-lg py-1.5">
                          <span className="text-[#f6b100] text-sm font-bold leading-tight">
                            {formatPriceK(dish.price)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dish Bottom Sheet */}
      {isDishModalOpen && selectedDish && (
        <DishBottomSheet
          dish={selectedDish}
          initialVariant={initialVariant}
          selectedCategory={
            selectedCategory === "all" ? null : selectedCategory
          }
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default MenuContainer;
