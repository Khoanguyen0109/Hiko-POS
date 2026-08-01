export const buildStorageItemOptions = (items) =>
  items.map((item) => ({
    value: item._id,
    label: `${item.name} (${item.code}) - Stock: ${item.currentStock} ${item.unit}`,
    item,
  }));

export const filterStorageItemOption = (option, query) => {
  const normalizedQuery = query.toLowerCase();
  const { name, code } = option.item;
  return (
    name.toLowerCase().includes(normalizedQuery) ||
    code.toLowerCase().includes(normalizedQuery)
  );
};

export const renderStorageItemOption = (option) => (
  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
    <span className="font-medium">{option.item.name}</span>
    <span className="text-[#ababab]">({option.item.code})</span>
    <span className="text-[#ababab] text-xs">
      Stock: {option.item.currentStock} {option.item.unit}
    </span>
  </div>
);

export const buildRecipeStorageItemOptions = (items, formatVND) =>
  items.map((item) => ({
    value: item._id,
    label: formatVND
      ? `${item.name} (${item.code})`
      : `${item.name} (${item.code}) - ${item.unit}`,
    item,
  }));

export const renderRecipeStorageItemOption = (option, formatVND, formatPackageLabel) => {
  const packageLabel = formatPackageLabel?.(option.item);
  const costLabel = formatVND ? formatVND(option.item.averageCost || 0) : null;

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-medium">{option.item.name}</span>
        <span className="text-[#ababab]">({option.item.code})</span>
        {costLabel ? (
          <span className="text-brand text-xs">
            {costLabel}/{option.item.unit}
          </span>
        ) : null}
      </div>
      {packageLabel ? (
        <span className="text-[#ababab] text-xs">{packageLabel}</span>
      ) : null}
    </div>
  );
};
