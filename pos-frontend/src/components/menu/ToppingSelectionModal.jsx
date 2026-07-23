import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { MdAdd, MdRemove } from "react-icons/md";
import BottomSheet from "../shared/BottomSheet";
import { fetchToppingsByCategory, addToppingToItem, removeToppingFromItem } from "../../redux/slices/toppingSlice";
import { formatVND } from "../../utils";

const ToppingSelectionModal = ({ isOpen, onClose, dish, onConfirm }) => {
  const dispatch = useDispatch();
  const { toppingsByCategory, loading, error } = useSelector((state) => state.toppings);
  const selectedToppings = useSelector((state) => state.toppings.selectedToppings[dish?._id] || []);

  const [localToppings, setLocalToppings] = useState({});
  const [totalToppingsPrice, setTotalToppingsPrice] = useState(0);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchToppingsByCategory());
      
      // Initialize local toppings from Redux state
      const initialToppings = {};
      selectedToppings.forEach(({ toppingId, quantity }) => {
        initialToppings[toppingId] = quantity;
      });
      setLocalToppings(initialToppings);
    }
  }, [isOpen, dispatch, selectedToppings]);

  useEffect(() => {
    // Calculate total toppings price
    let total = 0;
    Object.entries(localToppings).forEach(([toppingId, quantity]) => {
      const topping = findToppingById(toppingId);
      if (topping && quantity > 0) {
        total += topping.price * quantity;
      }
    });
    setTotalToppingsPrice(total);
  }, [localToppings, toppingsByCategory]);

  const findToppingById = (toppingId) => {
    for (const category of Object.values(toppingsByCategory)) {
      const topping = category.find(t => t._id === toppingId);
      if (topping) return topping;
    }
    return null;
  };

  const handleToppingQuantityChange = (toppingId, change) => {
    setLocalToppings(prev => {
      const currentQuantity = prev[toppingId] || 0;
      const newQuantity = Math.max(0, Math.min(5, currentQuantity + change)); // Max 5 per topping
      
      if (newQuantity === 0) {
        const { [toppingId]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [toppingId]: newQuantity
      };
    });
  };

  const handleConfirm = () => {
    // Update Redux state with selected toppings
    Object.entries(localToppings).forEach(([toppingId, quantity]) => {
      if (quantity > 0) {
        dispatch(addToppingToItem({
          dishId: dish._id,
          toppingId,
          quantity
        }));
      } else {
        dispatch(removeToppingFromItem({
          dishId: dish._id,
          toppingId
        }));
      }
    });

    // Remove toppings that are no longer selected
    selectedToppings.forEach(({ toppingId }) => {
      if (!localToppings[toppingId] || localToppings[toppingId] === 0) {
        dispatch(removeToppingFromItem({
          dishId: dish._id,
          toppingId
        }));
      }
    });

    onConfirm(localToppings);
    onClose();
  };

  const handleCancel = () => {
    // Reset local toppings to Redux state
    const resetToppings = {};
    selectedToppings.forEach(({ toppingId, quantity }) => {
      resetToppings[toppingId] = quantity;
    });
    setLocalToppings(resetToppings);
    onClose();
  };

  const footer = (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[#f5f5f5]">
          <span className="text-sm">Toppings Total:</span>
          <span className="ml-2 text-lg font-bold text-[#f6b100]">
            {formatVND(totalToppingsPrice)}
          </span>
        </div>
        <div className="text-xs text-[#ababab]">
          {Object.values(localToppings).reduce((sum, qty) => sum + qty, 0)} items selected
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCancel}
          className="flex-1 rounded-lg border border-[#343434] bg-[#262626] px-4 py-3 font-medium text-[#ababab] transition-colors hover:bg-[#343434] hover:text-[#f5f5f5]"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 rounded-lg bg-[#f6b100] px-4 py-3 font-bold text-[#1f1f1f] transition-colors hover:bg-[#e09900]"
        >
          Confirm Toppings
        </button>
      </div>
    </>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleCancel}
      title={
        <div>
          <h2 className="text-xl font-bold text-[#f5f5f5]">Select Toppings</h2>
          <p className="mt-1 text-sm text-[#ababab]">for {dish?.name}</p>
        </div>
      }
      footer={footer}
      size="lg"
      bodyClassName="p-4 sm:p-6"
    >
          {loading && (
            <div className="text-center py-8">
              <div className="text-[#ababab]">Loading toppings...</div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-400">Error: {error}</div>
            </div>
          )}

          {!loading && !error && Object.keys(toppingsByCategory).length === 0 && (
            <div className="text-center py-8">
              <div className="text-[#ababab]">No toppings available</div>
            </div>
          )}

          {!loading && !error && Object.keys(toppingsByCategory).length > 0 && (
            <div className="space-y-6">
              {Object.entries(toppingsByCategory).map(([category, toppings]) => (
                <div key={category}>
                  <h3 className="text-[#f6b100] text-lg font-semibold mb-3 border-b border-[#343434] pb-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {toppings.filter(topping => topping.isAvailable).map((topping) => {
                      const quantity = localToppings[topping._id] || 0;
                      return (
                        <div
                          key={topping._id}
                          className={`p-4 rounded-lg border transition-colors ${
                            quantity > 0
                              ? 'bg-[#f6b100]/10 border-[#f6b100]'
                              : 'bg-[#262626] border-[#343434] hover:border-[#f6b100]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-[#f5f5f5] font-medium">{topping.name}</h4>
                              <p className="text-[#ababab] text-sm">{topping.description}</p>
                              <p className="text-[#f6b100] font-semibold">{formatVND(topping.price)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleToppingQuantityChange(topping._id, -1)}
                                disabled={quantity === 0}
                                className="w-8 h-8 rounded-full bg-[#343434] flex items-center justify-center text-[#f5f5f5] hover:bg-[#f6b100] hover:text-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <MdRemove size={16} />
                              </button>
                              
                              <span className="text-[#f5f5f5] font-medium min-w-[2rem] text-center">
                                {quantity}
                              </span>
                              
                              <button
                                onClick={() => handleToppingQuantityChange(topping._id, 1)}
                                disabled={quantity >= 5}
                                className="w-8 h-8 rounded-full bg-[#343434] flex items-center justify-center text-[#f5f5f5] hover:bg-[#f6b100] hover:text-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <MdAdd size={16} />
                              </button>
                            </div>
                            
                            {quantity > 0 && (
                              <div className="text-[#f6b100] font-semibold">
                                {formatVND(topping.price * quantity)}
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
    </BottomSheet>
  );
};

ToppingSelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dish: PropTypes.object,
  onConfirm: PropTypes.func.isRequired
};

export default ToppingSelectionModal;
