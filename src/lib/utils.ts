import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ExpiryStatus = "expired" | "soon" | "safe";

export function getExpiryStatus(expiryDate: Date, soonDaysThreshold: number = 30): {
  status: ExpiryStatus;
  daysRemaining: number;
  isExpired: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(expiryDate);
  target.setHours(0, 0, 0, 0);

  const daysRemaining = differenceInDays(target, today);
  const isExpired = daysRemaining < 0;

  if (isExpired) {
    return { status: "expired", daysRemaining, isExpired: true };
  }
  if (daysRemaining <= soonDaysThreshold) {
    return { status: "soon", daysRemaining, isExpired: false };
  }
  return { status: "safe", daysRemaining, isExpired: false };
}
