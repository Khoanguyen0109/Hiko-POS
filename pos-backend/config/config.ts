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
        process.env.SPEEDSMS_OTP_DRY_RUN === "true" ||
        process.env.NODE_ENV === "test",
    /** When ZNS=false, skip OTP verification before spin. */
    znsEnabled: process.env.ZNS !== "false",
    speedSmsAccessToken: process.env.SPEEDSMS_ACCESS_TOKEN || "",
    speedSmsApiUrl:
        process.env.SPEEDSMS_API_URL || "https://api.speedsms.vn/index.php",
    speedSmsType: Number(process.env.SPEEDSMS_SMS_TYPE || 4),
    speedSmsSender: process.env.SPEEDSMS_SENDER || "Verify",
    /** Opt-in. Leave unset/false to send OTP via Zalo only. */
    speedSmsEnabled: process.env.SPEEDSMS === "true",
    otpHashSecret:
        process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || "otp-dev-secret",
});

export default config;