import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { MdClose, MdAdd, MdDelete, MdCalculate } from "react-icons/md";
import { saveRecipe, fetchRecipeByDishId } from "../../redux/slices/recipeSlice";
import { fetchIngredients } from "../../redux/slices/ingredientSlice";
import { enqueueSnackbar } from "notistack";
import { formatVND } from "../../utils";

const RecipeModal = ({ isOpen, onClose, dish, onSuccess }) => {
  const dispatch = useDispatch();
  const { items: ingredients } = useSelector((state) => state.ingredients);
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
    notes: ""
  });

  const [totalCost, setTotalCost] = useState(0);
  const [useVariants, setUseVariants] = useState(false);

  useEffect(() => {
    if (isOpen && ingredients.length === 0) {
      dispatch(fetchIngredients({ limit: 1000, isActive: true }));
    }
  }, [isOpen, ingredients.length, dispatch]);

  useEffect(() => {
    if (dish && isOpen) {
      setSelectedDish(dish);
      // Load existing recipe if available
      dispatch(fetchRecipeByDishId(dish._id));
      
      // Check if dish has size variants
      const hasVariants = dish.hasSizeVariants && dish.sizeVariants && dish.sizeVariants.length > 0;
      setUseVariants(hasVariants);
    } else if (!dish && isOpen) {
      // No dish pre-selected, user will choose
      setSelectedDish(null);
    }
  }, [dish, isOpen, dispatch]);

  const handleDishSelect = (dishId) => {
    const selected = dishes.find(d => d._id === dishId);
    if (selected) {
      setSelectedDish(selected);
      dispatch(fetchRecipeByDishId(dishId));
      const hasVariants = selected.hasSizeVariants && selected.sizeVariants && selected.sizeVariants.length > 0;
      setUseVariants(hasVariants);
    }
  };

  useEffect(() => {
    const activeDish = selectedDish || dish;
    
    // Get dish ID from currentRecipe (handle both string and populated object)
    const recipeDishId = currentRecipe?.dishId 
      ? (typeof currentRecipe.dishId === 'object' ? currentRecipe.dishId._id : currentRecipe.dishId)
      : null;
    
    if (currentRecipe && activeDish && recipeDishId === activeDish._id) {
      // Populate form with existing recipe
      const dishIdValue = typeof currentRecipe.dishId === 'object' ? currentRecipe.dishId._id : currentRecipe.dishId;
      
      // Process ingredients - extract ID from populated objects
      const processedIngredients = (currentRecipe.ingredients || []).map(ing => ({
        ingredientId: typeof ing.ingredientId === 'object' ? ing.ingredientId._id : ing.ingredientId,
        quantity: ing.quantity || 0,
        unit: ing.unit || '',
        notes: ing.notes || ''
      }));
      
      // Process size variant recipes - extract ID from populated objects
      const processedSizeVariants = (currentRecipe.sizeVariantRecipes || []).map(variant => ({
        size: variant.size,
        totalIngredientCost: variant.totalIngredientCost || 0,
        ingredients: (variant.ingredients || []).map(ing => ({
          ingredientId: typeof ing.ingredientId === 'object' ? ing.ingredientId._id : ing.ingredientId,
          quantity: ing.quantity || 0,
          unit: ing.unit || '',
          notes: ing.notes || ''
        }))
      }));
      
      setFormData({
        dishId: dishIdValue,
        ingredients: processedIngredients,
        sizeVariantRecipes: processedSizeVariants,
        servings: currentRecipe.servings || 1,
        prepTime: currentRecipe.prepTime || 0,
        instructions: currentRecipe.instructions || "",
        notes: currentRecipe.notes || ""
      });
      setTotalCost(currentRecipe.totalIngredientCost || 0);
      
      // Update useVariants flag based on recipe
      const hasVariants = (currentRecipe.sizeVariantRecipes && currentRecipe.sizeVariantRecipes.length > 0) ||
                          (activeDish.hasSizeVariants && activeDish.sizeVariants && activeDish.sizeVariants.length > 0);
      setUseVariants(hasVariants);
    } else if (activeDish && isOpen) {
      // Initialize new recipe
      const hasVariants = activeDish.hasSizeVariants && activeDish.sizeVariants && activeDish.sizeVariants.length > 0;
      setFormData({
        dishId: activeDish._id,
        ingredients: hasVariants ? [] : [{ ingredientId: "", quantity: 0, unit: "", notes: "" }],
        sizeVariantRecipes: hasVariants 
          ? activeDish.sizeVariants.map(v => ({
              size: v.size,
              ingredients: [{ ingredientId: "", quantity: 0, unit: "", notes: "" }],
              totalIngredientCost: 0
            }))
          : [],
        servings: 1,
        prepTime: 0,
        instructions: "",
        notes: ""
      });
      setTotalCost(0);
    }
  }, [currentRecipe, dish, selectedDish, isOpen]);

  const addIngredient = (variantIndex = null) => {
    if (variantIndex !== null) {
      // Add to variant
      const newVariants = [...formData.sizeVariantRecipes];
      newVariants[variantIndex].ingredients.push({
        ingredientId: "",
        quantity: 0,
        unit: "",
        notes: ""
      });
      setFormData(prev => ({ ...prev, sizeVariantRecipes: newVariants }));
    } else {
      // Add to default recipe
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, { ingredientId: "", quantity: 0, unit: "", notes: "" }]
      }));
    }
  };

  const removeIngredient = (index, variantIndex = null) => {
    if (variantIndex !== null) {
      const newVariants = [...formData.sizeVariantRecipes];
      newVariants[variantIndex].ingredients = newVariants[variantIndex].ingredients.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, sizeVariantRecipes: newVariants }));
    } else {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index)
      }));
    }
    calculateTotalCost();
  };

  const updateIngredient = (index, field, value, variantIndex = null) => {
    if (variantIndex !== null) {
      const newVariants = [...formData.sizeVariantRecipes];
      newVariants[variantIndex].ingredients[index] = {
        ...newVariants[variantIndex].ingredients[index],
        [field]: value
      };
      
      // Auto-fill unit when ingredient is selected
      if (field === "ingredientId" && value) {
        const ingredient = ingredients.find(ing => ing._id === value);
        if (ingredient) {
          newVariants[variantIndex].ingredients[index].unit = ingredient.unit;
        }
      }
      
      setFormData(prev => ({ ...prev, sizeVariantRecipes: newVariants }));
    } else {
      const newIngredients = [...formData.ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        [field]: value
      };
      
      // Auto-fill unit
      if (field === "ingredientId" && value) {
        const ingredient = ingredients.find(ing => ing._id === value);
        if (ingredient) {
          newIngredients[index].unit = ingredient.unit;
        }
      }
      
      setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    }
    calculateTotalCost();
  };

  const calculateTotalCost = () => {
    let cost = 0;
    
    if (useVariants) {
      // Calculate for variants
      formData.sizeVariantRecipes.forEach(variant => {
        variant.ingredients.forEach(recipeIng => {
          if (recipeIng.ingredientId) {
            const ingredient = ingredients.find(ing => ing._id === recipeIng.ingredientId);
            if (ingredient) {
              const unitCost = ingredient.costs?.averageCost || ingredient.costs?.standardCost || 0;
              cost += recipeIng.quantity * unitCost;
            }
          }
        });
      });
    } else {
      // Calculate for default recipe
      formData.ingredients.forEach(recipeIng => {
        if (recipeIng.ingredientId) {
          const ingredient = ingredients.find(ing => ing._id === recipeIng.ingredientId);
          if (ingredient) {
            const unitCost = ingredient.costs?.averageCost || ingredient.costs?.standardCost || 0;
            cost += recipeIng.quantity * unitCost;
          }
        }
      });
    }
    
    setTotalCost(cost);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const hasIngredients = useVariants 
      ? formData.sizeVariantRecipes.some(v => v.ingredients.some(i => i.ingredientId))
      : formData.ingredients.some(i => i.ingredientId);
    
    if (!hasIngredients) {
      enqueueSnackbar("Please add at least one ingredient", { variant: "warning" });
      return;
    }

    try {
      await dispatch(saveRecipe(formData)).unwrap();
      enqueueSnackbar("Recipe saved successfully!", { variant: "success" });
      onSuccess();
    } catch (error) {
      enqueueSnackbar(error || "Failed to save recipe", { variant: "error" });
    }
  };

  if (!isOpen) return null;
  
  const activeDish = selectedDish || dish;

  const renderIngredientRow = (recipeIng, index, variantIndex = null) => {
    const selectedIngredient = ingredients.find(ing => ing._id === recipeIng.ingredientId);
    const unitCost = selectedIngredient?.costs?.averageCost || selectedIngredient?.costs?.standardCost || 0;
    const lineCost = recipeIng.quantity * unitCost;

    return (
      <div key={index} className="grid grid-cols-12 gap-2 items-start bg-[#1a1a1a] p-3 rounded-lg">
        {/* Ingredient Select */}
        <div className="col-span-12 sm:col-span-5">
          <select
            value={recipeIng.ingredientId}
            onChange={(e) => updateIngredient(index, "ingredientId", e.target.value, variantIndex)}
            required
            className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
          >
            <option value="">Select ingredient</option>
            {ingredients.map(ing => (
              <option key={ing._id} value={ing._id}>
                {ing.name} ({ing.code}) - {formatVND(ing.costs?.averageCost || 0)}/{ing.unit}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div className="col-span-5 sm:col-span-2">
          <input
            type="number"
            value={recipeIng.quantity}
            onChange={(e) => updateIngredient(index, "quantity", parseFloat(e.target.value) || 0, variantIndex)}
            placeholder="Qty"
            min="0"
            step="0.01"
            required
            className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
          />
        </div>

        {/* Unit */}
        <div className="col-span-4 sm:col-span-2">
          <input
            type="text"
            value={recipeIng.unit}
            readOnly
            className="w-full bg-[#1a1a1a] border border-[#343434] rounded-lg px-3 py-2 text-[#ababab] text-sm cursor-not-allowed"
          />
        </div>

        {/* Cost */}
        <div className="col-span-2 sm:col-span-2 text-right">
          <p className="text-[#f6b100] font-semibold text-sm py-2">
            {formatVND(lineCost)}
          </p>
        </div>

        {/* Delete Button */}
        <div className="col-span-1 flex justify-end">
          <button
            type="button"
            onClick={() => removeIngredient(index, variantIndex)}
            className="text-red-500 hover:text-red-400 p-2"
          >
            <MdDelete size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1f1f] rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434] sticky top-0 bg-[#1f1f1f] z-10">
          <div>
            <h2 className="text-[#f5f5f5] text-xl font-bold">
              {activeDish ? `Recipe for ${activeDish.name}` : "Create New Recipe"}
            </h2>
            <p className="text-[#ababab] text-sm mt-1">
              {activeDish 
                ? "Define ingredients and quantities for this dish"
                : "Select a dish and define its recipe"
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Dish Selector (when no dish pre-selected) */}
          {!dish && (
            <div>
              <label className="block text-[#ababab] text-sm mb-2">
                Select Dish <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDish?._id || ""}
                onChange={(e) => handleDishSelect(e.target.value)}
                required
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
              >
                <option value="">Choose a dish...</option>
                {dishes.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.name} - {d.category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recipe Type */}
          {useVariants && activeDish && (
            <div className="bg-[#262626] border border-[#343434] rounded-lg p-4">
              <p className="text-[#f5f5f5] text-sm mb-2">
                <strong>Note:</strong> This dish has size variants. Define ingredients for each size.
              </p>
            </div>
          )}

          {/* Show rest of form only when dish is selected */}
          {!activeDish && !dish && (
            <div className="text-center py-8">
              <p className="text-[#ababab]">Please select a dish to continue</p>
            </div>
          )}

          {/* Ingredients List */}
          {activeDish && (useVariants ? (
            // Render for each variant
            <div className="space-y-6">
              {formData.sizeVariantRecipes.map((variant, variantIndex) => (
                <div key={variantIndex} className="bg-[#262626] rounded-lg p-4 border border-[#343434]">
                  <h3 className="text-[#f5f5f5] font-semibold text-lg mb-4">
                    {variant.size} Size
                  </h3>
                  
                  <div className="space-y-2">
                    {variant.ingredients.map((recipeIng, index) => 
                      renderIngredientRow(recipeIng, index, variantIndex)
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => addIngredient(variantIndex)}
                    className="mt-3 flex items-center gap-2 text-[#f6b100] hover:text-[#e5a000] text-sm font-medium"
                  >
                    <MdAdd /> Add Ingredient
                  </button>
                </div>
              ))}
            </div>
          ) : (
            // Render default recipe
            <div>
              <h3 className="text-[#f5f5f5] font-semibold mb-3">Ingredients</h3>
              <div className="space-y-2">
                {formData.ingredients.map((recipeIng, index) => 
                  renderIngredientRow(recipeIng, index)
                )}
              </div>

              <button
                type="button"
                onClick={() => addIngredient()}
                className="mt-3 flex items-center gap-2 text-[#f6b100] hover:text-[#e5a000] text-sm font-medium"
              >
                <MdAdd /> Add Ingredient
              </button>
            </div>
          ))}

          {/* Additional Info */}
          {activeDish && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#ababab] text-sm mb-2">Servings</label>
              <input
                type="number"
                value={formData.servings}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                min="1"
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
              />
            </div>

            <div>
              <label className="block text-[#ababab] text-sm mb-2">Prep Time (minutes)</label>
              <input
                type="number"
                value={formData.prepTime}
                onChange={(e) => setFormData(prev => ({ ...prev, prepTime: parseInt(e.target.value) || 0 }))}
                min="0"
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#ababab] text-sm mb-2">Instructions</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              rows={3}
              className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
              placeholder="Step-by-step cooking instructions..."
            />
          </div>

          <div>
            <label className="block text-[#ababab] text-sm mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
              placeholder="Additional notes..."
            />
          </div>

          {/* Total Cost Summary */}
          <div className="bg-[#f6b100]/10 border border-[#f6b100]/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MdCalculate className="text-[#f6b100]" size={24} />
                <span className="text-[#f5f5f5] font-semibold">Total Ingredient Cost:</span>
              </div>
              <span className="text-[#f6b100] text-2xl font-bold">
                {formatVND(totalCost)}
              </span>
            </div>
            {formData.servings > 1 && (
              <p className="text-[#ababab] text-sm mt-2 text-right">
                Cost per serving: {formatVND(totalCost / formData.servings)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#343434]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-[#262626] text-[#f5f5f5] rounded-lg hover:bg-[#343434] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={calculateTotalCost}
              className="px-6 py-2 bg-[#343434] text-[#f5f5f5] rounded-lg hover:bg-[#404040] transition-colors flex items-center gap-2"
            >
              <MdCalculate /> Recalculate
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg hover:bg-[#e5a000] transition-colors font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Recipe"}
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
  onSuccess: PropTypes.func.isRequired
};

export default RecipeModal;

