/**
 * Use Case — Sync Marketplace Contacts
 *
 * Connects to the Campus Marketplace database and syncs all new verified users
 * to the CRM contacts table since the last sync timestamp.
 */

import postgres from 'postgres';
import { getSetting } from './GetSetting';
import { updateSetting } from './UpdateSetting';
import { syncMarketplaceContact } from './SyncMarketplaceContact';
import type { ContactRepository, ActivityLogRepository, SettingRepository } from '@/domain/repositories';

interface Dependencies {
  contactRepository: ContactRepository;
  activityLogRepository: ActivityLogRepository;
  settingRepository: SettingRepository;
}

export async function syncMarketplaceContacts(deps: Dependencies) {
  let marketplaceDbUrl = process.env.CAMPUS_MARKETPLACE_DATABASE_URL;
  if (!marketplaceDbUrl) {
    return { success: false, error: 'CAMPUS_MARKETPLACE_DATABASE_URL environment variable is missing.' };
  }

  // Defensively rewrite port 5432 to 6543 (PgBouncer pooler port) for serverless compatibility
  if (marketplaceDbUrl.includes(':5432/')) {
    marketplaceDbUrl = marketplaceDbUrl.replace(':5432/', ':6543/');
  }

  const lastSyncSetting = await getSetting('campus_marketplace_last_sync', { settingRepository: deps.settingRepository });
  const lastSyncTimestamp = lastSyncSetting?.value || '1970-01-01T00:00:00Z';

  const cmClient = postgres(marketplaceDbUrl, { prepare: false, ssl: 'require' });
  const results = {
    queriedRows: 0,
    syncedRows: 0,
    skippedRows: 0,
    errors: [] as string[],
  };

  try {
    // Fetch newly verified users since the last sync timestamp
    const rows = await cmClient`
      select id, username, email, phone, role, avatar, is_verified, created_at, student_id, preferred_language, last_seen_at, account_status, home_town 
      from users 
      where is_verified = true and created_at > ${lastSyncTimestamp} 
      order by created_at asc
    `;

    results.queriedRows = rows.length;

    let maxCreatedAt: Date | null = null;

    for (const row of rows) {
      try {
        const syncResult = await syncMarketplaceContact(
          {
            id: row.id.toString(),
            username: row.username,
            email: row.email,
            phone: row.phone,
            role: row.role,
            avatar: row.avatar,
            isVerified: row.is_verified,
            createdAt: new Date(row.created_at),
            studentId: row.student_id,
            preferredLanguage: row.preferred_language,
            lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : null,
            accountStatus: row.account_status,
            homeTown: row.home_town,
          },
          {
            contactRepository: deps.contactRepository,
            activityLogRepository: deps.activityLogRepository,
          }
        );

        if (!syncResult.success) {
          results.errors.push(`Marketplace contact sync failed for ID ${row.id}: ${syncResult.error}`);
          continue; // Keep processing the rest of the users
        }

        if (syncResult.skipped) {
          results.skippedRows++;
        } else {
          results.syncedRows++;
        }

        const rowCreatedAt = new Date(row.created_at);
        if (!maxCreatedAt || rowCreatedAt > maxCreatedAt) {
          maxCreatedAt = rowCreatedAt;
        }
      } catch (err: any) {
        results.errors.push(`Marketplace contact sync error for ID ${row.id}: ${err.message}`);
        continue;
      }
    }

    if (maxCreatedAt) {
      await updateSetting(
        {
          key: 'campus_marketplace_last_sync',
          value: maxCreatedAt.toISOString(),
        },
        { settingRepository: deps.settingRepository }
      );
    }

    return { success: true, results };
  } catch (err: any) {
    console.error('[Sync Marketplace Contacts Error]', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || 'Marketplace database query failed.', results };
  } finally {
    await cmClient.end();
  }
}
