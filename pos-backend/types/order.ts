import type { Types } from "mongoose";

/** Entry in `promotionsApplied` on a line item (Happy Hour and similar). */
export interface OrderItemPromotionApplied {
  promotionId?: Types.ObjectId;
  promotionName?: string;
  promotionType?: string;
  discountType?: string;
  discountAmount?: number;
  discountPercentage?: number | null;
  uniformPrice?: number | null;
  appliedAt?: Date;
}

/** Incoming order item from request body (validated in controller). */
export interface OrderItemInput {
  dishId: string | Types.ObjectId;
  name: string;
  originalPricePerQuantity?: number;
  pricePerQuantity: number;
  quantity: number;
  originalPrice?: number;
  price: number;
  promotionsApplied?: OrderItemPromotionApplied[];
  isHappyHourItem?: boolean;
  happyHourDiscount?: number;
  category?: string;
  image?: string;
  note?: string;
  toppings?: OrderItemToppingInput[];
  variant?: {
    size?: string;
    price?: number;
    cost?: number;
  };
}

export interface OrderItemToppingInput {
  toppingId: string | Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

/** Normalized item stored on an order after processing. */
export interface ProcessedOrderItem {
  dishId: string | Types.ObjectId;
  name: string;
  originalPricePerQuantity: number;
  pricePerQuantity: number;
  quantity: number;
  originalPrice: number;
  price: number;
  promotionsApplied: OrderItemPromotionApplied[];
  isHappyHourItem: boolean;
  happyHourDiscount: number;
  category?: string;
  image?: string;
  note?: string;
  toppings: Array<{
    toppingId: string | Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
  }>;
  variant?: {
    size?: string;
    price?: number;
    cost?: number;
  };
}
