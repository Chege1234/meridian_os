import { createClient } from '@supabase/supabase-js';

async function testRlsDetails() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const viewerEmail = 'qa_viewer_test@meridian.os';
  const viewerPassword = 'ViewerPassword123!';

  const viewerClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: authData, error: signInErr } = await viewerClient.auth.signInWithPassword({
    email: viewerEmail,
    password: viewerPassword,
  });

  if (signInErr) {
    console.error('Sign in error:', signInErr);
    return;
  }

  console.log('Signed in user ID:', authData.user.id);

  // 1. Try INSERT as viewer
  const { data: insData, error: insErr } = await viewerClient.from('content_items').insert({
    platform: 'instagram',
    type: 'post',
    caption: 'Unauthorized insert attempt by viewer',
    author_id: authData.user.id,
  }).select();

  console.log('INSERT result data:', insData);
  console.log('INSERT result error:', insErr);

  // 2. Try UPDATE as viewer
  const { data: updData, error: updErr } = await viewerClient.from('content_items').update({
    caption: 'Hacked by viewer',
  }).eq('id', 'ec197d34-2497-46cc-8e5e-9fa4a5f390d4').select();

  console.log('UPDATE result data:', updData);
  console.log('UPDATE result error:', updErr);
}

testRlsDetails().catch(console.error).finally(() => process.exit());
