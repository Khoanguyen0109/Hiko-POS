import { MdAdd, MdRemove, MdDelete } from "react-icons/md";
import { MdReceipt } from "react-icons/md";
import { formatVND } from "../../utils";
import PropTypes from "prop-types";

const OrderItemEditor = ({ item, index, onQuantityChange, onRemove }) => {
  const handleIncrement = () => {
    onQuantityChange(index, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity <= 1) return;
    onQuantityChange(index, item.quantity - 1);
  };

  const pricePerQty = item.pricePerQuantity ?? item.price / (item.quantity || 1);
  const itemPrice = item.price ?? pricePerQty * item.quantity;

  return (
    <div className="flex items-start gap-4 p-4 bg-[#262626] rounded-lg border border-[#343434]">
      <div className="w-16 h-16 bg-[#343434] rounded-lg flex-shrink-0 flex items-center justify-center">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <MdReceipt className="text-[#ababab]" size={24} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="text-[#f5f5f5] font-medium">{item.name}</h3>
            {item.category && (
              <p className="text-[#ababab] text-xs">{item.category}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[#f6b100] font-semibold">{formatVND(itemPrice)}</p>
            <p className="text-[#ababab] text-xs">
              {formatVND(pricePerQty)} × {item.quantity}
            </p>
          </div>
        </div>

        {(item.variant || (item.toppings && item.toppings.length > 0)) && (
          <div className="mt-2 pt-2 border-t border-[#343434] space-y-1">
            {item.variant?.size && (
              <p className="text-[#ababab] text-xs">Size: {item.variant.size}</p>
            )}
            {item.toppings?.length > 0 && (
              <p className="text-[#ababab] text-xs">
                Toppings: {item.toppings.map((t) => t.name).join(", ")}
              </p>
            )}
          </div>
        )}

        {item.note && (
          <p className="mt-2 text-[#ababab] text-xs">Note: {item.note}</p>
        )}

        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-2 bg-[#1f1f1f] rounded-lg p-1 border border-[#343434]">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={item.quantity <= 1}
              className="h-8 w-8 rounded-md bg-[#262626] text-[#f6b100] hover:bg-[#343434] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Decrease quantity"
            >
              <MdRemove size={16} />
            </button>
            <span className="text-[#f5f5f5] font-semibold min-w-[28px] text-center text-sm">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              className="h-8 w-8 rounded-md bg-[#262626] text-[#f6b100] hover:bg-[#343434] flex items-center justify-center transition-colors"
              aria-label="Increase quantity"
            >
              <MdAdd size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="h-8 w-8 rounded-md text-red-400 hover:bg-red-900/30 flex items-center justify-center transition-colors"
            aria-label="Remove item"
            title="Remove"
          >
            <MdDelete size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

OrderItemEditor.propTypes = {
  index: PropTypes.number.isRequired,
  item: PropTypes.shape({
    dishId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    name: PropTypes.string.isRequired,
    price: PropTypes.number,
    pricePerQuantity: PropTypes.number,
    quantity: PropTypes.number.isRequired,
    category: PropTypes.string,
    image: PropTypes.string,
    variant: PropTypes.shape({ size: PropTypes.string }),
    toppings: PropTypes.array,
    note: PropTypes.string,
  }).isRequired,
  onQuantityChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default OrderItemEditor;
