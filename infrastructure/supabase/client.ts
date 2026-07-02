/**
 * Supabase Client — Browser
 *
 * Creates a Supabase client for use in Client Components.
 * Implementation will be completed when Supabase credentials are configured.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
