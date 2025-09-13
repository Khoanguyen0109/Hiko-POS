import { useState } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { MdAdd, MdRemove } from "react-icons/md";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { formatVND } from "../../utils";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import defaultDishImage from "../../assets/images/hyderabadibiryani.jpg";

const DishSelectionModal = ({ dish, selectedCategory, onClose }) => {
  const dispatch = useDispatch();
  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (dish.hasSizeVariants && dish.sizeVariants?.length > 0) {
      return dish.sizeVariants.find(v => v.isDefault) || dish.sizeVariants[0];
    }
    return null;
  });
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.price;
    }
    return dish.price;
  };

  const getCurrentCost = () => {
    if (selectedVariant) {
      return selectedVariant.cost || 0;
    }
    return dish.cost || 0;
  };

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  const handleAddToCart = () => {
    const currentPrice = getCurrentPrice();
    let dishName = dish.name;
    
    if (selectedVariant) {
      dishName = `${dish.name} (${selectedVariant.size})`;
    }

    const cartItem = {
      id: `${dish._id}-${selectedVariant?.size || 'default'}-${Date.now()}`,
      dishId: dish._id,
      name: dishName,
      pricePerQuantity: currentPrice,
      quantity: quantity,
      price: currentPrice * quantity,
      category: selectedCategory?.name || 'Unknown',
      image: dish.image || defaultDishImage,
      variant: selectedVariant ? {
        size: selectedVariant.size,
        price: selectedVariant.price,
        cost: selectedVariant.cost
      } : null,
      note: note.trim() || null
    };

    dispatch(addItems(cartItem));
    enqueueSnackbar(`${dishName} added to cart!`, { variant: "success" });
    onClose();
  };

  const totalPrice = getCurrentPrice() * quantity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-[#1f1f1f] rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">Select Options</h2>
          <button
            onClick={onClose}
            className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
          >
            <IoMdClose size={24} />
          </button>
        </div>

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
            <div className="grid grid-cols-1 gap-2">
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
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-lg">{variant.size}</span>
                        {isDefault && (
                          <span className={`ml-2 text-xs ${isSelected ? 'text-[#1f1f1f]/70' : 'text-[#ababab]'}`}>
                            (Default)
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-lg ${isSelected ? 'text-[#1f1f1f]' : 'text-[#f6b100]'}`}>
                          {formatVND(variant.price)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
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

        {/* Total and Add to Cart */}
        <div className="p-6 border-t border-[#343434]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#ababab] text-lg">Total:</span>
            <span className="text-[#f6b100] text-2xl font-bold">
              {formatVND(totalPrice)}
            </span>
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