export function getToppingId(toppingRef) {
  if (toppingRef == null) return "";
  if (typeof toppingRef === "object") {
    return String(toppingRef._id || toppingRef.toppingId || "");
  }
  return String(toppingRef);
}

export function isItemEligibleForPromotion(item, promotion) {
  if (!promotion) return false;

  if (promotion.applicableItems === "all_order" || !promotion.applicableItems) {
    return true;
  }

  if (promotion.applicableItems === "specific_dishes") {
    return (promotion.specificDishes || []).some((dishId) => {
      const id = typeof dishId === "object" ? dishId._id : dishId;
      return String(id) === String(item.dishId);
    });
  }

  if (promotion.applicableItems === "categories") {
    return (promotion.categories || []).some((category) => {
      if (typeof category === "object" && category.name) {
        return (
          category.name.toLowerCase() === item.category?.toLowerCase() ||
          String(category._id) === String(item.category)
        );
      }
      return (
        String(category) === String(item.category) ||
        String(category?._id) === String(item.category)
      );
    });
  }

  return false;
}

export function isItemSizeEligible(item, promotion) {
  const sizes = promotion?.applicableSizes || [];
  if (sizes.length === 0) return true;

  const itemSize = item?.variant?.size;
  if (!itemSize) return false;

  return sizes.some(
    (size) => String(size).toLowerCase() === String(itemSize).toLowerCase()
  );
}

export function isItemEligibleForFreeTopping(item, promotion) {
  if (!promotion || promotion.type !== "free_topping" || !item) return false;
  return (
    isItemEligibleForPromotion(item, promotion) &&
    isItemSizeEligible(item, promotion)
  );
}

export function calculateFreeToppingDiscount(items, promotion) {
  const promoIds = new Set(
    (promotion?.freeToppings || []).map((topping) => getToppingId(topping))
  );

  if (promoIds.size === 0 || !Array.isArray(items)) {
    return { discount: 0, appliedToItems: [] };
  }

  let discount = 0;
  const appliedToItems = [];

  for (const item of items) {
    if (!isItemEligibleForFreeTopping(item, promotion)) continue;

    let itemDiscount = 0;
    for (const topping of item.toppings || []) {
      if (!promoIds.has(getToppingId(topping.toppingId))) continue;
      const unitPrice = Number(topping.price) || 0;
      const toppingQty = Number(topping.quantity) || 1;
      const itemQty = Number(item.quantity) || 1;
      itemDiscount += unitPrice * toppingQty * itemQty;
    }

    if (itemDiscount > 0) {
      discount += itemDiscount;
      appliedToItems.push(item.id || item.dishId);
    }
  }

  return { discount, appliedToItems };
}

export function isToppingFree(topping, promotion, item) {
  if (!isItemEligibleForFreeTopping(item, promotion)) return false;
  const promoIds = new Set(
    (promotion.freeToppings || []).map((t) => getToppingId(t))
  );
  return promoIds.has(getToppingId(topping.toppingId));
}

export function getFreeToppingNames(promotion) {
  if (!promotion?.freeToppings?.length) return [];
  return promotion.freeToppings
    .map((topping) => (typeof topping === "object" ? topping.name : ""))
    .filter(Boolean);
}
