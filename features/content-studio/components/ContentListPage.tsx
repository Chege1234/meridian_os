'use client';

/**
 * Feature Component â€” Content List Page
 *
 * Searchable, filterable list of Content items.
 * Supports toggle between Kanban Board view and Table List view.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const prefilledCampaignId = searchParams.get('campaignId') || undefined;

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
        campaignId: prefilledCampaignId,
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
  }, [search, statusFilter, platformFilter, prefilledCampaignId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createContentItemAction({
        platform: newPlatform,
        type: newType,
        caption: newCaption || null,
        body: newBody || null,
        campaignId: prefilledCampaignId,
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
    <div className="animate-fade-up space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-mer-muted">Meridian OS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-mer-text">Content Studio</h1>
          <p className="mt-1 text-sm text-mer-muted">Plan, compose, review and schedule campaign assets.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.6)] p-1">
            {([['kanban', Kanban, 'Board'],['list', List, 'Table']] as const).map(([vm, Icon, label]) => (
              <button
                key={vm}
                onClick={() => setViewMode(vm)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === vm
                    ? 'bg-[rgba(77,216,255,0.12)] text-mer-cyan border border-[rgba(77,216,255,0.25)]'
                    : 'text-mer-muted hover:text-mer-text'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>

          {/* Create dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Button onClick={() => setIsCreateOpen(true)} variant="glow" className="gap-1.5">
              <Plus className="h-4 w-4" /> Create Copy
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-mer-cyan" /> Draft New Content
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  {[{ label:'Platform', value:newPlatform, set:setNewPlatform, opts:PLATFORMS.map((p)=>[p,p]) },
                    { label:'Type', value:newType, set:setNewType, opts:TYPES.map((t)=>[t,t.replace('_',' ')]) }]
                    .map(({label, value, set, opts}) => (
                    <div key={label} className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">{label}</label>
                      <select
                        className="w-full rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.7)] px-3 py-2 text-sm text-mer-text capitalize outline-none focus:border-[var(--mer-border-hover)]"
                        value={value}
                        onChange={(e:any) => set(e.target.value)}
                      >
                        {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {[{ label:'Caption / Summary', ph:'Short post caption, subject, or copy summaryâ€¦', rows:3, val:newCaption, set:setNewCaption },
                  { label:'Body Copy (Long Form)', ph:'Write your email body, blog copy, or article text hereâ€¦', rows:6, val:newBody, set:setNewBody }]
                  .map(({label, ph, rows, val, set}) => (
                  <div key={label} className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted">{label}</label>
                    <textarea
                      rows={rows}
                      className="w-full rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.7)] px-3 py-2 text-sm text-mer-text placeholder:text-mer-muted outline-none focus:border-[var(--mer-border-hover)] resize-none"
                      placeholder={ph}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating}>{creating ? 'Creatingâ€¦' : 'Create Draft'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col gap-3 rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mer-muted" />
          <Input
            placeholder="Search captions or body copyâ€¦"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[rgba(7,12,22,0.6)] border-[var(--mer-border-glow)] text-mer-text placeholder:text-mer-muted focus:border-[var(--mer-border-hover)]"
          />
        </div>
        <div className="flex items-center gap-2">
          {[{ val: platformFilter, set: setPlatformFilter, opts: [['all','All Platforms'], ...PLATFORMS.map((p)=>[p,p])] },
            ...(viewMode==='list' ? [{ val: statusFilter, set: setStatusFilter, opts: [['all','All Statuses'], ...STATUSES.map((s)=>[s,s])] }] : [])]
            .map((sel,i) => (
            <select key={i} value={sel.val} onChange={(e) => sel.set(e.target.value)}
              className="h-9 rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.7)] px-3 text-xs text-mer-text outline-none capitalize focus:border-[var(--mer-border-hover)]">
              {sel.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* Kanban / List view */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-2 gap-3 overflow-x-auto pb-4 md:grid-cols-3 xl:grid-cols-6">
          {STATUSES.map((status) => {
            const statusItems = getItemsByStatus(status);
            const COLUMN_COLOR: Record<string, string> = {
              draft:     'text-mer-muted',
              review:    'text-mer-amber',
              approved:  'text-mer-green',
              scheduled: 'text-mer-blue',
              published: 'text-mer-cyan',
              archived:  'text-mer-red',
            };
            return (
              <div
                key={status}
                className="flex min-h-[480px] min-w-[200px] flex-col rounded-[16px] border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.5)] backdrop-blur-sm p-3"
              >
                {/* Column header */}
                <div className="mb-3 flex items-center justify-between border-b border-[var(--mer-border-glow)] pb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${COLUMN_COLOR[status]}`}>
                    {status.replace('_', ' ')}
                  </span>
                  <span className={`font-mono text-[10px] font-semibold ${COLUMN_COLOR[status]}`}>
                    {statusItems.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                  {statusItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className="group cursor-pointer rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(13,20,35,0.7)] p-3 space-y-2 transition-all hover:border-[var(--mer-border-hover)] hover:shadow-[0_0_10px_var(--mer-glow-cyan)]"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="muted" className="text-[9px] capitalize">{item.platform}</Badge>
                        <span className="font-mono text-[9px] text-mer-muted">{item.type.replace('_',' ')}</span>
                      </div>
                      <p className="text-xs text-mer-text line-clamp-3 leading-relaxed">
                        {item.caption || item.body || <span className="italic text-mer-muted/50">Empty Copy</span>}
                      </p>
                      <div className="flex items-center gap-0.5 pt-1 border-t border-[var(--mer-border-glow)] text-[10px] text-mer-muted">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {statusItems.length === 0 && (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[var(--mer-border-glow)] py-10">
                      <span className="text-[10px] text-mer-muted/50">Empty</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List table view */
        <>
          {loading ? (
            <div className="space-y-3 rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] p-6">
              {[1,2,3].map((i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-white/[0.04]" />
              ))}
            </div>
          ) : items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {['Platform','Type','Preview','Status','Created On','Actions'].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant="muted" className="capitalize text-xs">{item.platform}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-mer-muted capitalize">{item.type.replace('_',' ')}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">{item.caption || item.body || <span className="italic text-mer-muted/50">Empty</span>}</TableCell>
                    <TableCell>
                      <Badge variant={
                        item.status==='published' ? 'cyan' :
                        item.status==='approved'  ? 'green' :
                        item.status==='review'    ? 'amber' :
                        item.status==='archived'  ? 'red' : 'muted'
                      } className="capitalize">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-mer-muted">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => setSelectedItemId(item.id)}>
                        <Eye className="h-3.5 w-3.5" /> Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] py-16 text-center">
              <FileText className="h-8 w-8 text-mer-muted/60" />
              <h3 className="mt-4 text-sm font-semibold text-mer-text">No copies found</h3>
              <p className="mt-1 text-xs text-mer-muted">Try adjusting your search or filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

