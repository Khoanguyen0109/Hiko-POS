import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.databaseURI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`❌ Database connection failed: ${msg}`);
        process.exit();
    }
}

export default connectDB;