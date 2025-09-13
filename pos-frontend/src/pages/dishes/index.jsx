import { useState } from "react";
import DishModal from "../../components/dashboard/DishModal";
import BackButton from "../../components/shared/BackButton";
import DishList from "./DishList";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";

const Dishes = () => {
  const navigate = useNavigate();
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive

  const handleOpenModal = () => {
    setIsDishModalOpen(true);
  };

  return (
    <>
      <section className="bg-[#1f1f1f] min-h-screen pb-20 overflow-y-scroll scrollbar-hide p-4">
        <div className="flex items-center justify-between px-10 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
              Dishes
            </h1>
          </div>

          <div className="flex items-center justify-around gap-4">
            <button
              onClick={() => navigate(ROUTES.CATEGORIES)}
              className="bg-[#1a1a1a] hover:bg-[#262626] px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md flex items-center gap-2"
            >
              Categories
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="bg-[#1a1a1a] hover:bg-[#262626] px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md flex items-center gap-2"
            >
              Add Dishes
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="px-10 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-[#ababab] text-sm font-medium">Filter:</span>
            {["all", "active", "inactive"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-[#f6b100] text-[#1f1f1f]"
                    : "bg-[#1a1a1a] text-[#ababab] hover:bg-[#262626] hover:text-[#f5f5f5] border border-[#343434]"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <DishList filterStatus={filterStatus} />
      </section>
      {isDishModalOpen && <DishModal setIsDishModalOpen={setIsDishModalOpen} />}
    </>
  );
};

export default Dishes;
