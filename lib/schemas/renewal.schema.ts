import { z } from "zod";

/**
 * Schema for contract renewal
 */
export const renewalSchema = z.object({
  contractType: z.enum(["monthly", "yearly", "custom"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export type RenewalFormData = z.infer<typeof renewalSchema>;
