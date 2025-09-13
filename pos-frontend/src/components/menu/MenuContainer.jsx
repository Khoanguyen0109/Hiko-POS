import { useState, useEffect } from "react";
import { GrRadialSelected } from "react-icons/gr";
import { MdCategory, MdRestaurantMenu } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchDishes } from "../../redux/slices/dishSlice";
import { formatVND } from "../../utils";
import defaultDishImage from "../../assets/images/hyderabadibiryani.jpg";
import DishSelectionModal from "./DishSelectionModal";

const MenuContainer = () => {
  const dispatch = useDispatch();

  // Redux state
  const { items: categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const { items: dishes, loading: dishesLoading } = useSelector((state) => state.dishes);
  
  // Local state
  const [selectedCategory, setSelectedCategory] = useState("all"); // Start with "all"
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [selectedDish, setSelectedDish] = useState(null);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchDishes());
  }, [dispatch]);

  // Filter dishes when category or dishes change
  useEffect(() => {
    if (dishes.length > 0) {
      if (selectedCategory === "all") {
        // Show all available dishes
        setFilteredDishes(dishes.filter(dish => dish.isAvailable));
      } else if (selectedCategory && typeof selectedCategory === 'object') {
        // Show dishes from selected category
        const categoryDishes = dishes.filter(dish => 
          dish.category._id === selectedCategory._id && dish.isAvailable
        );
        setFilteredDishes(categoryDishes);
      }
    }
  }, [selectedCategory, dishes]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleDishClick = (dish) => {
    setSelectedDish(dish);
    setIsDishModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDishModalOpen(false);
    setSelectedDish(null);
  };

  // Get active categories only
  const activeCategories = categories.filter(cat => cat.isActive);

  // Get total available dishes count
  const totalAvailableDishes = dishes.filter(dish => dish.isAvailable).length;

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
      {/* Categories Section */}
      <div className="px-10 py-4 overflow-y-auto">
        <h2 className="text-[#f5f5f5] text-lg font-semibold mb-4 flex items-center gap-2">
          <MdCategory size={20} />
          Categories
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* All Categories Option */}
          <div
            className="flex flex-col items-start justify-between p-4 rounded-lg h-[100px] cursor-pointer transition-all duration-200 hover:scale-105"
            style={{ 
              backgroundColor: "#f6b100",
              opacity: selectedCategory === "all" ? 1 : 0.8
            }}
            onClick={() => handleCategorySelect("all")}
          >
            <div className="flex items-center justify-between w-full">
              <h3 className="text-[#1f1f1f] text-lg font-semibold">
                All
              </h3>
              {selectedCategory === "all" && (
                <GrRadialSelected className="text-[#1f1f1f]" size={20} />
              )}
            </div>
            <p className="text-[#1f1f1f]/80 text-sm font-medium">
              {totalAvailableDishes} Dishes
            </p>
          </div>

          {/* Regular Categories */}
          {activeCategories.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <MdCategory size={48} className="text-[#343434] mx-auto mb-4" />
              <p className="text-[#ababab]">No active categories found</p>
            </div>
          ) : (
            activeCategories.map((category) => {
              const categoryDishCount = dishes.filter(dish => 
                dish.category._id === category._id && dish.isAvailable
              ).length;

          return (
            <div
                  key={category._id}
                  className="flex flex-col items-start justify-between p-4 rounded-lg h-[100px] cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{ 
                    backgroundColor: category.color,
                    opacity: selectedCategory?._id === category._id ? 1 : 0.8
                  }}
                  onClick={() => handleCategorySelect(category)}
            >
              <div className="flex items-center justify-between w-full">
                    <h3 className="text-white text-lg font-semibold">
                      {category.name}
                    </h3>
                    {selectedCategory?._id === category._id && (
                  <GrRadialSelected className="text-white" size={20} />
                )}
              </div>
                  <p className="text-white/80 text-sm font-medium">
                    {categoryDishCount} Dishes
              </p>
            </div>
          );
            })
          )}
        </div>
      </div>

      <hr className="border-[#2a2a2a] border-t-2 mt-4" />

      {/* Dishes Section */}
      <div className="px-10 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#f5f5f5] text-lg font-semibold flex items-center gap-2">
            <MdRestaurantMenu size={20} />
            {selectedCategory === "all" 
              ? 'All Dishes' 
              : selectedCategory 
                ? `${selectedCategory.name} Dishes` 
                : 'All Dishes'
            }
          </h2>
          <span className="text-[#ababab] text-sm">
            {filteredDishes.length} available dishes
          </span>
        </div>

        {filteredDishes.length === 0 ? (
          <div className="text-center py-12">
            <MdRestaurantMenu size={64} className="text-[#343434] mx-auto mb-4" />
            <h3 className="text-[#ababab] text-lg font-medium mb-2">
              No dishes available
            </h3>
            <p className="text-[#ababab] text-sm">
              {selectedCategory === "all"
                ? 'No dishes available at the moment'
                : selectedCategory && typeof selectedCategory === 'object'
                  ? `No available dishes in ${selectedCategory.name} category`
                  : 'No dishes available at the moment'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDishes.map((dish) => {
              // Get display price (handle size variants)
              let priceLabel = formatVND(dish.price);
              
              if (dish.hasSizeVariants && dish.sizeVariants?.length > 0) {
                const defaultVariant = dish.sizeVariants.find(v => v.isDefault) || dish.sizeVariants[0];
                priceLabel = `${formatVND(defaultVariant.price)} (${defaultVariant.size})`;
                
                // Show price range if multiple variants
                if (dish.sizeVariants.length > 1) {
                  const prices = dish.sizeVariants.map(v => v.price);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  if (minPrice !== maxPrice) {
                    priceLabel = `${formatVND(minPrice)} - ${formatVND(maxPrice)}`;
                  }
                }
              }

          return (
            <div
                  key={dish._id}
                  onClick={() => handleDishClick(dish)}
                  className="flex flex-col justify-between p-4 rounded-lg h-[280px] cursor-pointer hover:bg-[#2a2a2a] bg-[#1a1a1a] transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
                  {/* Dish Image */}
                  <div className="w-full h-32 mb-3 rounded-lg  bg-[#2a2a2a] relative">
                    <img 
                      src={dish.image || defaultDishImage} 
                      alt={dish.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.target.src = defaultDishImage;
                      }}
                    />
                    {/* Image overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    
                    {/* Availability badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dish.isAvailable 
                          ? 'bg-green-900/80 text-green-300 border border-green-700' 
                          : 'bg-red-900/80 text-red-300 border border-red-700'
                      }`}>
                        {dish.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    {/* Size variants indicator */}
                    {dish.hasSizeVariants && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900/80 text-blue-300 border border-blue-700">
                          Multiple Sizes
                        </span>
                      </div>
                    )}

                    {/* Category badge when showing all dishes */}
                    {selectedCategory === "all" && dish.category && (
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-900/80 text-purple-300 border border-purple-700">
                          {dish.category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dish Header */}
                  <div className="flex-1 mb-3">
                    <h3 className="text-[#f5f5f5] text-lg font-semibold mb-1 line-clamp-2">
                      {dish.name}
                    </h3>
                    {dish.note && (
                      <p className="text-[#ababab] text-xs line-clamp-2">
                        {dish.note}
                      </p>
                    )}
              </div>

                  {/* Price Section */}
              <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <p className="text-[#f6b100] text-lg font-bold">
                        {priceLabel}
                </p>
                      {dish.hasSizeVariants && (
                        <span className="text-[#ababab] text-xs">
                          Multiple sizes available
                  </span>
                      )}
                    </div>
                    
                    {/* Click to order indicator */}
                    <div className="text-[#ababab] text-xs text-right">
                      <p>Click to</p>
                      <p className="text-[#f6b100] font-medium">Order</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
        )}
      </div>

      {/* Dish Selection Modal */}
      {isDishModalOpen && selectedDish && (
        <DishSelectionModal
          dish={selectedDish}
          selectedCategory={selectedCategory === "all" ? null : selectedCategory}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default MenuContainer;
