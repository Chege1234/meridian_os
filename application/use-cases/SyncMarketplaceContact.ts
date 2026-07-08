/**
 * Use Case — Sync Marketplace Contact
 *
 * Syncs a single contact from Campus Marketplace.
 */

import type { Contact } from '@/domain/entities';
import type { ContactRepository, ActivityLogRepository } from '@/domain/repositories';

export interface SyncMarketplaceContactInput {
  id: string; // CM user bigint id stored as text
  username: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  avatar: string | null;
  isVerified: boolean;
  createdAt: Date;
  studentId: string | null;
  preferredLanguage: string | null;
  lastSeenAt: Date | null;
  accountStatus: string | null;
  homeTown: string | null;
}

interface Dependencies {
  contactRepository: ContactRepository;
  activityLogRepository: ActivityLogRepository;
}

interface Result {
  success: boolean;
  contact?: Contact;
  error?: string;
  skipped?: boolean;
}

export async function syncMarketplaceContact(
  input: SyncMarketplaceContactInput,
  deps: Dependencies,
): Promise<Result> {
  // Defensively reject unverified users
  if (!input.isVerified) {
    return { success: false, error: 'Cannot sync unverified user.' };
  }

  try {
    // 1. Fetch potential contacts matching this external ID
    const existingContacts = await deps.contactRepository.findByExternalId(input.id);

    // 2. Edge case check: If any existing contact with same external_id has source='manual', skip
    const hasManual = existingContacts.some((c) => c.source === 'manual');
    if (hasManual) {
      await deps.activityLogRepository.create({
        userId: null,
        action: 'contact.sync_skipped',
        module: 'crm',
        entity: 'contact',
        metadata: {
          externalId: input.id,
          reason: 'Manual contact exists with same external ID',
          username: input.username,
        },
      });
      return { success: true, skipped: true };
    }

    const syncedContact = existingContacts.find((c) => c.source === 'campus_marketplace');

    const metadata = {
      marketplaceRole: input.role,
      accountStatus: input.accountStatus,
      homeTown: input.homeTown,
      preferredLanguage: input.preferredLanguage,
      studentId: input.studentId,
      avatar: input.avatar,
      lastSeenAt: input.lastSeenAt ? input.lastSeenAt.toISOString() : null,
    };

    if (syncedContact) {
      // Update existing synced contact
      const updated = await deps.contactRepository.update(syncedContact.id, {
        name: input.username,
        organization: null,
        email: input.email,
        phone: input.phone,
        source: 'campus_marketplace',
        externalId: input.id,
        syncedAt: new Date(),
        metadata,
      });

      if (!updated) {
        return { success: false, error: 'Failed to update existing synced contact.' };
      }

      return { success: true, contact: updated };
    } else {
      // Create new synced contact
      const created = await deps.contactRepository.create({
        name: input.username,
        organization: null,
        email: input.email,
        phone: input.phone,
        notes: null, // Stay staff-owned, sync never writes to notes
        createdBy: null,
        source: 'campus_marketplace',
        externalId: input.id,
        syncedAt: new Date(),
        metadata,
      });

      return { success: true, contact: created };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to sync marketplace contact.',
    };
  }
}
