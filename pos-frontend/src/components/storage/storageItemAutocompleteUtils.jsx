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
