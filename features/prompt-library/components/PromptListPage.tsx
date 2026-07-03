'use client';

/**
 * Feature Component — Prompt List Page
 *
 * Searchable, filterable list of prompt templates.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Sparkles, Plus, AlertCircle, Eye, Edit, Tag, BookOpen } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
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
} from '@/shared/components/ui';
import type { Prompt } from '@/domain/entities';
import { getPromptsAction, createPromptAction } from '../actions';
import { PromptEditor } from './PromptEditor';

export function PromptListPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  
  // Creation modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newProvider, setNewProvider] = useState<'openai' | 'anthropic' | 'google'>('openai');
  const [creating, setCreating] = useState(false);

  // Selected prompt for editing
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);

  async function loadPrompts() {
    setLoading(true);
    try {
      const res = await getPromptsAction({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      if (res.success) {
        setPrompts(res.prompts);
      } else {
        toast.error(res.error || 'Failed to load prompts.');
      }
    } catch {
      toast.error('An error occurred loading prompts.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrompts();
  }, [search, statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newPromptText.trim()) {
      toast.error('Title and Prompt template are required.');
      return;
    }

    setCreating(true);
    try {
      const res = await createPromptAction({
        title: newTitle,
        description: newDesc,
        prompt: newPromptText,
        provider: newProvider,
        status: 'draft', // default to draft
      });

      if (res.success && res.prompt) {
        toast.success('Prompt created as Draft successfully.');
        setIsCreateOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewPromptText('');
        setNewProvider('openai');
        loadPrompts();
        // Go straight to editing to publish or adjust it
        setEditingPromptId(res.prompt.id);
      } else {
        toast.error(res.error || 'Failed to create prompt.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setCreating(false);
    }
  }

  if (editingPromptId) {
    return (
      <PromptEditor
        promptId={editingPromptId}
        onClose={() => {
          setEditingPromptId(null);
          loadPrompts();
        }}
      />
    );
  }

  const columnHelper = createColumnHelper<Prompt>();

  const columns = [
    columnHelper.accessor('title', {
      header: 'Title',
      cell: (info) => {
        const prompt = info.row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <div className="font-semibold text-foreground">{prompt.title}</div>
            {prompt.description && (
              <div className="text-xs text-muted-foreground line-clamp-1">
                {prompt.description}
              </div>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('provider', {
      header: 'AI Provider',
      cell: (info) => {
        const val = info.getValue();
        const colors: Record<string, string> = {
          openai: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          anthropic: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
          google: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
        return (
          <Badge variant="outline" className={`capitalize font-medium ${colors[val] ?? ''}`}>
            {val}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('version', {
      header: 'Version',
      cell: (info) => <span className="font-mono text-xs">v{info.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
          active: 'default',
          draft: 'secondary',
          deprecated: 'outline',
        };
        return (
          <Badge variant={variants[status] || 'secondary'} className="capitalize">
            {status}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('usageCount', {
      header: 'Uses',
      cell: (info) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const prompt = info.row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setEditingPromptId(prompt.id)}
          >
            <Edit className="h-3.5 w-3.5" /> Configure
          </Button>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: prompts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title + Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Prompt Library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage reusable AI prompt templates, version histories, and provider models.
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> New Prompt
          </Button>
          <DialogContent className="sm:max-w-[600px] border-border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Create Prompt Template
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Title
                </label>
                <Input
                  placeholder="e.g. Instagram Promo Caption Generator"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Description
                </label>
                <Input
                  placeholder="What is this prompt used for?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    AI Provider
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={newProvider}
                    onChange={(e: any) => setNewProvider(e.target.value)}
                  >
                    <option value="openai">OpenAI (GPT)</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="google">Google (Gemini)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex justify-between">
                  <span>Prompt Template Text</span>
                  <span className="text-[10px] text-muted-foreground font-normal normal-case">
                    Use double curly braces like <code>{"{{variable}}"}</code> for placeholders.
                  </span>
                </label>
                <textarea
                  className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-sans"
                  placeholder="Write a marketing post on Instagram about {{topic}} for our audience. Tone should be {{tone}}."
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
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

      {/* Controls: Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-lg border border-border/80">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search prompt templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['active', 'draft', 'deprecated', 'all'] as const).map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? 'default' : 'outline'}
              size="sm"
              className="capitalize text-xs font-medium"
              onClick={() => setStatusFilter(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Table grid */}
      <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            <div className="h-6 w-full animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : prompts.length > 0 ? (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent">
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} className="text-xs uppercase font-semibold text-muted-foreground px-4 py-3">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3.5 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
            <h3 className="mt-4 text-sm font-semibold text-foreground">No prompts found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your filters or create a new prompt template.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
