import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { IoMdAdd, IoMdRemove } from "react-icons/io";
import {
  useGetCategoriesQuery,
  useGetDishByIdQuery,
  useGetDishStoresQuery,
  useCreateDishMutation,
  useUpdateDishMutation,
  useSaveDishStoresMutation,
} from "../../redux/api/endpoints/catalogEndpoints";
import { useGetAllStoresQuery } from "../../redux/api/endpoints/peopleEndpoints";
import { unwrapList } from "../../redux/api/queryResult";
import { enqueueSnackbar } from "notistack"
import PropTypes from "prop-types";
import BottomSheet from "../shared/BottomSheet";

const SIZE_OPTIONS = ['Small', 'Medium', 'Large', 'Extra Large', 'Regular'];

const storeIdOf = (store) => store?._id || store?.id;

const buildStoreRows = (stores, overlays) =>
  stores.map((store) => {
    const storeId = String(storeIdOf(store));
    const overlay = (overlays || []).find((row) => String(row.storeId) === storeId);
    return {
      storeId,
      name: store.name,
      code: store.code || "",
      exists: Boolean(overlay?.exists),
      enabled: overlay ? overlay.isAvailable !== false : true,
      price: typeof overlay?.price === "number" ? String(overlay.price) : "",
      sizePrices: Object.fromEntries(
        (overlay?.sizeVariants || []).map((variant) => [variant.size, String(variant.price)])
      ),
    };
  });

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
  const { data: storesResult, isLoading: storesLoading } = useGetAllStoresQuery(undefined, {
    skip: !isAdmin,
  });
  const { data: dishStores, isLoading: storeLoading } = useGetDishStoresQuery(dishId, {
    skip: !dishId || !isAdmin,
  });
  const [createDish, { isLoading: isCreating }] = useCreateDishMutation();
  const [updateDish, { isLoading: isUpdating }] = useUpdateDishMutation();
  const [saveDishStores, { isLoading: isSavingStores }] = useSaveDishStoresMutation();
  const dishLoading = isCreating || isUpdating || isSavingStores;
  
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
  const [storeRows, setStoreRows] = useState([]);

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
      setStoreRows([]);
    }
  }, [editingDish, catalogDish]);

  useEffect(() => {
    if (!isAdmin) return;
    const list = unwrapList(storesResult).filter((store) => store.isActive !== false);
    if (list.length === 0) return;
    setStoreRows(buildStoreRows(list, Array.isArray(dishStores) ? dishStores : []));
  }, [isAdmin, storesResult, dishStores]);

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
    
    if (isAdmin) {
      const invalidStorePrice = storeRows.some((row) => {
        if (submitData.hasSizeVariants) {
          return sizeVariants.some((variant) => {
            const value = row.sizePrices[variant.size];
            return value !== "" && value != null && Number(value) < 0;
          });
        }
        return row.price !== "" && Number(row.price) < 0;
      });
      if (invalidStorePrice) {
        enqueueSnackbar("Store prices must be non-negative", { variant: "error" });
        return;
      }
    }

    const overlays = storeRows.map((row) => {
      const filledSizes = submitData.hasSizeVariants
        ? sizeVariants
            .map((variant) => ({ size: variant.size, price: row.sizePrices[variant.size] }))
            .filter((variant) => variant.price !== "" && variant.price != null && !Number.isNaN(Number(variant.price)))
            .map((variant) => ({ size: variant.size, price: Number(variant.price) }))
        : [];
      const hasSizeOverride = Boolean(submitData.hasSizeVariants) && filledSizes.length > 0;
      const hasBaseOverride = !submitData.hasSizeVariants && row.price !== "";
      const inherit = row.enabled && !hasSizeOverride && !hasBaseOverride;
      if (inherit) {
        return { storeId: row.storeId, inherit: true };
      }
      return {
        storeId: row.storeId,
        inherit: false,
        isAvailable: row.enabled,
        price: submitData.hasSizeVariants ? null : row.price === "" ? null : Number(row.price),
        sizeVariants: submitData.hasSizeVariants ? filledSizes : [],
      };
    });

    try {
      if (editingDish) {
        await updateDish({
          dishId: editingDish._id,
          ...submitData,
        }).unwrap();

        if (isAdmin && overlays.length > 0) {
          await saveDishStores({ dishId: editingDish._id, overlays }).unwrap();
        }

        handleCloseModal();
        enqueueSnackbar("Dish updated successfully!", { variant: "success" });
      } else {
        const created = await createDish(submitData).unwrap();
        const createdId = created?._id || created?.id;
        if (isAdmin && createdId && overlays.length > 0) {
          await saveDishStores({ dishId: createdId, overlays }).unwrap();
        }
        handleCloseModal();
        enqueueSnackbar("Dish created successfully!", { variant: "success" });
        setDishData({ 
          name: "", price: "", category: "", note: "", 
          image: "", hasSizeVariants: false, isAvailable: true 
        });
        setSizeVariants([{ size: 'Medium', price: '', isDefault: true }]);
        setStoreRows([]);
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
      size="xl"
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

          {isAdmin && (
            <div className="space-y-3 rounded-lg border border-[#343434] p-4">
              <p className="text-sm font-medium text-[#f5f5f5]">Prices by store</p>
              <p className="text-xs text-[#ababab]">
                Empty price uses the default catalog price. Store price is used first if set.
              </p>
              {storesLoading || (Boolean(dishId) && storeLoading) ? (
                <p className="text-xs text-[#ababab]">Loading stores...</p>
              ) : storeRows.length === 0 ? (
                <p className="text-xs text-[#ababab]">No active stores.</p>
              ) : (
                <div className="space-y-3">
                  {storeRows.map((row) => (
                    <div key={row.storeId} className="rounded-lg bg-[#1f1f1f] p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#f5f5f5]">{row.name}</p>
                          {row.code ? (
                            <p className="text-xs text-[#ababab]">{row.code}</p>
                          ) : null}
                        </div>
                        <label className="flex shrink-0 items-center gap-2 text-xs text-[#ababab]">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setStoreRows((prev) =>
                                prev.map((item) =>
                                  item.storeId === row.storeId ? { ...item, enabled } : item
                                )
                              );
                            }}
                            className="w-4 h-4 text-yellow-400 bg-[#262626] border-gray-600 rounded focus:ring-yellow-400"
                          />
                          Sell here
                        </label>
                      </div>
                      {dishData.hasSizeVariants ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {sizeVariants.map((variant) => (
                            <label key={`${row.storeId}-${variant.size}`} className="block">
                              <span className="mb-1 block text-xs text-[#ababab]">
                                {variant.size} default {variant.price || "—"}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.sizePrices[variant.size] || ""}
                                placeholder={variant.price || "Inherit"}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setStoreRows((prev) =>
                                    prev.map((item) =>
                                      item.storeId === row.storeId
                                        ? {
                                            ...item,
                                            sizePrices: { ...item.sizePrices, [variant.size]: value },
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className="w-full bg-[#262626] text-white rounded p-2 text-sm focus:outline-none"
                              />
                            </label>
                          ))}
                        </div>
                      ) : (
                        <label className="block">
                          <span className="mb-1 block text-xs text-[#ababab]">Store price (₫)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.price}
                            placeholder={dishData.price || "Inherit"}
                            onChange={(e) => {
                              const value = e.target.value;
                              setStoreRows((prev) =>
                                prev.map((item) =>
                                  item.storeId === row.storeId ? { ...item, price: value } : item
                                )
                              );
                            }}
                            className="w-full bg-[#262626] text-white rounded p-2 text-sm focus:outline-none"
                          />
                        </label>
                      )}
                    </div>
                  ))}
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
