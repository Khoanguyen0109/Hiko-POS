import type { Document, Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      /** Set by `isVerifiedUser` after JWT validation */
      user?: Document & {
        _id: Types.ObjectId;
        role: string;
        name?: string;
        email?: string;
        phone?: string;
        isActive?: boolean;
      };
      /** Set by `storeContext` / `optionalStoreContext` */
      store?: Document & {
        _id: Types.ObjectId;
        isActive?: boolean;
      };
      /** Store membership / synthetic admin context */
      storeUser?: (Document & { role?: string }) | { role: string };
    }
  }
}

export {};
