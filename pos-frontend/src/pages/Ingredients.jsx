import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdWarning,
  MdCheckCircle,
  MdInventory,
  MdHistory,
  MdFileDownload,
  MdFileUpload
} from "react-icons/md";
import {
  fetchIngredients,
  fetchLowStockIngredients,
  removeIngredient,
  setFilters,
  setPagination
} from "../redux/slices/ingredientSlice";
import { formatVND } from "../utils";
import IngredientModal from "../components/ingredients/IngredientModal";
import TransactionModal from "../components/ingredients/TransactionModal";
import TransactionHistoryModal from "../components/ingredients/TransactionHistoryModal";
import BackButton from "../components/shared/BackButton";
import FullScreenLoader from "../components/shared/FullScreenLoader";

const Ingredients = () => {
  const dispatch = useDispatch();
  const { role } = useSelector((state) => state.user);
  const isAdmin = role === "Admin";

  const {
    items: ingredients,
    lowStockItems,
    loading,
    error,
    filters,
    pagination
  } = useSelector((state) => state.ingredients);

  const [activeTab, setActiveTab] = useState("all");
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [transactionType, setTransactionType] = useState("IMPORT");

  useEffect(() => {
    document.title = "POS | Ingredients";
    loadIngredients();
    dispatch(fetchLowStockIngredients());
  }, [dispatch, filters, pagination.currentPage]);

  const loadIngredients = () => {
    const params = {
      page: pagination.currentPage,
      limit: pagination.limit,
      ...filters
    };

    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === "all") {
        delete params[key];
      }
    });

    dispatch(fetchIngredients(params));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ingredient?")) return;
    
    try {
      await dispatch(removeIngredient(id)).unwrap();
      loadIngredients();
    } catch (error) {
      console.error("Error deleting ingredient:", error);
    }
  };

  const openIngredientModal = (mode, ingredient = null) => {
    setModalMode(mode);
    setSelectedIngredient(ingredient);
    setShowIngredientModal(true);
  };

  const openTransactionModal = (type, ingredient = null) => {
    setTransactionType(type);
    setSelectedIngredient(ingredient);
    setShowTransactionModal(true);
  };

  const openHistoryModal = (ingredient) => {
    setSelectedIngredient(ingredient);
    setShowHistoryModal(true);
  };

  const closeModals = () => {
    setShowIngredientModal(false);
    setShowTransactionModal(false);
    setShowHistoryModal(false);
    setSelectedIngredient(null);
    setModalMode("create");
  };

  const getStockStatusColor = (ingredient) => {
    const stock = ingredient.inventory?.currentStock || 0;
    const reorder = ingredient.inventory?.reorderPoint || 0;

    if (stock <= 0) return "text-red-500 bg-red-500/10";
    if (stock <= reorder) return "text-yellow-500 bg-yellow-500/10";
    return "text-green-500 bg-green-500/10";
  };

  const getStockStatusText = (ingredient) => {
    const stock = ingredient.inventory?.currentStock || 0;
    const reorder = ingredient.inventory?.reorderPoint || 0;

    if (stock <= 0) return "Out of Stock";
    if (stock <= reorder) return "Low Stock";
    return "In Stock";
  };

  const tabs = [
    { id: "all", label: "All Ingredients", count: ingredients.length },
    { id: "low-stock", label: "Low Stock", count: lowStockItems.length }
  ];

  if (loading && !ingredients.length) {
    return <FullScreenLoader />;
  }

  const displayedIngredients = activeTab === "low-stock" ? lowStockItems : ingredients;

  return (
    <div className="bg-[#1f1f1f] min-h-screen pb-20">
      {/* Header */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#f5f5f5] mb-2">
                Ingredient Management
              </h1>
              <p className="text-[#ababab]">
                Track inventory, manage stock, and monitor costs
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => openIngredientModal("create")}
              className="bg-[#f6b100] hover:bg-[#e5a000] text-[#1f1f1f] px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <MdAdd /> Add Ingredient
            </button>
            <button
              onClick={() => openTransactionModal("IMPORT")}
              className="bg-[#262626] hover:bg-[#343434] text-[#f5f5f5] px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <MdFileDownload /> Import Stock
            </button>
            <button
              onClick={() => openTransactionModal("EXPORT")}
              className="bg-[#262626] hover:bg-[#343434] text-[#f5f5f5] px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <MdFileUpload /> Export Stock
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-8 border-b border-[#343434]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[#262626] text-[#f6b100] border-b-2 border-[#f6b100]"
                  : "text-[#ababab] hover:text-[#f5f5f5] hover:bg-[#262626]"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? "bg-[#f6b100]/20 text-[#f6b100]"
                  : "bg-[#343434] text-[#ababab]"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 md:px-6 mb-6">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Ingredients Grid */}
      <div className="container mx-auto px-4 md:px-6">
        {displayedIngredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MdInventory size={64} className="text-[#ababab] mb-4" />
            <h3 className="text-[#f5f5f5] text-lg font-semibold mb-2">
              No Ingredients Found
            </h3>
            <p className="text-[#ababab] text-sm max-w-md">
              {activeTab === "low-stock"
                ? "All ingredients are well stocked!"
                : "Add your first ingredient to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedIngredients.map((ingredient) => (
              <div
                key={ingredient._id}
                className="bg-[#262626] rounded-lg p-6 border border-[#343434] hover:border-[#f6b100]/30 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-[#f5f5f5] font-semibold text-lg mb-1">
                      {ingredient.name}
                    </h3>
                    <p className="text-[#ababab] text-xs">{ingredient.code}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStockStatusColor(
                      ingredient
                    )}`}
                  >
                    {getStockStatusText(ingredient)}
                  </span>
                </div>

                {/* Category & Unit */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-[#343434] text-[#ababab] rounded text-xs">
                    {ingredient.category}
                  </span>
                  <span className="px-2 py-1 bg-[#343434] text-[#ababab] rounded text-xs">
                    {ingredient.unit}
                  </span>
                </div>

                {/* Stock Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#ababab]">Current Stock:</span>
                    <span className="text-[#f5f5f5] font-semibold">
                      {ingredient.inventory?.currentStock || 0} {ingredient.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#ababab]">Reorder Point:</span>
                    <span className="text-[#f5f5f5]">
                      {ingredient.inventory?.reorderPoint || 0} {ingredient.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#ababab]">Avg Cost:</span>
                    <span className="text-[#f5f5f5]">
                      {formatVND(ingredient.costs?.averageCost || 0)}/{ingredient.unit}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[#343434]">
                  <button
                    onClick={() => openIngredientModal("edit", ingredient)}
                    className="flex-1 bg-[#343434] hover:bg-[#f6b100] text-[#f5f5f5] hover:text-[#1f1f1f] px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <MdEdit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => openTransactionModal("IMPORT", ingredient)}
                    className="flex-1 bg-[#343434] hover:bg-green-600 text-[#f5f5f5] px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    title="Import Stock"
                  >
                    <MdFileDownload size={16} /> Import
                  </button>
                  <button
                    onClick={() => openHistoryModal(ingredient)}
                    className="flex-1 bg-[#343434] hover:bg-blue-600 text-[#f5f5f5] px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    title="View History"
                  >
                    <MdHistory size={16} /> History
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(ingredient._id)}
                      className="bg-[#343434] hover:bg-red-600 text-[#f5f5f5] px-3 py-2 rounded text-sm transition-colors"
                      title="Delete"
                    >
                      <MdDelete size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => dispatch(setPagination({ currentPage: pagination.currentPage - 1 }))}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 bg-[#262626] text-[#f5f5f5] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#343434]"
            >
              Previous
            </button>
            <span className="text-[#ababab] text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => dispatch(setPagination({ currentPage: pagination.currentPage + 1 }))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 bg-[#262626] text-[#f5f5f5] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#343434]"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <IngredientModal
        isOpen={showIngredientModal}
        onClose={closeModals}
        mode={modalMode}
        ingredient={selectedIngredient}
        onSuccess={() => {
          loadIngredients();
          closeModals();
        }}
      />

      <TransactionModal
        isOpen={showTransactionModal}
        onClose={closeModals}
        type={transactionType}
        ingredient={selectedIngredient}
        onSuccess={() => {
          loadIngredients();
          dispatch(fetchLowStockIngredients());
          closeModals();
        }}
      />

      <TransactionHistoryModal
        isOpen={showHistoryModal}
        onClose={closeModals}
        ingredient={selectedIngredient}
      />
    </div>
  );
};

export default Ingredients;

