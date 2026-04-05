import type { Types } from "mongoose";

/**
 * Minimal shape for a StoreUser document used when updating assignments in memberController.
 */
export interface StoreUserAssignmentDoc {
  role: string;
  isActive: boolean;
  store: Types.ObjectId | { toString(): string };
  save: () => Promise<unknown>;
}
