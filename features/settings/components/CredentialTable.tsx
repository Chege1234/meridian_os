'use client';

/**
 * Feature — Settings / Credential Table
 *
 * Displays list of provider credentials. Allow editing priority,
 * toggling active/disabled, soft deleting, and retrying health checks.
 */

import { useState } from 'react';
import type { ProviderCredential } from '@/domain/entities';
import { setCredentialPriority, setCredentialStatus, removeProviderCredential, retrySingleCredential } from '../actions';

interface Props {
  credentials: ProviderCredential[];
  onRefresh: () => void;
}

export function CredentialTable({ credentials, onRefresh }: Props) {
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
  const [priorityVal, setPriorityVal] = useState<number>(10);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setUpdatingId(id);
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const res = await setCredentialStatus(id, { status: newStatus });
    setUpdatingId(null);
    if (res.success) {
      onRefresh();
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential? This cannot be undone.')) return;
    setUpdatingId(id);
    const res = await removeProviderCredential(id);
    setUpdatingId(null);
    if (res.success) {
      onRefresh();
    } else {
      alert(res.error);
    }
  };

  const handleSavePriority = async (id: string) => {
    setUpdatingId(id);
    const res = await setCredentialPriority(id, { priority: priorityVal });
    setUpdatingId(null);
    setEditingPriorityId(null);
    if (res.success) {
      onRefresh();
    } else {
      alert(res.error);
    }
  };

  const handleRetry = async (id: string) => {
    setUpdatingId(id);
    const res = await retrySingleCredential(id);
    setUpdatingId(null);
    if (res.success) {
      const data = res.data as { success: boolean; errorMessage?: string };
      if (data.success) {
        alert('Credential health check passed! Status reset to active.');
      } else {
        alert(`Health check failed: ${data.errorMessage || 'Unknown error'}`);
      }
      onRefresh();
    } else {
      alert(res.error);
    }
  };

  const getStatusBadge = (status: ProviderCredential['status']) => {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    switch (status) {
      case 'active':
        return `${base} bg-green-500/10 text-green-500 border border-green-500/20`;
      case 'rate_limited':
        return `${base} bg-yellow-500/10 text-yellow-500 border border-yellow-500/20`;
      case 'disabled':
        return `${base} bg-muted/10 text-muted-foreground border border-muted/20`;
      case 'error':
        return `${base} bg-destructive/10 text-destructive border border-destructive/20`;
      default:
        return base;
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
            <th className="px-4 py-3">Label</th>
            <th className="px-4 py-3">Provider</th>
            <th className="px-4 py-3">Tier</th>
            <th className="px-4 py-3 w-28">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Last Checked / Error</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {credentials.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                No credentials configured yet. Click "Add Credential" to configure one.
              </td>
            </tr>
          ) : (
            credentials.map((cred) => (
              <tr key={cred.id} className="hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3.5 font-medium text-foreground">
                  {cred.label}
                </td>
                <td className="px-4 py-3.5 capitalize text-muted-foreground">
                  {cred.provider}
                </td>
                <td className="px-4 py-3.5 capitalize text-muted-foreground">
                  {cred.modelTier}
                </td>
                <td className="px-4 py-3.5 text-foreground">
                  {editingPriorityId === cred.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={9999}
                        value={priorityVal}
                        onChange={(e) => setPriorityVal(parseInt(e.target.value, 10) || 10)}
                        className="w-16 rounded border border-border bg-background px-1.5 py-0.5 text-center text-xs text-foreground focus:outline-none"
                      />
                      <button
                        onClick={() => handleSavePriority(cred.id)}
                        className="text-primary hover:text-primary/80 font-medium text-xs"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingPriorityId(null)}
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span>{cred.priority}</span>
                      <button
                        onClick={() => {
                          setEditingPriorityId(cred.id);
                          setPriorityVal(cred.priority);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-foreground transition-opacity"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className={getStatusBadge(cred.status)}>{cred.status}</span>
                </td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-xs truncate">
                  {cred.status === 'error' && cred.lastErrorMessage ? (
                    <span className="text-destructive font-medium" title={cred.lastErrorMessage}>
                      {cred.lastErrorMessage}
                    </span>
                  ) : cred.status === 'rate_limited' && cred.rateLimitResetAt ? (
                    <span>Reset: {new Date(cred.rateLimitResetAt).toLocaleTimeString()}</span>
                  ) : cred.lastErrorAt ? (
                    <span>Last Err: {new Date(cred.lastErrorAt).toLocaleDateString()}</span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right space-x-2">
                  {(cred.status === 'error' || cred.status === 'rate_limited') && (
                    <button
                      onClick={() => handleRetry(cred.id)}
                      disabled={updatingId !== null}
                      className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleStatus(cred.id, cred.status)}
                    disabled={updatingId !== null}
                    className="rounded border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent disabled:opacity-50"
                  >
                    {cred.status === 'disabled' ? 'Enable' : 'Disable'}
                  </button>
                  <button
                    onClick={() => handleDelete(cred.id)}
                    disabled={updatingId !== null}
                    className="rounded bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
