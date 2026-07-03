/**
 * API Route — Sign Out
 *
 * Destroys the Supabase session and returns success.
 */

import { NextResponse } from 'next/server';
import { signOut } from '@/infrastructure/auth';

export async function POST() {
  await signOut();
  return NextResponse.json({ success: true });
}
