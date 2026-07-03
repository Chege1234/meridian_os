'use client';

/**
 * Feature Component — KB Article Editor
 *
 * Premium editing interface for Knowledge Base articles with version history
 * and workflow status transition management.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              {articleId ? 'Edit KB Article' : 'Create KB Article'}
            </h1>
            {article && (
              <p className="text-xs text-muted-foreground">
                Slug: <span className="font-mono bg-muted py-0.5 px-1.5 rounded">{article.slug}</span>
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
                  className="gap-1.5 text-blue-600 border-blue-500/20 hover:bg-blue-50 dark:hover:bg-blue-950/20"
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
                    className="gap-1.5 text-yellow-600 border-yellow-500/20 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                  >
                    Send back to Draft
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusTransition('published')}
                    className="gap-1.5 text-emerald-600 border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
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
                  className="gap-1.5 text-red-600 border-red-500/20 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </Button>
              )}
              <Badge className="capitalize text-xs font-semibold py-1 px-2.5">
                Status: {article.status}
              </Badge>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Panel */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-border/80 bg-card space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" /> Article Content
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input
                  disabled={isArchived}
                  placeholder="e.g. How to connect to VPN"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <select
                  disabled={isArchived}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled className="text-muted-foreground">Select a category...</option>
                  {renderCategoryOptions()}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Content (Markdown)</label>
              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-40 grid-cols-2 mb-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-0">
                  <textarea
                    disabled={isArchived}
                    placeholder="Write article content using markdown (# Title, ## Heading, etc.)..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-0">
                  <div className="min-h-[300px] w-full rounded-md border border-border bg-muted/20 p-4 overflow-y-auto">
                    {renderMarkdownPreview(content)}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Version Summary / Change Log
              </label>
              <Input
                disabled={isArchived}
                placeholder={articleId ? 'What changes did you make in this version?' : 'Initial creation details...'}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full text-sm"
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
          </Card>
        </form>

        {/* Sidebar History Panel */}
        <div className="space-y-6">
          <Card className="p-6 border-border/80 bg-card space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Version History
            </h3>

            {versions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No version history yet.</p>
            ) : (
              <div className="relative border-l border-border pl-4 space-y-6 py-2">
                {versions.map((ver, idx) => {
                  const isActive = ver.id === article?.currentVersionId;
                  const versionIndex = versions.length - idx; // v1, v2 count from bottom
                  
                  return (
                    <div key={ver.id} className="relative group">
                      {/* Timeline node dot */}
                      <div
                        className={`absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 bg-background ${
                          isActive
                            ? 'border-primary scale-125'
                            : 'border-muted-foreground/40'
                        }`}
                      />
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-foreground">
                            Version {versionIndex}
                            {isActive && (
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
                          <p className="text-xs text-foreground/80 font-medium line-clamp-2">
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
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Snapshot Modal */}
      {viewingVersion && (
        <Dialog open={!!viewingVersion} onOpenChange={() => setViewingVersion(null)}>
          <DialogContent className="sm:max-w-[700px] border-border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Article Version Snapshot
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-3 rounded-lg border border-border/40">
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Snapshot Title:</span>
                  <span className="font-bold text-foreground">{viewingVersion.title}</span>
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
                  Content Snapshot
                </label>
                <div className="bg-muted p-4 rounded-lg font-mono text-xs border border-border/80 whitespace-pre-wrap leading-relaxed select-all max-h-[300px] overflow-y-auto">
                  {viewingVersion.content}
                </div>
              </div>

              {/* Action to restore this past version */}
              {article && !isArchived && viewingVersion.id !== article.currentVersionId && (
                <div className="flex justify-between items-center pt-4 border-t border-border/50 gap-4">
                  <p className="text-[10px] text-muted-foreground max-w-sm">
                    Restoring this snapshot will create a new version snapshot matching this text and set it as current.
                  </p>
                  <Button
                    size="sm"
                    className="gap-1 shrink-0"
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
