import { z } from "zod";

const normalizePhone = (raw: string) => {
  let p = (raw || "").trim().replace(/[\s-]/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("0")) p = p.slice(1);
  if (/^\d{10}$/.test(p)) return `+91${p}`;
  return p;
};

export const PhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .transform(normalizePhone)
  .refine((p) => /^\+91\d{10}$/.test(p), {
    message: "Enter a valid phone number (e.g., +91XXXXXXXXXX).",
  });

export const OtpSchema = z
  .string()
  .trim()
  .min(1, "OTP is required.")
  .refine((v) => /^\d{6,7}$/.test(v), {
    message: "Enter a valid OTP (6–7 digits).",
  });

export const SendOtpSchema = z.object({
  phone: PhoneSchema,
});

export const VerifyOtpSchema = z.object({
  phone: PhoneSchema,
  code: OtpSchema,
});

export const RecoverySchema = z.object({
  phone: PhoneSchema,
  recovery_pass: z
    .string()
    .trim()
    .min(6, "Recovery pass must be at least 6 characters."),
});

// Optional utility to use in components
export function getZodError(error: unknown): string {
  if (error instanceof z.ZodError) {
    const issue = error.issues?.[0];
    return issue?.message || "Invalid input.";
  }
  return "Validation failed.";
}
