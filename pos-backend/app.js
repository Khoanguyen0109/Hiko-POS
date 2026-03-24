const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const mongoose = require("mongoose");

const app = express();

// Trust Railway's reverse proxy so express-rate-limit can read X-Forwarded-For correctly
app.set('trust proxy', 1);

connectDB();

// ─── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'https://hiko-pos.vercel.app'],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-Id'],
    credentials: true
}));

// ─── Body parsing & cookies ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ─── MongoDB injection sanitization ───────────────────────────────────────
app.use(mongoSanitize());

// ─── Gzip compression ─────────────────────────────────────────────────────
app.use(compression());

// ─── Rate limiters ─────────────────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts. Please try again in 15 minutes." }
});

const couponLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many coupon validation requests. Slow down." }
});

app.use("/api/user/login", authLimiter);
app.use("/api/user/register", authLimiter);
app.use("/api/promotion/validate-coupon", couponLimiter);

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = ["disconnected", "connected", "connecting", "disconnecting"][dbState] || "unknown";
    const healthy = dbState === 1;

    res.status(healthy ? 200 : 503).json({
        status: healthy ? "ok" : "degraded",
        db: dbStatus,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use("/api/store", require("./routes/storeRoute"));
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/member", require("./routes/memberRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/table", require("./routes/tableRoute"));
app.use("/api/payment", require("./routes/paymentRoute"));
app.use("/api/category", require("./routes/categoryRoute"));
app.use("/api/dish", require("./routes/dishRoute"));
app.use("/api/customer", require("./routes/customerRoute"));
app.use("/api/topping", require("./routes/toppingRoute"));
app.use("/api/promotion", require("./routes/promotionRoute"));
app.use("/api/spending", require("./routes/spendingRoute"));
app.use("/api/storage/supplier", require("./routes/supplierRoute"));
app.use("/api/storage/item", require("./routes/storageItemRoute"));
app.use("/api/storage/import", require("./routes/storageImportRoute"));
app.use("/api/storage/export", require("./routes/storageExportRoute"));
app.use("/api/storage/analytics", require("./routes/storageAnalyticsRoute"));
app.use("/api/shift-template", require("./routes/shiftTemplateRoute"));
app.use("/api/schedule", require("./routes/scheduleRoute"));
app.use("/api/salary", require("./routes/salaryRoute"));
app.use("/api/extra-work", require("./routes/extraWorkRoute"));
app.use("/api/test", require("./routes/testRoute"));

// ─── Global error handler ──────────────────────────────────────────────────
app.use(globalErrorHandler);

// ─── Server start ──────────────────────────────────────────────────────────
const server = app.listen(config.port, () => {
    console.log(`☑️  POS Server is listening on port ${config.port}`);
});

// ─── Graceful shutdown ─────────────────────────────────────────────────────
const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        try {
            await mongoose.connection.close();
            console.log("MongoDB connection closed.");
        } catch {
            // ignore close errors
        }
        process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
        console.error("Forced shutdown after timeout.");
        process.exit(1);
    }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
