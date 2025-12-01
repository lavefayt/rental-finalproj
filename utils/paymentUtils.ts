import { Room } from "@/types/app.types";
import { isContractExpired, getDaysUntilDue } from "./dateUtils";

/**
 * Get the daily rate for a room (uses dailyRate if available, falls back to monthly price / 30)
 */
export function getDailyRate(room: Room): number {
  return room.dailyRate || Math.round(room.price / 30);
}

/**
 * Get the total rent for a room (uses totalRent if available, falls back to monthly price)
 */
export function getTotalRent(room: Room): number {
  if (!room.renter) return room.price;
  return room.renter.totalRent || room.price;
}

/**
 * Check if a room has an unpaid balance
 */
export function isPastDue(room: Room): boolean {
  if (!room.renter) return false;
  return room.renter.amountPaid < getTotalRent(room);
}

/**
 * Calculate the remaining balance for a room
 */
export function calculateBalance(room: Room): number {
  if (!room.renter) return 0;
  return Math.max(0, getTotalRent(room) - room.renter.amountPaid);
}

/**
 * Get the number of days overdue (0 if not overdue)
 */
export function getDaysOverdue(contractEndDate: string): number {
  const daysUntilDue = getDaysUntilDue(contractEndDate);
  return daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0;
}

/**
 * Calculate the late fee based on daily rate × days overdue
 * Late fee is charged per day the tenant is past their contract end date
 */
export function calculateLateFee(room: Room): number {
  if (!room.renter) return 0;

  const balance = calculateBalance(room);
  const expired = isContractExpired(room.renter.contractEndDate);

  if (!expired || balance <= 0) return 0;

  const daysOverdue = getDaysOverdue(room.renter.contractEndDate);
  const dailyRate = getDailyRate(room);

  return daysOverdue * dailyRate;
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
