import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MdAdd, MdRemove } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { fetchToppingsByCategory } from "../../redux/slices/toppingSlice";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import defaultDishImage from "../../assets/images/hyderabadibiryani.jpg";

const formatCompactPrice = (price) => {
  if (!price && price !== 0) return "0k";
  const k = Math.round(price / 1000);
  return `${k}k`;
};

const parseVariantLabel = (size) => {
  if (!size) return { sizeLetter: "", description: "" };
  const parts = size.trim().split(/\s+/);
  if (parts.length === 1) return { sizeLetter: parts[0], description: "" };
  return { sizeLetter: parts[0], description: parts.slice(1).join(" ") };
};

const DishBottomSheet = ({
  dish,
  initialVariant,
  selectedCategory,
  onClose,
  onAddToOrder,
}) => {
  const dispatch = useDispatch();
  const { toppingsByCategory, loading: toppingsLoading } = useSelector(
    (state) => state.toppings,
  );

  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (initialVariant) return initialVariant;
    if (dish.hasSizeVariants && dish.sizeVariants?.length > 0) {
      return dish.sizeVariants.find((v) => v.isDefault) || dish.sizeVariants[0];
    }
    return null;
  });
  const [selectedToppings, setSelectedToppings] = useState({});

  useEffect(() => {
    dispatch(fetchToppingsByCategory());
  }, [dispatch]);

  const getCurrentPrice = () => {
    return selectedVariant ? selectedVariant.price : dish.price;
  };

  const findToppingById = (toppingId) => {
    for (const category of Object.values(toppingsByCategory)) {
      const topping = category.find((t) => t._id === toppingId);
      if (topping) return topping;
    }
    return null;
  };

  const getToppingsPrice = () => {
    let total = 0;
    Object.entries(selectedToppings).forEach(([toppingId, qty]) => {
      const topping = findToppingById(toppingId);
      if (topping && qty > 0) {
        total += topping.price * qty;
      }
    });
    return total;
  };

  const allToppings = Object.values(toppingsByCategory)
    .flat()
    .filter((t) => t.isAvailable);

  const handleToppingQuantityChange = (toppingId, change) => {
    setSelectedToppings((prev) => {
      const current = prev[toppingId] || 0;
      const next = Math.max(0, current + change);
      if (next === 0) {
        // eslint-disable-next-line no-unused-vars
        const { [toppingId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [toppingId]: next };
    });
  };

  const handleAddToCart = () => {
    const currentPrice = getCurrentPrice();
    const toppingsPrice = getToppingsPrice();
    const totalItemPrice = currentPrice + toppingsPrice;

    let dishName = dish.name;
    if (selectedVariant) {
      dishName = `${dish.name} (${selectedVariant.size})`;
    }

    const toppings = Object.entries(selectedToppings)
      .filter(([, qty]) => qty > 0)
      .map(([toppingId, qty]) => {
        const topping = findToppingById(toppingId);
        return {
          toppingId,
          name: topping.name,
          price: topping.price,
          quantity: qty,
          totalPrice: topping.price * qty,
        };
      });

    if (onAddToOrder) {
      const orderItem = {
        dishId: dish._id,
        name: dishName,
        originalPricePerQuantity: totalItemPrice,
        pricePerQuantity: totalItemPrice,
        quantity: 1,
        originalPrice: totalItemPrice,
        price: totalItemPrice,
        category: dish.category?.name || selectedCategory?.name || "Unknown",
        image: dish.image || defaultDishImage,
        variant: selectedVariant
          ? {
              size: selectedVariant.size,
              price: selectedVariant.price,
              cost: selectedVariant.cost,
            }
          : undefined,
        toppings:
          toppings.length > 0
            ? toppings.map((t) => ({
                toppingId: t.toppingId,
                name: t.name,
                price: t.price,
                quantity: t.quantity,
              }))
            : [],
      };
      onAddToOrder(orderItem);
      enqueueSnackbar(`${dishName} đã thêm vào đơn!`, { variant: "success" });
    } else {
      const cartItem = {
        id: `${dish._id}-${selectedVariant?.size || "default"}-${Date.now()}`,
        dishId: dish._id,
        name: dishName,
        pricePerQuantity: totalItemPrice,
        quantity: 1,
        price: totalItemPrice,
        category: dish.category?.name || selectedCategory?.name || "Unknown",
        image: dish.image || defaultDishImage,
        variant: selectedVariant
          ? {
              size: selectedVariant.size,
              price: selectedVariant.price,
              cost: selectedVariant.cost,
            }
          : null,
        toppings: toppings.length > 0 ? toppings : null,
        note: null,
      };
      dispatch(addItems(cartItem));
      enqueueSnackbar(`${dishName} đã thêm vào giỏ!`, { variant: "success" });
    }
    onClose();
  };

  const hasVariants = dish.hasSizeVariants && dish.sizeVariants?.length > 0;
  const hasToppings = allToppings.length > 0;

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 bg-black/60 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
          }
        }}
      >
        <div className="bg-[#1a1a1a] rounded-t-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 rounded-full bg-[#555]" />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            {/* Title */}
            <h2 className="text-white text-2xl font-bold mt-3">{dish.name}</h2>

            {/* Size & Method Variants */}
            {hasVariants && (
              <div className="mt-5">
                <h4 className="text-[#888] text-xs font-semibold tracking-widest uppercase mb-3">
                  Size & Cách pha
                </h4>
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(
                      dish.sizeVariants.length,
                      4,
                    )}, 1fr)`,
                  }}
                >
                  {dish.sizeVariants.map((variant, idx) => {
                    const isSelected = selectedVariant?.size === variant.size;
                    const { sizeLetter, description } = parseVariantLabel(
                      variant.size,
                    );

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariant(variant)}
                        className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-lg border-2 transition-all duration-200 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-900/30"
                            : "border-[#333] bg-[#262626] hover:border-[#555]"
                        }`}
                      >
                        <span
                          className={`text-base font-bold leading-tight ${
                            isSelected ? "text-white" : "text-[#ccc]"
                          }`}
                        >
                          {sizeLetter}
                        </span>
                        {description && (
                          <span
                            className={`text-[10px] mt-0.5 leading-tight ${
                              isSelected ? "text-emerald-400" : "text-[#888]"
                            }`}
                          >
                            {description}
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold mt-0.5 ${
                            isSelected ? "text-white" : "text-[#aaa]"
                          }`}
                        >
                          {formatCompactPrice(variant.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Base Price (shown only when no variants) */}
            {!hasVariants && (
              <p className="text-emerald-400 text-lg font-bold mt-2">
                {formatCompactPrice(dish.price)}
              </p>
            )}

            {/* Toppings */}
            {hasToppings && (
              <div className="mt-5">
                <h4 className="text-[#888] text-xs font-semibold tracking-widest uppercase mb-3">
                  Topping
                </h4>
                <div>
                  {allToppings.map((topping) => {
                    const qty = selectedToppings[topping._id] || 0;
                    return (
                      <div
                        key={topping._id}
                        className="flex items-center justify-between py-3 border-b border-[#2a2a2a] last:border-b-0"
                      >
                        <span className="text-[#ddd] text-sm font-medium">
                          {topping.name}
                        </span>
                        <div className="flex items-center gap-2.5">
                          <span className="text-emerald-400 text-xs font-semibold min-w-[36px] text-right">
                            +{formatCompactPrice(topping.price)}
                          </span>
                          <button
                            onClick={() =>
                              handleToppingQuantityChange(topping._id, -1)
                            }
                            disabled={qty <= 0}
                            className="w-7 h-7 rounded-lg bg-[#333] text-[#aaa] flex items-center justify-center disabled:opacity-30 transition-colors hover:bg-[#444]"
                          >
                            <MdRemove size={14} />
                          </button>
                          <span className="text-white text-sm font-semibold w-4 text-center">
                            {qty}
                          </span>
                          <button
                            onClick={() =>
                              handleToppingQuantityChange(topping._id, 1)
                            }
                            className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center transition-colors hover:bg-emerald-500"
                          >
                            <MdAdd size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {toppingsLoading && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Add to Order Button */}
          <div className="px-5 pb-5 pt-3 flex-shrink-0">
            <button
              onClick={handleAddToCart}
              disabled={!dish.isAvailable}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base transition-colors"
            >
              {dish.isAvailable ? "+ Thêm vào đơn" : "Hết hàng"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

DishBottomSheet.propTypes = {
  onAddToOrder: PropTypes.func,
  initialVariant: PropTypes.shape({
    size: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    cost: PropTypes.number,
    isDefault: PropTypes.bool,
  }),
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
      }),
    ),
    category: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
    }),
  }).isRequired,
  selectedCategory: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default DishBottomSheet;
