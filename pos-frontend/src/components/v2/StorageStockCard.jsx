import PropTypes from "prop-types";

const StorageStockCard = ({ item }) => {
  const isOut = item.currentStock === 0;
  const isLow = !isOut && item.currentStock <= item.minStock;

  const statusLabel = isOut ? "Out of stock" : isLow ? "Low stock" : "In stock";
  const borderClass = isOut
    ? "border-red-800/50 bg-red-950/20"
    : isLow
    ? "border-yellow-800/40 bg-yellow-950/15"
    : "border-[#343434] bg-[#1f1f1f]";
  const qtyClass = isOut ? "text-red-400" : isLow ? "text-yellow-400" : "text-green-400";
  const badgeClass = isOut
    ? "bg-red-900/40 text-red-300"
    : isLow
    ? "bg-yellow-900/40 text-yellow-300"
    : "bg-green-900/30 text-green-400";

  return (
    <div className={`rounded-xl border p-4 ${borderClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-[#f5f5f5]">{item.name}</h3>
          <p className="mt-1 text-xs text-[#ababab]">
            Min stock: {item.minStock}
            {item.unit ? ` ${item.unit}` : ""}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#6a6a6a]">Current qty</p>
          <p className={`text-2xl font-bold ${qtyClass}`}>{item.currentStock}</p>
        </div>
        {!isOut && item.minStock > 0 && (
          <div className="w-24">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#1a1a1a]">
              <div
                className={`h-full rounded-full ${isLow ? "bg-yellow-400" : "bg-green-400"}`}
                style={{
                  width: `${Math.min((item.currentStock / item.minStock) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

StorageStockCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string.isRequired,
    currentStock: PropTypes.number.isRequired,
    minStock: PropTypes.number,
    unit: PropTypes.string,
    isActive: PropTypes.bool,
  }).isRequired,
};

export default StorageStockCard;
