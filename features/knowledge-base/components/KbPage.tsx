'use client';

/**
 * Feature Component — KB Dashboard Page
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
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, version, and manage internal documentation and standard protocols.
          </p>
        </div>

        <Button className="gap-1.5" onClick={() => setIsCreatingArticle(true)}>
          <Plus className="h-4 w-4" /> Create Article
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Categories Tree */}
        <Card className="p-4 border-border/80 bg-card/60 backdrop-blur-sm space-y-4 h-fit md:sticky md:top-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Categories
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-muted-foreground hover:text-foreground gap-1"
              onClick={() => {
                setNewCategoryParentId(null);
                setIsCreateCategoryOpen(true);
              }}
              title="Add Root Category"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-1">
            <div
              className={`flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors cursor-pointer text-sm ${
                selectedCategoryId === null
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
              onClick={() => setSelectedCategoryId(null)}
            >
              <Folder className="h-4 w-4 text-muted-foreground/60" />
              <span>All Articles</span>
            </div>

            <div className="border-t border-border/40 my-2 pt-2 space-y-1">
              {topLevelCategories.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-2">No categories yet.</p>
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
        </Card>

        {/* Content Listing Area */}
        <div className="md:col-span-3 space-y-4">
          <Card className="p-4 border-border/80 bg-card space-y-4">
            {/* Breadcrumbs and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div className="text-sm font-medium flex items-center gap-1">
                <span className="text-muted-foreground">KB</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground">
                  {selectedCategory ? selectedCategory.name : 'All Articles'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-32"
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
              <div className="space-y-2 py-8">
                <div className="h-8 animate-pulse rounded bg-muted" />
                <div className="h-8 animate-pulse rounded bg-muted" />
                <div className="h-8 animate-pulse rounded bg-muted" />
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground font-medium">No articles found in this category.</p>
                <Button size="sm" onClick={() => setIsCreatingArticle(true)} className="mt-2">
                  Create your first article
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                      
                      const statusColors: Record<string, string> = {
                        draft: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
                        review: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                        published: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                        archived: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
                      };

                      return (
                        <TableRow key={art.id}>
                          <TableCell className="font-semibold text-foreground">
                            {art.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Folder className="h-3 w-3 text-muted-foreground/80" />
                              {cat ? cat.name : 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`capitalize border ${statusColors[art.status] || ''}`}>
                              {art.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-medium">
                            {new Date(art.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {art.status === 'published' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleOpenReadView(art)}
                                  title="View Article"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              {art.status !== 'archived' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setEditingArticleId(art.id)}
                                  title="Edit Article"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {art.status !== 'archived' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                  onClick={() => handleArchiveArticle(art.id)}
                                  title="Archive Article"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
          </Card>
        </div>
      </div>

      {/* Create Category Modal */}
      {isCreateCategoryOpen && (
        <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-primary" />
                {newCategoryParentId ? 'Add Subcategory' : 'Add Root Category'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateCategory} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Category Name
                </label>
                <Input
                  required
                  placeholder="e.g. Finance Operations"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>

              {newCategoryParentId && (
                <div className="p-3 bg-muted/40 rounded border border-border/40 text-xs">
                  <span className="text-muted-foreground">Adding under: </span>
                  <span className="font-semibold text-foreground">
                    {categories.find((c) => c.id === newCategoryParentId)?.name}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateCategoryOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creatingCategory}>
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
          <DialogContent className="sm:max-w-[750px] border-border bg-card max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-border/40 pb-4">
              <DialogTitle className="text-2xl font-extrabold text-foreground flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" /> {readingArticle.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1.5">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Author ID: {readingArticle.authorId.substring(0, 8)}...
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Published On: {new Date(readingArticle.updatedAt).toLocaleDateString()}
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 capitalize">
                  {readingArticle.status}
                </Badge>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {loadingReadView ? (
                <div className="space-y-2">
                  <div className="h-4 animate-pulse rounded bg-muted w-3/4" />
                  <div className="h-4 animate-pulse rounded bg-muted" />
                  <div className="h-4 animate-pulse rounded bg-muted w-5/6" />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                  {readingContent.split('\n').map((line, idx) => {
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
              )}
            </div>

            <div className="flex justify-end border-t border-border/40 pt-4">
              <Button size="sm" onClick={() => setReadingArticle(null)}>
                Close Reading View
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
