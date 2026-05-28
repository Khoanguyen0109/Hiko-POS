/**
 * Final payable total for an order, accounting for reward discounts.
 * Handles legacy orders where appliedReward was saved but bills.total was not reduced.
 */
export function getOrderDisplayTotal(order) {
  if (!order?.bills) return 0;

  const bills = order.bills;
  const tax = bills.tax || 0;
  const rewardDiscount =
    bills.rewardDiscount ?? order.appliedReward?.discountAmount ?? 0;
  let total = bills.total ?? 0;

  if (rewardDiscount > 0 && order.appliedReward?.rewardProgram) {
    const postPromotionTotal = Math.max(
      0,
      (bills.subtotal ?? 0) - (bills.promotionDiscount ?? 0)
    );
    if (Math.abs(total - postPromotionTotal) < 1) {
      total = Math.max(0, total - rewardDiscount);
    }
  }

  if (bills.totalWithTax != null && bills.totalWithTax !== bills.total) {
    return bills.totalWithTax;
  }

  return total + tax;
}

export function getOrderRewardDiscount(order) {
  if (!order) return 0;
  return (
    order.bills?.rewardDiscount ?? order.appliedReward?.discountAmount ?? 0
  );
}
