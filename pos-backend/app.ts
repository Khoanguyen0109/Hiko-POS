import type { Request, Response } from "express";

import express from "express";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";

import connectDB from "./config/database.js";
import config from "./config/config.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";

import storeRoute from "./routes/storeRoute.js";
import userRoute from "./routes/userRoute.js";
import memberRoute from "./routes/memberRoute.js";
import orderRoute from "./routes/orderRoute.js";
import tableRoute from "./routes/tableRoute.js";
import paymentRoute from "./routes/paymentRoute.js";
import categoryRoute from "./routes/categoryRoute.js";
import dishRoute from "./routes/dishRoute.js";
import customerRoute from "./routes/customerRoute.js";
import toppingRoute from "./routes/toppingRoute.js";
import promotionRoute from "./routes/promotionRoute.js";
import spendingRoute from "./routes/spendingRoute.js";
import supplierRoute from "./routes/supplierRoute.js";
import storageItemRoute from "./routes/storageItemRoute.js";
import storageImportRoute from "./routes/storageImportRoute.js";
import storageExportRoute from "./routes/storageExportRoute.js";
import storageAnalyticsRoute from "./routes/storageAnalyticsRoute.js";
import shiftTemplateRoute from "./routes/shiftTemplateRoute.js";
import scheduleRoute from "./routes/scheduleRoute.js";
import salaryRoute from "./routes/salaryRoute.js";
import extraWorkRoute from "./routes/extraWorkRoute.js";
import ticketRoute from "./routes/ticketRoute.js";
import testRoute from "./routes/testRoute.js";

const app = express();

// Trust Railway's reverse proxy so express-rate-limit can read X-Forwarded-For correctly
app.set("trust proxy", 1);

connectDB();

// ─── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: ["http://localhost:5173", "https://hiko-pos.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Store-Id"],
    credentials: true,
  })
);

// ─── Body parsing & cookies ────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
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
  message: {
    success: false,
    message: "Too many attempts. Please try again in 15 minutes.",
  },
});

const couponLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many coupon validation requests. Slow down.",
  },
});

app.use("/api/user/login", authLimiter);
app.use("/api/user/register", authLimiter);
app.use("/api/promotion/validate-coupon", couponLimiter);

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/", (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    ["disconnected", "connected", "connecting", "disconnecting"][dbState] ||
    "unknown";
  const healthy = dbState === 1;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    db: dbStatus,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use("/api/store", storeRoute);
app.use("/api/user", userRoute);
app.use("/api/member", memberRoute);
app.use("/api/order", orderRoute);
app.use("/api/table", tableRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/category", categoryRoute);
app.use("/api/dish", dishRoute);
app.use("/api/customer", customerRoute);
app.use("/api/topping", toppingRoute);
app.use("/api/promotion", promotionRoute);
app.use("/api/spending", spendingRoute);
app.use("/api/storage/supplier", supplierRoute);
app.use("/api/storage/item", storageItemRoute);
app.use("/api/storage/import", storageImportRoute);
app.use("/api/storage/export", storageExportRoute);
app.use("/api/storage/analytics", storageAnalyticsRoute);
app.use("/api/shift-template", shiftTemplateRoute);
app.use("/api/schedule", scheduleRoute);
app.use("/api/salary", salaryRoute);
app.use("/api/extra-work", extraWorkRoute);
app.use("/api/ticket", ticketRoute);
app.use("/api/test", testRoute);

// ─── Global error handler ──────────────────────────────────────────────────
app.use(globalErrorHandler);

// ─── Server start ──────────────────────────────────────────────────────────
const server = app.listen(config.port, () => {
  console.log(`☑️  POS Server is listening on port ${config.port}`);
});

// ─── Graceful shutdown ─────────────────────────────────────────────────────
const shutdown = (signal: NodeJS.Signals) => {
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

  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
