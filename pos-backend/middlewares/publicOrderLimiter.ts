import rateLimit from "express-rate-limit";

export const publicOrderLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    message: {
        success: false,
        message: "Too many orders, please try again later",
    },
});
