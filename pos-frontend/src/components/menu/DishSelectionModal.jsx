import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IoMdClose, IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import { MdAdd, MdRemove } from "react-icons/md";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { fetchToppingsByCategory } from "../../redux/slices/toppingSlice";
import { formatVND } from "../../utils";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import defaultDishImage from "../../assets/images/hyderabadibiryani.jpg";

const DishSelectionModal = ({ dish, selectedCategory, onClose }) => {
  const dispatch = useDispatch();
  const { toppingsByCategory, loading: toppingsLoading } = useSelector((state) => state.toppings);
  
  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (dish.hasSizeVariants && dish.sizeVariants?.length > 0) {
      return dish.sizeVariants.find(v => v.isDefault) || dish.sizeVariants[0];
    }
    return null;
  });
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [selectedToppings, setSelectedToppings] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  // Fetch toppings when modal opens
  useEffect(() => {
    dispatch(fetchToppingsByCategory());
  }, [dispatch]);

  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.price;
    }
    return dish.price;
  };


  const findToppingById = (toppingId) => {
    for (const category of Object.values(toppingsByCategory)) {
      const topping = category.find(t => t._id === toppingId);
      if (topping) return topping;
    }
    return null;
  };

  const getToppingsPrice = () => {
    let total = 0;
    Object.entries(selectedToppings).forEach(([toppingId, quantity]) => {
      const topping = findToppingById(toppingId);
      if (topping && quantity > 0) {
        total += topping.price * quantity;
      }
    });
    return total;
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const handleToppingQuantityChange = (toppingId, change) => {
    setSelectedToppings(prev => {
      const currentQuantity = prev[toppingId] || 0;
      const newQuantity = Math.max(0, currentQuantity + change);
      
      if (newQuantity === 0) {
        // eslint-disable-next-line no-unused-vars
        const { [toppingId]: _, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [toppingId]: newQuantity
      };
    });
  };

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  const handleAddToCart = () => {
    const currentPrice = getCurrentPrice();
    const toppingsPrice = getToppingsPrice();
    const totalItemPrice = (currentPrice + toppingsPrice) * quantity;
    
    let dishName = dish.name;
    if (selectedVariant) {
      dishName = `${dish.name} (${selectedVariant.size})`;
    }

    // Convert selected toppings to array format
    const toppings = Object.entries(selectedToppings)
      .filter(([, quantity]) => quantity > 0)
      .map(([toppingId, quantity]) => {
        const topping = findToppingById(toppingId);
        return {
          toppingId,
          name: topping.name,
          price: topping.price,
          quantity,
          totalPrice: topping.price * quantity
        };
      });

    const cartItem = {
      id: `${dish._id}-${selectedVariant?.size || 'default'}-${Date.now()}`,
      dishId: dish._id,
      name: dishName,
      pricePerQuantity: currentPrice + toppingsPrice,
      quantity: quantity,
      price: totalItemPrice,
      category: dish.category?.name || selectedCategory?.name || 'Unknown',
      image: dish.image || defaultDishImage,
      variant: selectedVariant ? {
        size: selectedVariant.size,
        price: selectedVariant.price,
        cost: selectedVariant.cost
      } : null,
      toppings: toppings.length > 0 ? toppings : null,
      note: note.trim() || null
    };

    dispatch(addItems(cartItem));
    enqueueSnackbar(`${dishName} added to cart!`, { variant: "success" });
    onClose();
  };

  const totalPrice = (getCurrentPrice() + getToppingsPrice()) * quantity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-[#1f1f1f] rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434] flex-shrink-0">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">Select Options</h2>
          <button
            onClick={onClose}
            className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
        {/* Dish Image */}
        <div className="p-6 pb-4">
          <div className="w-full h-48 rounded-lg  bg-[#2a2a2a] relative mb-4">
            <img 
              src={dish.image || defaultDishImage} 
              alt={dish.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = defaultDishImage;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            
            {/* Availability badge */}
            <div className="absolute top-3 right-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                dish.isAvailable 
                  ? 'bg-green-900/90 text-green-300 border border-green-700' 
                  : 'bg-red-900/90 text-red-300 border border-red-700'
              }`}>
                {dish.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>

          {/* Dish Info */}
          <div className="mb-4">
            <h3 className="text-[#f5f5f5] text-2xl font-bold mb-2">{dish.name}</h3>
            {dish.note && (
              <p className="text-[#ababab] text-sm leading-relaxed mb-3">
                {dish.note}
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[#f6b100] text-xl font-bold">
                {formatVND(getCurrentPrice())}
              </span>
            </div>
          </div>
        </div>

        {/* Size Variants Selection */}
        {dish.hasSizeVariants && dish.sizeVariants?.length > 0 && (
          <div className="px-6 pb-4">
            <h4 className="text-[#f5f5f5] font-semibold mb-3">Choose Size</h4>
            <div className="grid grid-cols-2 gap-2">
              {dish.sizeVariants.map((variant, index) => {
                const isSelected = selectedVariant?.size === variant.size;
                const isDefault = variant.isDefault;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleVariantChange(variant)}
                    className={`relative p-4 rounded-lg text-left transition-all duration-200 border-2 ${
                      isSelected 
                        ? 'bg-[#f6b100] text-[#1f1f1f] border-[#f6b100] shadow-lg' 
                        : 'bg-[#262626] text-[#f5f5f5] border-[#343434] hover:border-[#f6b100] hover:bg-[#343434]'
                    }`}
                  >
                    {isDefault && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1f1f1f]"></div>
                    )}
                    <div className="flex items-center flex-row justify-between">
                      <div className="flex flex-1">
                        <span className="font-bold text-lg">{variant.size}</span>
                        {isDefault && (
                          <span className={`ml-2 text-xs ${isSelected ? 'text-[#1f1f1f]/70' : 'text-[#ababab]'}`}>
                            (Default)
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Toppings Selection Accordion */}
        {Object.keys(toppingsByCategory).length > 0 && (
          <div className="px-6 pb-4">
            <h4 className="text-[#f5f5f5] font-semibold mb-3">Add Toppings (Optional)</h4>
            <div className="space-y-2">
              {Object.entries(toppingsByCategory).map(([categoryName, toppings]) => {
                const isExpanded = expandedCategories[categoryName];
                const categoryToppingsCount = toppings.filter(topping => 
                  selectedToppings[topping._id] > 0
                ).length;
                
                return (
                  <div key={categoryName} className="border border-[#343434] rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(categoryName)}
                      className="w-full p-4 bg-[#262626] hover:bg-[#343434] transition-colors flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#f5f5f5] font-medium">{categoryName}</span>
                        {categoryToppingsCount > 0 && (
                          <span className="bg-[#f6b100] text-[#1f1f1f] text-xs px-2 py-1 rounded-full font-medium">
                            {categoryToppingsCount} selected
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <IoMdArrowUp className="text-[#ababab]" size={20} />
                      ) : (
                        <IoMdArrowDown className="text-[#ababab]" size={20} />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="bg-[#1f1f1f] border-t border-[#343434]">
                        {toppings.filter(topping => topping.isAvailable).map((topping) => {
                          const quantity = selectedToppings[topping._id] || 0;
                          
                          return (
                            <div key={topping._id} className="p-4 border-b border-[#343434] last:border-b-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h5 className="text-[#f5f5f5] font-medium">{topping.name}</h5>
                                  {topping.description && (
                                    <p className="text-[#ababab] text-sm">{topping.description}</p>
                                  )}
                                  <p className="text-[#f6b100] font-bold">{formatVND(topping.price)}</p>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleToppingQuantityChange(topping._id, -1)}
                                    disabled={quantity <= 0}
                                    className="p-2 rounded-lg bg-[#262626] text-[#f6b100] hover:bg-[#343434] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <MdRemove size={16} />
                                  </button>
                                  
                                  <span className="text-[#f5f5f5] font-bold min-w-[30px] text-center">
                                    {quantity}
                                  </span>
                                  
                                  <button
                                    onClick={() => handleToppingQuantityChange(topping._id, 1)}
                                    className="p-2 rounded-lg bg-[#262626] text-[#f6b100] hover:bg-[#343434] transition-colors"
                                  >
                                    <MdAdd size={16} />
                                  </button>
                                </div>
                              </div>
                              
                              {quantity > 0 && (
                                <div className="text-right">
                                  <span className="text-[#f6b100] text-sm font-medium">
                                    Subtotal: {formatVND(topping.price * quantity)}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {toppings.filter(topping => topping.isAvailable).length === 0 && (
                          <div className="p-4 text-center text-[#ababab]">
                            No available toppings in this category
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {toppingsLoading && (
              <div className="text-center py-4">
                <div className="inline-block w-6 h-6 border-2 border-[#f6b100] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#ababab] text-sm mt-2">Loading toppings...</p>
              </div>
            )}
          </div>
        )}

        {/* Quantity Selection */}
        <div className="px-6 pb-4">
          <h4 className="text-[#f5f5f5] font-semibold mb-3">Quantity</h4>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="p-3 rounded-lg bg-[#262626] text-[#f6b100] hover:bg-[#343434] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MdRemove size={20} />
            </button>
            <span className="text-[#f5f5f5] text-2xl font-bold min-w-[60px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="p-3 rounded-lg bg-[#262626] text-[#f6b100] hover:bg-[#343434] transition-colors"
            >
              <MdAdd size={20} />
            </button>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="px-6 pb-4">
          <h4 className="text-[#f5f5f5] font-semibold mb-3">Special Instructions (Optional)</h4>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any special requests or modifications..."
            className="w-full p-3 rounded-lg bg-[#262626] text-[#f5f5f5] border border-[#343434] focus:border-[#f6b100] focus:outline-none resize-none"
            rows="3"
            maxLength={200}
          />
          <p className="text-[#ababab] text-xs mt-1">
            {note.length}/200 characters
          </p>
        </div>
        </div>

        {/* Sticky Footer - Total and Add to Cart */}
        <div className="p-6 border-t border-[#343434] flex-shrink-0 bg-[#1f1f1f] rounded-b-lg">
          {/* Price Breakdown */}
          <div className="space-y-2 mb-4">
          
            {getToppingsPrice() > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[#ababab]">Toppings:</span>
                <span className="text-[#f5f5f5]">{formatVND(getToppingsPrice())}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-[#ababab]">Quantity:</span>
              <span className="text-[#f5f5f5]">×{quantity}</span>
            </div>
            
            <div className="border-t border-[#343434] pt-2 flex items-center justify-between">
              <span className="text-[#ababab] text-lg font-medium">Total:</span>
              <span className="text-[#f6b100] text-2xl font-bold">
                {formatVND(totalPrice)}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={!dish.isAvailable}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-bold text-lg hover:bg-[#e09900] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaShoppingCart size={20} />
            {dish.isAvailable ? 'Add to Cart' : 'Not Available'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

DishSelectionModal.propTypes = {
  dish: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    cost: PropTypes.number,
    note: PropTypes.string,
    image: PropTypes.string,
    isAvailable: PropTypes.bool.isRequired,
    hasSizeVariants: PropTypes.bool,
    sizeVariants: PropTypes.arrayOf(
      PropTypes.shape({
        size: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        cost: PropTypes.number,
        isDefault: PropTypes.bool,
      })
    ),
  }).isRequired,
  selectedCategory: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default DishSelectionModal; 