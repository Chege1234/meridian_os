import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  try {
    const canWrite = await sql`SELECT public.can_write('4b36f932-55f1-46c2-8b5d-36ede0356de8'::uuid);`;
    console.log('can_write for test viewer:', canWrite);

    const policies = await sql`
      SELECT policyname, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'content_items';
    `;
    console.log('Policies for content_items:', JSON.stringify(policies, null, 2));

    const userRow = await sql`
      SELECT u.id, u.email, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = '4b36f932-55f1-46c2-8b5d-36ede0356de8';
    `;
    console.log('User row for test viewer:', userRow);
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await sql.end();
  }
}

main();
