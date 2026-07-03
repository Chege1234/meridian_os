/**
 * Infrastructure — Supabase
 *
 * Exports Supabase client factories for browser and server contexts.
 */

export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient } from './server';
export { db } from './db';

