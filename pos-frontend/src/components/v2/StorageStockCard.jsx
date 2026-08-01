import PropTypes from "prop-types";

const StorageStockCard = ({ item }) => {
  const isOut = item.currentStock === 0;
  const isLow = !isOut && item.currentStock <= item.minStock;

  const borderClass = isOut
    ? "border-red-800/50 bg-red-950/20"
    : isLow
      ? "border-yellow-800/40 bg-yellow-950/15"
      : "border-[#343434] bg-[#1f1f1f]";
  const qtyClass = isOut ? "text-red-400" : isLow ? "text-yellow-400" : "text-green-400";

  return (
    <div className={`rounded-lg border px-3 py-2 ${borderClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-[#f5f5f5]">
            {item.name}
          </h3>
          <p className="mt-0.5 text-xs text-[#ababab] tabular-nums">
            {(item.averageCost ?? 0).toLocaleString("vi-VN")} VND
            {item.unit ? `/${item.unit}` : ""}
          </p>
        </div>
        <p className={`shrink-0 text-base font-bold tabular-nums leading-none ${qtyClass}`}>
          {item.currentStock}
          {item.unit ? (
            <span className="ml-1 text-[10px] font-normal text-[#ababab]">{item.unit}</span>
          ) : null}
        </p>
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
    averageCost: PropTypes.number,
    isActive: PropTypes.bool,
  }).isRequired,
};

export default StorageStockCard;
