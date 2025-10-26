import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { MdClose, MdAdd, MdDelete, MdSave, MdCalculate } from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import { fetchIngredients } from "../../redux/slices/ingredientSlice";
import {
  saveToppingRecipe,
  fetchToppingRecipeByToppingId,
  clearCurrentRecipe,
} from "../../redux/slices/toppingRecipeSlice";
import { formatVND } from "../../utils";

const ToppingRecipeModal = ({ isOpen, onClose, topping, onSuccess }) => {
  const dispatch = useDispatch();
  const { items: ingredients } = useSelector((state) => state.ingredients);
  const { items: toppings } = useSelector((state) => state.toppings);
  const { currentRecipe, loading } = useSelector((state) => state.toppingRecipes);

  const [selectedTopping, setSelectedTopping] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [yieldAmount, setYieldAmount] = useState(1);
  const [yieldUnit, setYieldUnit] = useState("serving");
  const [preparationTime, setPreparationTime] = useState(0);
  const [preparationNotes, setPreparationNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Active topping - either from prop or selected
  const activeToppingId = topping?._id || selectedTopping?._id;
  const activeTopping = topping || selectedTopping;

  // Load ingredients on mount
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchIngredients());
    }
  }, [isOpen, dispatch]);

  // Handle topping prop change
  useEffect(() => {
    if (topping) {
      setSelectedTopping(topping);
    } else {
      setSelectedTopping(null);
    }
  }, [topping]);

  // Fetch recipe when topping is selected
  useEffect(() => {
    if (activeToppingId && isOpen) {
      dispatch(fetchToppingRecipeByToppingId(activeToppingId));
    } else {
      dispatch(clearCurrentRecipe());
    }
  }, [activeToppingId, isOpen, dispatch]);

  // Populate form when recipe is loaded
  useEffect(() => {
    if (currentRecipe) {
      setRecipeIngredients(
        currentRecipe.ingredients.map((ing) => ({
          ingredientId: ing.ingredientId._id,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes || "",
          _ingredientData: ing.ingredientId,
        }))
      );
      setYieldAmount(currentRecipe.yield?.amount || 1);
      setYieldUnit(currentRecipe.yield?.unit || "serving");
      setPreparationTime(currentRecipe.preparationTime || 0);
      setPreparationNotes(currentRecipe.preparationNotes || "");
      setIsActive(currentRecipe.isActive !== undefined ? currentRecipe.isActive : true);
    } else {
      setRecipeIngredients([]);
      setYieldAmount(1);
      setYieldUnit("serving");
      setPreparationTime(0);
      setPreparationNotes("");
      setIsActive(true);
    }
  }, [currentRecipe]);

  // Calculate total cost
  const calculatedCost = useMemo(() => {
    let total = 0;
    recipeIngredients.forEach((ri) => {
      const ing = ingredients.find((i) => i._id === ri.ingredientId);
      if (ing && ing.costs?.averageCost) {
        total += ri.quantity * ing.costs.averageCost;
      }
    });
    return total;
  }, [recipeIngredients, ingredients]);

  const costPerServing = useMemo(() => {
    const yield_ = yieldAmount || 1;
    return calculatedCost / yield_;
  }, [calculatedCost, yieldAmount]);

  // Handle topping selection
  const handleToppingSelect = (toppingId) => {
    const selected = toppings.find((t) => t._id === toppingId);
    setSelectedTopping(selected);
  };

  // Add ingredient row
  const handleAddIngredient = () => {
    setRecipeIngredients([
      ...recipeIngredients,
      { ingredientId: "", quantity: 0, unit: "g", notes: "" },
    ]);
  };

  // Remove ingredient row
  const handleRemoveIngredient = (index) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  // Update ingredient row
  const handleIngredientChange = (index, field, value) => {
    const updated = [...recipeIngredients];
    updated[index][field] = value;
    setRecipeIngredients(updated);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!activeToppingId) {
      enqueueSnackbar("Please select a topping", { variant: "error" });
      return;
    }

    if (recipeIngredients.length === 0) {
      enqueueSnackbar("Please add at least one ingredient", { variant: "error" });
      return;
    }

    // Validate all ingredients are selected
    const hasEmptyIngredients = recipeIngredients.some((ri) => !ri.ingredientId);
    if (hasEmptyIngredients) {
      enqueueSnackbar("Please select ingredients for all rows", { variant: "error" });
      return;
    }

    const payload = {
      toppingId: activeToppingId,
      ingredients: recipeIngredients.map((ri) => ({
        ingredientId: ri.ingredientId,
        quantity: parseFloat(ri.quantity),
        unit: ri.unit,
        notes: ri.notes,
      })),
      yield: {
        amount: parseFloat(yieldAmount),
        unit: yieldUnit,
      },
      preparationTime: parseInt(preparationTime, 10),
      preparationNotes,
      isActive,
    };

    try {
      await dispatch(saveToppingRecipe(payload)).unwrap();
      enqueueSnackbar("Topping recipe saved successfully!", { variant: "success" });
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      enqueueSnackbar(error || "Failed to save topping recipe", { variant: "error" });
    }
  };

  const handleClose = () => {
    dispatch(clearCurrentRecipe());
    setRecipeIngredients([]);
    setYieldAmount(1);
    setYieldUnit("serving");
    setPreparationTime(0);
    setPreparationNotes("");
    setIsActive(true);
    if (!topping) setSelectedTopping(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#1e1e1e] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-[#343434]">
        {/* Header */}
        <div className="sticky top-0 bg-[#1e1e1e] border-b border-[#343434] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-[#f5f5f5]">
            {currentRecipe ? "Edit Topping Recipe" : "Create Topping Recipe"}
          </h2>
          <button
            onClick={handleClose}
            className="text-[#ababab] hover:text-[#f5f5f5]"
          >
            <MdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Topping Selector (if no topping prop) */}
          {!topping && (
            <div className="mb-6">
              <label className="block text-[#ababab] text-sm mb-2">
                Select Topping <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTopping?._id || ""}
                onChange={(e) => handleToppingSelect(e.target.value)}
                required
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
              >
                <option value="">Choose a topping...</option>
                {toppings.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} - {formatVND(t.price)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show message if no topping selected */}
          {!activeToppingId && !topping && (
            <div className="text-center py-8">
              <p className="text-[#ababab]">Please select a topping to continue</p>
            </div>
          )}

          {/* Recipe Form (only if topping is selected) */}
          {activeToppingId && (
            <>
              {/* Topping Info Display */}
              {activeTopping && (
                <div className="mb-6 p-4 bg-[#262626] rounded-lg border border-[#343434]">
                  <h3 className="text-[#f5f5f5] font-semibold mb-2">
                    {activeTopping.name}
                  </h3>
                  <p className="text-[#ababab] text-sm">
                    Price: {formatVND(activeTopping.price)} | Current Cost:{" "}
                    {formatVND(activeTopping.cost || 0)}
                  </p>
                </div>
              )}

              {/* Ingredients */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[#ababab] text-sm">
                    Ingredients <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="flex items-center gap-2 px-3 py-1 bg-[#f6b100] text-[#1e1e1e] rounded-lg hover:bg-[#f6b100]/90"
                  >
                    <MdAdd size={18} />
                    <span className="text-sm">Add Ingredient</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {recipeIngredients.map((ri, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row gap-2 p-3 bg-[#262626] rounded-lg border border-[#343434]"
                    >
                      {/* Ingredient Select */}
                      <select
                        value={ri.ingredientId}
                        onChange={(e) =>
                          handleIngredientChange(index, "ingredientId", e.target.value)
                        }
                        required
                        className="flex-1 bg-[#1e1e1e] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                      >
                        <option value="">Select ingredient...</option>
                        {ingredients.map((ing) => (
                          <option key={ing._id} value={ing._id}>
                            {ing.name} ({ing.unit}) - {formatVND(ing.costs?.averageCost || 0)}
                          </option>
                        ))}
                      </select>

                      {/* Quantity */}
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={ri.quantity}
                        onChange={(e) =>
                          handleIngredientChange(index, "quantity", e.target.value)
                        }
                        placeholder="Quantity"
                        required
                        className="w-24 bg-[#1e1e1e] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                      />

                      {/* Unit */}
                      <input
                        type="text"
                        value={ri.unit}
                        onChange={(e) =>
                          handleIngredientChange(index, "unit", e.target.value)
                        }
                        placeholder="Unit"
                        required
                        className="w-20 bg-[#1e1e1e] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                      />

                      {/* Notes */}
                      <input
                        type="text"
                        value={ri.notes}
                        onChange={(e) =>
                          handleIngredientChange(index, "notes", e.target.value)
                        }
                        placeholder="Notes (optional)"
                        className="flex-1 bg-[#1e1e1e] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                      />

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50"
                      >
                        <MdDelete size={20} />
                      </button>
                    </div>
                  ))}

                  {recipeIngredients.length === 0 && (
                    <p className="text-[#ababab] text-center py-4">
                      No ingredients added yet. Click "Add Ingredient" to start.
                    </p>
                  )}
                </div>
              </div>

              {/* Cost Calculation Display */}
              {recipeIngredients.length > 0 && (
                <div className="mb-6 p-4 bg-[#262626] rounded-lg border border-[#343434]">
                  <div className="flex items-center gap-2 mb-2">
                    <MdCalculate className="text-[#f6b100]" size={20} />
                    <h3 className="text-[#f5f5f5] font-semibold">Cost Breakdown</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-[#ababab]">
                      Total Ingredient Cost:{" "}
                      <span className="text-[#f5f5f5] font-semibold">
                        {formatVND(calculatedCost)}
                      </span>
                    </p>
                    <p className="text-[#ababab]">
                      Cost per Serving:{" "}
                      <span className="text-[#f6b100] font-semibold">
                        {formatVND(costPerServing)}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Yield */}
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#ababab] text-sm mb-2">
                    Yield Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={yieldAmount}
                    onChange={(e) => setYieldAmount(e.target.value)}
                    required
                    className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                  />
                </div>
                <div>
                  <label className="block text-[#ababab] text-sm mb-2">
                    Yield Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    required
                    placeholder="e.g., serving, ml, g"
                    className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                  />
                </div>
              </div>

              {/* Preparation Time */}
              <div className="mb-6">
                <label className="block text-[#ababab] text-sm mb-2">
                  Preparation Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={preparationTime}
                  onChange={(e) => setPreparationTime(e.target.value)}
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                />
              </div>

              {/* Preparation Notes */}
              <div className="mb-6">
                <label className="block text-[#ababab] text-sm mb-2">
                  Preparation Notes
                </label>
                <textarea
                  value={preparationNotes}
                  onChange={(e) => setPreparationNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional preparation instructions..."
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100] resize-none"
                />
              </div>

              {/* Active Status */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 accent-[#f6b100]"
                  />
                  <span className="text-[#f5f5f5]">Active Recipe</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 bg-[#262626] text-[#f5f5f5] rounded-lg hover:bg-[#343434]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-[#f6b100] text-[#1e1e1e] rounded-lg hover:bg-[#f6b100]/90 disabled:opacity-50"
                >
                  <MdSave size={18} />
                  {loading ? "Saving..." : "Save Recipe"}
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

