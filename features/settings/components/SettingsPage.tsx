'use client';

/**
 * Feature — Settings Page
 *
 * Main settings view with tabs for General, Branding, and AI Credentials.
 * Reads/writes through Setting use cases.
 * Per BR-1300/1302/1303: workspace settings affect everyone,
 * branding propagates automatically, no redeploy required.
 */

import { useState, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';
import { GeneralSettings } from './GeneralSettings';
import { BrandingSettings } from './BrandingSettings';
import { AICredentialsSettings } from './AICredentialsSettings';
import { createClient } from '@/infrastructure/supabase/client';

const BASE_TABS = [
  { id: 'general', label: 'General' },
  { id: 'branding', label: 'Branding' },
] as const;

type TabId = 'general' | 'branding' | 'ai-credentials';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkRole() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user role name
        const { data: profile } = await supabase
          .from('users')
          .select('roles(name)')
          .eq('id', user.id)
          .single();

        if (profile) {
          // roles relation nested response
          const roleName = (profile.roles as unknown as { name: string })?.name;
          if (roleName === 'owner' || roleName === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error('Failed to check user role:', err);
      }
    }
    checkRole();
  }, []);

  const tabs = [
    ...BASE_TABS,
    ...(isAdmin ? [{ id: 'ai-credentials' as const, label: 'AI Credentials' }] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage workspace configuration, branding, and AI keys.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              'border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && <GeneralSettings />}
      {activeTab === 'branding' && <BrandingSettings />}
      {activeTab === 'ai-credentials' && isAdmin && <AICredentialsSettings />}
    </div>
  );
}
