'use client';

/**
 * Feature Component — Automation Center
 *
 * Dashboard showcasing active rule-based automations, a builder drawer,
 * and the pending approvals queue.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Cpu,
  Plus,
  Search,
  Clock,
  Play,
  Pause,
  Check,
  X,
  RefreshCw,
  Terminal,
  FileText,
  AlertTriangle,
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
  TableCell,
} from '@/shared/components/ui';
import type { Automation, AutomationRun } from '@/domain/entities';
import {
  getAutomationsAction,
  createAutomationAction,
  pauseAutomationAction,
  getAutomationRunsAction,
  approveAutomationRunAction,
  rejectAutomationRunAction,
} from '../actions';

export function AutomationPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Builder modal
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<'schedule' | 'event'>('event');
  const [cron, setCron] = useState('0 0 * * *');
  const [event, setEvent] = useState('content.published');
  const [actionType, setActionType] = useState<
    'create_task' | 'send_notification' | 'update_status' | 'generate_content_draft' | 'run_report'
  >('create_task');
  const [requiresApproval, setRequiresApproval] = useState(true);

  // Action config states
  const [taskTitle, setTaskTitle] = useState('New automated task');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notifRecipient, setNotifRecipient] = useState('Admin');
  const [notifMessage, setNotifMessage] = useState('An automation trigger succeeded!');
  const [statusTargetType, setStatusTargetType] = useState('campaign');
  const [statusTargetId, setStatusTargetId] = useState('');
  const [statusTargetVal, setStatusTargetVal] = useState('active');
  const [draftPlatform, setDraftPlatform] = useState('email');
  const [draftType, setDraftType] = useState('newsletter');
  const [draftBody, setDraftBody] = useState('Automated newsletter body.');
  const [reportType, setReportType] = useState('performance');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const autoRes = await getAutomationsAction();
      if (autoRes.success) {
        setAutomations(autoRes.automations);
      } else {
        toast.error(autoRes.error || 'Failed to load automations.');
      }

      const runsRes = await getAutomationRunsAction();
      if (runsRes.success) {
        setRuns(runsRes.runs);
      }
    } catch {
      toast.error('An error occurred during data fetching.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: 'active' | 'paused') {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await pauseAutomationAction({ id, status: nextStatus });
      if (res.success) {
        toast.success(`Automation status updated to ${nextStatus}.`);
        loadData();
      } else {
        toast.error(res.error || 'Failed to update status.');
      }
    } catch {
      toast.error('An error occurred.');
    }
  }

  async function handleCreateAutomation(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Automation name is required.');
      return;
    }

    // Build trigger and action configs
    const triggerConfig = triggerType === 'schedule' ? { cron } : { event };
    let actionConfig: any = {};

    switch (actionType) {
      case 'create_task':
        actionConfig = { title: taskTitle, priority: taskPriority };
        break;
      case 'send_notification':
        actionConfig = { recipient: notifRecipient, message: notifMessage };
        break;
      case 'update_status':
        actionConfig = {
          targetType: statusTargetType,
          targetId: statusTargetId,
          status: statusTargetVal,
        };
        break;
      case 'generate_content_draft':
        actionConfig = { platform: draftPlatform, type: draftType, body: draftBody };
        break;
      case 'run_report':
        actionConfig = { reportType };
        break;
    }

    try {
      // Client-side rule check helper for instant feedback (optional, but nice)
      if (!requiresApproval && actionType === 'update_status') {
        const liveStatuses = ['published', 'active', 'approved', 'scheduled', 'archived', 'deleted', 'completed'];
        if (liveStatuses.includes(statusTargetVal)) {
          toast.error(
            'Cannot set auto-approval for status transitions to live, active, completed, or archived states.'
          );
          return;
        }
      }

      const res = await createAutomationAction({
        name,
        triggerType,
        triggerConfig,
        actionType,
        actionConfig,
        status: 'active',
        requiresApproval,
      });

      if (res.success) {
        toast.success('Automation created successfully.');
        setIsBuilderOpen(false);
        // Reset form
        setName('');
        loadData();
      } else {
        toast.error(res.error || 'Failed to create automation.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Validation failed.');
    }
  }

  async function handleApproveRun(runId: string) {
    try {
      const res = await approveAutomationRunAction(runId);
      if (res.success) {
        toast.success('Automation run approved and executed.');
        loadData();
      } else {
        toast.error(res.error || 'Failed to approve run.');
      }
    } catch {
      toast.error('An error occurred.');
    }
  }

  async function handleRejectRun(runId: string) {
    try {
      const res = await rejectAutomationRunAction(runId);
      if (res.success) {
        toast.success('Automation run rejected.');
        loadData();
      } else {
        toast.error(res.error || 'Failed to reject run.');
      }
    } catch {
      toast.error('An error occurred.');
    }
  }

  const filteredAutomations = automations.filter((auto) =>
    auto.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary animate-pulse" /> Automation Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Build and monitor rule-based task triggers and automatic workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadData} variant="outline" size="icon" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsBuilderOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Automation
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Automations List */}
        <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-sm border-border">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search automations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAutomations.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center border border-dashed border-border rounded-lg">
              <Cpu className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No automations found. Create one to begin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAutomations.map((auto) => (
                    <TableRow key={auto.id}>
                      <TableCell className="font-semibold">{auto.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {auto.triggerType}
                        </Badge>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {auto.triggerType === 'schedule' ? auto.triggerConfig.cron : auto.triggerConfig.event}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary/20 text-primary border-none capitalize">
                          {auto.actionType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {auto.requiresApproval ? (
                          <Badge variant="secondary">Requires Sign-off</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-none">Auto-run</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(auto.id, auto.status)}
                          className={auto.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}
                        >
                          {auto.status === 'active' ? (
                            <Play className="h-4 w-4 mr-1 fill-emerald-500" />
                          ) : (
                            <Pause className="h-4 w-4 mr-1 fill-amber-500" />
                          )}
                          <span className="capitalize">{auto.status}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Approval Queue */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-amber-500" /> Approval Queue
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Pending runs waiting for Admin or Owner validation.
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2">
            {loading ? (
              <div className="flex h-20 items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : runs.filter((r) => r.status === 'pending_approval').length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center border border-dashed border-border rounded-lg">
                <Check className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="text-xs text-muted-foreground">All caught up! No pending approvals.</p>
              </div>
            ) : (
              runs
                .filter((r) => r.status === 'pending_approval')
                .map((run) => {
                  const parentAuto = automations.find((a) => a.id === run.automationId);
                  return (
                    <div key={run.id} className="p-4 bg-background/50 border border-border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{parentAuto?.name || 'Automation Run'}</span>
                        <Badge variant="outline" className="text-[10px] uppercase text-amber-400 border-amber-400">
                          Sign-off
                        </Badge>
                      </div>
                      <div className="p-2 bg-black/30 rounded text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-24">
                        <pre>{JSON.stringify(run.inputSnapshot, null, 2)}</pre>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRejectRun(run.id)}
                          className="h-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleApproveRun(run.id)} className="h-8">
                          <Check className="h-4 w-4 mr-1 text-emerald-500" /> Approve
                        </Button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </Card>
      </div>

      {/* History Log */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Terminal className="h-5 w-5 text-primary" /> Execution Audit History
        </h2>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Automation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Output / Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const parentAuto = automations.find((a) => a.id === run.automationId);
                return (
                  <TableRow key={run.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(run.triggeredAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-xs">{parentAuto?.name || 'Automation Template'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          run.status === 'executed'
                            ? 'text-emerald-500 border-emerald-500'
                            : run.status === 'failed'
                              ? 'text-rose-500 border-rose-500'
                              : 'text-amber-500 border-amber-500'
                        }
                      >
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-md truncate font-mono text-muted-foreground">
                      {run.error ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> {run.error}
                        </span>
                      ) : (
                        JSON.stringify(run.output || run.inputSnapshot)
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Builder Dialog */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-2xl bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Cpu className="h-5 w-5 text-primary" /> Automation Builder
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateAutomation} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Automation Name</label>
                <Input
                  placeholder="e.g. Content Published Alert"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Approval toggle */}
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center justify-between p-3 bg-background/50 border border-border rounded-lg h-10">
                  <span className="text-xs font-semibold text-foreground">Requires Approval</span>
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary"
                  />
                </div>
              </div>

              {/* Trigger Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Trigger Type</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as any)}
                  className="w-full h-10 bg-background border border-border rounded-lg px-3 text-xs text-foreground"
                >
                  <option value="event">App Event</option>
                  <option value="schedule">Time Schedule</option>
                </select>
              </div>

              {/* Trigger Config */}
              {triggerType === 'schedule' ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Cron Expression</label>
                  <Input value={cron} onChange={(e) => setCron(e.target.value)} placeholder="0 0 * * *" />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Select Event</label>
                  <select
                    value={event}
                    onChange={(e) => setEvent(e.target.value)}
                    className="w-full h-10 bg-background border border-border rounded-lg px-3 text-xs text-foreground"
                  >
                    <option value="content.published">Content Published</option>
                    <option value="campaign.status_changed">Campaign Status Changed</option>
                    <option value="sop.review_overdue">SOP Review Overdue</option>
                  </select>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-bold text-foreground mb-4">Configure Action</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Action Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e: any) => setActionType(e.target.value)}
                    className="w-full h-10 bg-background border border-border rounded-lg px-3 text-xs text-foreground"
                  >
                    <option value="create_task">Create Task</option>
                    <option value="send_notification">Send Notification</option>
                    <option value="update_status">Update Status</option>
                    <option value="generate_content_draft">Generate Content Draft</option>
                    <option value="run_report">Run Report</option>
                  </select>
                </div>

                {/* Conditional configurations */}
                {actionType === 'create_task' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Task Title</label>
                      <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                      <select
                        value={taskPriority}
                        onChange={(e: any) => setTaskPriority(e.target.value)}
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-xs text-foreground"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </>
                )}

                {actionType === 'send_notification' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Recipient Role / User</label>
                      <Input value={notifRecipient} onChange={(e) => setNotifRecipient(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Message</label>
                      <Input value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} />
                    </div>
                  </>
                )}

                {actionType === 'update_status' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Target Type</label>
                      <select
                        value={statusTargetType}
                        onChange={(e) => setStatusTargetType(e.target.value)}
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-xs text-foreground"
                      >
                        <option value="campaign">Campaign</option>
                        <option value="content_item">Content Item</option>
                        <option value="sop">SOP</option>
                        <option value="task">Task</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Target Entity ID</label>
                      <Input
                        placeholder="UUID in DB"
                        value={statusTargetId}
                        onChange={(e) => setStatusTargetId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">New Status</label>
                      <Input value={statusTargetVal} onChange={(e) => setStatusTargetVal(e.target.value)} />
                    </div>
                  </>
                )}

                {actionType === 'generate_content_draft' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Platform</label>
                      <Input value={draftPlatform} onChange={(e) => setDraftPlatform(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Type</label>
                      <Input value={draftType} onChange={(e) => setDraftType(e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">Draft Body</label>
                      <textarea
                        value={draftBody}
                        onChange={(e) => setDraftBody(e.target.value)}
                        rows={3}
                        className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground"
                      />
                    </div>
                  </>
                )}

                {actionType === 'run_report' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Report Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full h-10 bg-background border border-border rounded-lg px-3 text-xs text-foreground"
                    >
                      <option value="performance">Performance Summary</option>
                      <option value="crm_activity">CRM Activity Log</option>
                      <option value="content_aging">Content Aging Analysis</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsBuilderOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Automation</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
