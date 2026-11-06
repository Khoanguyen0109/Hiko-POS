import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { IoMdAdd, IoMdRemove } from "react-icons/io";
import {
  useGetCategoriesQuery,
  useGetDishByIdQuery,
  useGetDishStoreQuery,
  useCreateDishMutation,
  useUpdateDishMutation,
  useUpsertDishStoreMutation,
  useDeleteDishStoreMutation,
} from "../../redux/api/endpoints/catalogEndpoints";
import { unwrapList } from "../../redux/api/queryResult";
import { enqueueSnackbar } from "notistack"
import PropTypes from "prop-types";
import BottomSheet from "../shared/BottomSheet";

const SIZE_OPTIONS = ['Small', 'Medium', 'Large', 'Extra Large', 'Regular'];

const DishModal = ({ setIsDishModalOpen, setIsDishesModalOpen, editingDish }) => {
  const isAdmin = useSelector((state) => state.user.role) === "Admin";
  const dishId = editingDish?._id;
  const { data: categoriesResult, isLoading: categoriesLoading } =
    useGetCategoriesQuery();
  const categories = unwrapList(categoriesResult);
  const { data: catalogDish, isLoading: catalogLoading } = useGetDishByIdQuery(
    dishId,
    { skip: !dishId }
  );
  const { data: storeSettings, isLoading: storeLoading } = useGetDishStoreQuery(
    dishId,
    { skip: !dishId || !isAdmin }
  );
  const [createDish, { isLoading: isCreating }] = useCreateDishMutation();
  const [updateDish, { isLoading: isUpdating }] = useUpdateDishMutation();
  const [upsertDishStore, { isLoading: isSavingStore }] = useUpsertDishStoreMutation();
  const [deleteDishStore, { isLoading: isClearingStore }] = useDeleteDishStoreMutation();
  const dishLoading = isCreating || isUpdating || isSavingStore || isClearingStore;
  
  const [dishData, setDishData] = useState({
    name: "",
    price: "",
    category: "",
    note: "",
    image: "",
    hasSizeVariants: false,
    isAvailable: true,
  });

  const [sizeVariants, setSizeVariants] = useState([
    { size: 'Medium', price: '', isDefault: true }
  ]);
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [storePrice, setStorePrice] = useState("");
  const [storeSizePrices, setStoreSizePrices] = useState([]);

  // Initialize catalog fields from GET /dish/:id so store prices are never saved as defaults
  useEffect(() => {
    const source = catalogDish || editingDish;
    if (editingDish && source) {
      setDishData({
        name: source.name || "",
        price: source.price?.toString() || "",
        category: source.category?._id || source.category || "",
        note: source.note || "",
        image: source.image || "",
        hasSizeVariants: source.hasSizeVariants || false,
        isAvailable: source.isAvailable !== undefined ? source.isAvailable : true,
      });

      if (source.hasSizeVariants && source.sizeVariants?.length > 0) {
        setSizeVariants(source.sizeVariants.map(variant => ({
          size: variant.size,
          price: variant.price?.toString() || '',
          isDefault: variant.isDefault || false
        })));
      } else {
        setSizeVariants([{ size: 'Medium', price: '', isDefault: true }]);
      }
    } else if (!editingDish) {
      setDishData({
        name: "",
        price: "",
        category: "",
        note: "",
        image: "",
        hasSizeVariants: false,
        isAvailable: true,
      });
      setSizeVariants([{ size: 'Medium', price: '', isDefault: true }]);
      setStoreEnabled(true);
      setStorePrice("");
      setStoreSizePrices([]);
    }
  }, [editingDish, catalogDish]);

  useEffect(() => {
    if (!editingDish || !storeSettings) return;
    setStoreEnabled(storeSettings.isAvailable !== false);
    setStorePrice(typeof storeSettings.price === "number" ? String(storeSettings.price) : "");
    const overlayBySize = Object.fromEntries(
      (storeSettings.sizeVariants || []).map((variant) => [variant.size, String(variant.price)])
    );
    const catalogSizes = (catalogDish?.sizeVariants || editingDish.sizeVariants || []).map(
      (variant) => variant.size
    );
    setStoreSizePrices(
      catalogSizes.map((size) => ({ size, price: overlayBySize[size] || "" }))
    );
  }, [editingDish, storeSettings, catalogDish]);

  // Define handleCloseModal first with useCallback
  const handleCloseModal = useCallback(() => {
    // Use the correct close function based on which prop is provided
    if (setIsDishModalOpen) {
      setIsDishModalOpen(false);
    } else if (setIsDishesModalOpen) {
      setIsDishesModalOpen(false);
    }
  }, [setIsDishModalOpen, setIsDishesModalOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleCloseModal]);

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
        { size: availableSize, price: '', isDefault: false }
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
        isDefault: variant.isDefault
      }));
    }
    
    const filledStoreSizes = storeSizePrices.filter(
      (variant) => variant.price !== "" && !Number.isNaN(Number(variant.price))
    );
    if (editingDish && isAdmin && dishData.hasSizeVariants) {
      const invalidStorePrices = filledStoreSizes.filter((variant) => Number(variant.price) < 0);
      if (invalidStorePrices.length > 0) {
        enqueueSnackbar("Store size prices must be non-negative", { variant: "error" });
        return;
      }
    }

    try {
      if (editingDish) {
        await updateDish({
          dishId: editingDish._id,
          ...submitData,
        }).unwrap();

        if (isAdmin) {
          const hasSizeOverride = Boolean(submitData.hasSizeVariants) && filledStoreSizes.length > 0;
          const hasBaseOverride = !submitData.hasSizeVariants && storePrice !== "";
          const inheritAll = storeEnabled && !hasSizeOverride && !hasBaseOverride;

          if (inheritAll) {
            if (storeSettings?.exists) {
              await deleteDishStore(editingDish._id).unwrap();
            }
          } else {
            const overlayPayload = { isAvailable: storeEnabled };
            if (submitData.hasSizeVariants) {
              overlayPayload.price = null;
              overlayPayload.sizeVariants = filledStoreSizes.map((variant) => ({
                size: variant.size,
                price: Number(variant.price),
              }));
            } else {
              overlayPayload.price = storePrice === "" ? null : Number(storePrice);
              overlayPayload.sizeVariants = [];
            }
            await upsertDishStore({
              dishId: editingDish._id,
              ...overlayPayload,
            }).unwrap();
          }
        }

        handleCloseModal();
        enqueueSnackbar("Dish updated successfully!", { variant: "success" });
      } else {
        await createDish(submitData).unwrap();
        handleCloseModal();
        enqueueSnackbar("Dish created successfully!", { variant: "success" });
        setDishData({ 
          name: "", price: "", category: "", note: "", 
          image: "", hasSizeVariants: false, isAvailable: true 
        });
        setSizeVariants([{ size: 'Medium', price: '', isDefault: true }]);
      }
    } catch (error) {
      enqueueSnackbar(
        error?.data || error || (editingDish ? "Failed to update dish" : "Failed to create dish"),
        { variant: "error" }
      );
      console.log(error);
    }
  };

  return (
    <BottomSheet
      isOpen
      onClose={handleCloseModal}
      title={editingDish ? "Edit Dish" : "Add Dish"}
      size="md"
      bodyClassName="p-4 sm:p-6"
    >
      <form onSubmit={handleSubmit} className="mt-2 space-y-4">
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

                  <div className="grid grid-cols-2 gap-3">
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Standard Price for non-variant dishes */}
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

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="isAvailable"
              checked={dishData.isAvailable}
              onChange={handleInputChange}
              className="w-4 h-4 text-yellow-400 bg-[#1f1f1f] border-gray-600 rounded focus:ring-yellow-400"
            />
            <label className="text-[#ababab] text-sm font-medium">
              Available at all stores
            </label>
          </div>

          {editingDish && isAdmin && (
            <div className="space-y-3 rounded-lg border border-[#343434] p-4">
              <p className="text-sm font-medium text-[#f5f5f5]">This store</p>
              <p className="text-xs text-[#ababab]">
                Leave prices empty to use the default catalog price. Store price is used first.
              </p>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={storeEnabled}
                  onChange={(e) => setStoreEnabled(e.target.checked)}
                  className="w-4 h-4 text-yellow-400 bg-[#1f1f1f] border-gray-600 rounded focus:ring-yellow-400"
                />
                <label className="text-[#ababab] text-sm font-medium">
                  Available at this store
                </label>
              </div>
              {storeLoading ? (
                <p className="text-xs text-[#ababab]">Loading store prices...</p>
              ) : dishData.hasSizeVariants ? (
                <div className="space-y-2">
                  {sizeVariants.map((variant) => {
                    const storeRow = storeSizePrices.find((row) => row.size === variant.size);
                    return (
                      <div key={variant.size} className="grid grid-cols-2 gap-3">
                        <label className="flex items-center text-xs text-[#ababab]">
                          {variant.size} default {variant.price || "—"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={storeRow?.price || ""}
                          placeholder={variant.price || "Inherit"}
                          onChange={(e) => {
                            const value = e.target.value;
                            setStoreSizePrices((prev) => {
                              const next = prev.filter((row) => row.size !== variant.size);
                              return [...next, { size: variant.size, price: value }];
                            });
                          }}
                          className="w-full bg-[#262626] text-white rounded p-2 text-sm focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <label className="block text-[#ababab] mb-1 text-xs">
                    Store price (₫)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={storePrice}
                    placeholder={dishData.price || "Inherit"}
                    onChange={(e) => setStorePrice(e.target.value)}
                    className="w-full bg-[#262626] text-white rounded p-2 text-sm focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={dishLoading || categoriesLoading || Boolean(editingDish && catalogLoading)}
            className="w-full rounded-lg mt-6 mb-4 py-3 text-lg bg-yellow-400 text-gray-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dishLoading 
              ? (editingDish ? "Updating Dish..." : "Adding Dish...") 
              : (editingDish ? "Update Dish" : "Add Dish")
            }
          </button>
        </form>
    </BottomSheet>
  );
};

DishModal.propTypes = {
  setIsDishModalOpen: PropTypes.func,
  setIsDishesModalOpen: PropTypes.func,
  editingDish: PropTypes.object,
}

export default DishModal;
