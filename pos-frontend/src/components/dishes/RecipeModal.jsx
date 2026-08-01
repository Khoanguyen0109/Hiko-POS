import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { MdClose, MdAdd, MdDelete, MdCalculate } from "react-icons/md";
import { saveRecipe, fetchRecipeByDishId, clearCurrentRecipe } from "../../redux/slices/recipeSlice";
import { fetchStorageItems } from "../../redux/slices/storageItemSlice";
import { fetchDishes } from "../../redux/slices/dishSlice";
import { enqueueSnackbar } from "notistack";
import { formatVND } from "../../utils";

const emptyLine = () => ({ storageItemId: "", quantity: 0, unit: "", notes: "" });

const processLines = (lines = []) =>
  lines.map((line) => ({
    storageItemId:
      typeof line.storageItemId === "object" ? line.storageItemId._id : line.storageItemId,
    quantity: line.quantity || 0,
    unit: line.unit || "",
    notes: line.notes || "",
  }));

const RecipeModal = ({ isOpen, onClose, dish, onSuccess }) => {
  const dispatch = useDispatch();
  const { items: storageItems } = useSelector((state) => state.storageItems);
  const { items: dishes } = useSelector((state) => state.dishes);
  const { currentRecipe, saving } = useSelector((state) => state.recipes);

  const [selectedDish, setSelectedDish] = useState(null);
  const [formData, setFormData] = useState({
    dishId: "",
    ingredients: [],
    sizeVariantRecipes: [],
    servings: 1,
    prepTime: 0,
    instructions: "",
    notes: "",
  });
  const [totalCost, setTotalCost] = useState(0);
  const [useVariants, setUseVariants] = useState(false);

  const activeDish = selectedDish || dish;

  const calculateTotalCost = useCallback(() => {
    let cost = 0;
    const lines = useVariants
      ? formData.sizeVariantRecipes.flatMap((variant) => variant.ingredients)
      : formData.ingredients;

    lines.forEach((line) => {
      if (!line.storageItemId) return;
      const item = storageItems.find((entry) => entry._id === line.storageItemId);
      if (item && line.unit === item.unit) {
        cost += line.quantity * (item.averageCost || 0);
      }
    });

    setTotalCost(cost);
  }, [formData.ingredients, formData.sizeVariantRecipes, storageItems, useVariants]);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchStorageItems({ isActive: true, limit: 1000 }));
      if (!dish) {
        dispatch(fetchDishes());
      }
    }
    return () => {
      if (!isOpen) {
        dispatch(clearCurrentRecipe());
      }
    };
  }, [isOpen, dish, dispatch]);

  useEffect(() => {
    if (dish && isOpen) {
      setSelectedDish(dish);
      dispatch(clearCurrentRecipe());
      dispatch(fetchRecipeByDishId(dish._id));
      setUseVariants(Boolean(dish.hasSizeVariants && dish.sizeVariants?.length > 0));
    } else if (!dish && isOpen) {
      setSelectedDish(null);
      dispatch(clearCurrentRecipe());
    }
  }, [dish, isOpen, dispatch]);

  useEffect(() => {
    if (!activeDish || !isOpen) return;

    const recipeDishId = currentRecipe?.dishId
      ? typeof currentRecipe.dishId === "object"
        ? currentRecipe.dishId._id
        : currentRecipe.dishId
      : null;

    if (currentRecipe && recipeDishId === activeDish._id) {
      setFormData({
        dishId: recipeDishId,
        ingredients: processLines(currentRecipe.ingredients),
        sizeVariantRecipes: (currentRecipe.sizeVariantRecipes || []).map((variant) => ({
          size: variant.size,
          totalIngredientCost: variant.totalIngredientCost || 0,
          ingredients: processLines(variant.ingredients),
        })),
        servings: currentRecipe.servings || 1,
        prepTime: currentRecipe.prepTime || 0,
        instructions: currentRecipe.instructions || "",
        notes: currentRecipe.notes || "",
      });
      setTotalCost(currentRecipe.totalIngredientCost || 0);
      setUseVariants(
        (currentRecipe.sizeVariantRecipes?.length > 0) ||
          (activeDish.hasSizeVariants && activeDish.sizeVariants?.length > 0)
      );
      return;
    }

    if (currentRecipe === null) {
      const hasVariants = activeDish.hasSizeVariants && activeDish.sizeVariants?.length > 0;
      setFormData({
        dishId: activeDish._id,
        ingredients: hasVariants ? [] : [emptyLine()],
        sizeVariantRecipes: hasVariants
          ? activeDish.sizeVariants.map((variant) => ({
              size: variant.size,
              ingredients: [emptyLine()],
              totalIngredientCost: 0,
            }))
          : [],
        servings: 1,
        prepTime: 0,
        instructions: "",
        notes: "",
      });
      setTotalCost(0);
      setUseVariants(hasVariants);
    }
  }, [currentRecipe, activeDish, isOpen]);

  useEffect(() => {
    calculateTotalCost();
  }, [calculateTotalCost]);

  const handleDishSelect = (dishId) => {
    const selected = dishes.find((entry) => entry._id === dishId);
    if (selected) {
      setSelectedDish(selected);
      dispatch(clearCurrentRecipe());
      dispatch(fetchRecipeByDishId(dishId));
      setUseVariants(Boolean(selected.hasSizeVariants && selected.sizeVariants?.length > 0));
    }
  };

  const addIngredient = (variantIndex = null) => {
    if (variantIndex !== null) {
      setFormData((prev) => {
        const sizeVariantRecipes = [...prev.sizeVariantRecipes];
        sizeVariantRecipes[variantIndex].ingredients.push(emptyLine());
        return { ...prev, sizeVariantRecipes };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, emptyLine()],
      }));
    }
  };

  const removeIngredient = (index, variantIndex = null) => {
    if (variantIndex !== null) {
      setFormData((prev) => {
        const sizeVariantRecipes = [...prev.sizeVariantRecipes];
        sizeVariantRecipes[variantIndex].ingredients =
          sizeVariantRecipes[variantIndex].ingredients.filter((_, i) => i !== index);
        return { ...prev, sizeVariantRecipes };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index),
      }));
    }
  };

  const updateIngredient = (index, field, value, variantIndex = null) => {
    if (variantIndex !== null) {
      setFormData((prev) => {
        const sizeVariantRecipes = [...prev.sizeVariantRecipes];
        sizeVariantRecipes[variantIndex].ingredients[index] = {
          ...sizeVariantRecipes[variantIndex].ingredients[index],
          [field]: value,
        };
        if (field === "storageItemId" && value) {
          const item = storageItems.find((entry) => entry._id === value);
          if (item) {
            sizeVariantRecipes[variantIndex].ingredients[index].unit = item.unit;
          }
        }
        return { ...prev, sizeVariantRecipes };
      });
    } else {
      setFormData((prev) => {
        const ingredients = [...prev.ingredients];
        ingredients[index] = { ...ingredients[index], [field]: value };
        if (field === "storageItemId" && value) {
          const item = storageItems.find((entry) => entry._id === value);
          if (item) {
            ingredients[index].unit = item.unit;
          }
        }
        return { ...prev, ingredients };
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasIngredients = useVariants
      ? formData.sizeVariantRecipes.some((variant) =>
          variant.ingredients.some((line) => line.storageItemId && line.quantity > 0)
        )
      : formData.ingredients.some((line) => line.storageItemId && line.quantity > 0);

    if (!hasIngredients) {
      enqueueSnackbar("Please add at least one storage item with quantity", { variant: "warning" });
      return;
    }

    try {
      await dispatch(saveRecipe(formData)).unwrap();
      enqueueSnackbar("Recipe saved and dish cost updated", { variant: "success" });
      onSuccess?.();
      onClose();
    } catch (error) {
      enqueueSnackbar(error || "Failed to save recipe", { variant: "error" });
    }
  };

  const renderIngredientRow = (line, index, variantIndex = null) => {
    const selectedItem = storageItems.find((entry) => entry._id === line.storageItemId);
    const unitCost = selectedItem?.averageCost || 0;
    const lineCost = line.unit === selectedItem?.unit ? line.quantity * unitCost : 0;

    return (
      <div key={index} className="grid grid-cols-12 gap-2 items-start bg-[#1a1a1a] p-3 rounded-lg">
        <div className="col-span-12 sm:col-span-5">
          <select
            value={line.storageItemId}
            onChange={(e) => updateIngredient(index, "storageItemId", e.target.value, variantIndex)}
            required
            className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-brand"
          >
            <option value="">Select storage item</option>
            {storageItems.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} ({item.code}) - {formatVND(item.averageCost || 0)}/{item.unit}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-4 sm:col-span-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={line.quantity || ""}
            onChange={(e) =>
              updateIngredient(index, "quantity", parseFloat(e.target.value) || 0, variantIndex)
            }
            placeholder="Qty"
            className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <div className="col-span-4 sm:col-span-2">
          <input
            type="text"
            value={line.unit}
            onChange={(e) => updateIngredient(index, "unit", e.target.value, variantIndex)}
            placeholder="Unit"
            className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <div className="col-span-3 sm:col-span-2 text-right">
          <p className="text-[#ababab] text-xs">Line cost</p>
          <p className="text-brand font-semibold text-sm">{formatVND(lineCost)}</p>
        </div>
        <div className="col-span-1 flex justify-end">
          <button
            type="button"
            onClick={() => removeIngredient(index, variantIndex)}
            className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg"
            title="Remove line"
          >
            <MdDelete size={18} />
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#1f1f1f] border border-[#343434] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#343434] bg-[#1f1f1f]">
          <div>
            <h2 className="text-[#f5f5f5] text-xl font-bold">Recipe & Cost</h2>
            {activeDish && (
              <p className="text-[#ababab] text-sm mt-1">{activeDish.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!dish && (
            <div>
              <label className="block text-[#ababab] text-sm mb-2">
                Select Dish <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDish?._id || ""}
                onChange={(e) => handleDishSelect(e.target.value)}
                required
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-brand"
              >
                <option value="">Choose a dish...</option>
                {dishes.map((entry) => (
                  <option key={entry._id} value={entry._id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!activeDish && !dish && (
            <div className="text-center py-8">
              <p className="text-[#ababab]">Please select a dish to continue</p>
            </div>
          )}

          {activeDish && useVariants && (
            <div className="bg-[#262626] border border-[#343434] rounded-lg p-4">
              <p className="text-[#f5f5f5] text-sm">
                This dish has size variants. Define storage items for each size separately.
              </p>
            </div>
          )}

          {activeDish && (useVariants ? (
            <div className="space-y-6">
              {formData.sizeVariantRecipes.map((variant, variantIndex) => (
                <div key={variant.size} className="bg-[#262626] rounded-lg p-4 border border-[#343434]">
                  <h3 className="text-[#f5f5f5] font-semibold text-lg mb-4">{variant.size} Size</h3>
                  <div className="space-y-2">
                    {variant.ingredients.map((line, index) =>
                      renderIngredientRow(line, index, variantIndex)
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addIngredient(variantIndex)}
                    className="mt-3 flex items-center gap-2 text-brand hover:opacity-80 text-sm font-medium"
                  >
                    <MdAdd /> Add storage item
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h3 className="text-[#f5f5f5] font-semibold mb-3">Storage items</h3>
              <div className="space-y-2">
                {formData.ingredients.map((line, index) => renderIngredientRow(line, index))}
              </div>
              <button
                type="button"
                onClick={() => addIngredient()}
                className="mt-3 flex items-center gap-2 text-brand hover:opacity-80 text-sm font-medium"
              >
                <MdAdd /> Add storage item
              </button>
            </div>
          ))}

          {activeDish && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#ababab] text-sm mb-2">Servings</label>
                  <input
                    type="number"
                    value={formData.servings}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        servings: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    min="1"
                    className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[#ababab] text-sm mb-2">Prep time (minutes)</label>
                  <input
                    type="number"
                    value={formData.prepTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prepTime: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    min="0"
                    className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">Preparation steps</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, instructions: e.target.value }))
                  }
                  rows={3}
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-brand"
                  placeholder="Step-by-step preparation..."
                />
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-brand"
                />
              </div>

              <div className="bg-brand/10 border border-brand/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MdCalculate className="text-brand" size={24} />
                    <span className="text-[#f5f5f5] font-semibold">Estimated ingredient cost</span>
                  </div>
                  <span className="text-brand text-2xl font-bold">{formatVND(totalCost)}</span>
                </div>
                {formData.servings > 1 && (
                  <p className="text-[#ababab] text-sm mt-2 text-right">
                    Cost per serving: {formatVND(totalCost / formData.servings)}
                  </p>
                )}
                <p className="text-[#ababab] text-xs mt-2">
                  Final cost is calculated on save using storage item average costs and unit conversion.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#343434]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-[#262626] text-[#f5f5f5] rounded-lg hover:bg-[#343434] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-brand text-[#1f1f1f] rounded-lg hover:opacity-90 transition-colors font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save recipe"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

RecipeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dish: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default RecipeModal;
