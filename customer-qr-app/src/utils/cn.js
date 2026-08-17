import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx logic and tailwind-merge.
 * This prevents class conflicts (e.g., 'p-4 p-8' becomes 'p-8').
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}