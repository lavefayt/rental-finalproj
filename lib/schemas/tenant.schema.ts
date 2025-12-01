import { z } from "zod";

/**
 * Schema for creating a new tenant
 */
export const newTenantSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(1, "Contact number is required"),
  contractType: z.enum(["monthly", "yearly", "custom"]),
  rentStartDate: z.string().min(1, "Start date is required"),
  contractEndDate: z.string().min(1, "End date is required"),
  amountPaid: z
    .string()
    .refine(
      (val) => val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      {
        message: "Amount must be a valid number",
      }
    )
    .transform((val) => (val === "" ? "0" : val)),
});

export type NewTenantFormData = z.infer<typeof newTenantSchema>;

/**
 * Schema for editing renter information
 */
export const editRenterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(1, "Contact number is required"),
});

export type EditRenterFormData = z.infer<typeof editRenterSchema>;
