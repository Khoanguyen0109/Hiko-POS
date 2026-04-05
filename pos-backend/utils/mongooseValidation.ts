import mongoose from "mongoose";

export function isMongooseValidationError(
  err: unknown
): err is mongoose.Error.ValidationError {
  return err instanceof mongoose.Error.ValidationError;
}

export function mongooseValidationMessages(
  err: mongoose.Error.ValidationError
): string[] {
  return Object.values(err.errors).map((e) => e.message);
}
