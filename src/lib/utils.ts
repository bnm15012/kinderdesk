import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── IST date/time helpers ─────────────────────────────────────────────────
// All display-facing date/time formatting is locked to Asia/Kolkata (IST, UTC+5:30).
// This prevents any timezone-of-the-machine confusion regardless of where the
// server or browser happen to be running.

const IST = "Asia/Kolkata";

/**
 * Format a date value for display (date only, no time).
 * e.g. "12 Jun 2025"
 */
export function fmtDate(
  value: Date | string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { ...opts, timeZone: IST });
}

/**
 * Format a date value showing only day + month (no year).
 * e.g. "12 Jun"
 */
export function fmtDateShort(value: Date | string | null | undefined): string {
  return fmtDate(value, { day: "numeric", month: "short" });
}

/**
 * Format a date+time value.
 * e.g. "12 Jun 2025, 9:30 AM"
 */
export function fmtDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: IST,
  });
}

/**
 * Returns today's date as a YYYY-MM-DD string in IST.
 * Safe replacement for new Date().toISOString().split("T")[0]
 * which returns UTC date (wrong after ~6:30 PM IST).
 */
export function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: IST }); // en-CA gives YYYY-MM-DD
}

/**
 * Returns the current hour (0-23) in IST.
 * Safe replacement for new Date().getHours() which uses local machine time.
 */
export function currentHourIST(): number {
  return parseInt(
    new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: IST }),
    10,
  );
}

/**
 * Format a long weekday + date.
 * e.g. "Friday, 12 June 2025"
 */
export function fmtDateLong(value?: Date): string {
  const d = value ?? new Date();
  return d.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: IST,
  });
}
