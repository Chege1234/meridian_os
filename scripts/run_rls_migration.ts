import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

// Load .env manually for tsx scripts that run outside Next.js
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .forEach((line) => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^"|"$/g, '');
      }
    });
}

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  console.log('Running RLS migration...');
  try {
    // Drop existing policies if any
    await sql`DROP POLICY IF EXISTS "Dashboards are readable by owner or if shared" ON "dashboards";`;
    await sql`DROP POLICY IF EXISTS "Dashboards are manageable by owner" ON "dashboards";`;
    await sql`DROP POLICY IF EXISTS "Saved reports are readable by owner or if shared" ON "saved_reports";`;
    await sql`DROP POLICY IF EXISTS "Saved reports are manageable by owner" ON "saved_reports";`;

    // Enable RLS
    await sql`ALTER TABLE "dashboards" ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE "saved_reports" ENABLE ROW LEVEL SECURITY;`;
    
    // Create SELECT policy for dashboards
    await sql`CREATE POLICY "Dashboards are readable by owner or if shared" ON "dashboards"
      FOR SELECT TO authenticated USING (deleted_at IS NULL AND (owner_id = auth.uid() OR is_shared = true));`;

    // Create ALL policy for dashboards (insert, update, delete)
    await sql`CREATE POLICY "Dashboards are manageable by owner" ON "dashboards"
      FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());`;

    // Create SELECT policy for saved reports
    await sql`CREATE POLICY "Saved reports are readable by owner or if shared" ON "saved_reports"
      FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_shared = true);`;

    // Create ALL policy for saved reports (insert, update, delete)
    await sql`CREATE POLICY "Saved reports are manageable by owner" ON "saved_reports"
      FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());`;

    console.log('RLS migration completed successfully!');
  } catch (err) {
    console.error('Error running RLS migration:', err);
  } finally {
    await sql.end();
  }
}

run();
