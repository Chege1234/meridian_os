/**
 * Shared — Utility Functions
 *
 * cn() merges Tailwind classes with clsx + tailwind-merge.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
