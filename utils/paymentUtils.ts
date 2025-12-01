import { Room } from "@/types/app.types";
import { isContractExpired, getDaysUntilDue } from "./dateUtils";

/**
 * Calculate total rent based on contract dates and monthly rent
 * Uses full months × monthly rent + remaining days × daily rate
 */
export function calculateTotalRentFromDates(
  startDate: string,
  endDate: string,
  monthlyRent: number
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate full months
  let fullMonths =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  // Calculate remaining days after full months
  const tempDate = new Date(start);
  tempDate.setMonth(tempDate.getMonth() + fullMonths);

  // If tempDate is past end, we went too far
  if (tempDate > end) {
    fullMonths--;
    tempDate.setMonth(tempDate.getMonth() - 1);
  }

  // Calculate remaining days
  const remainingDays = Math.ceil(
    (end.getTime() - tempDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Daily rate is monthly rent / 30
  const dailyRate = Math.round(monthlyRent / 30);

  // Total rent = full months × monthly rent + remaining days × daily rate
  const totalRent = fullMonths * monthlyRent + remainingDays * dailyRate;

  return Math.max(totalRent, 0);
}

/**
 * Get the daily rate for a room (monthly price / 30)
 */
export function getDailyRate(room: Room): number {
  return Math.round(room.price / 30);
}

/**
 * Get the total rent for a room (calculated from contract dates)
 */
export function getTotalRent(room: Room): number {
  if (!room.renter) return room.price;

  // Calculate from dates instead of using stored value
  return calculateTotalRentFromDates(
    room.renter.rentStartDate,
    room.renter.contractEndDate,
    room.price
  );
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
