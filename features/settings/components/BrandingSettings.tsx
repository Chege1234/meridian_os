'use client';

/**
 * Feature — Branding Settings
 *
 * Per BR-1302: branding changes update every module automatically.
 * Per BR-1303: changing themes never requires deployment.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/infrastructure/supabase/client';

export function BrandingSettings() {
  const [primaryColor, setPrimaryColor] = useState('#16a34a');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['brand.primaryColor']);

      if (data) {
        for (const setting of data) {
          if (setting.key === 'brand.primaryColor')
            setPrimaryColor(setting.value);
        }
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      await supabase.from('settings').upsert(
        [
          {
            key: 'brand.primaryColor',
            value: primaryColor,
            type: 'string',
            description: 'Brand primary color (hex)',
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'key' },
      );

      toast.success('Branding saved. Changes take effect immediately.');
    } catch {
      toast.error('Failed to save branding.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="primary-color"
          className="text-sm font-medium text-foreground"
        >
          Primary Color
        </label>
        <div className="flex items-center gap-3">
          <input
            id="primary-color"
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded-md border border-input"
          />
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#16a34a"
            className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Changes propagate across all modules without redeployment.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save branding'}
        </button>
      </div>
    </form>
  );
}
