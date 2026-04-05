/** Partial fields allowed when updating a topping via PATCH/body. */
export interface ToppingUpdatePayload {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  isAvailable?: boolean;
}
