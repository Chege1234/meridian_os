'use client';

/**
 * Feature Component — Content Editor
 *
 * Detailed editor for Content copies with AI assistant integration,
 * workflow status transitions, and version history.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Save,
  Sparkles,
  Calendar,
  History,
  CheckCircle2,
  FileEdit,
  Play,
  RotateCcw,
  Tag,
  ArrowRight,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Button, Input, Badge, Card, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui';
import type { ContentItem, ContentVersion, Prompt } from '@/domain/entities';
import {
  getContentDetailAction,
  updateContentItemAction,
  transitionContentStatusAction,
  generateContentAction
} from '../actions';
import { getPromptsAction } from '@/features/prompt-library/actions';

interface ContentEditorProps {
  contentId: string;
  onClose: () => void;
}

export function ContentEditor({ contentId, onClose }: ContentEditorProps) {
  const [item, setItem] = useState<ContentItem | null>(null);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [platform, setPlatform] = useState('');
  const [type, setType] = useState('');
  const [caption, setCaption] = useState('');
  const [body, setBody] = useState('');
  const [versionSummary, setVersionSummary] = useState('');
  const [saving, setSaving] = useState(false);

  // AI Assistant states
  const [activePrompts, setActivePrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  // Selected past version for modal
  const [viewingVersion, setViewingVersion] = useState<ContentVersion | null>(null);

  async function loadDetails() {
    try {
      const res = await getContentDetailAction(contentId);
      if (res.success && res.contentItem) {
        setItem(res.contentItem);
        setVersions(res.versions || []);
        
        setPlatform(res.contentItem.platform);
        setType(res.contentItem.type);
        setCaption(res.contentItem.caption || '');
        setBody(res.contentItem.body || '');
      } else {
        toast.error(res.error || 'Failed to load details.');
        onClose();
      }
    } catch {
      toast.error('An error occurred.');
      onClose();
    }
  }

  async function loadActivePrompts() {
    try {
      const res = await getPromptsAction({ status: 'active' });
      if (res.success) {
        setActivePrompts(res.prompts);
      }
    } catch (err: any) {
      console.warn('Failed to load prompts:', err.message);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadDetails();
      await loadActivePrompts();
      setLoading(false);
    }
    init();
  }, [contentId]);

  // Track selected prompt change to populate variables
  useEffect(() => {
    const prompt = activePrompts.find((p) => p.id === selectedPromptId);
    setSelectedPrompt(prompt || null);
    
    if (prompt) {
      const initialVars: Record<string, string> = {};
      prompt.variables.forEach((v) => {
        // Autofill default values if we can guess them from content item
        if (v === 'platform') initialVars[v] = platform;
        else if (v === 'type') initialVars[v] = type;
        else if (v === 'current_copy') initialVars[v] = caption || body;
        else initialVars[v] = '';
      });
      setVariableValues(initialVars);
    } else {
      setVariableValues({});
    }
  }, [selectedPromptId, activePrompts]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateContentItemAction({
        id: contentId,
        data: {
          platform: platform as any,
          type: type as any,
          caption,
          body,
          versionSummary: versionSummary.trim() || undefined,
        },
      });

      if (res.success) {
        toast.success('Changes saved and version snapshot recorded.');
        setVersionSummary('');
        loadDetails();
      } else {
        toast.error(res.error || 'Failed to save changes.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusTransition(nextStatus: any) {
    try {
      const res = await transitionContentStatusAction({
        id: contentId,
        status: nextStatus,
      });

      if (res.success) {
        toast.success(`Content transitioned to ${nextStatus}.`);
        loadDetails();
      } else {
        toast.error(res.error || 'Status transition rejected.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    }
  }

  async function handleAiGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPromptId) {
      toast.error('Please select an AI prompt template.');
      return;
    }

    setGenerating(true);
    setAiSuggestion('');
    try {
      const res = await generateContentAction({
        promptId: selectedPromptId,
        variables: variableValues,
      });

      if (res.success && res.text) {
        setAiSuggestion(res.text);
        toast.success('AI suggestions generated successfully!');
      } else {
        toast.error(res.error || 'AI generation failed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'AI request failed.');
    } finally {
      setGenerating(false);
    }
  }

  function applyAiSuggestion() {
    if (!aiSuggestion) return;
    
    // Determine where to insert based on content type
    if (type === 'article' || type === 'email_copy') {
      setBody(aiSuggestion);
    } else {
      setCaption(aiSuggestion);
    }
    toast.success('Applied AI suggestion to editor! Review and save when ready.');
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
              Edit Content Copy
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 capitalize">
              <span>Platform: <strong>{item?.platform}</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/45" />
              <span>Type: <strong>{item?.type.replace('_', ' ')}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="capitalize text-xs font-semibold py-1 px-2.5">
            Status: {item?.status}
          </Badge>
        </div>
      </div>

      {/* Grid of Work Area & Side Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Editor + Workflow Area */}
        <div className="xl:col-span-2 space-y-6">
          {/* Status Transitions Controls */}
          {item && item.status !== 'archived' && (
            <Card className="p-4 border-border/80 bg-card space-y-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Workflow Transitions
              </span>
              <div className="flex flex-wrap gap-2">
                {item.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusTransition('review')}
                    className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    Submit for Review <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
                {item.status === 'review' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatusTransition('approved')}
                      className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Approve Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusTransition('draft')}
                      className="text-yellow-600 border-yellow-500/20 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                    >
                      Send back to Draft (Admin/Owner)
                    </Button>
                  </>
                )}
                {item.status === 'approved' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatusTransition('scheduled')}
                      className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Schedule Publication
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusTransition('published')}
                      className="gap-1 bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      Publish Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusTransition('review')}
                      className="text-yellow-600 border-yellow-500/20 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                    >
                      Re-review Copy (Admin/Owner)
                    </Button>
                  </>
                )}
                {item.status === 'scheduled' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatusTransition('published')}
                      className="gap-1 bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      Publish Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusTransition('approved')}
                      className="text-indigo-600 border-indigo-500/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      Unschedule (Admin/Owner)
                    </Button>
                  </>
                )}
                {item.status === 'published' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusTransition('archived')}
                    className="text-red-600 border-red-500/20 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    Archive Published Copy
                  </Button>
                )}
                
                {/* Global soft-delete option */}
                {item.status !== 'published' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => handleStatusTransition('archived')}
                  >
                    Archive Draft
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Core Copy Editor Form */}
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="p-6 border-border/80 bg-card space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Platform
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize"
                    value={platform}
                    onChange={(e: any) => setPlatform(e.target.value)}
                    disabled={item?.status === 'archived'}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="twitter">X (Twitter)</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="email">Email Campaign</option>
                    <option value="blog">Blog Post</option>
                    <option value="whatsapp">WhatsApp Outreach</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Content Type
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize"
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    disabled={item?.status === 'archived'}
                  >
                    <option value="post">Image Post</option>
                    <option value="story">Story</option>
                    <option value="reel">Reel Video</option>
                    <option value="caption">Video Caption</option>
                    <option value="article">Blog Article</option>
                    <option value="email_copy">Email Copy</option>
                  </select>
                </div>
              </div>

              {/* Caption or Email Subject */}
              <div className="space-y-1">
                <label htmlFor="content-caption" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Caption / Subject
                </label>
                <textarea
                  id="content-caption"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Insert post caption, social hashtags, or email subject lines here..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={item?.status === 'archived'}
                />
              </div>

              {/* Long Form Body Copy */}
              {(type === 'article' || type === 'email_copy') && (
                <div className="space-y-1">
                  <label htmlFor="content-body" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Body Copy (Long Form Content)
                  </label>
                  <textarea
                    id="content-body"
                    rows={12}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-sans"
                    placeholder="Write detailed newsletter contents, outreach logs, or article bodies here..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={item?.status === 'archived'}
                  />
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <label htmlFor="content-summary" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Version Summary / Save Note
                </label>
                <Input
                  id="content-summary"
                  placeholder="e.g. Updated call to action link, adjusted tags"
                  value={versionSummary}
                  onChange={(e) => setVersionSummary(e.target.value)}
                  disabled={item?.status === 'archived'}
                />
                <p className="text-[10px] text-muted-foreground">
                  Saving content changes writes an immutable version snapshot (BR-303).
                </p>
              </div>

              {item?.status !== 'archived' && (
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={saving} className="gap-1.5 shadow-sm">
                    <Save className="h-4 w-4" /> Save Content Changes
                  </Button>
                </div>
              )}
            </Card>
          </form>
        </div>

        {/* AI Assistant + Versions Side Panels */}
        <div className="space-y-6">
          {/* AI Generator Panel */}
          {item?.status !== 'archived' && (
            <Card className="p-6 border-border/80 bg-card space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Assistant Panel
              </h3>

              <form onSubmit={handleAiGenerate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Prompt Template
                  </label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize"
                    value={selectedPromptId}
                    onChange={(e) => setSelectedPromptId(e.target.value)}
                    required
                  >
                    <option value="">Select active prompt template...</option>
                    {activePrompts.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                {/* Render prompt variables dynamically */}
                {selectedPrompt && selectedPrompt.variables.length > 0 && (
                  <div className="space-y-3 p-3 bg-muted/40 rounded-lg border border-border/60">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                      Configure Variables:
                    </span>
                    {selectedPrompt.variables.map((v) => (
                      <div key={v} className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-foreground capitalize">
                          {v.replace('_', ' ')}
                        </label>
                        <Input
                          className="h-8 text-xs px-2"
                          placeholder={`Enter value for ${v.replace('_', ' ')}`}
                          value={variableValues[v] || ''}
                          onChange={(e) => setVariableValues({
                            ...variableValues,
                            [v]: e.target.value,
                          })}
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                {selectedPromptId && (
                  <Button type="submit" disabled={generating} className="w-full h-8 text-xs gap-1.5 bg-primary/95 shadow-sm">
                    <Play className="h-3.5 w-3.5" /> {generating ? 'Generating Suggestions...' : 'Generate with AI'}
                  </Button>
                )}
              </form>

              {/* AI response preview */}
              {aiSuggestion && (
                <div className="space-y-3 pt-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground border-b border-border/40 pb-2">
                    <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-yellow-500" /> Draft Suggestion</span>
                    <Button variant="ghost" size="sm" onClick={() => setAiSuggestion('')} className="h-5 px-1.5 text-[10px]">
                      Clear
                    </Button>
                  </div>
                  <div className="bg-yellow-500/5 dark:bg-yellow-500/10 border border-yellow-500/25 p-3 rounded-lg text-xs leading-relaxed text-foreground select-all whitespace-pre-wrap font-sans max-h-56 overflow-y-auto">
                    {aiSuggestion}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>*Responses remain editable.</span>
                    <Button
                      size="sm"
                      className="h-7 text-[10px] gap-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={applyAiSuggestion}
                    >
                      Apply to Editor
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Content versions */}
          <Card className="p-6 border-border/80 bg-card space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Version Timeline
            </h3>

            <div className="relative border-l border-border pl-4 space-y-6 py-2">
              {versions.map((ver, idx) => (
                <div key={ver.id} className="relative group">
                  {/* Timeline point */}
                  <div className={`absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 bg-background ${idx === 0 ? 'border-primary scale-125' : 'border-muted-foreground/40'}`} />
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Version {versions.length - idx}
                        {idx === 0 && (
                          <Badge className="ml-1.5 py-0 px-1 text-[9px] uppercase font-semibold">Current</Badge>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setViewingVersion(ver)}
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
                <History className="h-5 w-5 text-primary" /> Content Snapshot
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-3 rounded-lg border border-border/40">
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Timestamp:</span>
                  <span className="text-foreground font-semibold">{new Date(viewingVersion.createdAt).toLocaleString()}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Change Summary:</span>
                  <span className="text-foreground font-semibold italic">"{viewingVersion.summary || 'No summary'}"</span>
                </div>
              </div>

              {viewingVersion.caption && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Caption Snapshot
                  </label>
                  <div className="bg-muted p-3 rounded-lg text-xs border border-border/80 whitespace-pre-wrap leading-relaxed">
                    {viewingVersion.caption}
                  </div>
                </div>
              )}

              {viewingVersion.body && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Body Snapshot
                  </label>
                  <div className="bg-muted p-3 rounded-lg text-xs border border-border/80 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto font-mono">
                    {viewingVersion.body}
                  </div>
                </div>
              )}

              {/* Action to restore this past version */}
              {item?.status !== 'archived' && (
                <div className="flex justify-between items-center pt-4 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground max-w-sm">
                    Restoring this snapshot will update the editor and write a new version snapshot matching these contents (BR-1101).
                  </p>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={async () => {
                      if (!confirm('Are you sure you want to restore this version snapshot?')) return;
                      try {
                        const res = await updateContentItemAction({
                          id: contentId,
                          data: {
                            caption: viewingVersion.caption,
                            body: viewingVersion.body,
                            versionSummary: 'Restored previous version snapshot',
                          },
                        });
                        if (res.success) {
                          toast.success('Successfully restored version!');
                          setViewingVersion(null);
                          loadDetails();
                        } else {
                          toast.error(res.error || 'Failed to restore.');
                        }
                      } catch (err: any) {
                        toast.error(err.message || 'An error occurred.');
                      }
                    }}
                  >
                    Restore This Snapshot
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
