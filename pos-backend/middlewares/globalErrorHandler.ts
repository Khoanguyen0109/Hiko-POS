import config from "../config/config.js";

const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    if (config.nodeEnv === "development") console.error(err);
    return res.status(statusCode).json({
        status: statusCode,
        message: err.message,
        errorStack: config.nodeEnv === "development" ? err.stack : ""
    })
}

export default globalErrorHandler;