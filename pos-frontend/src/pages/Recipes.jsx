import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MdMenuBook,
  MdCalculate,
  MdEdit,
  MdRestaurant,
  MdLocalOffer,
  MdPieChart,
  MdPayments,
} from "react-icons/md";
import FeaturePageHeader from "../components/shared/FeaturePageHeader";
import LoadingState from "../components/shared/LoadingState";
import EmptyState from "../components/shared/EmptyState";
import ErrorBanner from "../components/shared/ErrorBanner";
import HeaderActionButton from "../components/shared/HeaderActionButton";
import RecipeModal from "../components/dishes/RecipeModal";
import ToppingRecipeModal from "../components/toppings/ToppingRecipeModal";
import { fetchRecipes, recalculateRecipeCosts } from "../redux/slices/recipeSlice";
import {
  fetchToppingRecipes,
  recalculateToppingRecipeCosts,
} from "../redux/slices/toppingRecipeSlice";
import { fetchDishes } from "../redux/slices/dishSlice";
import { fetchToppings } from "../redux/slices/toppingSlice";
import { enqueueSnackbar } from "notistack";
import { formatVND } from "../utils";
import { getRecipeTotalCost } from "../utils/recipeCost";

const thClass = "px-4 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider";
const tdClass = "px-4 py-3 text-sm text-[#f5f5f5] whitespace-nowrap";

const getDishFromRecipe = (recipe) =>
  typeof recipe.dishId === "object" ? recipe.dishId : null;

const getToppingFromRecipe = (recipe) =>
  typeof recipe.toppingId === "object" ? recipe.toppingId : null;

const getDishRecipeCostSummary = (recipe) => {
  if (recipe.sizeVariantRecipes?.length > 0) {
    const costs = recipe.sizeVariantRecipes.map((variant) =>
      getRecipeTotalCost(variant.totalIngredientCost || 0, variant.otherCost)
    );
    const min = Math.min(...costs);
    const max = Math.max(...costs);
    return min === max ? formatVND(min) : `${formatVND(min)} - ${formatVND(max)}`;
  }
  return formatVND(getRecipeTotalCost(recipe.totalIngredientCost, recipe.otherCost));
};

const collectDishFoodCostPercents = (recipe) => {
  const dish = getDishFromRecipe(recipe);
  if (!dish) return [];

  if (dish.hasSizeVariants && dish.sizeVariants?.length > 0) {
    return dish.sizeVariants
      .map((variant) => {
        const recipeVariant = recipe.sizeVariantRecipes?.find(
          (entry) => entry.size === variant.size
        );
        const cost = getRecipeTotalCost(
          recipeVariant?.totalIngredientCost || 0,
          recipeVariant?.otherCost
        );
        return variant.price > 0 ? (cost / variant.price) * 100 : null;
      })
      .filter((value) => value !== null);
  }

  const cost = getRecipeTotalCost(recipe.totalIngredientCost, recipe.otherCost);
  const price = dish.price || 0;
  return price > 0 ? [(cost / price) * 100] : [];
};

const collectToppingFoodCostPercents = (recipe) => {
  const topping = getToppingFromRecipe(recipe);
  if (!topping?.price) return [];
  const cost = getRecipeTotalCost(recipe.totalIngredientCost, recipe.otherCost);
  return [(cost / topping.price) * 100];
};

const getAverageFoodCostPercent = (percents) => {
  if (percents.length === 0) return null;
  return percents.reduce((sum, value) => sum + value, 0) / percents.length;
};

const getVariantTotalCost = (recipe, size) => {
  const variant = recipe.sizeVariantRecipes?.find((entry) => entry.size === size);
  if (!variant) return null;
  return getRecipeTotalCost(variant.totalIngredientCost || 0, variant.otherCost);
};

const getSizeTotalCostSummary = (recipes, size) => {
  const costs = recipes
    .map((recipe) => getVariantTotalCost(recipe, size))
    .filter((cost) => cost !== null);

  if (costs.length === 0) {
    return { total: null, recipeCount: 0 };
  }

  return {
    total: costs.reduce((sum, cost) => sum + cost, 0),
    recipeCount: costs.length,
  };
};

const getDishFoodCostPercent = (recipe) => {
  const percents = collectDishFoodCostPercents(recipe);
  if (percents.length === 0) return "—";

  const min = Math.min(...percents);
  const max = Math.max(...percents);
  return min === max ? `${min.toFixed(1)}%` : `${min.toFixed(1)}% - ${max.toFixed(1)}%`;
};

const getToppingFoodCostPercent = (recipe) => {
  const percents = collectToppingFoodCostPercents(recipe);
  if (percents.length === 0) return "—";
  return `${percents[0].toFixed(1)}%`;
};

const Recipes = () => {
  const dispatch = useDispatch();
  const { items: dishRecipes, loading: dishLoading, error: dishError } = useSelector(
    (state) => state.recipes
  );
  const {
    items: toppingRecipes,
    loading: toppingLoading,
    error: toppingError,
  } = useSelector((state) => state.toppingRecipes);

  const [activeTab, setActiveTab] = useState("dishes");
  const [search, setSearch] = useState("");
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [isToppingModalOpen, setIsToppingModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [selectedTopping, setSelectedTopping] = useState(null);

  useEffect(() => {
    dispatch(fetchRecipes({ limit: 100 }));
    dispatch(fetchToppingRecipes({ limit: 100 }));
  }, [dispatch]);

  const filteredDishRecipes = useMemo(() => {
    if (!search.trim()) return dishRecipes;
    const query = search.trim().toLowerCase();
    return dishRecipes.filter((recipe) => {
      const dish = getDishFromRecipe(recipe);
      return dish?.name?.toLowerCase().includes(query);
    });
  }, [dishRecipes, search]);

  const filteredToppingRecipes = useMemo(() => {
    if (!search.trim()) return toppingRecipes;
    const query = search.trim().toLowerCase();
    return toppingRecipes.filter((recipe) => {
      const topping = getToppingFromRecipe(recipe);
      return topping?.name?.toLowerCase().includes(query);
    });
  }, [toppingRecipes, search]);

  const averageFoodCost = useMemo(() => {
    const recipes =
      activeTab === "dishes" ? filteredDishRecipes : filteredToppingRecipes;
    const percents = recipes.flatMap((recipe) =>
      activeTab === "dishes"
        ? collectDishFoodCostPercents(recipe)
        : collectToppingFoodCostPercents(recipe)
    );
    return {
      value: getAverageFoodCostPercent(percents),
      sampleCount: percents.length,
      recipeCount: recipes.length,
    };
  }, [activeTab, filteredDishRecipes, filteredToppingRecipes]);

  const mediumTotalCost = useMemo(
    () =>
      activeTab === "dishes"
        ? getSizeTotalCostSummary(filteredDishRecipes, "Medium")
        : { total: null, recipeCount: 0 },
    [activeTab, filteredDishRecipes]
  );

  const largeTotalCost = useMemo(
    () =>
      activeTab === "dishes"
        ? getSizeTotalCostSummary(filteredDishRecipes, "Large")
        : { total: null, recipeCount: 0 },
    [activeTab, filteredDishRecipes]
  );

  const handleRecalculateAll = async () => {
    try {
      if (activeTab === "dishes") {
        const result = await dispatch(recalculateRecipeCosts()).unwrap();
        enqueueSnackbar(result.message || "Dish costs recalculated", { variant: "success" });
        dispatch(fetchRecipes({ limit: 100 }));
        dispatch(fetchDishes());
      } else {
        const result = await dispatch(recalculateToppingRecipeCosts()).unwrap();
        enqueueSnackbar(result.message || "Topping costs recalculated", { variant: "success" });
        dispatch(fetchToppingRecipes({ limit: 100 }));
        dispatch(fetchToppings({}));
      }
    } catch (err) {
      enqueueSnackbar(err || "Failed to recalculate costs", { variant: "error" });
    }
  };

  const handleCreateRecipe = () => {
    if (activeTab === "dishes") {
      setSelectedDish(null);
      setIsDishModalOpen(true);
    } else {
      setSelectedTopping(null);
      setIsToppingModalOpen(true);
    }
  };

  const loading = activeTab === "dishes" ? dishLoading : toppingLoading;
  const error = activeTab === "dishes" ? dishError : toppingError;

  return (
    <section className="bg-[#1f1f1f] min-h-screen pb-20">
      <FeaturePageHeader
        title="Recipes"
        tabs={[
          { id: "dishes", label: "Dishes", icon: MdRestaurant },
          { id: "toppings", label: "Toppings", icon: MdLocalOffer },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
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

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="min-w-[220px] flex-1 rounded-lg border border-[#343434] bg-[#262626] p-4 sm:max-w-xs sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <MdPieChart className="text-xl text-brand sm:text-2xl" />
              <span className="text-xs text-[#ababab] sm:text-sm">
                {activeTab === "dishes" ? "Dishes" : "Toppings"}
              </span>
            </div>
            <h3 className="mb-1 text-lg font-bold text-[#f5f5f5] sm:text-2xl">
              {averageFoodCost.value !== null
                ? `${averageFoodCost.value.toFixed(1)}%`
                : "—"}
            </h3>
            <p className="text-xs text-[#ababab] sm:text-sm">Avg food cost</p>
            {averageFoodCost.sampleCount > 0 ? (
              <p className="mt-2 text-xs text-[#6a6a6a]">
                {averageFoodCost.recipeCount} recipe
                {averageFoodCost.recipeCount === 1 ? "" : "s"}
                {averageFoodCost.sampleCount !== averageFoodCost.recipeCount
                  ? ` · ${averageFoodCost.sampleCount} sizes`
                  : ""}
              </p>
            ) : null}
          </div>

          {activeTab === "dishes" ? (
            <>
              <div className="min-w-[220px] flex-1 rounded-lg border border-[#343434] bg-[#262626] p-4 sm:max-w-xs sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <MdPayments className="text-xl text-blue-400 sm:text-2xl" />
                  <span className="text-xs text-[#ababab] sm:text-sm">Medium</span>
                </div>
                <h3 className="mb-1 text-lg font-bold text-[#f5f5f5] sm:text-2xl">
                  {mediumTotalCost.total !== null ? formatVND(mediumTotalCost.total) : "—"}
                </h3>
                <p className="text-xs text-[#ababab] sm:text-sm">Total recipe cost (M)</p>
                {mediumTotalCost.recipeCount > 0 ? (
                  <p className="mt-2 text-xs text-[#6a6a6a]">
                    {mediumTotalCost.recipeCount} recipe
                    {mediumTotalCost.recipeCount === 1 ? "" : "s"}
                  </p>
                ) : null}
              </div>

              <div className="min-w-[220px] flex-1 rounded-lg border border-[#343434] bg-[#262626] p-4 sm:max-w-xs sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <MdPayments className="text-xl text-purple-400 sm:text-2xl" />
                  <span className="text-xs text-[#ababab] sm:text-sm">Large</span>
                </div>
                <h3 className="mb-1 text-lg font-bold text-[#f5f5f5] sm:text-2xl">
                  {largeTotalCost.total !== null ? formatVND(largeTotalCost.total) : "—"}
                </h3>
                <p className="text-xs text-[#ababab] sm:text-sm">Total recipe cost (L)</p>
                {largeTotalCost.recipeCount > 0 ? (
                  <p className="mt-2 text-xs text-[#6a6a6a]">
                    {largeTotalCost.recipeCount} recipe
                    {largeTotalCost.recipeCount === 1 ? "" : "s"}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        <div className="mb-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === "dishes"
                ? "Search by dish name..."
                : "Search by topping name..."
            }
            className="w-full max-w-md bg-[#262626] border border-[#343434] rounded-lg px-4 py-2.5 text-[#f5f5f5] focus:outline-none focus:border-brand"
          />
        </div>

        {activeTab === "dishes" ? (
          loading ? (
            <LoadingState message="Loading dish recipes..." />
          ) : filteredDishRecipes.length === 0 ? (
            <EmptyState icon={MdRestaurant} message="No dish recipes found. Create one from a dish." />
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
                  {filteredDishRecipes.map((recipe) => {
                    const dish = getDishFromRecipe(recipe);
                    const lineCount =
                      recipe.sizeVariantRecipes?.length > 0
                        ? recipe.sizeVariantRecipes.reduce(
                            (total, variant) => total + (variant.ingredients?.length || 0),
                            0
                          )
                        : recipe.ingredients?.length || 0;

                    return (
                      <tr
                        key={recipe._id}
                        className="bg-[#1f1f1f] hover:bg-[#262626] transition-colors"
                      >
                        <td className={tdClass}>
                          <span className="font-medium">{dish?.name || "Unknown dish"}</span>
                        </td>
                        <td className={tdClass}>{lineCount}</td>
                        <td className={`${tdClass} text-brand font-semibold`}>
                          {getDishRecipeCostSummary(recipe)}
                        </td>
                        <td className={tdClass}>{getDishFoodCostPercent(recipe)}</td>
                        <td className={tdClass}>
                          {recipe.lastCostUpdate
                            ? new Date(recipe.lastCostUpdate).toLocaleDateString("vi-VN")
                            : "—"}
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <button
                            type="button"
                            onClick={() => {
                              if (dish) {
                                setSelectedDish(dish);
                                setIsDishModalOpen(true);
                              }
                            }}
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
          )
        ) : loading ? (
          <LoadingState message="Loading topping recipes..." />
        ) : filteredToppingRecipes.length === 0 ? (
          <EmptyState icon={MdLocalOffer} message="No topping recipes found. Create one from a topping." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#343434]">
            <table className="w-full min-w-[800px]">
              <thead className="bg-[#262626]">
                <tr>
                  <th className={thClass}>Topping</th>
                  <th className={thClass}>Lines</th>
                  <th className={thClass}>Recipe cost</th>
                  <th className={thClass}>Food cost %</th>
                  <th className={thClass}>Updated</th>
                  <th className={`${thClass} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#343434]">
                {filteredToppingRecipes.map((recipe) => {
                  const topping = getToppingFromRecipe(recipe);

                  return (
                    <tr
                      key={recipe._id}
                      className="bg-[#1f1f1f] hover:bg-[#262626] transition-colors"
                    >
                      <td className={tdClass}>
                        <span className="font-medium">{topping?.name || "Unknown topping"}</span>
                      </td>
                      <td className={tdClass}>{recipe.ingredients?.length || 0}</td>
                      <td className={`${tdClass} text-brand font-semibold`}>
                        {formatVND(getRecipeTotalCost(recipe.totalIngredientCost, recipe.otherCost))}
                      </td>
                      <td className={tdClass}>{getToppingFoodCostPercent(recipe)}</td>
                      <td className={tdClass}>
                        {recipe.lastCostUpdate
                          ? new Date(recipe.lastCostUpdate).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <button
                          type="button"
                          onClick={() => {
                            if (topping) {
                              setSelectedTopping(topping);
                              setIsToppingModalOpen(true);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 border border-purple-800 rounded transition-colors"
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
        isOpen={isDishModalOpen}
        onClose={() => {
          setIsDishModalOpen(false);
          setSelectedDish(null);
        }}
        dish={selectedDish}
        onSuccess={() => {
          dispatch(fetchRecipes({ limit: 100 }));
          dispatch(fetchDishes());
        }}
      />

      <ToppingRecipeModal
        isOpen={isToppingModalOpen}
        onClose={() => {
          setIsToppingModalOpen(false);
          setSelectedTopping(null);
        }}
        topping={selectedTopping}
        onSuccess={() => {
          dispatch(fetchToppingRecipes({ limit: 100 }));
          dispatch(fetchToppings({}));
        }}
      />
    </section>
  );
};

export default Recipes;
