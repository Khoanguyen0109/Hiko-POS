import "dotenv/config";

const config = Object.freeze({
    port: process.env.PORT || 3000,
    databaseURI: process.env.MONGODB_URI || "mongodb://localhost:27017/pos-db",
    nodeEnv: process.env.NODE_ENV || "development",
    accessTokenSecret: process.env.JWT_SECRET,
    redisUrl: process.env.REDIS_URL || null,
    zaloAppId: process.env.ZALO_APP_ID || "",
    zaloOaId: process.env.ZALO_OA_ID || "",
    zaloSecretKey: process.env.ZALO_SECRET_KEY || "",
    zaloAccessToken: process.env.ZALO_ACCESS_TOKEN || "",
    zaloRefreshToken: process.env.ZALO_REFRESH_TOKEN || "",
    znsOtpTemplateId: process.env.ZNS_OTP_TEMPLATE_ID || "",
    znsOtpParamName: process.env.ZNS_OTP_PARAM_NAME || "otp",
    znsOtpDryRun:
        process.env.ZNS_OTP_DRY_RUN === "true" ||
        process.env.NODE_ENV === "test",
    otpHashSecret:
        process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || "otp-dev-secret",
});

export default config;