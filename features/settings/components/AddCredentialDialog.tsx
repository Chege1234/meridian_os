'use client';

/**
 * Feature — Settings / Add Credential Dialog
 *
 * Modal dialog for creating a new AI provider credential.
 * The key input is type="password" — masked at all times.
 * After save, the raw key is never shown again.
 *
 * Per docs/09_SECURITY_SPECIFICATION.md:
 *   Never expose decrypted keys in UI after initial entry.
 */

import { useState } from 'react';
import { addProviderCredential } from '../actions';
import type { ProviderCredential } from '@/domain/entities';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (credential: ProviderCredential) => void;
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google Gemini' },
] as const;

const TIERS = [
  { value: 'flagship', label: 'Flagship (GPT-4o / Claude Sonnet / Gemini Pro)' },
  { value: 'fast', label: 'Fast (GPT-4o-mini / Claude Haiku / Gemini Flash)' },
] as const;

const INITIAL_FORM = {
  provider: 'openai' as const,
  label: '',
  rawKey: '',
  priority: 10,
  modelTier: 'flagship' as const,
};

export function AddCredentialDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await addProviderCredential(form);

    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onCreated(result.data);
    setForm(INITIAL_FORM);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="mb-1 text-lg font-semibold text-foreground">Add AI Provider Credential</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          The API key is encrypted before storage and cannot be retrieved after saving.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Provider */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cred-provider">
              Provider
            </label>
            <select
              id="cred-provider"
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value as typeof form.provider })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cred-label">
              Label <span className="text-muted-foreground">(human-readable name)</span>
            </label>
            <input
              id="cred-label"
              type="text"
              required
              placeholder="e.g. OpenAI Production Primary"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cred-key">
              API Key
            </label>
            <input
              id="cred-key"
              type="password"
              required
              autoComplete="off"
              placeholder="sk-••••••••••••••••"
              value={form.rawKey}
              onChange={(e) => setForm({ ...form, rawKey: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Stored encrypted (AES-256-GCM). Not recoverable after save.
            </p>
          </div>

          {/* Model Tier */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cred-tier">
              Model Tier
            </label>
            <select
              id="cred-tier"
              value={form.modelTier}
              onChange={(e) => setForm({ ...form, modelTier: e.target.value as typeof form.modelTier })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="cred-priority">
              Priority <span className="text-muted-foreground">(lower = tried first)</span>
            </label>
            <input
              id="cred-priority"
              type="number"
              min={1}
              max={9999}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value, 10) || 10 })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
