'use client';

/**
 * Feature Component — SOP Editor
 *
 * Detailed editing view for Standard Operating Procedures with step-by-step
 * checklist reordering and versioning.
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
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  ListTodo,
  Clock,
  CheckCircle,
  Send,
  Archive,
  BookOpen
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
} from '@/shared/components/ui';
import type { Sop, SopVersion, SopStep, KbCategory } from '@/domain/entities';
import {
  getSopDetailAction,
  createSopAction,
  updateSopAction,
  transitionSopStatusAction,
  setReviewDueDateAction
} from '../actions';
import { getCategoriesAction } from '@/features/knowledge-base/actions';

interface SopEditorProps {
  sopId: string | null; // null for creating new
  onClose: () => void;
}

export function SopEditor({ sopId, onClose }: SopEditorProps) {
  const [sop, setSop] = useState<Sop | null>(null);
  const [versions, setVersions] = useState<SopVersion[]>([]);
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [reviewDueDate, setReviewDueDate] = useState('');
  const [steps, setSteps] = useState<SopStep[]>([{ order: 0, instruction: '', note: '' }]);
  const [summary, setSummary] = useState(''); // version summary
  const [saving, setSaving] = useState(false);

  // Version snapshot view modal
  const [viewingVersion, setViewingVersion] = useState<SopVersion | null>(null);

  async function loadCategories() {
    try {
      const res = await getCategoriesAction();
      if (res.success) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }

  async function loadDetails() {
    if (!sopId) {
      setLoading(false);
      return;
    }
    try {
      const res = await getSopDetailAction(sopId);
      if (res.success && res.sop) {
        setSop(res.sop);
        setVersions(res.versions || []);
        
        setTitle(res.sop.title);
        setCategoryId(res.sop.categoryId || '');
        setReviewDueDate(res.sop.reviewDueDate ? new Date(res.sop.reviewDueDate).toISOString().split('T')[0] || '' : '');
        
        // Find current version steps
        const currentVer = res.versions ? res.versions.find((v) => v.id === res.sop?.currentVersionId) : null;
        if (currentVer) {
          setSteps([...currentVer.steps].sort((a, b) => a.order - b.order));
        } else if (res.versions && res.versions.length > 0 && res.versions[0]) {
          setSteps([...res.versions[0].steps].sort((a, b) => a.order - b.order));
        }
      } else {
        toast.error(res.error || 'Failed to load SOP details.');
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
  }, [sopId]);

  // Steps Manipulation Helpers
  function handleAddStep() {
    setSteps([...steps, { order: steps.length, instruction: '', note: '' }]);
  }

  function handleRemoveStep(index: number) {
    if (steps.length === 1) {
      toast.error('SOP must contain at least one step.');
      return;
    }
    const updated = steps.filter((_, idx) => idx !== index).map((step, idx) => ({
      ...step,
      order: idx
    }));
    setSteps(updated);
  }

  function handleMoveStep(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...steps];
    
    // Swap steps
    const temp = updated[index];
    const targetVal = updated[targetIndex];
    if (temp && targetVal) {
      updated[index] = targetVal;
      updated[targetIndex] = temp;
    }

    // Recalculate orders
    const corrected = updated.map((step, idx) => ({
      ...step,
      order: idx
    }));

    setSteps(corrected);
  }

  function handleStepChange(index: number, field: 'instruction' | 'note', value: string) {
    const updated = [...steps];
    const target = updated[index];
    if (target) {
      updated[index] = {
        ...target,
        [field]: value
      };
    }
    setSteps(updated);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || steps.some((s) => !s.instruction.trim())) {
      toast.error('Title and all Step instructions are required.');
      return;
    }

    setSaving(true);
    try {
      const formattedSteps = steps.map((s, idx) => ({
        order: idx,
        instruction: s.instruction.trim(),
        note: s.note?.trim() || null
      }));

      const payload = {
        title,
        categoryId: categoryId || null,
        steps: formattedSteps,
        reviewDueDate: reviewDueDate ? new Date(reviewDueDate) : null,
        versionSummary: summary.trim() || undefined,
        summary: summary.trim() || undefined,
      };

      if (sopId) {
        const res = await updateSopAction({
          id: sopId,
          data: payload,
        });

        if (res.success) {
          toast.success('SOP updated and new version snapshot created.');
          setSummary('');
          await loadDetails();
        } else {
          toast.error(res.error || 'Failed to update SOP.');
        }
      } else {
        const res = await createSopAction({
          ...payload,
          status: 'draft',
        });

        if (res.success && 'sop' in res && res.sop) {
          toast.success('SOP created as Draft successfully.');
          onClose();
        } else {
          toast.error(res.error || 'Failed to create SOP.');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusTransition(targetStatus: 'draft' | 'review' | 'published' | 'archived') {
    if (!sopId) return;
    try {
      const res = await transitionSopStatusAction({
        id: sopId,
        status: targetStatus,
      });

      if (res.success) {
        toast.success(`SOP status transitioned to ${targetStatus} successfully.`);
        await loadDetails();
      } else {
        toast.error(res.error || 'Status transition failed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    }
  }

  const renderCategoryOptions = (parentId: string | null = null, depth = 0): React.ReactNode[] => {
    const list = categories.filter((c) => c.parentCategoryId === parentId);
    return list.flatMap((c) => [
      <option key={c.id} value={c.id} className="bg-background text-foreground">
        {'\u00A0'.repeat(depth * 3)}{depth > 0 ? '↳ ' : ''}{c.name}
      </option>,
      ...renderCategoryOptions(c.id, depth + 1),
    ]);
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

  const isArchived = sop?.status === 'archived';

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
              {sopId ? 'Edit SOP Checklist' : 'Create SOP Checklist'}
            </h1>
            {sop && (
              <p className="text-xs text-muted-foreground">
                Owner ID: <span className="font-mono bg-muted py-0.5 px-1.5 rounded">{sop.ownerId}</span>
              </p>
            )}
          </div>
        </div>

        {/* Workflow Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {sop && (
            <>
              {sop.status === 'draft' && (
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
              {sop.status === 'review' && (
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
                    Publish SOP
                  </Button>
                </>
              )}
              {sop.status === 'published' && (
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
                Status: {sop.status}
              </Badge>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps Editor Main Panel */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-border/80 bg-card space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
              <ListTodo className="h-4 w-4 text-primary" /> General Info & Checklist Steps
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input
                  disabled={isArchived}
                  placeholder="e.g. End of Month Financial Reconciliation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category (Optional)</label>
                <select
                  disabled={isArchived}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No Category</option>
                  {renderCategoryOptions()}
                </select>
              </div>

              <div className="space-y-1 md:col-span-3">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/80" /> Review Due Date
                </label>
                <Input
                  type="date"
                  disabled={isArchived}
                  value={reviewDueDate}
                  onChange={(e) => setReviewDueDate(e.target.value)}
                  className="max-w-xs text-sm"
                />
                <p className="text-[10px] text-muted-foreground pt-0.5">
                  Overdue procedures will be surfaced prominently on the dashboard.
                </p>
              </div>
            </div>

            {/* List of Steps */}
            <div className="space-y-4 pt-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Sequence Checklist Steps
              </label>

              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-4 rounded-lg bg-muted/30 border border-border/50 items-start transition-all hover:bg-muted/40"
                  >
                    {/* Index Indicator */}
                    <div className="flex h-6 w-6 rounded-full bg-primary/10 text-primary items-center justify-center font-bold text-xs shrink-0 mt-2">
                      {index + 1}
                    </div>

                    <div className="flex-1 space-y-2">
                      <Input
                        disabled={isArchived}
                        placeholder="Action Instruction (e.g. Log in to QuickBooks and export ledger)..."
                        value={step.instruction}
                        onChange={(e) => handleStepChange(index, 'instruction', e.target.value)}
                        className="text-sm font-semibold text-foreground bg-background"
                      />
                      <Input
                        disabled={isArchived}
                        placeholder="Optional details, hints, or credentials note..."
                        value={step.note || ''}
                        onChange={(e) => handleStepChange(index, 'note', e.target.value)}
                        className="text-xs text-muted-foreground bg-background/50"
                      />
                    </div>

                    {/* Step Actions */}
                    {!isArchived && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={index === 0}
                          onClick={() => handleMoveStep(index, 'up')}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={index === steps.length - 1}
                          onClick={() => handleMoveStep(index, 'down')}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStep(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!isArchived && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                  className="gap-1 text-xs border-dashed"
                >
                  <Plus className="h-3.5 w-3.5" /> Add SOP Step
                </Button>
              )}
            </div>

            <div className="space-y-1 pt-2 border-t border-border/40">
              <label className="text-xs font-medium text-muted-foreground">
                Version Summary / Change Log
              </label>
              <Input
                disabled={isArchived}
                placeholder={sopId ? 'Describe edits made in this checklist version...' : 'Initial SOP checklist creation...'}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full text-sm"
              />
            </div>

            {!isArchived && (
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : sopId ? 'Save SOP & Create Version' : 'Create SOP Checklist'}
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
                  const isActive = ver.id === sop?.currentVersionId;
                  const versionIndex = versions.length - idx; // reverse list indexing
                  
                  return (
                    <div key={ver.id} className="relative group">
                      {/* Timeline dot */}
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
                            type="button"
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
          <DialogContent className="sm:max-w-[600px] border-border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> SOP Version Snapshot
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

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Checklist Steps Snapshot
                </label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {viewingVersion.steps.map((s, idx) => (
                    <div key={idx} className="p-2.5 rounded border border-border/60 bg-muted/20 text-xs flex gap-2.5 items-start">
                      <span className="h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{s.instruction}</p>
                        {s.note && <p className="text-[10px] text-muted-foreground italic mt-0.5">{s.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action to restore this past version */}
              {sop && !isArchived && viewingVersion.id !== sop.currentVersionId && (
                <div className="flex justify-between items-center pt-4 border-t border-border/50 gap-4">
                  <p className="text-[10px] text-muted-foreground max-w-sm">
                    Restoring this snapshot will replace the active checklist steps and create a new version snapshot.
                  </p>
                  <Button
                    size="sm"
                    className="gap-1 shrink-0"
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to restore this checklist snapshot?`)) return;
                      try {
                        const res = await updateSopAction({
                          id: sop.id,
                          data: {
                            title: viewingVersion.title,
                            categoryId: sop.categoryId,
                            steps: [...viewingVersion.steps],
                            versionSummary: `Restored version created on ${new Date(viewingVersion.createdAt).toLocaleDateString()}`,
                          },
                        });
                        if (res.success) {
                          toast.success(`Successfully restored SOP steps snapshot!`);
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
