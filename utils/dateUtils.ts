import { ContractType } from "@/types/app.types";

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get a date formatted for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

/**
 * Calculate end date based on start date and contract type
 */
export function calculateEndDate(
  startDate: string,
  type: ContractType
): string {
  if (type === "custom" || !startDate) return "";

  const date = new Date(startDate);
  if (type === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else if (type === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date.toISOString().split("T")[0];
}

/**
 * Get default end date (1 month from today)
 */
export function getDefaultEndDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().split("T")[0];
}

/**
 * Check if a contract end date has expired
 */
export function isContractExpired(contractEndDate: string): boolean {
  return new Date(contractEndDate) < new Date();
}

/**
 * Get the number of days until a due date (negative if overdue)
 */
export function getDaysUntilDue(endDate: string): number {
  const today = new Date();
  const due = new Date(endDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get human-readable days until due text
 */
export function getDaysUntilDueText(endDate: string): string {
  const days = getDaysUntilDue(endDate);

  if (days < 0) {
    return `${Math.abs(days)} days overdue`;
  } else if (days === 0) {
    return "Due today";
  } else {
    return `${days} days left`;
  }
}
