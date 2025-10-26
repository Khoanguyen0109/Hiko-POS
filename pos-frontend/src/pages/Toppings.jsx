import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import { MdAdd, MdEdit, MdDelete, MdToggleOn, MdToggleOff, MdMenuBook } from "react-icons/md";
import {
  fetchToppings,
  createTopping,
  updateToppingThunk,
  deleteToppingThunk,
  toggleToppingAvailabilityThunk,
  clearError
} from "../redux/slices/toppingSlice";
import { formatVND } from "../utils";
import Modal from "../components/shared/Modal";
import DeleteConfirmationModal from "../components/shared/DeleteConfirmationModal";
import ToppingRecipeModal from "../components/toppings/ToppingRecipeModal";

const Toppings = () => {
  const dispatch = useDispatch();
  const { toppings, loading, error } = useSelector((state) => state.toppings);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedTopping, setSelectedTopping] = useState(null);
  const [recipeTopping, setRecipeTopping] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAvailable, setFilterAvailable] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Kem"
  });

  const categories = ["Kem", "Matcha"];

  useEffect(() => {
    dispatch(fetchToppings({ 
      category: filterCategory || undefined, 
      available: filterAvailable || undefined 
    }));
  }, [dispatch, filterCategory, filterAvailable]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleOpenModal = (topping = null) => {
    if (topping) {
      setSelectedTopping(topping);
      setIsEditing(true);
      setFormData({
        name: topping.name,
        description: topping.description || "",
        price: topping.price.toString(),
        category: topping.category
      });
    } else {
      setSelectedTopping(null);
      setIsEditing(false);
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "Kem"
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTopping(null);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const toppingData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      category: formData.category
    };

    try {
      if (isEditing) {
        await dispatch(updateToppingThunk({ 
          toppingId: selectedTopping._id, 
          toppingData 
        })).unwrap();
        enqueueSnackbar("Topping updated successfully!", { variant: "success" });
      } else {
        await dispatch(createTopping(toppingData)).unwrap();
        enqueueSnackbar("Topping created successfully!", { variant: "success" });
      }
      handleCloseModal();
    } catch (error) {
      enqueueSnackbar(error || "Operation failed", { variant: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteToppingThunk(selectedTopping._id)).unwrap();
      enqueueSnackbar("Topping deleted successfully!", { variant: "success" });
      setShowDeleteModal(false);
      setSelectedTopping(null);
    } catch (error) {
      enqueueSnackbar(error || "Delete failed", { variant: "error" });
    }
  };

  const handleToggleAvailability = async (topping) => {
    try {
      await dispatch(toggleToppingAvailabilityThunk(topping._id)).unwrap();
      enqueueSnackbar(
        `Topping ${topping.isAvailable ? 'disabled' : 'enabled'} successfully!`,
        { variant: "success" }
      );
    } catch (error) {
      enqueueSnackbar(error || "Toggle failed", { variant: "error" });
    }
  };

  const handleOpenRecipeModal = (topping) => {
    setRecipeTopping(topping);
    setShowRecipeModal(true);
  };

  const handleCloseRecipeModal = () => {
    setShowRecipeModal(false);
    setRecipeTopping(null);
  };


  const filteredToppings = toppings.filter(topping => {
    if (filterCategory && topping.category !== filterCategory) return false;
    if (filterAvailable !== "" && topping.isAvailable.toString() !== filterAvailable) return false;
    return true;
  });

  return (
    <section className="bg-[#1f1f1f] pb-20 min-h-screen ">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Toppings Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#f6b100] text-[#1f1f1f] px-4 py-2 rounded-lg font-semibold hover:bg-[#e09900] transition-colors"
        >
          <MdAdd size={20} />
          Add Topping
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select
          value={filterAvailable}
          onChange={(e) => setFilterAvailable(e.target.value)}
          className="px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
        >
          <option value="">All Status</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
      </div>

      {/* Toppings Grid */}
      {loading ? (
        <div className="text-center py-8 text-[#ababab]">Loading toppings...</div>
      ) : filteredToppings.length === 0 ? (
        <div className="text-center py-8 text-[#ababab]">No toppings found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredToppings.map((topping) => (
            <div
              key={topping._id}
              className={`p-4 rounded-lg border transition-colors ${
                topping.isAvailable
                  ? 'bg-[#262626] border-[#343434]'
                  : 'bg-[#1f1f1f] border-[#2a2a2a] opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-[#f5f5f5] font-semibold">{topping.name}</h3>
                  <p className="text-[#ababab] text-sm">{topping.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#f6b100] font-bold">{formatVND(topping.price)}</span>
                    <span className="text-xs text-[#ababab] bg-[#343434] px-2 py-1 rounded">
                      {topping.category}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggleAvailability(topping)}
                  className={`ml-2 ${
                    topping.isAvailable ? 'text-green-400' : 'text-red-400'
                  } hover:opacity-80 transition-opacity`}
                >
                  {topping.isAvailable ? <MdToggleOn size={24} /> : <MdToggleOff size={24} />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenRecipeModal(topping)}
                    className="p-2 rounded-lg bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 border border-purple-800 transition-colors duration-200"
                    title="Manage recipe"
                  >
                    <MdMenuBook size={18} />
                  </button>
                  <button
                    onClick={() => handleOpenModal(topping)}
                    className="text-[#f6b100] hover:text-[#e09900] transition-colors"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTopping(topping);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-md">
          <h2 className="text-xl font-bold text-[#f5f5f5] mb-4">
            {isEditing ? "Edit Topping" : "Add New Topping"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#f5f5f5] text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                required
              />
            </div>

            <div>
              <label className="block text-[#f5f5f5] text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                rows="2"
              />
            </div>

            <div>
              <label className="block text-[#f5f5f5] text-sm font-medium mb-1">Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                required
              />
            </div>

            <div>
              <label className="block text-[#f5f5f5] text-sm font-medium mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>


            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#ababab] hover:bg-[#343434] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e09900] transition-colors"
              >
                {isEditing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={selectedTopping?.name}
        itemType="topping"
      />

      {/* Recipe Modal */}
      {showRecipeModal && (
        <ToppingRecipeModal
          isOpen={showRecipeModal}
          onClose={handleCloseRecipeModal}
          topping={recipeTopping}
          onSuccess={handleCloseRecipeModal}
        />
      )}
    </section>
  );
};

export default Toppings;
