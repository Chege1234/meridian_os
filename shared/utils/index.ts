/**
 * Shared Utilities
 *
 * Reusable utility functions used across multiple features.
 * Feature-specific utilities belong in their feature directory.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution.
 * Standard utility for shadcn/ui components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
