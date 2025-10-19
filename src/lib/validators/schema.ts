import z from "zod";
export const CreateCafeUserSchema = z.object({
  user_name: z.string().min(4, "Minimum 4 characters required").max(15, "Maximum 15 characters allowed"),
  user_email: z.string().email("Invalid email address"),
  user_mobile_no: z.string().regex(/^\+?\d{10,15}$/, "Invalid phone number"),
  login_user_name: z.string().min(4).max(15),
  password_hash: z.string().min(6, "Minimum 6 characters required"),
  cafe_id: z.uuid("Invalid Café ID"),
});
export const CreateCafeSchema = z.object({
  cafe_name: z.string().min(3, "Café name is required"),
  cafe_location: z.string().min(5, "Location must be descriptive"),
  cafe_description: z.string().optional(),
  cafe_mobile_no: z
    .string()
    .regex(/^\+?\d{10,15}$/, "Invalid phone number format"),
  cafe_upi_id: z.string().min(5, "Valid UPI ID required"),
  opening_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format (HH:MM)"),
  closing_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format (HH:MM)"),
});

export type CreateCafeInput = z.infer<typeof CreateCafeSchema>;

export type CreateCafeUserInput = z.infer<typeof CreateCafeUserSchema>;
