interface BillLineItem {
  originalPrice?: number;
  price: number;
}

interface AppliedPromotionForBill {
  type?: string;
  discountAmount?: number;
}

/**
 * Shared bill calculation for orders.
 * Used by addOrder, updateOrder, and updateOrderItems.
 */
function calculateOrderBills(
  processedItems: BillLineItem[],
  appliedPromotions: AppliedPromotionForBill[] = [],
  tax = 0
) {
  const subtotal = processedItems.reduce(
    (sum, item) => sum + (item.originalPrice || item.price),
    0
  );

  const hasOrderLevelPromotions = appliedPromotions?.some(
    (p) => p.type === "order_percentage" || p.type === "order_fixed"
  );
  const hasItemLevelPromotions = appliedPromotions?.some(
    (p) =>
      p.type === "happy_hour" ||
      p.type === "item_percentage" ||
      p.type === "item_fixed"
  );

  let total;
  if (hasOrderLevelPromotions && !hasItemLevelPromotions) {
    const orderLevelDiscount = appliedPromotions
      .filter(
        (p) => p.type === "order_percentage" || p.type === "order_fixed"
      )
      .reduce((sum, p) => sum + (p.discountAmount || 0), 0);
    total = Math.max(0, subtotal - orderLevelDiscount);
  } else if (hasItemLevelPromotions && !hasOrderLevelPromotions) {
    total = processedItems.reduce((sum, item) => sum + item.price, 0);
  } else if (hasOrderLevelPromotions && hasItemLevelPromotions) {
    const itemLevelTotal = processedItems.reduce(
      (sum, item) => sum + item.price,
      0
    );
    const orderLevelDiscount = appliedPromotions
      .filter(
        (p) => p.type === "order_percentage" || p.type === "order_fixed"
      )
      .reduce((sum, p) => sum + (p.discountAmount || 0), 0);
    total = Math.max(0, itemLevelTotal - orderLevelDiscount);
  } else {
    total = subtotal;
  }

  const promotionDiscount = subtotal - total;
  const totalWithTax = total + (tax || 0);

  return {
    subtotal,
    promotionDiscount: Math.max(0, promotionDiscount),
    total,
    tax: tax || 0,
    totalWithTax,
  };
}

/**
 * Format raw order-level promotions into the shape expected by calculateOrderBills.
 * Used when applying new promotions (e.g. in updateOrder) where discountAmount
 * is computed from discount.percentage or discount.fixedAmount.
 */
interface RawOrderLevelPromotion {
  type?: string;
  promotionId?: unknown;
  _id?: unknown;
  name?: string;
  code?: string;
  appliedToItems?: unknown[];
  discount?: { percentage?: number; fixedAmount?: number };
}

function formatOrderLevelPromotions(
  subtotal: number,
  rawPromotions: RawOrderLevelPromotion[] | null | undefined
) {
  if (!rawPromotions || !Array.isArray(rawPromotions)) return [];

  return rawPromotions.map((promo) => {
    let discountAmount = 0;
    if (promo.type === "order_percentage") {
      discountAmount = (subtotal * (promo.discount?.percentage || 0)) / 100;
    } else if (promo.type === "order_fixed") {
      discountAmount = promo.discount?.fixedAmount || 0;
    }
    return {
      promotionId: promo.promotionId || promo._id,
      name: promo.name,
      type: promo.type,
      discountAmount,
      code: promo.code,
      appliedToItems: promo.appliedToItems || [],
    };
  });
}

export {
  calculateOrderBills,
  formatOrderLevelPromotions,
};