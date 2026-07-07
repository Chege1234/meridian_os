'use client';

/**
 * Feature Component — Prompt Editor
 *
 * Detailed editing view for prompt templates.
 * Per BR-702: every edit creates a version snapshot.
 * Per BR-1102: stores author, timestamp, change summary.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, Save, Sparkles, AlertTriangle, Eye, Calendar, User, History, ArrowRight, Tag } from 'lucide-react';
import { Button, Input, Badge, Card, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui';
import type { Prompt, PromptVersion } from '@/domain/entities';
import { extractVariables } from '@/domain/rules/PromptRules';
import { getPromptDetailAction, updatePromptAction, deprecatePromptAction } from '../actions';

interface PromptEditorProps {
  promptId: string;
  onClose: () => void;
}

export function PromptEditor({ promptId, onClose }: PromptEditorProps) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [promptText, setPromptText] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google' | 'nvidia'>('openai');
  const [status, setStatus] = useState<'draft' | 'active' | 'deprecated'>('draft');
  const [versionSummary, setVersionSummary] = useState('');
  const [saving, setSaving] = useState(false);

  // Selected past version for modal
  const [viewingVersion, setViewingVersion] = useState<PromptVersion | null>(null);

  async function loadDetails() {
    try {
      const res = await getPromptDetailAction(promptId);
      if (res.success && res.prompt) {
        setPrompt(res.prompt);
        setVersions(res.versions || []);
        
        setTitle(res.prompt.title);
        setDesc(res.prompt.description || '');
        setPromptText(res.prompt.prompt);
        setProvider(res.prompt.provider);
        setStatus(res.prompt.status);
      } else {
        toast.error(res.error || 'Failed to load details.');
        onClose();
      }
    } catch {
      toast.error('An error occurred.');
      onClose();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [promptId]);

  // Live variable extraction
  const liveVariables = extractVariables(promptText);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !promptText.trim()) {
      toast.error('Title and Prompt template are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await updatePromptAction({
        id: promptId,
        data: {
          title,
          description: desc || null,
          prompt: promptText,
          provider,
          status,
          versionSummary: versionSummary.trim() || undefined,
        },
      });

      if (res.success) {
        toast.success('Prompt updated and new version snapshot created.');
        setVersionSummary('');
        loadDetails();
      } else {
        toast.error(res.error || 'Failed to update prompt.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeprecate() {
    if (!confirm('Are you sure you want to deprecate this prompt? This cannot be undone.')) return;
    try {
      const res = await deprecatePromptAction(promptId);
      if (res.success) {
        toast.success('Prompt deprecated successfully.');
        loadDetails();
      } else {
        toast.error(res.error || 'Failed to deprecate prompt.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/4 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 animate-pulse rounded bg-muted" />
          <div className="h-96 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              Edit Prompt Template
            </h1>
            <p className="text-xs text-muted-foreground">
              Current version is <span className="font-mono font-semibold">v{prompt?.version}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status !== 'deprecated' && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-500/20 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={handleDeprecate}
            >
              Deprecate
            </Button>
          )}
          <Badge className="capitalize text-xs font-semibold py-1 px-2.5">
            Status: {prompt?.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-border/80 bg-card space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Prompt Metadata
            </h3>

            <div className="space-y-1">
              <label htmlFor="edit-title" className="text-xs font-medium text-muted-foreground">
                Title
              </label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={status === 'deprecated'}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-desc" className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <Input
                id="edit-desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                disabled={status === 'deprecated'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  AI Provider
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={provider}
                  onChange={(e: any) => setProvider(e.target.value)}
                  disabled={status === 'deprecated'}
                >
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="google">Google (Gemini)</option>
                  <option value="nvidia">NVIDIA (GLM-5.2)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Publishing Status
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  disabled={status === 'deprecated'}
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="active">Active (Available for AI)</option>
                  {status === 'deprecated' && <option value="deprecated">Deprecated</option>}
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/80 bg-card space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex justify-between">
              <span>Template Content</span>
              {liveVariables.length > 0 && (
                <span className="text-xs font-normal normal-case text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> {liveVariables.length} placeholder variables detected
                </span>
              )}
            </h3>

            <div className="space-y-2">
              <textarea
                className="flex min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono text-xs leading-relaxed"
                placeholder="e.g. Write a social post promoting {{topic}}..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                required
                disabled={status === 'deprecated'}
              />
            </div>

            {/* Live variables tags list */}
            {liveVariables.length > 0 && (
              <div className="bg-muted/40 p-3 rounded-lg border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-2">
                  Extracted Variables:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {liveVariables.map((v) => (
                    <Badge key={v} variant="secondary" className="font-mono text-[10px] px-1.5 py-0.5 border border-border/50 text-foreground">
                      {"{{" + v + "}}"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <label htmlFor="edit-summary" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Version Release Notes
              </label>
              <Input
                id="edit-summary"
                placeholder="e.g. Fixed grammar, added audience variable"
                value={versionSummary}
                onChange={(e) => setVersionSummary(e.target.value)}
                disabled={status === 'deprecated'}
              />
              <p className="text-[10px] text-muted-foreground">
                Documenting changes creates an immutable version snapshot (BR-702, BR-1100).
              </p>
            </div>

            {status !== 'deprecated' && (
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving} className="gap-1.5 shadow-sm">
                  <Save className="h-4 w-4" /> Save Changes & Publish Version
                </Button>
              </div>
            )}
          </Card>
        </form>

        {/* History Timeline */}
        <div className="space-y-6">
          <Card className="p-6 border-border/80 bg-card space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Version History
            </h3>

            <div className="relative border-l border-border pl-4 space-y-6 py-2">
              {versions.map((ver) => (
                <div key={ver.id} className="relative group">
                  {/* Timeline point */}
                  <div className={`absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 bg-background ${ver.version === prompt?.version ? 'border-primary scale-125' : 'border-muted-foreground/40'}`} />
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-foreground">
                        Version {ver.version}
                        {ver.version === prompt?.version && (
                          <Badge className="ml-1.5 py-0 px-1 text-[9px] uppercase font-semibold">Active</Badge>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setViewingVersion(ver)}
                        title="View Snapshot"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {ver.summary && (
                      <p className="text-xs text-foreground/80 font-medium">
                        {ver.summary}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(ver.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Snapshot Modal */}
      {viewingVersion && (
        <Dialog open={!!viewingVersion} onOpenChange={() => setViewingVersion(null)}>
          <DialogContent className="sm:max-w-[700px] border-border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Prompt Version Snapshot
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-3 rounded-lg border border-border/40">
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Version:</span>
                  <span className="font-mono font-bold text-foreground">v{viewingVersion.version}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Created On:</span>
                  <span className="text-foreground font-semibold">{new Date(viewingVersion.createdAt).toLocaleString()}</span>
                </div>
                <div className="col-span-2 space-y-1 pt-1.5 border-t border-border/40">
                  <span className="text-muted-foreground block font-medium">Change Summary:</span>
                  <span className="text-foreground font-semibold italic">"{viewingVersion.summary || 'No summary provided.'}"</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Prompt Text Snapshot
                </label>
                <div className="bg-muted p-4 rounded-lg font-mono text-xs border border-border/80 whitespace-pre-wrap leading-relaxed select-all">
                  {viewingVersion.prompt}
                </div>
              </div>

              {viewingVersion.variables.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Variables Configured
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingVersion.variables.map((v) => (
                      <Badge key={v} variant="outline" className="font-mono text-[10px]">
                        {"{{" + v + "}}"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action to restore this past version */}
              {status !== 'deprecated' && viewingVersion.version !== prompt?.version && (
                <div className="flex justify-between items-center pt-4 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground max-w-sm">
                    Restoring this snapshot will increment the active prompt version and create a new version snapshot matching this text (BR-1101).
                  </p>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to restore Version ${viewingVersion.version}?`)) return;
                      try {
                        const res = await updatePromptAction({
                          id: promptId,
                          data: {
                            prompt: viewingVersion.prompt,
                            variables: [...viewingVersion.variables],
                            versionSummary: `Restored Version ${viewingVersion.version}`,
                          },
                        });
                        if (res.success) {
                          toast.success(`Successfully restored Version ${viewingVersion.version}!`);
                          setViewingVersion(null);
                          loadDetails();
                        } else {
                          toast.error(res.error || 'Failed to restore version.');
                        }
                      } catch (err: any) {
                        toast.error(err.message || 'An error occurred.');
                      }
                    }}
                  >
                    Restore Version {viewingVersion.version}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
