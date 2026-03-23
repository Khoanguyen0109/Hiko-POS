const { z } = require("zod");
const { userRoles } = require("../constants/user");

const phoneSchema = z
    .string({ required_error: "Phone number is required" })
    .trim()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits");

const passwordSchema = z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters");

const registerSchema = z.object({
    name: z
        .string({ required_error: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters"),
    phone: phoneSchema,
    password: passwordSchema,
    role: z.enum([userRoles.ADMIN, userRoles.USER], {
        required_error: "Role is required",
        invalid_type_error: `Role must be one of: ${Object.values(userRoles).join(", ")}`
    }),
    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .optional()
        .or(z.literal(""))
        .transform((val) => val === "" ? undefined : val)
});

const loginSchema = z.object({
    phone: phoneSchema,
    password: z
        .string({ required_error: "Password is required" })
        .min(1, "Password is required")
});

module.exports = { registerSchema, loginSchema };
