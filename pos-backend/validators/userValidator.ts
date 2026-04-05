import { z } from "zod";
import { userRoles } from "../constants/user.js";

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .regex(/^\d{10}$/, "Phone number must be exactly 10 digits");

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(6, "Password must be at least 6 characters");

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  phone: phoneSchema,
  password: passwordSchema,
  role: z.enum(
    [userRoles.ADMIN, userRoles.USER] as [string, ...string[]],
    { message: `Role must be one of: ${Object.values(userRoles).join(", ")}` }
  ),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
});

const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Password is required"),
});

export { registerSchema, loginSchema };
