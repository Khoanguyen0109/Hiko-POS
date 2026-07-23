const DEFAULT_PILL = "bg-gray-900/30 text-gray-400 border border-gray-700";

export const STATUS_COLORS = {
  completed: {
    stripe: "bg-green-500",
    pill: "bg-green-900/30 text-green-400 border border-green-800",
  },
  progress: {
    stripe: "bg-blue-500",
    pill: "bg-blue-900/30 text-blue-400 border border-blue-800",
  },
  pending: {
    stripe: "bg-amber-500",
    pill: "bg-amber-900/30 text-amber-400 border border-amber-800",
  },
  cancelled: {
    stripe: "bg-red-500",
    pill: "bg-red-900/30 text-red-400 border border-red-800",
  },
};

export const PAYMENT_COLORS = {
  Cash: {
    pill: "bg-green-900/30 text-green-400 border border-green-800",
    label: "Cash",
  },
  Banking: {
    pill: "bg-purple-900/30 text-purple-400 border border-purple-800",
    label: "Banking",
  },
  Card: {
    pill: "bg-blue-900/30 text-blue-400 border border-blue-800",
    label: "Card",
  },
  Unpaid: {
    pill: "bg-gray-900/30 text-gray-400 border border-gray-700",
    label: "Unpaid",
  },
};

export const VENDOR_COLORS = {
  Grab: {
    pill: "bg-green-900/30 text-green-400 border border-green-800",
    label: "Grab",
  },
  Shopee: {
    pill: "bg-orange-900/30 text-orange-400 border border-orange-800",
    label: "Shopee",
  },
  BeFood: {
    pill: "bg-purple-900/30 text-purple-400 border border-purple-800",
    label: "BeFood",
  },
  XanhSM: {
    pill: "bg-teal-900/30 text-teal-400 border border-teal-800",
    label: "XanhSM",
  },
  None: {
    pill: "bg-slate-900/30 text-slate-300 border border-slate-700",
    label: "Walk-in",
  },
};

export const ITEM_CATEGORY_COLORS = {
  matcha: {
    chip: "bg-emerald-900/40 text-emerald-300 border border-emerald-800",
    label: "Matcha",
  },
  coffee: {
    chip: "bg-amber-900/40 text-amber-300 border border-amber-800",
    label: "Coffee",
  },
  pastry: {
    chip: "bg-pink-900/40 text-pink-300 border border-pink-800",
    label: "Pastry",
  },
  food: {
    chip: "bg-orange-900/40 text-orange-300 border border-orange-800",
    label: "Food",
  },
  default: {
    chip: "bg-[#343434] text-[#ababab] border border-[#4a4a4a]",
    label: "Item",
  },
};

const MATCHA_KEYWORDS = ["matcha", "trà", "tra", "tea"];
const COFFEE_KEYWORDS = ["coffee", "cà phê", "ca phe", "espresso", "latte"];
const PASTRY_KEYWORDS = ["pastry", "bánh", "banh", "cake", "topping", "dessert", "cookie", "croissant"];
const FOOD_KEYWORDS = ["food", "món", "mon", "dish", "meal", "rice", "noodle", "sandwich"];

function matchesKeywords(text, keywords) {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

export function getStatusTheme(status) {
  return STATUS_COLORS[status] || {
    stripe: "bg-gray-500",
    pill: DEFAULT_PILL,
  };
}

export function getPaymentTheme(paymentMethod) {
  if (!paymentMethod) {
    return PAYMENT_COLORS.Unpaid;
  }
  return PAYMENT_COLORS[paymentMethod] || PAYMENT_COLORS.Unpaid;
}

export function getVendorTheme(vendor) {
  if (!vendor || vendor === "None") {
    return VENDOR_COLORS.None;
  }
  return VENDOR_COLORS[vendor] || VENDOR_COLORS.None;
}

export function inferItemCategory(item) {
  const categoryText = [item?.category, item?.categoryName, item?.name]
    .filter(Boolean)
    .join(" ");

  if (!categoryText) {
    return "default";
  }

  if (matchesKeywords(categoryText, MATCHA_KEYWORDS)) return "matcha";
  if (matchesKeywords(categoryText, COFFEE_KEYWORDS)) return "coffee";
  if (matchesKeywords(categoryText, PASTRY_KEYWORDS)) return "pastry";
  if (matchesKeywords(categoryText, FOOD_KEYWORDS)) return "food";

  return "default";
}

export function getItemCategoryTheme(item) {
  const key = inferItemCategory(item);
  return ITEM_CATEGORY_COLORS[key] || ITEM_CATEGORY_COLORS.default;
}
