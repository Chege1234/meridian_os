/**
 * Domain Rules — Contact Business Rules
 *
 * Pure functions enforcing CRM Contact business rules.
 * Per BR-800: duplicate contacts are detected automatically based on:
 * - Email match
 * - Phone match
 * - Combination of Name and Organization match
 *
 * Does not block creation, only flags.
 */

import type { Contact } from '@/domain/entities';

export interface DuplicateCheckInput {
  name: string;
  organization?: string | null;
  email?: string | null;
  phone?: string | null;
}

/**
 * Detect duplicates for a given contact input among a list of existing contacts.
 */
export function detectDuplicates(
  input: DuplicateCheckInput,
  existingContacts: Contact[],
): { hasDuplicates: boolean; duplicates: Contact[] } {
  const duplicates: Contact[] = [];

  const inputEmail = input.email?.trim().toLowerCase();
  const inputPhone = input.phone?.trim().replace(/\D/g, '');
  const inputName = input.name.trim().toLowerCase();
  const inputOrg = input.organization?.trim().toLowerCase();

  for (const existing of existingContacts) {
    let isMatch = false;

    // 1. Match on Email (if both have email)
    if (inputEmail && existing.email) {
      if (inputEmail === existing.email.trim().toLowerCase()) {
        isMatch = true;
      }
    }

    // 2. Match on Phone (if both have phone, ignoring formatting characters)
    if (!isMatch && inputPhone && existing.phone) {
      const existingPhone = existing.phone.trim().replace(/\D/g, '');
      if (inputPhone === existingPhone) {
        isMatch = true;
      }
    }

    // 3. Match on Name + Organization combination (if both organization fields are provided and match)
    if (!isMatch) {
      const existingName = existing.name.trim().toLowerCase();
      const existingOrg = existing.organization?.trim().toLowerCase();

      if (inputName === existingName) {
        if (inputOrg && existingOrg && inputOrg === existingOrg) {
          isMatch = true;
        }
      }
    }

    if (isMatch) {
      duplicates.push(existing);
    }
  }

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}
