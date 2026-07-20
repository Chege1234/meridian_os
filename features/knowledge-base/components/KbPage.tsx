'use client';

/**
 * Feature Component â€” KB Dashboard Page
 *
 * Renders the category tree sidebar, searchable/filterable article grid,
 * and handles editing and viewing routes for KB articles.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Tag,
  FolderPlus,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  Folder,
  Layers,
  ChevronRight,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Input,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Card
} from '@/shared/components/ui';
import { GlassPanel } from '@/shared/components/ui/GlassPanel';
import type { KbArticle, KbCategory } from '@/domain/entities';
import {
  getArticlesAction,
  getCategoriesAction,
  createCategoryAction,
  archiveArticleAction
} from '../actions';
import { CategoryNode } from './CategoryNode';
import { KbEditor } from './KbEditor';

export function KbPage() {
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Editor toggle state
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);

  // Create Category Modal state
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Article reading view state
  const [readingArticle, setReadingArticle] = useState<KbArticle | null>(null);
  const [readingContent, setReadingContent] = useState('');
  const [loadingReadView, setLoadingReadView] = useState(false);

  const { data: catRes, isLoading: loadingCategories } = useQuery({
    queryKey: ['kbCategories'],
    queryFn: () => getCategoriesAction(),
    staleTime: 300000, // 5 mins
  });

  const { data: artRes, isLoading: loadingArticles } = useQuery({
    queryKey: ['kbArticles', { search, selectedCategoryId, statusFilter }],
    queryFn: () => getArticlesAction({
      search: search || undefined,
      categoryId: selectedCategoryId || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    staleTime: 300000, // 5 mins
  });

  const categories = catRes?.success ? catRes.categories : [];
  const articles = artRes?.success ? artRes.articles : [];
  const loading = loadingCategories || loadingArticles;

  function loadData() {
    queryClient.invalidateQueries({ queryKey: ['kbArticles'] });
    queryClient.invalidateQueries({ queryKey: ['kbCategories'] });
  }


  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Category name is required.');
      return;
    }

    setCreatingCategory(true);
    try {
      const res = await createCategoryAction({
        name: newCategoryName,
        parentCategoryId: newCategoryParentId,
        position: 0,
      });

      if (res.success) {
        toast.success('Category created successfully.');
        setIsCreateCategoryOpen(false);
        setNewCategoryName('');
        setNewCategoryParentId(null);
        queryClient.invalidateQueries({ queryKey: ['kbCategories'] });
      } else {
        toast.error(res.error || 'Failed to create category.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleArchiveArticle(id: string) {
    if (!confirm('Are you sure you want to archive this article? This will soft delete it.')) return;
    try {
      const res = await archiveArticleAction(id);
      if (res.success) {
        toast.success('Article archived successfully.');
        loadData();
      } else {
        toast.error(res.error || 'Failed to archive article.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    }
  }

  async function handleOpenReadView(art: KbArticle) {
    setReadingArticle(art);
    setLoadingReadView(true);
    try {
      const { getArticleDetailAction } = await import('../actions');
      const res = await getArticleDetailAction(art.id);
      if (res.success && res.article && res.versions) {
        const currentVer = res.versions.find((v) => v.id === res.article.currentVersionId);
        setReadingContent(currentVer ? currentVer.content : 'No published content.');
      } else {
        setReadingContent('Failed to load content.');
      }
    } catch {
      setReadingContent('An error occurred loading content.');
    } finally {
      setLoadingReadView(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  // Filter top-level categories
  const topLevelCategories = categories.filter((c) => c.parentCategoryId === null);

  if (editingArticleId !== null || isCreatingArticle) {
    return (
      <KbEditor
        articleId={editingArticleId}
        initialCategoryId={selectedCategoryId}
        onClose={() => {
          setEditingArticleId(null);
          setIsCreatingArticle(false);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="animate-fade-up space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
            Meridian OS
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-mer-text flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-mer-cyan" /> Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-mer-muted">
            Create, version, and manage internal documentation and standard protocols.
          </p>
        </div>

        <Button variant="glow" className="gap-1.5" onClick={() => setIsCreatingArticle(true)}>
          <Plus className="h-4 w-4" /> Create Article
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Sidebar Categories Tree */}
        <div className="rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md p-4 space-y-4 h-fit md:sticky md:top-6">
          <div className="flex items-center justify-between border-b border-[var(--mer-border-glow)] pb-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-mer-cyan" /> Categories
            </h3>
            <button
              className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-mer-muted hover:bg-white/5 hover:text-mer-cyan transition-all cursor-pointer"
              onClick={() => {
                setNewCategoryParentId(null);
                setIsCreateCategoryOpen(true);
              }}
              title="Add Root Category"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <div
              className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg transition-all cursor-pointer text-xs font-semibold ${
                selectedCategoryId === null
                  ? 'bg-[rgba(77,216,255,0.12)] text-mer-cyan border border-[rgba(77,216,255,0.25)] shadow-[0_0_8px_rgba(77,216,255,0.15)]'
                  : 'text-mer-muted hover:bg-white/5 hover:text-mer-text'
              }`}
              onClick={() => setSelectedCategoryId(null)}
            >
              <Folder className="h-4 w-4 text-mer-cyan/60" />
              <span>All Articles</span>
            </div>

            <div className="border-t border-[var(--mer-border-glow)] my-2 pt-2 space-y-1">
              {topLevelCategories.length === 0 ? (
                <p className="text-xs text-mer-muted italic px-2">No categories yet.</p>
              ) : (
                topLevelCategories.map((cat) => (
                  <CategoryNode
                    key={cat.id}
                    category={cat}
                    allCategories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onSelect={setSelectedCategoryId}
                    onAddSubcategory={(parentId) => {
                      setNewCategoryParentId(parentId);
                      setIsCreateCategoryOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Content Listing Area */}
        <div className="md:col-span-3 space-y-4">
          <div className="rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md p-5 space-y-4">
            {/* Breadcrumbs and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--mer-border-glow)] pb-4">
              <div className="text-xs font-semibold flex items-center gap-1">
                <span className="text-mer-muted">KB</span>
                <ChevronRight className="h-3 w-3 text-mer-muted/40" />
                <span className="text-mer-text">
                  {selectedCategory ? selectedCategory.name : 'All Articles'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mer-muted" />
                  <Input
                    placeholder="Search articlesâ€¦"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)] text-xs h-9"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-9 rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.7)] px-3 text-xs text-mer-text outline-none capitalize focus:border-[var(--mer-border-hover)] w-32"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="review">Under Review</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Articles List Table */}
            {loading ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-white/[0.04]" />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <AlertCircle className="h-10 w-10 text-mer-muted/60 mx-auto" />
                <p className="text-sm text-mer-muted font-semibold">No articles found in this category.</p>
                <Button size="sm" onClick={() => setIsCreatingArticle(true)} className="mt-2">
                  Create your first article
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--mer-border-glow)]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((art) => {
                      const cat = categories.find((c) => c.id === art.categoryId);
                      return (
                        <TableRow key={art.id}>
                          <TableCell className="font-semibold text-mer-text">
                            {art.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="muted" className="gap-1 text-xs">
                              <Folder className="h-3 w-3 text-mer-cyan/60" />
                              {cat ? cat.name : 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                art.status === 'published' ? 'green' :
                                art.status === 'review' ? 'blue' :
                                art.status === 'draft' ? 'amber' : 'red'
                              }
                              className="capitalize"
                            >
                              {art.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-mer-muted font-medium">
                            {new Date(art.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {art.status === 'published' && (
                                <button
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 text-mer-muted hover:text-mer-cyan transition-all cursor-pointer"
                                  onClick={() => handleOpenReadView(art)}
                                  title="View Article"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              {art.status !== 'archived' && (
                                <button
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 text-mer-muted hover:text-mer-cyan transition-all cursor-pointer"
                                  onClick={() => setEditingArticleId(art.id)}
                                  title="Edit Article"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {art.status !== 'archived' && (
                                <button
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 text-mer-muted hover:text-mer-red transition-all cursor-pointer"
                                  onClick={() => handleArchiveArticle(art.id)}
                                  title="Archive Article"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Category Modal */}
      {isCreateCategoryOpen && (
        <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-mer-cyan" />
                {newCategoryParentId ? 'Add Subcategory' : 'Add Root Category'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateCategory} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">
                  Category Name
                </label>
                <Input
                  required
                  placeholder="e.g. Finance Operations"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)]"
                />
              </div>

              {newCategoryParentId && (
                <div className="p-3 bg-[rgba(7,12,22,0.4)] rounded-xl border border-[var(--mer-border-glow)] text-xs text-mer-text">
                  <span className="text-mer-muted">Adding under: </span>
                  <span className="font-semibold text-mer-cyan">
                    {categories.find((c) => c.id === newCategoryParentId)?.name}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateCategoryOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingCategory}>
                  {creatingCategory ? 'Creating...' : 'Create Category'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Read View Modal */}
      {readingArticle && (
        <Dialog open={!!readingArticle} onOpenChange={() => setReadingArticle(null)}>
          <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-[var(--mer-border-glow)] pb-4">
              <DialogTitle className="text-2xl font-bold text-mer-text flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-mer-cyan" /> {readingArticle.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-4 text-xs text-mer-muted pt-1.5">
                <span className="flex items-center gap-1 font-mono">
                  <User className="h-3.5 w-3.5" /> Author: {readingArticle.authorId.substring(0, 8)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Updated: {new Date(readingArticle.updatedAt).toLocaleDateString()}
                </span>
                <Badge variant="green" className="capitalize">
                  {readingArticle.status}
                </Badge>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {loadingReadView ? (
                <div className="space-y-2">
                  <div className="h-4 animate-pulse rounded bg-white/5 w-3/4" />
                  <div className="h-4 animate-pulse rounded bg-white/5" />
                  <div className="h-4 animate-pulse rounded bg-white/5 w-5/6" />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-mer-text space-y-4">
                  {readingContent.split('\n').map((line, idx) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={idx} className="text-xl font-bold text-mer-text border-b border-[var(--mer-border-glow)] pb-1.5 pt-2">{line.replace('# ', '')}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={idx} className="text-lg font-semibold text-mer-text border-b border-[var(--mer-border-glow)]/40 pb-1 pt-2">{line.replace('## ', '')}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={idx} className="text-md font-medium text-mer-cyan pt-1">{line.replace('### ', '')}</h3>;
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return (
                        <li key={idx} className="ml-4 list-disc text-mer-text/90">
                          {line.substring(2)}
                        </li>
                      );
                    }
                    if (line.match(/^\d+\.\s/)) {
                      return (
                        <li key={idx} className="ml-4 list-decimal text-mer-text/90">
                          {line.replace(/^\d+\.\s/, '')}
                        </li>
                      );
                    }
                    if (line.trim() === '') {
                      return <div key={idx} className="h-2" />;
                    }
                    return <p key={idx} className="text-sm leading-relaxed text-mer-text/80 whitespace-pre-wrap">{line}</p>;
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-[var(--mer-border-glow)] pt-4">
              <Button onClick={() => setReadingArticle(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
