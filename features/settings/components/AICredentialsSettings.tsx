'use client';

/**
 * Feature — Settings / AI Credentials
 *
 * Tab panel that hosts the list of credentials, health checks,
 * and handles adding new credentials.
 */

import { useState, useEffect, useCallback } from 'react';
import { getProviderCredentials, runHealthCheck } from '../actions';
import type { ProviderCredential } from '@/domain/entities';
import { CredentialTable } from './CredentialTable';
import { AddCredentialDialog } from './AddCredentialDialog';

export function AICredentialsSettings() {
  const [credentials, setCredentials] = useState<ProviderCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getProviderCredentials();
    setLoading(false);

    if (res.success) {
      setCredentials(res.data);
    } else {
      setError(res.error);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleFullHealthCheck = async () => {
    setCheckingHealth(true);
    const res = await runHealthCheck();
    setCheckingHealth(false);

    if (res.success) {
      const data = res.data as { checked: number; recovered: number; stillFailing: number };
      alert(
        `Health Check Completed:\n` +
        `- Checked: ${data.checked}\n` +
        `- Recovered: ${data.recovered}\n` +
        `- Still Failing: ${data.stillFailing}`
      );
      fetchCredentials();
    } else {
      alert(`Health check trigger failed: ${res.error}`);
    }
  };

  if (loading && credentials.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Loading credentials...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">AI Provider Credentials</h2>
          <p className="text-sm text-muted-foreground">
            Manage encrypted API keys and priorities for failover routing.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFullHealthCheck}
            disabled={checkingHealth}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            {checkingHealth ? 'Checking…' : 'Run Health Check'}
          </button>
          <button
            onClick={() => setDialogOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add Credential
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <CredentialTable credentials={credentials} onRefresh={fetchCredentials} />

      <AddCredentialDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={() => fetchCredentials()}
      />
    </div>
  );
}
export default AICredentialsSettings;
