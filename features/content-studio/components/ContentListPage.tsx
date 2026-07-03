'use client';

/**
 * Feature Component — Content List Page
 *
 * Searchable, filterable list of Content items.
 * Supports toggle between Kanban Board view and Table List view.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, PenTool, Plus, Kanban, List, Eye, Trash2, Calendar, FileText, Megaphone, Clock } from 'lucide-react';
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
  Card,
} from '@/shared/components/ui';
import type { ContentItem, ContentPlatform, ContentType, ContentStatus } from '@/domain/entities';
import { getContentItemsAction, createContentItemAction, transitionContentStatusAction } from '../actions';
import { ContentEditor } from './ContentEditor';

const PLATFORMS: ContentPlatform[] = ['instagram', 'tiktok', 'twitter', 'linkedin', 'email', 'blog', 'whatsapp'];
const TYPES: ContentType[] = ['post', 'story', 'reel', 'caption', 'article', 'email_copy'];
const STATUSES: ContentStatus[] = ['draft', 'review', 'approved', 'scheduled', 'published', 'archived'];

export function ContentListPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [loading, setLoading] = useState(true);

  // Creation modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlatform, setNewPlatform] = useState<ContentPlatform>('instagram');
  const [newType, setNewType] = useState<ContentType>('post');
  const [newCaption, setNewCaption] = useState('');
  const [newBody, setNewBody] = useState('');
  const [creating, setCreating] = useState(false);

  // Selected item for detail view
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await getContentItemsAction({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        platform: platformFilter === 'all' ? undefined : platformFilter,
      });
      if (res.success) {
        setItems(res.items);
      } else {
        toast.error(res.error || 'Failed to load content items.');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [search, statusFilter, platformFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createContentItemAction({
        platform: newPlatform,
        type: newType,
        caption: newCaption || null,
        body: newBody || null,
      });

      if (res.success && res.contentItem) {
        toast.success('Draft content created.');
        setIsCreateOpen(false);
        setNewCaption('');
        setNewBody('');
        loadItems();
        setSelectedItemId(res.contentItem.id);
      } else {
        toast.error(res.error || 'Failed to create content.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setCreating(false);
    }
  }

  async function handleQuickStatusChange(id: string, nextStatus: ContentStatus) {
    try {
      const res = await transitionContentStatusAction({ id, status: nextStatus });
      if (res.success) {
        toast.success(`Moved status to ${nextStatus}.`);
        loadItems();
      } else {
        toast.error(res.error || 'Status transition rejected.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Transition failed.');
    }
  }

  if (selectedItemId) {
    return (
      <ContentEditor
        contentId={selectedItemId}
        onClose={() => {
          setSelectedItemId(null);
          loadItems();
        }}
      />
    );
  }

  // Filter items for Kanban display
  const getItemsByStatus = (status: ContentStatus) => {
    return items.filter((item) => item.status === status);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title + Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <PenTool className="h-6 w-6 text-primary" /> Content Studio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan, compose, review, and schedule campaign assets and social copies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border/80 bg-muted/40 p-0.5">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2.5 text-xs font-semibold gap-1"
              onClick={() => setViewMode('kanban')}
            >
              <Kanban className="h-3.5 w-3.5" /> Board
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2.5 text-xs font-semibold gap-1"
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5" /> Table
            </Button>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" /> Create Copy
            </Button>
            <DialogContent className="sm:max-w-[550px] border-border bg-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-primary" /> Draft New Content
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Platform
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize"
                      value={newPlatform}
                      onChange={(e: any) => setNewPlatform(e.target.value)}
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Content Type
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize"
                      value={newType}
                      onChange={(e: any) => setNewType(e.target.value)}
                    >
                      {TYPES.map((t) => (
                        <option key={t} value={t}>{t.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Caption / Summary Text
                  </label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Short post caption, subject, or copy summary..."
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Body Copy (Long Form)
                  </label>
                  <textarea
                    className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Write your email body, blog copy, or article text here..."
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Draft'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-lg border border-border/80">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search captions or bodies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Platform Filter */}
          <select
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="all">All Platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* List Status Filter (only shown in table view, board shows all) */}
          {viewMode === 'list' && (
            <select
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => {
            const statusItems = getItemsByStatus(status);
            const badgeVariants: Record<string, string> = {
              draft: 'bg-muted text-muted-foreground',
              review: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
              approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              scheduled: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
              published: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
              archived: 'bg-red-500/10 text-red-600 dark:text-red-400',
            };

            return (
              <div key={status} className="flex flex-col min-w-[220px] bg-muted/20 border border-border/60 rounded-lg p-3 space-y-3 min-h-[500px]">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                    {status.replace('_', ' ')}
                  </span>
                  <Badge variant="outline" className={`font-mono text-[10px] ${badgeVariants[status]}`}>
                    {statusItems.length}
                  </Badge>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {statusItems.map((item) => (
                    <Card
                      key={item.id}
                      className="p-3 border-border bg-card hover:border-primary/50 transition-colors shadow-sm cursor-pointer space-y-2 relative group"
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-semibold capitalize px-1 py-0 border-border">
                          {item.platform}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {item.type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-xs text-foreground/80 line-clamp-3 font-medium">
                        {item.caption || item.body || <span className="text-muted-foreground/40 italic">Empty Copy</span>}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/40">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Card>
                  ))}
                  
                  {statusItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/40 rounded-lg">
                      <span className="text-[10px] text-muted-foreground/50 font-medium">Empty Column</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Table View */
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
          {loading ? (
            <div className="space-y-3 p-6">
              <div className="h-6 w-full animate-pulse rounded bg-muted" />
              <div className="h-20 w-full animate-pulse rounded bg-muted" />
            </div>
          ) : items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase font-semibold text-muted-foreground px-4 py-3">Platform</TableHead>
                  <TableHead className="text-xs uppercase font-semibold text-muted-foreground px-4 py-3">Type</TableHead>
                  <TableHead className="text-xs uppercase font-semibold text-muted-foreground px-4 py-3">Preview</TableHead>
                  <TableHead className="text-xs uppercase font-semibold text-muted-foreground px-4 py-3">Status</TableHead>
                  <TableHead className="text-xs uppercase font-semibold text-muted-foreground px-4 py-3">Created On</TableHead>
                  <TableHead className="text-xs uppercase font-semibold text-muted-foreground px-4 py-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="px-4 py-3 capitalize">
                      <Badge variant="outline" className="font-semibold text-xs">{item.platform}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 capitalize text-xs font-mono">{item.type.replace('_', ' ')}</TableCell>
                    <TableCell className="px-4 py-3 text-xs max-w-sm truncate">
                      {item.caption || item.body || <span className="text-muted-foreground/40 italic">Empty Copy</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant={item.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/60" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">No copies found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                No matching content copies were found. Try adjusting your search query.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
