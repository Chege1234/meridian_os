'use client';

/**
 * Feature — Settings Page
 *
 * Main settings view with tabs for General and Branding.
 * Reads/writes through Setting use cases.
 * Per BR-1300/1302/1303: workspace settings affect everyone,
 * branding propagates automatically, no redeploy required.
 */

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { GeneralSettings } from './GeneralSettings';
import { BrandingSettings } from './BrandingSettings';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'branding', label: 'Branding' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage workspace configuration and branding.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border" role="tablist">
        {TABS.map((tab) => (
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
    </div>
  );
}
