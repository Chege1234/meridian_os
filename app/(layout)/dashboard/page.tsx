/**
 * Dashboard Page
 *
 * Welcome page confirming auth works.
 * Shows current user info. Placeholder for future dashboard widgets.
 */

import { redirect } from 'next/navigation';
import { getAuthUser } from '@/infrastructure/auth';
import { createClient } from '@/infrastructure/supabase/server';

export const metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, roles(name)')
    .eq('id', authUser.id)
    .single();

  const name = (profile?.full_name as string) ?? 'there';
  const rolesData = profile?.roles as { name: string } | { name: string }[] | null;
  const roleName = (Array.isArray(rolesData) ? rolesData[0]?.name : rolesData?.name) ?? 'user';

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back, {name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as <span className="font-medium">{roleName}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder cards for future widgets */}
        <DashboardCard
          title="Knowledge Base"
          description="Documents & SOPs"
          value="Coming soon"
        />
        <DashboardCard
          title="Campaigns"
          description="Active campaigns"
          value="Coming soon"
        />
        <DashboardCard
          title="Analytics"
          description="Business insights"
          value="Coming soon"
        />
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/20">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <p className="mt-3 text-lg font-semibold text-muted-foreground/50">
        {value}
      </p>
    </div>
  );
}
