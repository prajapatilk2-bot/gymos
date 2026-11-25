import { z } from "zod";

// Strong password rule (W3): at least 10 characters, one uppercase, one
// lowercase, one digit and one symbol. Enforced server-side wherever a
// password is set — admin "create user", "reset password" and future
// member/self-service change-password flows all import this schema.
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters long.")
  .max(128, "Password must be at most 128 characters long.")
  .refine(
    (value) => /[a-z]/.test(value),
    "Password must contain a lowercase letter.",
  )
  .refine(
    (value) => /[A-Z]/.test(value),
    "Password must contain an uppercase letter.",
  )
  .refine((value) => /[0-9]/.test(value), "Password must contain a digit.")
  .refine(
    (value) => /[^a-zA-Z0-9]/.test(value),
    "Password must contain a symbol (e.g. ! @ # $ %).",
  );
