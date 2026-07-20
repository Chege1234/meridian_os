'use client';

/**
 * Feature Component — KB Article Editor
 *
 * Premium editing interface for Knowledge Base articles with version history
 * and workflow status transition management.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Save,
  Eye,
  Calendar,
  User,
  History,
  Tag,
  BookOpen,
  ArrowRight,
  Archive,
  Send,
  CheckCircle,
  FileText
} from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/shared/components/ui';
import { GlassPanel } from '@/shared/components/ui/GlassPanel';
import type { KbArticle, KbArticleVersion, KbCategory } from '@/domain/entities';
import {
  getArticleDetailAction,
  createArticleAction,
  updateArticleAction,
  transitionArticleStatusAction,
  getCategoriesAction
} from '../actions';
import { generateSlug } from '@/domain/rules/KbRules';

interface KbEditorProps {
  articleId: string | null; // null for creating new
  initialCategoryId?: string | null;
  onClose: () => void;
}

export function KbEditor({ articleId, initialCategoryId, onClose }: KbEditorProps) {
  const queryClient = useQueryClient();
  const [article, setArticle] = useState<KbArticle | null>(null);
  const [versions, setVersions] = useState<KbArticleVersion[]>([]);
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [summary, setSummary] = useState(''); // version summary
  const [saving, setSaving] = useState(false);

  // Version snapshot view modal
  const [viewingVersion, setViewingVersion] = useState<KbArticleVersion | null>(null);

  async function loadCategories() {
    try {
      const res = await getCategoriesAction();
      if (res.success) {
        setCategories(res.categories);
        if (!articleId && initialCategoryId) {
          setCategoryId(initialCategoryId);
        } else if (res.categories && res.categories.length > 0 && !categoryId) {
          const firstCat = res.categories[0];
          if (firstCat) {
            setCategoryId(firstCat.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }

  async function loadDetails() {
    if (!articleId) {
      setLoading(false);
      return;
    }
    try {
      const res = await getArticleDetailAction(articleId);
      if (res.success && res.article) {
        setArticle(res.article);
        setVersions(res.versions || []);
        
        setTitle(res.article.title);
        setCategoryId(res.article.categoryId);
        
        // Find current version content
        const currentVer = res.versions ? res.versions.find((v) => v.id === res.article?.currentVersionId) : null;
        if (currentVer) {
          setContent(currentVer.content);
        } else if (res.versions && res.versions.length > 0 && res.versions[0]) {
          // Fallback to the latest version in history
          setContent(res.versions[0].content);
        }
      } else {
        toast.error(res.error || 'Failed to load article details.');
        onClose();
      }
    } catch {
      toast.error('An error occurred loading details.');
      onClose();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([loadCategories(), loadDetails()]);
  }, [articleId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) {
      toast.error('Title, Content, and Category are required.');
      return;
    }

    setSaving(true);
    try {
      if (articleId) {
        // Update existing
        const res = await updateArticleAction({
          id: articleId,
          data: {
            title,
            content,
            categoryId,
            summary: summary.trim() || undefined,
            versionSummary: summary.trim() || undefined,
          },
        });

        if (res.success) {
          toast.success('Article updated and new version snapshot created.');
          setSummary('');
          queryClient.invalidateQueries({ queryKey: ['kbArticles'] });
          await loadDetails();
        } else {
          toast.error(res.error || 'Failed to update article.');
        }
      } else {
        // Create new
        const res = await createArticleAction({
          title,
          content,
          categoryId,
          summary: summary.trim() || undefined,
          status: 'draft',
        });

        if (res.success && 'article' in res && res.article) {
          toast.success('Article created as Draft successfully.');
          queryClient.invalidateQueries({ queryKey: ['kbArticles'] });
          onClose();
        } else {
          toast.error(res.error || 'Failed to create article.');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusTransition(targetStatus: 'draft' | 'review' | 'published' | 'archived') {
    if (!articleId) return;
    try {
      const res = await transitionArticleStatusAction({
        id: articleId,
        status: targetStatus,
      });

      if (res.success) {
        toast.success(`Article status transitioned to ${targetStatus} successfully.`);
        queryClient.invalidateQueries({ queryKey: ['kbArticles'] });
        await loadDetails();
      } else {
        toast.error(res.error || 'Status transition failed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    }
  }

  // Indented categories listing for dropdown
  const renderCategoryOptions = (parentId: string | null = null, depth = 0): React.ReactNode[] => {
    const list = categories.filter((c) => c.parentCategoryId === parentId);
    return list.flatMap((c) => [
      <option key={c.id} value={c.id} className="bg-background text-foreground">
        {'\u00A0'.repeat(depth * 3)}{depth > 0 ? '↳ ' : ''}{c.name}
      </option>,
      ...renderCategoryOptions(c.id, depth + 1),
    ]);
  };

  // Simple Markdown Renderer
  const renderMarkdownPreview = (text: string) => {
    if (!text) return <p className="text-muted-foreground italic">No content written yet.</p>;

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
        {text.split('\n').map((line, idx) => {
          if (line.startsWith('# ')) {
            return <h1 key={idx} className="text-2xl font-extrabold text-foreground border-b border-border/60 pb-1 pt-2">{line.replace('# ', '')}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={idx} className="text-xl font-bold text-foreground border-b border-border/40 pb-0.5 pt-2">{line.replace('## ', '')}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={idx} className="text-lg font-semibold text-foreground pt-1">{line.replace('### ', '')}</h3>;
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-foreground/90">
                {line.substring(2)}
              </li>
            );
          }
          if (line.match(/^\d+\.\s/)) {
            return (
              <li key={idx} className="ml-4 list-decimal text-foreground/90">
                {line.replace(/^\d+\.\s/, '')}
              </li>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-2" />;
          }
          return <p key={idx} className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{line}</p>;
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/4 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 animate-pulse rounded bg-muted" />
          <div className="h-96 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const activeVersionNumber = versions.findIndex((v) => v.id === article?.currentVersionId);
  const isArchived = article?.status === 'archived';

  return (
    <div className="animate-fade-up space-y-6">
      {/* Header & Workflow Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="icon" onClick={onClose} className="h-8 w-8 rounded-xl border-[var(--mer-border-glow)] text-mer-muted hover:text-mer-text">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-mer-text flex items-center gap-2">
              {articleId ? 'Edit KB Article' : 'Create KB Article'}
            </h1>
            {article && (
              <p className="text-[10px] text-mer-muted mt-0.5">
                Slug: <span className="font-mono bg-[rgba(7,12,22,0.4)] border border-[var(--mer-border-glow)] py-0.5 px-2 rounded-lg text-mer-cyan">{article.slug}</span>
              </p>
            )}
          </div>
        </div>

        {/* Workflow Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {article && (
            <>
              {article.status === 'draft' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusTransition('review')}
                  className="gap-1.5 border-mer-blue/30 text-mer-blue bg-mer-blue/10 hover:bg-mer-blue/20"
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit for Review
                </Button>
              )}
              {article.status === 'review' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusTransition('draft')}
                    className="gap-1.5 border-mer-amber/30 text-mer-amber bg-mer-amber/10 hover:bg-mer-amber/20"
                  >
                    Send back to Draft
                  </Button>
                  <Button
                    variant="glow"
                    size="sm"
                    onClick={() => handleStatusTransition('published')}
                    className="gap-1.5"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Publish Article
                  </Button>
                </>
              )}
              {article.status === 'published' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusTransition('archived')}
                  className="gap-1.5 border-mer-red/30 text-mer-red bg-mer-red/10 hover:bg-mer-red/20"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </Button>
              )}
              <Badge
                variant={
                  article.status === 'published' ? 'green' :
                  article.status === 'review' ? 'blue' :
                  article.status === 'draft' ? 'amber' : 'red'
                }
                className="capitalize text-xs font-semibold py-1 px-2.5"
              >
                Status: {article.status}
              </Badge>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Panel */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <div className="rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md p-6 space-y-5">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted flex items-center gap-1.5 border-b border-[var(--mer-border-glow)] pb-2">
              <FileText className="h-4 w-4 text-mer-cyan" /> Article Content
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">Title</label>
                <Input
                  disabled={isArchived}
                  placeholder="e.g. How to connect to VPN"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">Category</label>
                <select
                  disabled={isArchived}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.7)] px-3 text-sm text-mer-text outline-none focus:border-[var(--mer-border-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled className="text-mer-muted">Select a category...</option>
                  {renderCategoryOptions()}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">Content (Markdown)</label>
              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-40 grid-cols-2 mb-2 bg-[rgba(7,12,22,0.7)] rounded-xl border border-[var(--mer-border-glow)] p-1 h-9">
                  <TabsTrigger value="edit" className="rounded-lg text-xs font-semibold py-1.5">Edit</TabsTrigger>
                  <TabsTrigger value="preview" className="rounded-lg text-xs font-semibold py-1.5">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-0">
                  <textarea
                    disabled={isArchived}
                    placeholder="Write article content using markdown (# Title, ## Heading, etc.)..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    className="flex min-h-[300px] w-full rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.6)] px-4 py-3 text-sm text-mer-text placeholder:text-mer-muted outline-none focus:border-[var(--mer-border-hover)] disabled:cursor-not-allowed disabled:opacity-50 font-mono resize-none leading-relaxed"
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-0">
                  <div className="min-h-[300px] w-full rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.3)] p-4 overflow-y-auto max-h-[400px]">
                    {renderMarkdownPreview(content)}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">
                Version Summary / Change Log
              </label>
              <Input
                disabled={isArchived}
                placeholder={articleId ? 'What changes did you make in this version?' : 'Initial creation details...'}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)]"
              />
            </div>

            {!isArchived && (
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : articleId ? 'Save Edits & Create Version' : 'Create Article'}
                </Button>
              </div>
            )}
          </div>
        </form>

        {/* Sidebar History Panel */}
        <div className="space-y-6">
          <div className="rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md p-6 space-y-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted flex items-center gap-2 border-b border-[var(--mer-border-glow)] pb-2">
              <History className="h-4 w-4 text-mer-cyan" /> Version History
            </h3>

            {versions.length === 0 ? (
              <p className="text-xs text-mer-muted italic">No version history yet.</p>
            ) : (
              <div className="relative border-l border-[var(--mer-border-glow)] pl-4 space-y-6 py-2">
                {versions.map((ver, idx) => {
                  const isActive = ver.id === article?.currentVersionId;
                  const versionIndex = versions.length - idx;
                  return (
                    <div key={ver.id} className="relative group">
                      {/* Timeline dot node */}
                      <div
                        className={`absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 bg-[var(--mer-bg-base)] transition-all ${
                          isActive
                            ? 'border-mer-cyan scale-125 shadow-[0_0_8px_var(--mer-glow-cyan)]'
                            : 'border-mer-muted/40'
                        }`}
                      />
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-mer-text">
                            Version {versionIndex}
                            {isActive && (
                              <Badge variant="cyan" className="ml-1.5 py-0 px-1 text-[9px] uppercase">Active</Badge>
                            )}
                          </span>
                          <button
                            className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-mer-muted hover:bg-white/5 hover:text-mer-cyan transition-all cursor-pointer"
                            onClick={() => setViewingVersion(ver)}
                            title="View Snapshot"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {ver.summary && (
                          <p className="text-xs text-mer-text/80 font-medium line-clamp-2 leading-relaxed">
                            {ver.summary}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-[10px] text-mer-muted">
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(ver.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Snapshot Modal */}
      {viewingVersion && (
        <Dialog open={!!viewingVersion} onOpenChange={() => setViewingVersion(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-4 w-4 text-mer-cyan" /> Article Version Snapshot
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-xs bg-[rgba(7,12,22,0.4)] p-4 rounded-xl border border-[var(--mer-border-glow)]">
                <div className="space-y-1">
                  <span className="text-mer-muted block font-medium">Snapshot Title:</span>
                  <span className="font-bold text-mer-text">{viewingVersion.title}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-mer-muted block font-medium">Created On:</span>
                  <span className="text-mer-text font-semibold">{new Date(viewingVersion.createdAt).toLocaleString()}</span>
                </div>
                <div className="col-span-2 space-y-1 pt-2 border-t border-[var(--mer-border-glow)]">
                  <span className="text-mer-muted block font-medium">Change Summary:</span>
                  <span className="text-mer-cyan font-semibold italic">"{viewingVersion.summary || 'No summary provided.'}"</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">
                  Content Snapshot
                </label>
                <div className="bg-[rgba(7,12,22,0.6)] p-4 rounded-xl font-mono text-xs border border-[var(--mer-border-glow)] text-mer-text whitespace-pre-wrap leading-relaxed select-all max-h-[300px] overflow-y-auto">
                  {viewingVersion.content}
                </div>
              </div>

              {/* Action to restore this past version */}
              {article && !isArchived && viewingVersion.id !== article.currentVersionId && (
                <div className="flex flex-col gap-3 pt-4 border-t border-[var(--mer-border-glow)] sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[10px] text-mer-muted max-w-sm">
                    Restoring this snapshot will create a new version snapshot matching this text and set it as current.
                  </p>
                  <Button
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to restore this version snapshot?`)) return;
                      try {
                        const res = await updateArticleAction({
                          id: article.id,
                          data: {
                            title: viewingVersion.title,
                            content: viewingVersion.content,
                            categoryId: article.categoryId,
                            versionSummary: `Restored version created on ${new Date(viewingVersion.createdAt).toLocaleDateString()}`,
                          },
                        });
                        if (res.success) {
                          toast.success(`Successfully restored version snapshot!`);
                          setViewingVersion(null);
                          await loadDetails();
                        } else {
                          toast.error(res.error || 'Failed to restore version.');
                        }
                      } catch (err: any) {
                        toast.error(err.message || 'An error occurred.');
                      }
                    }}
                  >
                    Restore Content Snapshot
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
