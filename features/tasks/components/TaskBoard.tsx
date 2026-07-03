'use client';

/**
 * Feature Component — Task Board
 *
 * A reusable Kanban-style task board.
 * Supports rendering globally or filtered by contactId.
 * Enforces task state machine (BR-700 / TaskRules) with user feedback.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Badge,
} from '@/shared/components/ui';
import type { Task, User, TaskStatus, TaskPriority } from '@/domain/entities';
import {
  getTasksAction,
  createTaskAction,
  updateTaskStatusAction,
  assignTaskAction,
  archiveTaskAction,
  getActiveUsersAction,
} from '../actions';

interface TaskBoardProps {
  contactId?: string; // Optional: filter tasks by contact
  contactName?: string; // Optional: for dialog display
  campaignId?: string; // Optional: filter tasks by campaign
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'Todo', color: 'border-t-blue-500 bg-blue-50/20 dark:bg-blue-950/10' },
  { id: 'in_progress', label: 'In Progress', color: 'border-t-yellow-500 bg-yellow-50/20 dark:bg-yellow-950/10' },
  { id: 'blocked', label: 'Blocked', color: 'border-t-red-500 bg-red-50/20 dark:bg-red-950/10' },
  { id: 'completed', label: 'Completed', color: 'border-t-green-500 bg-green-50/20 dark:bg-green-950/10' },
];

export function TaskBoard({ contactId, contactName, campaignId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');

  async function loadData() {
    setLoading(true);
    try {
      const tasksRes = await getTasksAction();
      const usersRes = await getActiveUsersAction();

      if (tasksRes.success) {
        // Filter by contactId / campaignId if provided
        let filtered = tasksRes.tasks;
        if (contactId) {
          filtered = filtered.filter((t) => t.contactId === contactId);
        }
        if (campaignId) {
          filtered = filtered.filter((t) => t.campaignId === campaignId);
        }
        setTasks(filtered);
      }
      if (usersRes.success) {
        setUsers(usersRes.users);
      }
    } catch {
      toast.error('Failed to load tasks data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [contactId, campaignId]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Task title is required.');
      return;
    }

    try {
      const res = await createTaskAction({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        contactId: contactId ?? null,
        campaignId: campaignId ?? null,
      });

      if (res.success && res.task) {
        setTasks((prev) => [res.task!, ...prev]);
        setIsCreateOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewPriority('medium');
        toast.success('Task created successfully.');
      } else {
        toast.error(res.error || 'Failed to create task.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred.');
    }
  }

  async function handleStatusTransition(task: Task, nextStatus: TaskStatus) {
    try {
      const res = await updateTaskStatusAction({ id: task.id, status: nextStatus });
      if (res.success && res.task) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? res.task! : t)),
        );
        toast.success(`Task status updated to "${nextStatus.replace('_', ' ')}".`);
      } else {
        toast.error(res.error || 'Invalid transition.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred.');
    }
  }

  async function handleAssignUser(taskId: string, userId: string | null) {
    try {
      const res = await assignTaskAction({ id: taskId, assignedTo: userId });
      if (res.success && res.task) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? res.task! : t)),
        );
        toast.success(userId ? 'Task assigned.' : 'Task unassigned.');
      } else {
        toast.error(res.error || 'Failed to assign task.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred.');
    }
  }

  async function handleArchiveTask(taskId: string) {
    try {
      const res = await archiveTaskAction(taskId);
      if (res.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        toast.success('Task archived.');
      } else {
        toast.error(res.error || 'Failed to archive task.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred.');
    }
  }

  const getPriorityBadge = (p: TaskPriority) => {
    const styles: Record<TaskPriority, string> = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    };
    return <Badge className={`${styles[p]} border-none uppercase text-[10px]`}>{p}</Badge>;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {contactName ? `Tasks for ${contactName}` : 'Tasks'}
        </h3>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Grid of Columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-lg border border-border/60 border-t-2 ${col.color} p-3 min-h-[400px]`}
            >
              {/* Column Title */}
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-foreground">{col.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {colTasks.length}
                </Badge>
              </div>

              {/* Tasks List */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colTasks.map((task) => (
                  <Card key={task.id} className="border border-border/80 bg-card hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-foreground tracking-tight line-clamp-2">
                          {task.title}
                        </span>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" className="h-6 w-6 p-0 shrink-0">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-44">
                            {/* Status transitions */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Move to</div>
                            {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
                              <DropdownMenuItem
                                key={c.id}
                                onClick={() => handleStatusTransition(task, c.id)}
                                className="text-xs"
                              >
                                <ArrowRight className="mr-2 h-3.5 w-3.5" />
                                {c.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem
                              onClick={() => handleArchiveTask(task.id)}
                              className="text-xs text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Archive Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        {getPriorityBadge(task.priority)}

                        {/* Assignee selector */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
                                <UserIcon className="h-3 w-3" />
                                <span className="max-w-[70px] truncate">
                                  {users.find((u) => u.id === task.assignedTo)?.fullName || 'Assign'}
                                </span>
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="max-h-56 overflow-y-auto">
                            <DropdownMenuItem onClick={() => handleAssignUser(task.id, null)} className="text-xs">
                              Unassigned
                            </DropdownMenuItem>
                            {users.map((u) => (
                              <DropdownMenuItem
                                key={u.id}
                                onClick={() => handleAssignUser(task.id, u.id)}
                                className="text-xs"
                              >
                                {u.fullName}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {colTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border/40 rounded-lg">
                    <span className="text-xs text-muted-foreground/60">No tasks</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="task-title" className="text-sm font-medium text-foreground">
                Title
              </label>
              <Input
                id="task-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Follow up on pricing"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="task-desc" className="text-sm font-medium text-foreground">
                Description
              </label>
              <Input
                id="task-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Call to align on details..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Priority</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={newPriority === p ? 'default' : 'outline'}
                    size="sm"
                    className="capitalize flex-1"
                    onClick={() => setNewPriority(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
