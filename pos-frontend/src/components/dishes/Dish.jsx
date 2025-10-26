import PropTypes from "prop-types";
import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  IoMdInformationCircleOutline,
  IoMdPricetag,
  IoMdTrash,
} from "react-icons/io";
import { MdOutlineInventory, MdToggleOn, MdToggleOff, MdEdit, MdMenuBook } from "react-icons/md";
import { removeDish, toggleAvailability } from "../../redux/slices/dishSlice";
import { enqueueSnackbar } from "notistack";
import biryani from "../../assets/images/hyderabadibiryani.jpg";
import { formatVND } from "../../utils";

const Dish = ({ dish, onEdit, onRecipe }) => {
  const dispatch = useDispatch();
  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (dish.hasSizeVariants && dish.sizeVariants?.length > 0) {
      return dish.sizeVariants.find((v) => v.isDefault) || dish.sizeVariants[0];
    }
    return null;
  });

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
  };

  const handleDeleteDish = async (e) => {
    e.stopPropagation();

    if (
      window.confirm(
        `Are you sure you want to delete "${dish.name}"? This action cannot be undone.`
      )
    ) {
      try {
        const resultAction = await dispatch(removeDish(dish._id));

        if (removeDish.fulfilled.match(resultAction)) {
          enqueueSnackbar("Dish deleted successfully!", { variant: "success" });
        } else {
          const errorMessage = resultAction.payload || "Failed to delete dish";
          enqueueSnackbar(errorMessage, { variant: "error" });
        }
      } catch {
        enqueueSnackbar("An unexpected error occurred", { variant: "error" });
      }
    }
  };

  const handleEditDish = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(dish);
    }
  };

  const handleRecipe = (e) => {
    e.stopPropagation();
    if (onRecipe) {
      onRecipe(dish);
    }
  };

  const handleToggleAvailability = async (e) => {
    e.stopPropagation();

    try {
      const resultAction = await dispatch(toggleAvailability(dish._id));

      if (toggleAvailability.fulfilled.match(resultAction)) {
        const newStatus = resultAction.payload.isAvailable;
        enqueueSnackbar(
          `Dish ${newStatus ? "enabled" : "disabled"} successfully!`,
          { variant: "success" }
        );
      } else {
        const errorMessage =
          resultAction.payload || "Failed to toggle availability";
        enqueueSnackbar(errorMessage, { variant: "error" });
      }
    } catch {
      enqueueSnackbar("An unexpected error occurred", { variant: "error" });
    }
  };

  const getCurrentPrice = () => {
    if (dish.hasSizeVariants && selectedVariant) {
      return selectedVariant.price;
    }
    return dish.price;
  };

  const getCurrentCost = () => {
    if (dish.hasSizeVariants && selectedVariant) {
      return selectedVariant.cost;
    }
    return dish.cost;
  };

  const getPriceRange = () => {
    if (!dish.hasSizeVariants || !dish.sizeVariants?.length) return null;

    const prices = dish.sizeVariants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return formatVND(minPrice);
    }
    return `${formatVND(minPrice)} - ${formatVND(maxPrice)}`;
  };

  return (
    <div className="bg-[#1f1f1f] rounded-[20px] p-4 sm:p-6 mt-4 mx-2 sm:mx-4 lg:mx-6 hover:bg-[#252525] transition-colors duration-200 border border-transparent hover:border-[#343434] relative">
      {/* Action Buttons */}

      {/* Header Section */}
      <div className="flex items-start gap-3 sm:gap-4 pr-16 sm:pr-24">
        {/* Dish Number */}
        {/* <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-[#f6b100] to-[#e09900] rounded-full flex items-center justify-center">
            <span className="text-[#1f1f1f] font-bold text-lg">
              {dish.id ? (dish.id < 10 ? `0${dish.id}` : dish.id) : "00"}
            </span>
          </div>
        </div> */}

        {/* Dish Image */}
        <div className="flex-shrink-0">
          <img
            src={dish.image || biryani}
            alt={dish.name}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-[#343434]"
          />
        </div>

        {/* Dish Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-[#f5f5f5] font-bold text-lg sm:text-xl tracking-wide mb-1 line-clamp-2">
                {dish.name}
              </h2>

              {/* Dish Meta Info */}
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                {!dish.isAvailable && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800">
                    <MdOutlineInventory size={12} className="mr-1" />
                    <span className="hidden sm:inline">Unavailable</span>
                    <span className="sm:hidden">N/A</span>
                  </span>
                )}

                {dish.hasSizeVariants && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-800">
                    <IoMdPricetag size={12} className="mr-1" />
                    <span className="hidden sm:inline">{dish.sizeVariants?.length} Sizes</span>
                    <span className="sm:hidden">{dish.sizeVariants?.length}S</span>
                  </span>
                )}
              </div>

              {dish.note && (
                <div className="flex items-start gap-1 mb-3">
                  <IoMdInformationCircleOutline
                    size={14}
                    className="text-[#ababab] mt-0.5 flex-shrink-0"
                  />
                  <p className="text-[#ababab] text-sm leading-relaxed">
                    {dish.note}
                  </p>
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="text-right flex-shrink-0 ml-4">
              {dish.hasSizeVariants ? (
                <div>
                  <p className="text-[#ababab] text-xs mb-1">Price Range</p>
                  <p className="text-[#f6b100] font-bold text-lg">
                    {getPriceRange()}
                  </p>
                  <p className="text-[#f6b100] font-bold text-xl mt-1">
                    {formatVND(getCurrentPrice())}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[#f6b100] font-bold text-2xl">
                    {formatVND(getCurrentPrice())}
                  </p>
                </div>
              )}

              {getCurrentCost() > 0 && (
                <p className="text-[#ababab] text-xs mt-1">
                  Cost: {formatVND(getCurrentCost())}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Size Variants Section */}
      {dish.hasSizeVariants && dish.sizeVariants?.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#343434]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#f5f5f5] font-semibold text-sm">
              Available Sizes
            </h3>
            <span className="text-[#ababab] text-xs">
              Select your preferred size
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {dish.sizeVariants.map((variant, index) => {
              const isSelected = selectedVariant?.size === variant.size;
              const isDefault = variant.isDefault;

              return (
                <button
                  key={index}
                  onClick={() => handleVariantChange(variant)}
                  className={`relative p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                    isSelected
                      ? "bg-[#f6b100] text-[#1f1f1f] border-[#f6b100] shadow-lg transform scale-105"
                      : "bg-[#262626] text-[#f5f5f5] border-[#343434] hover:border-[#f6b100] hover:bg-[#343434]"
                  }`}
                >
                  {/* Default Badge */}
                  {isDefault && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1f1f1f]"></div>
                  )}

                  <div className="flex flex-col items-center">
                    <span className="font-bold mb-1">{variant.size}</span>
                    <span
                      className={`text-xs ${
                        isSelected ? "text-[#1f1f1f]" : "text-[#f6b100]"
                      } font-bold`}
                    >
                      {formatVND(variant.price)}
                    </span>
                    {variant.cost > 0 && (
                      <span
                        className={`text-xs mt-1 ${
                          isSelected ? "text-[#1f1f1f]/70" : "text-[#ababab]"
                        }`}
                      >
                        Cost: {formatVND(variant.cost)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Variant Info */}
          {selectedVariant && (
            <div className="mt-4 p-3 bg-[#262626] rounded-lg border border-[#343434]">
              <div className="flex items-center justify-between">
                <span className="text-[#ababab] text-sm">Selected:</span>
                <div className="text-right">
                  <span className="text-[#f5f5f5] font-semibold">
                    {selectedVariant.size}
                  </span>
                  <span className="text-[#f6b100] font-bold ml-2">
                    {formatVND(selectedVariant.price)}
                  </span>
                </div>
              </div>
              {selectedVariant.isDefault && (
                <p className="text-[#ababab] text-xs mt-1">
                  ✓ This is the default size for this dish
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end mt-4 items-center gap-2">
        {/* Recipe Button */}
        <button
          onClick={handleRecipe}
          className="p-2 rounded-lg bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 border border-purple-800 transition-colors duration-200"
          title="Manage recipe"
        >
          <MdMenuBook size={18} />
        </button>

        {/* Edit Button */}
        <button
          onClick={handleEditDish}
          className="p-2 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-800 transition-colors duration-200"
          title="Edit dish"
        >
          <MdEdit size={18} />
        </button>

        {/* Toggle Availability Button */}
        <button
          onClick={handleToggleAvailability}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            dish.isAvailable
              ? "bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-800"
              : "bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800"
          }`}
          title={dish.isAvailable ? "Disable dish" : "Enable dish"}
        >
          {dish.isAvailable ? (
            <MdToggleOn size={18} />
          ) : (
            <MdToggleOff size={18} />
          )}
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDeleteDish}
          className="p-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800 transition-colors duration-200"
          title="Delete dish"
        >
          <IoMdTrash size={18} />
        </button>
      </div>
    </div>
  );
};

Dish.propTypes = {
  dish: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    cost: PropTypes.number,
    image: PropTypes.string,
    note: PropTypes.string,
    hasSizeVariants: PropTypes.bool,
    isAvailable: PropTypes.bool,
    sizeVariants: PropTypes.arrayOf(
      PropTypes.shape({
        size: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        cost: PropTypes.number,
        isDefault: PropTypes.bool,
      })
    ),
  }).isRequired,
  onEdit: PropTypes.func,
  onRecipe: PropTypes.func,
};

export default Dish;
