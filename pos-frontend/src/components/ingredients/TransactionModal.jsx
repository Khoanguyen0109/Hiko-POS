import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { MdClose } from "react-icons/md";
import {
  createImportTransaction,
  createExportTransaction,
  createAdjustmentTransaction,
  fetchIngredients
} from "../../redux/slices/ingredientSlice";
import { enqueueSnackbar } from "notistack";

const TransactionModal = ({ isOpen, onClose, type, ingredient, onSuccess }) => {
  const dispatch = useDispatch();
  const { items: ingredients } = useSelector((state) => state.ingredients);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    ingredientId: "",
    quantity: 0,
    unitCost: 0,
    supplierName: "",
    batchNumber: "",
    expiryDate: "",
    reason: "PRODUCTION",
    notes: ""
  });

  useEffect(() => {
    if (isOpen && ingredients.length === 0) {
      dispatch(fetchIngredients({ limit: 1000 }));
    }
  }, [isOpen, ingredients.length, dispatch]);

  useEffect(() => {
    if (ingredient) {
      setFormData(prev => ({
        ...prev,
        ingredientId: ingredient._id
      }));
    } else {
      resetForm();
    }
  }, [ingredient, isOpen]);

  const resetForm = () => {
    setFormData({
      ingredientId: "",
      quantity: 0,
      unitCost: 0,
      supplierName: "",
      batchNumber: "",
      expiryDate: "",
      reason: "PRODUCTION",
      notes: ""
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === "IMPORT") {
        await dispatch(createImportTransaction({
          ingredientId: formData.ingredientId,
          quantity: parseFloat(formData.quantity),
          unitCost: parseFloat(formData.unitCost),
          supplierName: formData.supplierName,
          batchNumber: formData.batchNumber,
          expiryDate: formData.expiryDate || undefined,
          notes: formData.notes
        })).unwrap();
        enqueueSnackbar("Stock imported successfully!", { variant: "success" });
      } else if (type === "EXPORT") {
        await dispatch(createExportTransaction({
          ingredientId: formData.ingredientId,
          quantity: parseFloat(formData.quantity),
          reason: formData.reason,
          notes: formData.notes
        })).unwrap();
        enqueueSnackbar("Stock exported successfully!", { variant: "success" });
      } else if (type === "ADJUSTMENT") {
        await dispatch(createAdjustmentTransaction({
          ingredientId: formData.ingredientId,
          quantity: parseFloat(formData.quantity),
          reason: formData.notes,
          notes: formData.notes
        })).unwrap();
        enqueueSnackbar("Stock adjusted successfully!", { variant: "success" });
      }
      onSuccess();
    } catch (error) {
      enqueueSnackbar(error || "Transaction failed", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedIngredient = ingredients.find(i => i._id === formData.ingredientId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1f1f] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <h2 className="text-[#f5f5f5] text-xl font-bold">
            {type === "IMPORT" ? "Import Stock" : type === "EXPORT" ? "Export Stock" : "Adjust Stock"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Ingredient Selection */}
          <div>
            <label className="block text-[#ababab] text-sm mb-2">
              Ingredient <span className="text-red-500">*</span>
            </label>
            <select
              name="ingredientId"
              value={formData.ingredientId}
              onChange={handleChange}
              required
              disabled={!!ingredient}
              className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100] disabled:opacity-50"
            >
              <option value="">Select an ingredient</option>
              {ingredients.map(ing => (
                <option key={ing._id} value={ing._id}>
                  {ing.name} ({ing.code}) - Stock: {ing.inventory?.currentStock || 0} {ing.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Info */}
          {selectedIngredient && (
            <div className="bg-[#262626] border border-[#343434] rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#ababab]">Current Stock:</span>
                  <p className="text-[#f5f5f5] font-semibold">
                    {selectedIngredient.inventory?.currentStock || 0} {selectedIngredient.unit}
                  </p>
                </div>
                <div>
                  <span className="text-[#ababab]">Avg Cost:</span>
                  <p className="text-[#f5f5f5] font-semibold">
                    {selectedIngredient.costs?.averageCost || 0} VND/{selectedIngredient.unit}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-[#ababab] text-sm mb-2">
              Quantity {selectedIngredient && `(${selectedIngredient.unit})`} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
              placeholder="Enter quantity"
            />
          </div>

          {/* Import Specific Fields */}
          {type === "IMPORT" && (
            <>
              <div>
                <label className="block text-[#ababab] text-sm mb-2">
                  Unit Cost (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                  placeholder="Cost per unit"
                />
                {formData.quantity > 0 && formData.unitCost > 0 && (
                  <p className="text-[#ababab] text-xs mt-1">
                    Total Cost: {(formData.quantity * formData.unitCost).toLocaleString('vi-VN')} VND
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#ababab] text-sm mb-2">Supplier Name</label>
                  <input
                    type="text"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleChange}
                    className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <label className="block text-[#ababab] text-sm mb-2">Batch Number</label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleChange}
                    className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                    placeholder="Batch #"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-2">Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                />
              </div>
            </>
          )}

          {/* Export Specific Fields */}
          {type === "EXPORT" && (
            <div>
              <label className="block text-[#ababab] text-sm mb-2">Reason</label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
              >
                <option value="PRODUCTION">Production (Making Dishes)</option>
                <option value="WASTE">Waste/Spoiled</option>
                <option value="DAMAGE">Damaged</option>
                <option value="THEFT">Theft/Missing</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[#ababab] text-sm mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
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
              {loading ? "Processing..." : type === "IMPORT" ? "Import Stock" : type === "EXPORT" ? "Export Stock" : "Adjust Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

TransactionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(["IMPORT", "EXPORT", "ADJUSTMENT"]).isRequired,
  ingredient: PropTypes.object,
  onSuccess: PropTypes.func.isRequired
};

export default TransactionModal;

