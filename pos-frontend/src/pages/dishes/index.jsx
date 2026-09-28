import { useState } from "react";
import DishModal from "../../components/dashboard/DishModal";
import RecipeModal from "../../components/dishes/RecipeModal";
import BackButton from "../../components/shared/BackButton";
import HeaderActionButton from "../../components/shared/HeaderActionButton";
import DishList from "./DishList";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";

const Dishes = () => {
  const navigate = useNavigate();
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

  return (
    <>
      <section className="min-h-screen bg-[#1f1f1f] pb-20">
        <div className="flex flex-col gap-3 px-4 py-4 sm:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <BackButton />
            <h1 className="text-xl font-bold tracking-wider text-[#f5f5f5] sm:text-2xl">
              Dishes
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <HeaderActionButton onClick={() => navigate(ROUTES.RECIPES)}>
              Recipes
            </HeaderActionButton>
            <HeaderActionButton onClick={() => navigate(ROUTES.CATEGORIES)}>
              Categories
            </HeaderActionButton>
            <HeaderActionButton variant="primary" onClick={handleOpenModal}>
              Add Dishes
            </HeaderActionButton>
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
        />
      )}
    </>
  );
};

export default Dishes;
