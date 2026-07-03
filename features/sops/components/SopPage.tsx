'use client';

/**
 * Feature Component — SOP Library Page
 *
 * Dashboard showcasing periodic review alerts/banners, searchable SOP table,
 * "Needs Review Only" filter, and interactive checklist execution viewer.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ListTodo,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  CheckSquare,
  Square,
  User,
  Calendar,
  X,
  FileSpreadsheet
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/shared/components/ui';
import type { Sop, KbCategory } from '@/domain/entities';
import {
  getSopsAction,
  getOverdueSopsAction,
  archiveSopAction,
  getSopDetailAction
} from '../actions';
import { getCategoriesAction } from '@/features/knowledge-base/actions';
import { SopEditor } from './SopEditor';

export function SopPage() {
  const [sops, setSops] = useState<Sop[]>([]);
  const [overdueSops, setOverdueSops] = useState<Sop[]>([]);
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [editingSopId, setEditingSopId] = useState<string | null>(null);
  const [isCreatingSop, setIsCreatingSop] = useState(false);

  // Interactive Checklist Runner Dialog
  const [activeChecklistSop, setActiveChecklistSop] = useState<Sop | null>(null);
  const [checklistSteps, setChecklistSteps] = useState<{ instruction: string; note?: string | null; checked: boolean }[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const catRes = await getCategoriesAction();
      if (catRes.success) {
        setCategories(catRes.categories);
      }

      const overdueRes = await getOverdueSopsAction();
      if (overdueRes.success) {
        setOverdueSops(overdueRes.sops);
      }

      const listRes = await getSopsAction({
        search: search || undefined,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        status: statusFilter === 'all' ? undefined : statusFilter,
        needsReviewOnly: needsReviewOnly || undefined,
      });

      if (listRes.success) {
        setSops(listRes.sops);
      } else {
        toast.error(listRes.error || 'Failed to load SOP checklists.');
      }
    } catch {
      toast.error('An error occurred during data fetching.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [search, categoryId, statusFilter, needsReviewOnly]);

  async function handleArchiveSop(id: string) {
    if (!confirm('Are you sure you want to archive this SOP? This will soft delete it.')) return;
    try {
      const res = await archiveSopAction(id);
      if (res.success) {
        toast.success('SOP archived successfully.');
        loadData();
      } else {
        toast.error(res.error || 'Failed to archive SOP.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    }
  }

  async function handleOpenChecklist(sopItem: Sop) {
    setActiveChecklistSop(sopItem);
    setLoadingChecklist(true);
    try {
      const res = await getSopDetailAction(sopItem.id);
      if (res.success && res.sop && res.versions) {
        const currentVer = res.versions.find((v) => v.id === res.sop.currentVersionId);
        if (currentVer) {
          const sortedSteps = [...currentVer.steps]
            .sort((a, b) => a.order - b.order)
            .map((s) => ({
              instruction: s.instruction,
              note: s.note,
              checked: false,
            }));
          setChecklistSteps(sortedSteps);
        } else {
          toast.error('Active steps not found for this SOP version.');
          setActiveChecklistSop(null);
        }
      } else {
        toast.error('Failed to load SOP checklist steps.');
        setActiveChecklistSop(null);
      }
    } catch {
      toast.error('An error occurred.');
      setActiveChecklistSop(null);
    } finally {
      setLoadingChecklist(false);
    }
  }

  function toggleChecklistStep(idx: number) {
    const updated = [...checklistSteps];
    const target = updated[idx];
    if (target) {
      target.checked = !target.checked;
      setChecklistSteps(updated);
    }
  }

  if (editingSopId !== null || isCreatingSop) {
    return (
      <SopEditor
        sopId={editingSopId}
        onClose={() => {
          setEditingSopId(null);
          setIsCreatingSop(false);
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
            <ListTodo className="h-6 w-6 text-primary" /> SOP Library
          </h1>
          <p className="text-sm text-muted-foreground">
            Standard Operating Procedures and interactive task checklists with periodic reviews.
          </p>
        </div>

        <Button className="gap-1.5" onClick={() => setIsCreatingSop(true)}>
          <Plus className="h-4 w-4" /> Create SOP Checklist
        </Button>
      </div>

      {/* Overdue periodic review banner widget */}
      {overdueSops.length > 0 && (
        <Card className="p-4 border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10 text-amber-800 dark:text-amber-300 flex items-start gap-3.5 animate-pulse">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <h4 className="font-bold text-sm">SOP Periodic Review Warnings</h4>
            <p className="text-xs text-amber-700/95 dark:text-amber-300/90 leading-relaxed">
              The following {overdueSops.length} published standard operating procedure(s) are past their periodic review due dates.
              Please audit them to ensure operational compliance.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {overdueSops.map((ovSop) => (
                <Badge
                  key={ovSop.id}
                  variant="outline"
                  onClick={() => setEditingSopId(ovSop.id)}
                  className="bg-background text-foreground hover:bg-muted cursor-pointer font-semibold text-[10px] transition-colors"
                >
                  {ovSop.title} (Due {ovSop.reviewDueDate ? new Date(ovSop.reviewDueDate).toLocaleDateString() : 'N/A'})
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Main List and Table Dashboard */}
      <Card className="p-4 border-border/80 bg-card space-y-4">
        {/* Filters and search toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search procedures..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-44"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

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

          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-foreground border border-border bg-muted/20 hover:bg-muted/40 py-1.5 px-3 rounded-md transition-colors select-none">
              <input
                type="checkbox"
                checked={needsReviewOnly}
                onChange={(e) => setNeedsReviewOnly(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
              />
              Needs Review Only
            </label>
          </div>
        </div>

        {/* Listing */}
        {loading ? (
          <div className="space-y-2 py-8">
            <div className="h-8 animate-pulse rounded bg-muted" />
            <div className="h-8 animate-pulse rounded bg-muted" />
            <div className="h-8 animate-pulse rounded bg-muted" />
          </div>
        ) : sops.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <ListTodo className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground font-medium">No SOP checklists found.</p>
            <Button size="sm" onClick={() => setIsCreatingSop(true)} className="mt-2">
              Create your first procedure checklist
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Checklist Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Review Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sops.map((sopItem) => {
                  const cat = categories.find((c) => c.id === sopItem.categoryId);
                  
                  // Check if overdue
                  const isOverdue = sopItem.status === 'published' &&
                    sopItem.reviewDueDate &&
                    new Date(sopItem.reviewDueDate) < new Date();

                  const statusColors: Record<string, string> = {
                    draft: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
                    review: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                    published: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    archived: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
                  };

                  return (
                    <TableRow key={sopItem.id}>
                      <TableCell className="font-semibold text-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5">
                            {sopItem.title}
                            {isOverdue && (
                              <Badge className="bg-red-500/10 text-red-600 border border-red-500/20 text-[9px] py-0 px-1 font-bold">
                                Overdue
                              </Badge>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {cat ? cat.name : 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`capitalize border ${statusColors[sopItem.status] || ''}`}>
                          {sopItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {sopItem.reviewDueDate ? (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                            <Calendar className="h-3 w-3" />
                            {new Date(sopItem.reviewDueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-normal">No Review Set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sopItem.status === 'published' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs font-bold gap-1"
                              onClick={() => handleOpenChecklist(sopItem)}
                            >
                              <CheckSquare className="h-3.5 w-3.5 text-primary" /> Run Checklist
                            </Button>
                          )}
                          {sopItem.status !== 'archived' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditingSopId(sopItem.id)}
                              title="Edit SOP"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {sopItem.status !== 'archived' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={() => handleArchiveSop(sopItem.id)}
                              title="Archive SOP"
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

      {/* Checklist execution viewer modal */}
      {activeChecklistSop && (
        <Dialog open={!!activeChecklistSop} onOpenChange={() => setActiveChecklistSop(null)}>
          <DialogContent className="sm:max-w-[550px] border-border bg-card">
            <DialogHeader className="border-b border-border/40 pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                <ListTodo className="h-5 w-5 text-primary" /> Executing SOP Checklist
              </DialogTitle>
              <div className="pt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
                <span>Title: {activeChecklistSop.title}</span>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-3.5">
              {loadingChecklist ? (
                <div className="space-y-2">
                  <div className="h-4 animate-pulse rounded bg-muted w-3/4" />
                  <div className="h-4 animate-pulse rounded bg-muted" />
                </div>
              ) : checklistSteps.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No checklist steps are defined in the published version.</p>
              ) : (
                <div className="space-y-3.5">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-1">
                    Complete steps in sequence:
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {checklistSteps.map((step, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleChecklistStep(idx)}
                        className={`flex gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                          step.checked
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-muted-foreground'
                            : 'bg-muted/30 border-border/60 hover:bg-muted/55 text-foreground'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {step.checked ? (
                            <CheckSquare className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-muted-foreground/80" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className={`text-sm font-semibold leading-snug ${step.checked ? 'line-through opacity-60' : ''}`}>
                            {step.instruction}
                          </p>
                          {step.note && (
                            <p className="text-[11px] text-muted-foreground/80 font-medium">
                              Note: {step.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress tracker */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center text-xs font-semibold pb-1.5">
                      <span>Checklist Progress</span>
                      <span>
                        {checklistSteps.filter((s) => s.checked).length} of {checklistSteps.length} (
                        {Math.round(
                          (checklistSteps.filter((s) => s.checked).length / checklistSteps.length) * 100
                        )}
                        %)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${
                            (checklistSteps.filter((s) => s.checked).length / checklistSteps.length) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between border-t border-border/40 pt-4 items-center">
              <span className="text-[10px] text-muted-foreground">
                Run local checklists. Progress resets upon closing.
              </span>
              <Button size="sm" onClick={() => setActiveChecklistSop(null)}>
                Close Runner
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
