import PropTypes from "prop-types";
import { useState } from "react";
import { IoMdPricetag, IoMdTrash } from "react-icons/io";
import { MdOutlineInventory, MdToggleOn, MdToggleOff, MdEdit, MdMenuBook } from "react-icons/md";
import {
  useDeleteDishMutation,
  useToggleDishAvailabilityMutation,
} from "../../redux/api/endpoints/catalogEndpoints";
import { enqueueSnackbar } from "notistack";
import biryani from "../../assets/images/hyderabadibiryani.jpg";
import { formatPriceK, formatVND } from "../../utils";

const Dish = ({ dish, onEdit, onRecipe }) => {
  const [deleteDish] = useDeleteDishMutation();
  const [toggleDishAvailability] = useToggleDishAvailabilityMutation();
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
        await deleteDish(dish._id).unwrap();
        enqueueSnackbar("Dish deleted successfully!", { variant: "success" });
      } catch (error) {
        enqueueSnackbar(
          error?.data || error || "Failed to delete dish",
          { variant: "error" }
        );
      }
    }
  };

  const handleEditDish = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(dish);
    }
  };


  const handleRecipeDish = (e) => {
    e.stopPropagation();
    if (onRecipe) {
      onRecipe(dish);
    }
  };

  const handleToggleAvailability = async (e) => {
    e.stopPropagation();

    try {
      const result = await toggleDishAvailability(dish._id).unwrap();
      const newStatus = result.isAvailable;
      enqueueSnackbar(
        `Dish ${newStatus ? "enabled" : "disabled"} successfully!`,
        { variant: "success" }
      );
    } catch (error) {
      enqueueSnackbar(
        error?.data || error || "Failed to toggle availability",
        { variant: "error" }
      );
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

  return (
    <div className="flex h-full min-w-0 flex-col rounded-[20px] border border-[#3a3a3a] bg-[#1f1f1f] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-colors duration-200 hover:border-[#4a4a4a] hover:bg-[#252525]">
      <div className="flex items-start gap-3">
        <img
          src={dish.image || biryani}
          alt={dish.name}
          className="h-12 w-12 shrink-0 rounded-xl border-2 border-[#343434] object-cover"
        />

        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-base font-bold tracking-wide text-[#f5f5f5]">
            {dish.name}
          </h2>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {!dish.isAvailable && (
              <span className="inline-flex items-center rounded-full border border-red-800 bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-400">
                <MdOutlineInventory size={12} className="mr-1" />
                Unavailable
              </span>
            )}

            {dish.hasSizeVariants && (
              <span className="inline-flex items-center rounded-full border border-blue-800 bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-400">
                <IoMdPricetag size={12} className="mr-1" />
                {dish.sizeVariants?.length} sizes
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 min-w-0">
        <p className="truncate text-lg font-bold text-brand">
          {formatVND(getCurrentPrice())}
        </p>
        {getCurrentCost() > 0 && (
          <p className="mt-0.5 text-xs text-[#ababab]">
            Cost: {formatVND(getCurrentCost())}
          </p>
        )}
      </div>

      {dish.note && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#ababab]">
          {dish.note}
        </p>
      )}

      {dish.hasSizeVariants && dish.sizeVariants?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {dish.sizeVariants.map((variant, index) => {
            const isSelected = selectedVariant?.size === variant.size;

            return (
              <button
                key={`${variant.size}-${index}`}
                type="button"
                onClick={() => handleVariantChange(variant)}
                className={`relative rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-brand bg-brand text-[#f5f5f5]"
                    : "border-[#343434] bg-[#262626] text-[#f5f5f5] hover:border-brand"
                }`}
              >
                {variant.isDefault && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[#1f1f1f] bg-green-500" />
                )}
                {variant.size}{" "}
                <span className={isSelected ? "text-[#f5f5f5]" : "text-brand"}>
                  {formatPriceK(variant.price)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-4">
        <button
          onClick={handleRecipeDish}
          className="p-2 rounded-lg bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 border border-amber-800 transition-colors duration-200"
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
