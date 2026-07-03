'use client';

/**
 * Feature — General Settings
 *
 * Workspace name and description.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/infrastructure/supabase/client';

export function GeneralSettings() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['workspace.name', 'workspace.description']);

      if (data) {
        for (const setting of data) {
          if (setting.key === 'workspace.name') setName(setting.value);
          if (setting.key === 'workspace.description')
            setDescription(setting.value);
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

      await supabase
        .from('settings')
        .upsert([
          {
            key: 'workspace.name',
            value: name,
            type: 'string',
            description: 'Workspace display name',
            updated_at: new Date().toISOString(),
          },
          {
            key: 'workspace.description',
            value: description,
            type: 'string',
            description: 'Workspace description',
            updated_at: new Date().toISOString(),
          },
        ], { onConflict: 'key' });

      toast.success('Settings saved successfully.');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-20 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="workspace-name"
          className="text-sm font-medium text-foreground"
        >
          Workspace Name
        </label>
        <input
          id="workspace-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Campus Marketplace"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          This name appears across the workspace for all users.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="workspace-description"
          className="text-sm font-medium text-foreground"
        >
          Description
        </label>
        <textarea
          id="workspace-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description of your workspace"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
