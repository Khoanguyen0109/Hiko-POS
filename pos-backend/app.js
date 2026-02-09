const express = require("express");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cors = require("cors");
const app = express();


const PORT = config.port;
connectDB();


// Middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'https://hiko-pos.vercel.app'],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}))
app.use(express.json()); // parse incoming request in json format


// Root Endpoint
app.get("/", (req,res) => {
    res.json({message : "Hello from POS Server!"});
})


// Other Endpoints
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

// Global Error Handler
app.use(globalErrorHandler);


// Server
app.listen(PORT, () => {
    console.log(`☑️  POS Server is listening on port ${PORT}`);
})