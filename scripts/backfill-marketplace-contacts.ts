import './load-env';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { createSupabaseContactRepository } from '@/infrastructure/repositories/SupabaseContactRepository';
import { createSupabaseActivityLogRepository } from '@/infrastructure/repositories/SupabaseActivityLogRepository';
import { createSupabaseSettingRepository } from '@/infrastructure/repositories/SupabaseSettingRepository';
import { syncMarketplaceContact } from '@/application/use-cases/SyncMarketplaceContact';
import { updateSetting } from '@/application/use-cases/UpdateSetting';

async function main() {
  console.log('Starting marketplace contacts backfill...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      'Error: Supabase environment variables are missing (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY).',
    );
    process.exit(1);
  }

  const marketplaceDbUrl = process.env.CAMPUS_MARKETPLACE_DATABASE_URL;
  if (!marketplaceDbUrl) {
    console.error('Error: CAMPUS_MARKETPLACE_DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  // Connect to the local Supabase instance
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const contactRepository = createSupabaseContactRepository(supabase);
  const activityLogRepository = createSupabaseActivityLogRepository(supabase);
  const settingRepository = createSupabaseSettingRepository(supabase);

  // Connect to the Campus Marketplace database
  const cmClient = postgres(marketplaceDbUrl, { prepare: false });

  try {
    // 1. Get the total count of verified users
    const countResult = await cmClient`
      select count(*)::int as count 
      from users 
      where is_verified = true
    `;
    const totalUsers = countResult[0]?.count || 0;
    console.log(`Found ${totalUsers} verified users to sync from Campus Marketplace.`);

    if (totalUsers === 0) {
      console.log('No verified users to backfill.');
      return;
    }

    let offset = 0;
    const limit = 500;
    let syncedCount = 0;
    let skippedCount = 0;
    let maxCreatedAt: Date | null = null;
    let errorsCount = 0;

    // 2. Paginate and process users in batches of 500
    while (true) {
      const rows = await cmClient`
        select id, username, email, phone, role, avatar, is_verified, created_at, student_id, preferred_language, last_seen_at, account_status, home_town 
        from users 
        where is_verified = true 
        order by created_at asc, id asc
        limit ${limit} offset ${offset}
      `;

      if (rows.length === 0) {
        break;
      }

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
            { contactRepository, activityLogRepository },
          );

          if (!syncResult.success) {
            console.error(`Error syncing contact ID ${row.id}: ${syncResult.error}`);
            errorsCount++;
          } else {
            if (syncResult.skipped) {
              skippedCount++;
            } else {
              syncedCount++;
            }
            const rowCreatedAt = new Date(row.created_at);
            if (!maxCreatedAt || rowCreatedAt > maxCreatedAt) {
              maxCreatedAt = rowCreatedAt;
            }
          }
        } catch (err: any) {
          console.error(`Exception syncing contact ID ${row.id}: ${err.message}`);
          errorsCount++;
        }
      }

      offset += rows.length;
      console.log(
        `Synced ${offset}/${totalUsers}... (Synced: ${syncedCount}, Skipped: ${skippedCount}, Errors: ${errorsCount})`,
      );
    }

    console.log('\n--- Backfill Summary ---');
    console.log(`Total processed users: ${offset}`);
    console.log(`Successfully synced:  ${syncedCount}`);
    console.log(`Skipped (manual duplicate): ${skippedCount}`);
    console.log(`Failed with errors:   ${errorsCount}`);

    // 3. Set the campus_marketplace_last_sync setting to the max created_at seen
    if (maxCreatedAt) {
      console.log(`Updating last sync setting to max created_at: ${maxCreatedAt.toISOString()}`);
      const updateResult = await updateSetting(
        {
          key: 'campus_marketplace_last_sync',
          value: maxCreatedAt.toISOString(),
        },
        { settingRepository },
      );

      if (updateResult.success) {
        console.log('Successfully updated campus_marketplace_last_sync setting.');
      } else {
        console.error(`Failed to update campus_marketplace_last_sync setting: ${updateResult.error}`);
      }
    }
  } catch (err: any) {
    console.error('Database query or operation failed during backfill:', err);
    throw err;
  } finally {
    await cmClient.end();
  }
}

main().catch((err) => {
  console.error('Fatal error during backfill execution:', err);
  process.exit(1);
});
