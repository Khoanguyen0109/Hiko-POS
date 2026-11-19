export const POS_TOPPING_CATEGORY = "topping";

export function buildStandaloneToppingItem(topping, quantity = 1) {
  const price = Number(topping.price) || 0;
  const qty = quantity > 0 ? quantity : 1;
  return {
    id: `topping-${topping._id}-${Date.now()}`,
    itemType: "topping",
    toppingId: topping._id,
    name: topping.name,
    pricePerQuantity: price,
    quantity: qty,
    price: price * qty,
    category: "Topping",
    image: null,
    variant: null,
    toppings: null,
    note: null,
  };
}
