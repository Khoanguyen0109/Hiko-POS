import createHttpError from "http-errors";

/**
 * Express middleware factory for Zod schema validation.
 * Validates req.body against the provided schema and returns 400 on failure.
 */
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const messages = result.error.errors
            .map((e) => e.message)
            .join(", ");
        return next(createHttpError(400, messages));
    }
    req.body = result.data; // use the coerced/trimmed data
    next();
};

export default validate;