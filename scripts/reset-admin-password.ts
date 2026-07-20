import './load-env';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const userId = 'b69f24f9-d994-4e34-8f89-e985d512f538';
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    password: 'Password123'
  });

  if (error) {
    console.error('Failed to reset password:', error.message);
  } else {
    console.log('Successfully reset admin password to Password123');
  }
}

main();
