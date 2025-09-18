import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { MdClose, MdAdd, MdRemove } from "react-icons/md";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-2xl max-h-[90vh] border border-[#343434] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <div>
            <h2 className="text-[#f5f5f5] text-xl font-bold">Select Toppings</h2>
            <p className="text-[#ababab] text-sm mt-1">for {dish?.name}</p>
          </div>
          <button
            onClick={handleCancel}
            className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
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
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#343434]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[#f5f5f5]">
              <span className="text-sm">Toppings Total:</span>
              <span className="ml-2 text-lg font-bold text-[#f6b100]">
                {formatVND(totalToppingsPrice)}
              </span>
            </div>
            <div className="text-[#ababab] text-xs">
              {Object.values(localToppings).reduce((sum, qty) => sum + qty, 0)} items selected
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-[#262626] border border-[#343434] rounded-lg text-[#ababab] font-medium hover:bg-[#343434] hover:text-[#f5f5f5] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-bold hover:bg-[#e09900] transition-colors"
            >
              Confirm Toppings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ToppingSelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dish: PropTypes.object,
  onConfirm: PropTypes.func.isRequired
};

export default ToppingSelectionModal;
