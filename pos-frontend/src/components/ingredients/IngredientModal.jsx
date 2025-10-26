import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { MdClose } from "react-icons/md";
import { createIngredient, editIngredient } from "../../redux/slices/ingredientSlice";
import { enqueueSnackbar } from "notistack";

const CATEGORIES = ['Protein', 'Vegetable', 'Fruit', 'Dairy', 'Grain', 'Spice', 'Oil', 'Sauce', 'Beverage', 'Other'];
const UNITS = ['kg', 'g', 'liter', 'ml', 'piece', 'pack', 'box', 'bag'];
const TEMPERATURES = ['FROZEN', 'CHILLED', 'AMBIENT', 'DRY'];

const IngredientModal = ({ isOpen, onClose, mode, ingredient, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    category: "Other",
    unit: "kg",
    inventory: {
      currentStock: 0,
      minStock: 0,
      maxStock: 1000,
      reorderPoint: 10
    },
    costs: {
      standardCost: 0
    },
    storage: {
      location: "",
      temperature: "AMBIENT",
      shelfLife: 0
    },
    notes: ""
  });

  useEffect(() => {
    if (ingredient && mode === "edit") {
      setFormData({
        name: ingredient.name || "",
        code: ingredient.code || "",
        description: ingredient.description || "",
        category: ingredient.category || "Other",
        unit: ingredient.unit || "kg",
        inventory: ingredient.inventory || {
          currentStock: 0,
          minStock: 0,
          maxStock: 1000,
          reorderPoint: 10
        },
        costs: ingredient.costs || { standardCost: 0 },
        storage: ingredient.storage || {
          location: "",
          temperature: "AMBIENT",
          shelfLife: 0
        },
        notes: ingredient.notes || ""
      });
    } else {
      resetForm();
    }
  }, [ingredient, mode, isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      category: "Other",
      unit: "kg",
      inventory: {
        currentStock: 0,
        minStock: 0,
        maxStock: 1000,
        reorderPoint: 10
      },
      costs: {
        standardCost: 0
      },
      storage: {
        location: "",
        temperature: "AMBIENT",
        shelfLife: 0
      },
      notes: ""
    });
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert to appropriate type
    let processedValue = value;
    if (type === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value);
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: processedValue
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure numeric fields are properly formatted
      const payload = {
        ...formData,
        inventory: {
          ...formData.inventory,
          currentStock: Number(formData.inventory.currentStock) || 0,
          minStock: Number(formData.inventory.minStock) || 0,
          maxStock: Number(formData.inventory.maxStock) || 0,
          reorderPoint: Number(formData.inventory.reorderPoint) || 0
        },
        costs: {
          ...formData.costs,
          standardCost: Number(formData.costs.standardCost) || 0
        },
        storage: {
          ...formData.storage,
          shelfLife: Number(formData.storage.shelfLife) || 0
        }
      };

      if (mode === "create") {
        await dispatch(createIngredient(payload)).unwrap();
        enqueueSnackbar("Ingredient created successfully!", { variant: "success" });
      } else {
        await dispatch(editIngredient({ ingredientId: ingredient._id, ...payload })).unwrap();
        enqueueSnackbar("Ingredient updated successfully!", { variant: "success" });
      }
      onSuccess();
    } catch (error) {
      enqueueSnackbar(error || "Operation failed", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1f1f] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <h2 className="text-[#f5f5f5] text-xl font-bold">
            {mode === "create" ? "Add New Ingredient" : "Edit Ingredient"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#ababab] text-sm mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                placeholder="e.g., Chicken Breast"
              />
            </div>

            <div>
              <label className="block text-[#ababab] text-sm mb-2">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100] uppercase"
                placeholder="e.g., CHKN-001"
              />
            </div>

            <div>
              <label className="block text-[#ababab] text-sm mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#ababab] text-sm mb-2">Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#ababab] text-sm mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
              placeholder="Brief description of the ingredient..."
            />
          </div>

          {/* Inventory */}
          <div>
            <h3 className="text-[#f5f5f5] font-semibold mb-3">Inventory Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[#ababab] text-xs mb-2">Min Stock</label>
                <input
                  type="number"
                  name="inventory.minStock"
                  value={formData.inventory.minStock}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                />
              </div>

              <div>
                <label className="block text-[#ababab] text-xs mb-2">Reorder Point</label>
                <input
                  type="number"
                  name="inventory.reorderPoint"
                  value={formData.inventory.reorderPoint}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                />
              </div>

              <div>
                <label className="block text-[#ababab] text-xs mb-2">Max Stock</label>
                <input
                  type="number"
                  name="inventory.maxStock"
                  value={formData.inventory.maxStock}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                />
              </div>

              <div>
                <label className="block text-[#ababab] text-xs mb-2">Standard Cost</label>
                <input
                  type="number"
                  name="costs.standardCost"
                  value={formData.costs.standardCost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                />
              </div>
            </div>
          </div>

          {/* Storage */}
          <div>
            <h3 className="text-[#f5f5f5] font-semibold mb-3">Storage Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#ababab] text-xs mb-2">Location</label>
                <input
                  type="text"
                  name="storage.location"
                  value={formData.storage.location}
                  onChange={handleChange}
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                  placeholder="e.g., Freezer A1"
                />
              </div>

              <div>
                <label className="block text-[#ababab] text-xs mb-2">Temperature</label>
                <select
                  name="storage.temperature"
                  value={formData.storage.temperature}
                  onChange={handleChange}
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                >
                  {TEMPERATURES.map(temp => (
                    <option key={temp} value={temp}>{temp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#ababab] text-xs mb-2">Shelf Life (days)</label>
                <input
                  type="number"
                  name="storage.shelfLife"
                  value={formData.storage.shelfLife}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[#ababab] text-sm mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
              placeholder="Additional notes..."
            />
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
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg hover:bg-[#e5a000] transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? "Saving..." : mode === "create" ? "Create" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

IngredientModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit"]).isRequired,
  ingredient: PropTypes.object,
  onSuccess: PropTypes.func.isRequired
};

export default IngredientModal;

