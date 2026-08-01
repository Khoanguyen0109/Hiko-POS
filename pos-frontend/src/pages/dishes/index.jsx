import { useState } from "react";
import DishModal from "../../components/dashboard/DishModal";
import RecipeModal from "../../components/dishes/RecipeModal";
import BackButton from "../../components/shared/BackButton";
import DishList from "./DishList";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { fetchDishes } from "../../redux/slices/dishSlice";
import { useDispatch } from "react-redux";

const Dishes = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [recipeDish, setRecipeDish] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive

  const handleOpenModal = () => {
    setEditingDish(null);
    setIsDishModalOpen(true);
  };

  const handleEditDish = (dish) => {
    setEditingDish(dish);
    setIsDishModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDishModalOpen(false);
    setEditingDish(null);
  };

  const handleRecipeDish = (dish) => {
    setRecipeDish(dish);
    setIsRecipeModalOpen(true);
  };

  const handleCloseRecipeModal = () => {
    setIsRecipeModalOpen(false);
    setRecipeDish(null);
  };

  const handleRecipeSuccess = () => {
    dispatch(fetchDishes());
  };

  return (
    <>
      <section className="bg-[#1f1f1f] min-h-screen pb-20 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <BackButton />
            <h1 className="text-[#f5f5f5] text-xl sm:text-2xl font-bold tracking-wider">
              Dishes
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => navigate(ROUTES.RECIPES)}
              className="bg-[#1a1a1a] hover:bg-[#262626] px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg text-[#f5f5f5] font-semibold text-sm sm:text-md flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Recipes
            </button>
            <button
              onClick={() => navigate(ROUTES.CATEGORIES)}
              className="bg-[#1a1a1a] hover:bg-[#262626] px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg text-[#f5f5f5] font-semibold text-sm sm:text-md flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Categories
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="bg-[#1a1a1a] hover:bg-[#262626] px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg text-[#f5f5f5] font-semibold text-sm sm:text-md flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Add Dishes
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="px-4 sm:px-10 mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[#ababab] text-sm font-medium">Filter:</span>
            {["all", "active", "inactive"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-brand text-[#f5f5f5]"
                    : "bg-[#1a1a1a] text-[#ababab] hover:bg-[#262626] hover:text-[#f5f5f5] border border-[#343434]"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <DishList 
          filterStatus={filterStatus} 
          onEditDish={handleEditDish}
          onRecipeDish={handleRecipeDish}
        />
      </section>
      {isDishModalOpen && (
        <DishModal 
          setIsDishModalOpen={handleCloseModal} 
          editingDish={editingDish}
        />
      )}
      {isRecipeModalOpen && (
        <RecipeModal
          isOpen={isRecipeModalOpen}
          onClose={handleCloseRecipeModal}
          dish={recipeDish}
          onSuccess={handleRecipeSuccess}
        />
      )}
    </>
  );
};

export default Dishes;
