import { type NextRequest, NextResponse } from 'next/server';

/**
 * Meridian OS Proxy (formerly Middleware)
 *
 * Handles authentication, session validation, and route protection.
 * Implementation will be completed when Supabase Auth is configured.
 */
export async function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
