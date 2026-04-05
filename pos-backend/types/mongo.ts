/**
 * Loose MongoDB filter / update payload for dynamic query building.
 * Prefer model-specific `FilterQuery<T>` from Mongoose when the shape is known.
 */
export type MongoFilter = Record<string, unknown>;
