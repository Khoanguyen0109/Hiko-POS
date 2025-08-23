import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IoMdClose, IoMdAdd, IoMdRemove } from "react-icons/io";
import { useSelector, useDispatch } from "react-redux";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { createDish } from "../../redux/slices/dishSlice";
import { enqueueSnackbar } from "notistack"
import PropTypes from "prop-types";

const SIZE_OPTIONS = ['Small', 'Medium', 'Large', 'Extra Large', 'Regular'];

const DishModal = ({ setIsDishModalOpen }) => {
  const dispatch = useDispatch();
  const { items: categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const { loading: dishLoading } = useSelector((state) => state.dishes);
  
  const [dishData, setDishData] = useState({
    name: "",
    price: "",
    category: "",
    cost: "",
    note: "",
    image: "",
    hasSizeVariants: false,
    isAvailable: true,
  });

  const [sizeVariants, setSizeVariants] = useState([
    { size: 'Medium', price: '', cost: '', isDefault: true }
  ]);

  // Fetch categories when component mounts
  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDishData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSizeVariantChange = (index, field, value) => {
    setSizeVariants(prev => 
      prev.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  const addSizeVariant = () => {
    const usedSizes = sizeVariants.map(v => v.size);
    const availableSize = SIZE_OPTIONS.find(size => !usedSizes.includes(size));
    
    if (availableSize) {
      setSizeVariants(prev => [
        ...prev,
        { size: availableSize, price: '', cost: '', isDefault: false }
      ]);
    }
  };

  const removeSizeVariant = (index) => {
    if (sizeVariants.length > 1) {
      setSizeVariants(prev => {
        const newVariants = prev.filter((_, i) => i !== index);
        // If we removed the default variant, make the first one default
        if (prev[index].isDefault && newVariants.length > 0) {
          newVariants[0].isDefault = true;
        }
        return newVariants;
      });
    }
  };

  const setDefaultVariant = (index) => {
    setSizeVariants(prev =>
      prev.map((variant, i) => ({
        ...variant,
        isDefault: i === index
      }))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate size variants if enabled
    if (dishData.hasSizeVariants) {
      const invalidVariants = sizeVariants.filter(v => !v.price || v.price <= 0);
      if (invalidVariants.length > 0) {
        enqueueSnackbar("All size variants must have valid prices", { variant: "error" });
        return;
      }
    }
    
    // Prepare data for submission
    const submitData = {
      name: dishData.name,
      price: Number(dishData.price),
      category: dishData.category,
      cost: dishData.cost ? Number(dishData.cost) : 0,
      note: dishData.note || "",
      image: dishData.image || "",
      hasSizeVariants: dishData.hasSizeVariants,
      isAvailable: dishData.isAvailable,
    };

    // Add size variants if enabled
    if (dishData.hasSizeVariants) {
      submitData.sizeVariants = sizeVariants.map(variant => ({
        size: variant.size,
        price: Number(variant.price),
        cost: variant.cost ? Number(variant.cost) : 0,
        isDefault: variant.isDefault
      }));
    }
    
    try {
      const resultAction = await dispatch(createDish(submitData));
      
      if (createDish.fulfilled.match(resultAction)) {
        setIsDishModalOpen(false);
        enqueueSnackbar("Dish created successfully!", { variant: "success" });
        // Reset form
        setDishData({ 
          name: "", price: "", category: "", cost: "", note: "", 
          image: "", hasSizeVariants: false, isAvailable: true 
        });
        setSizeVariants([{ size: 'Medium', price: '', cost: '', isDefault: true }]);
      } else {
        const errorMessage = resultAction.payload || "Failed to create dish";
        enqueueSnackbar(errorMessage, { variant: "error" });
      }
    } catch (error) {
      enqueueSnackbar("An unexpected error occurred", { variant: "error" });
      console.log(error);
    }
  };

  const handleCloseModal = () => {
    setIsDishModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-[#262626] p-6 rounded-lg shadow-lg w-[480px] max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex justify-between item-center mb-4">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">Add Dish</h2>
          <button
            onClick={handleCloseModal}
            className="text-[#f5f5f5] hover:text-red-500"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Dish Name */}
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">
              Dish Name *
            </label>
            <div className="flex item-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
              <input
                type="text"
                name="name"
                value={dishData.name}
                onChange={handleInputChange}
                placeholder="Enter dish name"
                className="bg-transparent flex-1 text-white focus:outline-none"
                required
              />
            </div>
          </div>
          
          {/* Category */}
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">
              Category *
            </label>
            <div className="flex item-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
              <select
                name="category"
                value={dishData.category}
                onChange={handleInputChange}
                className="bg-transparent flex-1 text-white focus:outline-none w-full"
                required
                disabled={categoriesLoading}
              >
                <option value="" className="bg-[#1f1f1f] text-gray-400">
                  {categoriesLoading ? "Loading categories..." : "Select a category"}
                </option>
                {categories.map((category) => (
                  <option 
                    key={category._id} 
                    value={category._id} 
                    className="bg-[#1f1f1f] text-white"
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Has Size Variants Checkbox */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="hasSizeVariants"
              checked={dishData.hasSizeVariants}
              onChange={handleInputChange}
              className="w-4 h-4 text-yellow-400 bg-[#1f1f1f] border-gray-600 rounded focus:ring-yellow-400"
            />
            <label className="text-[#ababab] text-sm font-medium">
              This dish has different sizes
            </label>
          </div>

          {/* Size Variants Section */}
          {dishData.hasSizeVariants ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-[#ababab] text-sm font-medium">
                  Size Variants *
                </label>
                <button
                  type="button"
                  onClick={addSizeVariant}
                  disabled={sizeVariants.length >= SIZE_OPTIONS.length}
                  className="flex items-center space-x-1 text-yellow-400 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IoMdAdd size={16} />
                  <span className="text-xs">Add Size</span>
                </button>
              </div>

              {sizeVariants.map((variant, index) => (
                <div key={index} className="bg-[#1f1f1f] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="defaultVariant"
                        checked={variant.isDefault}
                        onChange={() => setDefaultVariant(index)}
                        className="w-4 h-4 text-yellow-400 bg-[#262626] border-gray-600"
                      />
                      <span className="text-xs text-[#ababab]">Default</span>
                    </div>
                    {sizeVariants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSizeVariant(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <IoMdRemove size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[#ababab] mb-1 text-xs">Size</label>
                      <select
                        value={variant.size}
                        onChange={(e) => handleSizeVariantChange(index, 'size', e.target.value)}
                        className="w-full bg-[#262626] text-white rounded p-2 text-sm focus:outline-none"
                      >
                        {SIZE_OPTIONS.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#ababab] mb-1 text-xs">Price *</label>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => handleSizeVariantChange(index, 'price', e.target.value)}
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        className="w-full bg-[#262626] text-white rounded p-2 text-sm focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#ababab] mb-1 text-xs">Cost</label>
                      <input
                        type="number"
                        value={variant.cost}
                        onChange={(e) => handleSizeVariantChange(index, 'cost', e.target.value)}
                        placeholder="Cost"
                        min="0"
                        step="0.01"
                        className="w-full bg-[#262626] text-white rounded p-2 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Standard Price & Cost for non-variant dishes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">
                    Price (₫) *
                  </label>
                  <div className="flex item-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="number"
                      name="price"
                      value={dishData.price}
                      onChange={handleInputChange}
                      placeholder="Enter selling price"
                      min="0"
                      step="0.01"
                      className="bg-transparent flex-1 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">
                    Cost (₫) <span className="text-xs">(Optional)</span>
                  </label>
                  <div className="flex item-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="number"
                      name="cost"
                      value={dishData.cost}
                      onChange={handleInputChange}
                      placeholder="Enter preparation cost"
                      min="0"
                      step="0.01"
                      className="bg-transparent flex-1 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Image URL */}
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">
              Image URL <span className="text-xs">(Optional)</span>
            </label>
            <div className="flex item-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
              <input
                type="url"
                name="image"
                value={dishData.image}
                onChange={handleInputChange}
                placeholder="Enter image URL"
                className="bg-transparent flex-1 text-white focus:outline-none"
              />
            </div>
          </div>
          
          {/* Note */}
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">
              Note <span className="text-xs">(Optional)</span>
            </label>
            <div className="flex item-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
              <textarea
                name="note"
                value={dishData.note}
                onChange={handleInputChange}
                placeholder="Add any notes about the dish"
                rows="3"
                className="bg-transparent flex-1 text-white focus:outline-none resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={dishLoading || categoriesLoading}
            className="w-full rounded-lg mt-6 mb-4 py-3 text-lg bg-yellow-400 text-gray-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dishLoading ? "Adding Dish..." : "Add Dish"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

DishModal.propTypes = {
  setIsDishModalOpen: PropTypes.func.isRequired
}

export default DishModal;
