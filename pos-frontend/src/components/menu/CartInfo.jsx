import { useEffect, useRef } from "react";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { FaNotesMedical } from "react-icons/fa6";
import { MdAdd, MdRemove } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { removeItem, updateItemQuantity } from "../../redux/slices/cartSlice";
import { formatVND } from "../../utils";

const CartInfo = () => {
  const cartData = useSelector((state) => state.cart);
  const scrolLRef = useRef();
  const dispatch = useDispatch();

  useEffect(() => {
    if (scrolLRef.current) {
      scrolLRef.current.scrollTo({
        top: scrolLRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [cartData]);

  const handleRemove = (itemId) => {
    dispatch(removeItem(itemId));
  };

  const handleIncrement = (item) => {
    const newQuantity = item.quantity + 1;
    const newPrice = item.pricePerQuantity * newQuantity;
    
    dispatch(updateItemQuantity({
      id: item.id,
      quantity: newQuantity,
      price: newPrice
    }));
  };

  const handleDecrement = (item) => {
    if (item.quantity > 1) {
      const newQuantity = item.quantity - 1;
      const newPrice = item.pricePerQuantity * newQuantity;
      
      dispatch(updateItemQuantity({
        id: item.id,
        quantity: newQuantity,
        price: newPrice
      }));
    }
  };


  return (
    <div className="px-4 py-2">
      <h1 className="text-lg text-[#e4e4e4] font-semibold tracking-wide">
        Order Details
      </h1>
      <div
        className="mt-4 overflow-y-scroll scrollbar-hide h-auto "
        ref={scrolLRef}
      >
        {cartData.items?.length === 0 ? (
          <p className="text-[#ababab] text-sm flex justify-center items-center h-[380px]">
            Your cart is empty. Start adding items!
          </p>
        ) : (
          cartData.items?.map((item) => {
            return (
              <div key={item.id} className="bg-[#1f1f1f] rounded-lg px-4 py-4 mb-2">
                {/* Item Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h1 className="text-[#f5f5f5] font-semibold tracking-wide text-md leading-tight">
                      {item.name}
                    </h1>
                    {item.category && (
                      <p className="text-[#ababab] text-xs mt-1">
                        {item.category}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-[#ababab] text-xs mt-1 italic">
                        Note: {item.note}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    {/* Show original price if Happy Hour is applied */}
                    {item.originalPrice && item.originalPrice !== item.price ? (
                      <div>
                        <p className="text-[#ababab] text-sm line-through">
                          {formatVND(item.originalPrice)}
                        </p>
                        <p className="text-[#f6b100] text-lg font-bold">
                          {formatVND(item.price)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[#f6b100] text-lg font-bold">
                        {formatVND(item.price)}
                      </p>
                    )}
                    
                    {/* Show per-item price with Happy Hour indication */}
                    {item.originalPricePerQuantity && item.originalPricePerQuantity !== item.pricePerQuantity ? (
                      <div className="text-xs">
                        <p className="text-[#ababab] line-through">
                          {formatVND(item.originalPricePerQuantity)} each
                        </p>
                        <p className="text-green-400">
                          {formatVND(item.pricePerQuantity)} each (Happy Hour)
                        </p>
                      </div>
                    ) : (
                      <p className="text-[#ababab] text-xs">
                        {formatVND(item.pricePerQuantity)} each
                      </p>
                    )}
                  </div>
                </div>

                {/* Controls Section */}
                <div className="flex items-center justify-between">
                  {/* Left side - Action buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800 transition-colors"
                      title="Remove item"
                    >
                      <RiDeleteBin2Fill size={16} />
                    </button>
                    {item.note && (
                      <button
                        className="p-2 rounded-lg bg-blue-900/30 text-blue-400 border border-blue-800"
                        title="Has special instructions"
                      >
                        <FaNotesMedical size={16} />
                      </button>
                    )}
                  </div>

                  {/* Right side - Quantity controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDecrement(item)}
                      disabled={item.quantity <= 1}
                      className="p-2 rounded-lg bg-[#262626] text-[#f6b100] hover:bg-[#343434] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Decrease quantity"
                    >
                      <MdRemove size={16} />
                    </button>
                    
                    <div className="bg-[#262626] px-3 py-2 rounded-lg border border-[#343434] min-w-[50px]">
                      <span className="text-[#f5f5f5] font-bold text-center block">
                        {item.quantity}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleIncrement(item)}
                      className="p-2 rounded-lg bg-[#262626] text-[#f6b100] hover:bg-[#343434] transition-colors"
                      title="Increase quantity"
                    >
                      <MdAdd size={16} />
                    </button>
                  </div>
                </div>

                {/* Variant and Toppings info if available */}
                {(item.variant || item.toppings) && (
                  <div className="mt-3 pt-3 border-t border-[#343434]">
                    {/* Size variant info */}
                    {item.variant && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#ababab] text-xs">
                          Size: {item.variant.size}
                        </span>
                      </div>
                    )}
                    
                    {/* Toppings info */}
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[#ababab] text-xs font-medium">
                            Toppings:
                          </span>
                          <div className="flex-1 h-px bg-[#343434]"></div>
                        </div>
                        <div className="bg-[#262626] rounded-md p-2 space-y-1">
                          {item.toppings.map((topping, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-[#f6b100] rounded-full"></div>
                                <span className="text-[#f5f5f5] text-xs">
                                  {topping.name}
                                </span>
                                <span className="text-[#ababab] text-xs bg-[#343434] px-2 py-0.5 rounded-full">
                                  ×{topping.quantity}
                                </span>
                              </div>
                              <span className="text-[#f6b100] text-xs font-medium">
                                {formatVND(topping.totalPrice)}
                              </span>
                            </div>
                          ))}
                          
                          {/* Total toppings price */}
                          {item.toppings.length > 1 && (
                            <div className="pt-1 mt-2 border-t border-[#343434] flex items-center justify-between">
                              <span className="text-[#ababab] text-xs font-medium">
                                Toppings Total:
                              </span>
                              <span className="text-[#f6b100] text-xs font-bold">
                                {formatVND(item.toppings.reduce((sum, t) => sum + t.totalPrice, 0))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>




    </div>
  );
};

export default CartInfo;
