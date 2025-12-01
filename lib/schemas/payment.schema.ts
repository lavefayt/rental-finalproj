import { z } from "zod";

/**
 * Schema for recording a payment
 */
export const paymentSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be greater than 0",
    }),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
