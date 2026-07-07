import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return NextResponse.json({
    env: {
      DATABASE_URL: {
        defined: dbUrl !== undefined,
        length: dbUrl ? dbUrl.length : 0,
        type: typeof dbUrl,
        value: dbUrl ? (dbUrl.length > 20 ? dbUrl.slice(0, 15) + '...' : dbUrl) : 'empty/null',
      },
      CREDENTIAL_ENCRYPTION_KEY: {
        defined: encryptionKey !== undefined,
        length: encryptionKey ? encryptionKey.length : 0,
        value: encryptionKey ? 'set' : 'empty/null',
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        defined: anonKey !== undefined,
        length: anonKey ? anonKey.length : 0,
        value: anonKey ? 'set' : 'empty/null',
      },
    },
    allKeys: Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('VSCODE_')),
  });
}
