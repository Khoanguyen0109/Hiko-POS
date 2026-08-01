import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { MdClose, MdAdd, MdDelete, MdCalculate } from "react-icons/md";
import Autocomplete from "../shared/Autocomplete";
import {
  buildRecipeStorageItemOptions,
  filterStorageItemOption,
  renderRecipeStorageItemOption,
} from "../storage/storageItemAutocompleteUtils";
import {
  saveToppingRecipe,
  fetchToppingRecipeByToppingId,
  clearCurrentToppingRecipe,
} from "../../redux/slices/toppingRecipeSlice";
import { fetchStorageItems } from "../../redux/slices/storageItemSlice";
import { fetchToppings } from "../../redux/slices/toppingSlice";
import { enqueueSnackbar } from "notistack";
import { formatVND } from "../../utils";
import {
  calculateRecipeLineCost,
  formatPackageLabel,
  getDefaultRecipeUnit,
  getRecipeTotalCost,
  getRecipeUnitOptions,
} from "../../utils/recipeCost";

const emptyLine = () => ({ storageItemId: "", quantity: 0, unit: "", notes: "" });

const processLines = (lines = []) =>
  lines.map((line) => ({
    storageItemId:
      typeof line.storageItemId === "object" ? line.storageItemId._id : line.storageItemId,
    quantity: line.quantity || 0,
    unit: line.unit || "",
    notes: line.notes || "",
  }));

const ToppingRecipeModal = ({ isOpen, onClose, topping, onSuccess }) => {
  const dispatch = useDispatch();
  const { items: storageItems } = useSelector((state) => state.storageItems);
  const { toppings } = useSelector((state) => state.toppings);
  const { currentRecipe, saving } = useSelector((state) => state.toppingRecipes);

  const [selectedTopping, setSelectedTopping] = useState(null);
  const [formData, setFormData] = useState({
    toppingId: "",
    ingredients: [emptyLine()],
    servings: 1,
    prepTime: 0,
    instructions: "",
    notes: "",
    otherCost: 0,
  });
  const [ingredientCost, setIngredientCost] = useState(0);

  const activeTopping = selectedTopping || topping;

  const storageItemOptions = useMemo(
    () => buildRecipeStorageItemOptions(storageItems, formatVND),
    [storageItems]
  );

  const renderStorageOption = useCallback(
    (option) => renderRecipeStorageItemOption(option, formatVND, formatPackageLabel),
    []
  );

  const calculateIngredientCost = useCallback(() => {
    let cost = 0;
    formData.ingredients.forEach((line) => {
      if (!line.storageItemId) return;
      const item = storageItems.find((entry) => entry._id === line.storageItemId);
      if (item) {
        cost += calculateRecipeLineCost(line.quantity, line.unit, item);
      }
    });
    setIngredientCost(cost);
  }, [formData.ingredients, storageItems]);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchStorageItems({ isActive: true, limit: 1000 }));
      if (!topping) {
        dispatch(fetchToppings({}));
      }
    }
    return () => {
      if (!isOpen) {
        dispatch(clearCurrentToppingRecipe());
      }
    };
  }, [isOpen, topping, dispatch]);

  useEffect(() => {
    if (topping && isOpen) {
      setSelectedTopping(topping);
      dispatch(clearCurrentToppingRecipe());
      dispatch(fetchToppingRecipeByToppingId(topping._id));
    } else if (!topping && isOpen) {
      setSelectedTopping(null);
      dispatch(clearCurrentToppingRecipe());
    }
  }, [topping, isOpen, dispatch]);

  useEffect(() => {
    if (!activeTopping || !isOpen) return;

    const recipeToppingId = currentRecipe?.toppingId
      ? typeof currentRecipe.toppingId === "object"
        ? currentRecipe.toppingId._id
        : currentRecipe.toppingId
      : null;

    if (currentRecipe && recipeToppingId === activeTopping._id) {
      setFormData({
        toppingId: recipeToppingId,
        ingredients: processLines(currentRecipe.ingredients),
        servings: currentRecipe.servings || 1,
        prepTime: currentRecipe.prepTime || 0,
        instructions: currentRecipe.instructions || "",
        notes: currentRecipe.notes || "",
        otherCost: currentRecipe.otherCost || 0,
      });
      setIngredientCost(currentRecipe.totalIngredientCost || 0);
      return;
    }

    if (currentRecipe === null) {
      setFormData({
        toppingId: activeTopping._id,
        ingredients: [emptyLine()],
        servings: 1,
        prepTime: 0,
        instructions: "",
        notes: "",
        otherCost: 0,
      });
      setIngredientCost(0);
    }
  }, [currentRecipe, activeTopping, isOpen]);

  useEffect(() => {
    calculateIngredientCost();
  }, [calculateIngredientCost]);

  const totalCost = getRecipeTotalCost(ingredientCost, formData.otherCost);

  const handleToppingSelect = (toppingId) => {
    const selected = toppings.find((entry) => entry._id === toppingId);
    if (selected) {
      setSelectedTopping(selected);
      dispatch(clearCurrentToppingRecipe());
      dispatch(fetchToppingRecipeByToppingId(toppingId));
    }
  };

  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, emptyLine()],
    }));
  };

  const removeIngredient = (index) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const updateIngredient = (index, field, value) => {
    setFormData((prev) => {
      const ingredients = [...prev.ingredients];
      ingredients[index] = { ...ingredients[index], [field]: value };
      if (field === "storageItemId" && value) {
        const item = storageItems.find((entry) => entry._id === value);
        if (item) {
          ingredients[index].unit = getDefaultRecipeUnit(item);
        }
      }
      return { ...prev, ingredients };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasIngredients = formData.ingredients.some(
      (line) => line.storageItemId && line.quantity > 0
    );

    if (!hasIngredients) {
      enqueueSnackbar("Please add at least one storage item with quantity", { variant: "warning" });
      return;
    }

    try {
      await dispatch(saveToppingRecipe(formData)).unwrap();
      enqueueSnackbar("Topping recipe saved and cost updated", { variant: "success" });
      onSuccess?.();
      onClose();
    } catch (error) {
      enqueueSnackbar(error || "Failed to save topping recipe", { variant: "error" });
    }
  };

  const renderIngredientRow = (line, index) => {
    const selectedItem = storageItems.find((entry) => entry._id === line.storageItemId);
    const unitOptions = selectedItem ? getRecipeUnitOptions(selectedItem) : ["ml", "g", "piece"];
    const lineCost = calculateRecipeLineCost(line.quantity, line.unit, selectedItem);
    const packageLabel = selectedItem ? formatPackageLabel(selectedItem) : null;

    return (
      <div key={index} className="grid grid-cols-12 gap-2 items-start bg-[#1a1a1a] p-3 rounded-lg">
        <div className="col-span-12 sm:col-span-5">
          <Autocomplete
            name={`storageItemId-${index}`}
            value={line.storageItemId}
            onChange={(e) => updateIngredient(index, "storageItemId", e.target.value)}
            options={storageItemOptions}
            placeholder="Search storage item by name or code..."
            filterOption={filterStorageItemOption}
            renderOption={renderStorageOption}
            required
            noOptionsText="No storage items found"
          />
          {packageLabel && (
            <p className="text-[#ababab] text-xs mt-1">{packageLabel}</p>
          )}
        </div>
        <div className="col-span-4 sm:col-span-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={line.quantity || ""}
            onChange={(e) =>
              updateIngredient(index, "quantity", parseFloat(e.target.value) || 0)
            }
            placeholder="Qty"
            className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <div className="col-span-4 sm:col-span-2">
          <select
            value={line.unit}
            onChange={(e) => updateIngredient(index, "unit", e.target.value)}
            className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-brand"
          >
            {unitOptions.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-3 sm:col-span-2 text-right">
          <p className="text-[#ababab] text-xs">Line cost</p>
          <p className="text-brand font-semibold text-sm">{formatVND(lineCost)}</p>
        </div>
        <div className="col-span-1 flex justify-end">
          <button
            type="button"
            onClick={() => removeIngredient(index)}
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
            <h2 className="text-[#f5f5f5] text-xl font-bold">Topping Recipe & Cost</h2>
            {activeTopping && (
              <p className="text-[#ababab] text-sm mt-1">{activeTopping.name}</p>
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
          {!topping && (
            <div>
              <label className="block text-[#ababab] text-sm mb-2">
                Select Topping <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTopping?._id || ""}
                onChange={(e) => handleToppingSelect(e.target.value)}
                required
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-brand"
              >
                <option value="">Choose a topping...</option>
                {toppings.map((entry) => (
                  <option key={entry._id} value={entry._id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!activeTopping && !topping && (
            <div className="text-center py-8">
              <p className="text-[#ababab]">Please select a topping to continue</p>
            </div>
          )}

          {activeTopping && (
            <>
              <div>
                <h3 className="text-[#f5f5f5] font-semibold mb-3">Storage items</h3>
                <div className="space-y-2">
                  {formData.ingredients.map((line, index) => renderIngredientRow(line, index))}
                </div>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="mt-3 flex items-center gap-2 text-brand hover:opacity-80 text-sm font-medium"
                >
                  <MdAdd /> Add storage item
                </button>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Other cost (cup, labor, packaging, etc.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.otherCost || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      otherCost: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  className="w-full max-w-xs bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#ababab] text-sm mb-2">Servings per batch</label>
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

              <div className="bg-brand/10 border border-brand/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#ababab] text-sm">Storage items</span>
                  <span className="text-[#f5f5f5] font-medium">{formatVND(ingredientCost)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[#ababab] text-sm">Other cost</span>
                  <span className="text-[#f5f5f5] font-medium">{formatVND(formData.otherCost || 0)}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand/20">
                  <div className="flex items-center gap-2">
                    <MdCalculate className="text-brand" size={24} />
                    <span className="text-[#f5f5f5] font-semibold">Total recipe cost</span>
                  </div>
                  <span className="text-brand text-2xl font-bold">{formatVND(totalCost)}</span>
                </div>
                {formData.servings > 1 && (
                  <p className="text-[#ababab] text-sm mt-2 text-right">
                    Cost per serving: {formatVND(totalCost / formData.servings)}
                  </p>
                )}
                {activeTopping?.price > 0 && (
                  <p className="text-[#ababab] text-sm mt-2 text-right">
                    Food cost: {((totalCost / activeTopping.price) * 100).toFixed(1)}% of selling price
                  </p>
                )}
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

ToppingRecipeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  topping: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default ToppingRecipeModal;
