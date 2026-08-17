import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes without style conflicts.
 * clsx: Handles conditional classes (e.g., isUrgent && 'bg-red-500')
 * twMerge: Ensures the last class defined wins if there's a conflict
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}