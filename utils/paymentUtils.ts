import { Room } from "@/types/app.types";
import { isContractExpired } from "./dateUtils";

/**
 * Late fee percentage (10%)
 */
export const LATE_FEE_PERCENTAGE = 0.1;

/**
 * Check if a room has an unpaid balance
 */
export function isPastDue(room: Room): boolean {
  return room.renter !== undefined && room.renter.amountPaid < room.price;
}

/**
 * Calculate the remaining balance for a room
 */
export function calculateBalance(room: Room): number {
  if (!room.renter) return 0;
  return Math.max(0, room.price - room.renter.amountPaid);
}

/**
 * Calculate the late fee (10% interest) for a room with expired contract
 */
export function calculateLateFee(room: Room): number {
  if (!room.renter) return 0;

  const balance = calculateBalance(room);
  const expired = isContractExpired(room.renter.contractEndDate);

  if (!expired || balance <= 0) return 0;

  return Math.round(balance * LATE_FEE_PERCENTAGE);
}

/**
 * Calculate total amount due including any late fees
 */
export function calculateTotalDue(room: Room): number {
  const balance = calculateBalance(room);
  const lateFee = calculateLateFee(room);
  return balance + lateFee;
}

/**
 * Get payment percentage for a room
 */
export function getPaymentPercentage(
  amountPaid: number,
  totalAmount: number
): number {
  if (totalAmount <= 0) return 100;
  return Math.round((amountPaid / totalAmount) * 100);
}

/**
 * Determine payment status
 */
export type PaymentStatus = "paid" | "partial" | "unpaid";

export function getPaymentStatus(
  amountPaid: number,
  totalAmount: number
): PaymentStatus {
  if (amountPaid >= totalAmount) return "paid";
  if (amountPaid > 0) return "partial";
  return "unpaid";
}
