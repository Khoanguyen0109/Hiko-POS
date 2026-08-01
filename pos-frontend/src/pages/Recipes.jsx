import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdMenuBook, MdCalculate, MdEdit } from "react-icons/md";
import FeaturePageHeader from "../components/shared/FeaturePageHeader";
import LoadingState from "../components/shared/LoadingState";
import EmptyState from "../components/shared/EmptyState";
import ErrorBanner from "../components/shared/ErrorBanner";
import HeaderActionButton from "../components/shared/HeaderActionButton";
import RecipeModal from "../components/dishes/RecipeModal";
import { fetchRecipes, recalculateRecipeCosts } from "../redux/slices/recipeSlice";
import { fetchDishes } from "../redux/slices/dishSlice";
import { enqueueSnackbar } from "notistack";
import { formatVND } from "../utils";

const thClass = "px-4 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider";
const tdClass = "px-4 py-3 text-sm text-[#f5f5f5] whitespace-nowrap";

const getDishFromRecipe = (recipe) =>
  typeof recipe.dishId === "object" ? recipe.dishId : null;

const getRecipeCostSummary = (recipe) => {
  if (recipe.sizeVariantRecipes?.length > 0) {
    const costs = recipe.sizeVariantRecipes.map((variant) => variant.totalIngredientCost || 0);
    const min = Math.min(...costs);
    const max = Math.max(...costs);
    return min === max ? formatVND(min) : `${formatVND(min)} - ${formatVND(max)}`;
  }
  return formatVND(recipe.totalIngredientCost || 0);
};

const getFoodCostPercent = (recipe) => {
  const dish = getDishFromRecipe(recipe);
  if (!dish) return "—";

  if (dish.hasSizeVariants && dish.sizeVariants?.length > 0) {
    const percents = dish.sizeVariants
      .map((variant) => {
        const recipeVariant = recipe.sizeVariantRecipes?.find((entry) => entry.size === variant.size);
        const cost = recipeVariant?.totalIngredientCost || 0;
        return variant.price > 0 ? (cost / variant.price) * 100 : null;
      })
      .filter((value) => value !== null);

    if (percents.length === 0) return "—";
    const min = Math.min(...percents);
    const max = Math.max(...percents);
    return min === max ? `${min.toFixed(1)}%` : `${min.toFixed(1)}% - ${max.toFixed(1)}%`;
  }

  const cost = recipe.totalIngredientCost || 0;
  const price = dish.price || 0;
  return price > 0 ? `${((cost / price) * 100).toFixed(1)}%` : "—";
};

const Recipes = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.recipes);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);

  useEffect(() => {
    dispatch(fetchRecipes({ limit: 100 }));
  }, [dispatch]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const query = search.trim().toLowerCase();
    return items.filter((recipe) => {
      const dish = getDishFromRecipe(recipe);
      return dish?.name?.toLowerCase().includes(query);
    });
  }, [items, search]);

  const handleRecalculateAll = async () => {
    try {
      const result = await dispatch(recalculateRecipeCosts()).unwrap();
      enqueueSnackbar(result.message || "Costs recalculated", { variant: "success" });
      dispatch(fetchRecipes({ limit: 100 }));
      dispatch(fetchDishes());
    } catch (err) {
      enqueueSnackbar(err || "Failed to recalculate costs", { variant: "error" });
    }
  };

  const handleOpenRecipe = (recipe) => {
    const dish = getDishFromRecipe(recipe);
    if (dish) {
      setSelectedDish(dish);
      setIsModalOpen(true);
    }
  };

  const handleCreateRecipe = () => {
    setSelectedDish(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDish(null);
  };

  const handleSuccess = () => {
    dispatch(fetchRecipes({ limit: 100 }));
    dispatch(fetchDishes());
  };

  return (
    <section className="bg-[#1f1f1f] min-h-screen pb-20">
      <FeaturePageHeader
        title="Recipes"
        actions={
          <>
            <HeaderActionButton
              icon={<MdCalculate size={16} />}
              onClick={handleRecalculateAll}
            >
              Recalculate all
            </HeaderActionButton>
            <HeaderActionButton
              variant="primary"
              icon={<MdMenuBook size={16} />}
              onClick={handleCreateRecipe}
            >
              Add recipe
            </HeaderActionButton>
          </>
        }
      />

      <div className="px-4 sm:px-10 pb-6">
        {error && <ErrorBanner message={error} className="mb-4" />}

        <div className="mb-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by dish name..."
            className="w-full max-w-md bg-[#262626] border border-[#343434] rounded-lg px-4 py-2.5 text-[#f5f5f5] focus:outline-none focus:border-brand"
          />
        </div>

        {loading ? (
          <LoadingState message="Loading recipes..." />
        ) : filteredItems.length === 0 ? (
          <EmptyState icon={MdMenuBook} message="No recipes found. Create one from a dish." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#343434]">
            <table className="w-full min-w-[800px]">
              <thead className="bg-[#262626]">
                <tr>
                  <th className={thClass}>Dish</th>
                  <th className={thClass}>Lines</th>
                  <th className={thClass}>Recipe cost</th>
                  <th className={thClass}>Food cost %</th>
                  <th className={thClass}>Updated</th>
                  <th className={`${thClass} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#343434]">
                {filteredItems.map((recipe) => {
                  const dish = getDishFromRecipe(recipe);
                  const lineCount = recipe.sizeVariantRecipes?.length > 0
                    ? recipe.sizeVariantRecipes.reduce(
                        (total, variant) => total + (variant.ingredients?.length || 0),
                        0
                      )
                    : recipe.ingredients?.length || 0;

                  return (
                    <tr key={recipe._id} className="bg-[#1f1f1f] hover:bg-[#262626] transition-colors">
                      <td className={tdClass}>
                        <span className="font-medium">{dish?.name || "Unknown dish"}</span>
                      </td>
                      <td className={tdClass}>{lineCount}</td>
                      <td className={`${tdClass} text-brand font-semibold`}>
                        {getRecipeCostSummary(recipe)}
                      </td>
                      <td className={tdClass}>{getFoodCostPercent(recipe)}</td>
                      <td className={tdClass}>
                        {recipe.lastCostUpdate
                          ? new Date(recipe.lastCostUpdate).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <button
                          type="button"
                          onClick={() => handleOpenRecipe(recipe)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-800 rounded transition-colors"
                        >
                          <MdEdit size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RecipeModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        dish={selectedDish}
        onSuccess={handleSuccess}
      />
    </section>
  );
};

export default Recipes;
