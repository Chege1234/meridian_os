'use client';

/**
 * Feature Component — AI Agents Dashboard
 *
 * Dashboard showcasing active AI agents, goal/allowed actions,
 * interactive agent run triggers, reasoning traces, token tracking,
 * and a granular per-action approval queue.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Bot,
  Plus,
  Play,
  Check,
  X,
  RefreshCw,
  Terminal,
  Activity,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
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
import type { Agent, AgentRun, Prompt } from '@/domain/entities';
import {
  getAgentsAction,
  createAgentAction,
  getAgentRunsAction,
  runAgentAction,
  approveAgentActionAction,
  rejectAgentActionAction,
  executeApprovedAgentActionsAction,
} from '../actions';
import { getPromptsAction } from '@/features/prompt-library/actions';

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail view state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Builder Modal state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [promptId, setPromptId] = useState('');
  const [allowedActions, setAllowedActions] = useState<string[]>(['generate_content_draft']);

  // Variables modal for execution
  const [executionAgent, setExecutionAgent] = useState<Agent | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const agentsRes = await getAgentsAction();
      if (agentsRes.success) {
        setAgents(agentsRes.agents);
      }

      const runsRes = await getAgentRunsAction();
      if (runsRes.success) {
        setRuns(runsRes.runs);
      }

      const promptsRes = await getPromptsAction({ status: 'active' });
      if (promptsRes.success) {
        setPrompts(promptsRes.prompts);
      }
    } catch {
      toast.error('An error occurred during data fetching.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !goal.trim() || !promptId) {
      toast.error('Name, Goal, and Prompt Template are required.');
      return;
    }

    try {
      const res = await createAgentAction({
        name,
        goal,
        allowedActions,
        promptId,
        status: 'active',
      });

      if (res.success) {
        toast.success('AI Agent created successfully.');
        setIsBuilderOpen(false);
        // Reset
        setName('');
        setGoal('');
        setPromptId('');
        setAllowedActions(['generate_content_draft']);
        loadData();
      } else {
        toast.error(res.error || 'Failed to create agent.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Validation failed.');
    }
  }

  const openExecutionDialog = (agent: Agent) => {
    setExecutionAgent(agent);
    const selectedPrompt = prompts.find((p) => p.id === agent.promptId);
    const initialVars: Record<string, string> = {};
    if (selectedPrompt) {
      selectedPrompt.variables.forEach((v) => {
        initialVars[v] = '';
      });
    }
    setVariables(initialVars);
  };

  async function handleRunAgent() {
    if (!executionAgent) return;
    setLoading(true);
    try {
      const res = await runAgentAction({
        agentId: executionAgent.id,
        variables,
      });

      if (res.success && res.run) {
        toast.success('Agent run completed. Actions staged in approval queue.');
        setExecutionAgent(null);
        loadData();
      } else {
        toast.error(res.error || 'Failed to run agent.');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleActionApproval(runId: string, actionId: string, approve: boolean) {
    try {
      const res = approve
        ? await approveAgentActionAction({ runId, actionId })
        : await rejectAgentActionAction({ runId, actionId });

      if (res.success) {
        toast.success(`Action successfully ${approve ? 'approved' : 'rejected'}.`);
        loadData();
      } else {
        toast.error(res.error || 'Failed to resolve action.');
      }
    } catch {
      toast.error('An error occurred.');
    }
  }

  async function handleExecuteActions(runId: string) {
    try {
      const res = await executeApprovedAgentActionsAction({ runId });
      if (res.success) {
        toast.success('Approved actions executed successfully.');
        loadData();
      } else {
        toast.error(res.error || 'Execution failed.');
      }
    } catch {
      toast.error('An error occurred during execution.');
    }
  }

  const toggleActionSelection = (val: string) => {
    if (allowedActions.includes(val)) {
      setAllowedActions(allowedActions.filter((a) => a !== val));
    } else {
      setAllowedActions([...allowedActions, val]);
    }
  };

  // Metrics aggregations
  const totalTokens = runs.reduce((sum, r) => sum + (r.tokenUsage?.totalTokens || 0), 0);
  const totalCost = runs.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> AI Agents Portal
          </h1>
          <p className="text-sm text-muted-foreground">
            Stage, verify, and orchestrate actions proposed by autonomous prompt-driven agents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadData} variant="outline" size="icon" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsBuilderOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Configure Agent
          </Button>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 bg-card/40 border-border flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Active Agents</span>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {agents.filter((a) => a.status === 'active').length}
            </h3>
          </div>
          <Bot className="h-8 w-8 text-primary opacity-50" />
        </Card>
        <Card className="p-4 bg-card/40 border-border flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Token Usage</span>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {totalTokens.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">tokens</span>
            </h3>
          </div>
          <Activity className="h-8 w-8 text-indigo-500 opacity-50" />
        </Card>
        <Card className="p-4 bg-card/40 border-border flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Estimated Cost</span>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              ${totalCost.toFixed(4)} <span className="text-xs font-normal text-muted-foreground">USD</span>
            </h3>
          </div>
          <DollarSign className="h-8 w-8 text-emerald-500 opacity-50" />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Agents List */}
        <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-sm border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">Configured Agents</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : agents.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center border border-dashed border-border rounded-lg">
                <Bot className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No agents configured yet.</p>
              </div>
            ) : (
              agents.map((agent) => (
                <div key={agent.id} className="p-4 bg-background/50 border border-border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        {agent.name}
                        <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>{agent.status}</Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 italic">"{agent.goal}"</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedAgent(agent)}>
                        Traces / Logs
                      </Button>
                      <Button size="sm" onClick={() => openExecutionDialog(agent)} className="gap-1">
                        <Play className="h-3 w-3" /> Run Agent
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50 text-[10px]">
                    <span className="text-muted-foreground">Allowed actions:</span>
                    {agent.allowedActions.map((action) => (
                      <Badge key={action} className="bg-primary/20 text-primary border-none">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Action Approval Queue */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" /> Actions Staged
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Review individual actions proposed by agents and execute approved ones.
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2">
            {runs.filter((r) => r.status === 'pending_approval').length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center border border-dashed border-border rounded-lg">
                <Check className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="text-xs text-muted-foreground">No staged actions requiring approval.</p>
              </div>
            ) : (
              runs
                .filter((r) => r.status === 'pending_approval')
                .map((run) => {
                  const parentAgent = agents.find((a) => a.id === run.agentId);
                  return (
                    <div key={run.id} className="p-4 bg-background/50 border border-border rounded-lg space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{parentAgent?.name} Run</span>
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(run.startedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                          <span className="font-semibold text-foreground">Reasoning:</span> {run.reasoningTrace}
                        </p>
                      </div>

                      {/* Granular proposed actions checklist */}
                      <div className="space-y-2">
                        {run.proposedActions.map((action) => (
                          <div
                            key={action.id}
                            className="p-2 bg-black/30 border border-border/50 rounded flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <Badge className="bg-primary/20 text-primary border-none text-[9px] capitalize">
                                {action.type.replace('_', ' ')}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {action.status === 'pending' ? (
                                  <>
                                    <button
                                      onClick={() => handleActionApproval(run.id, action.id, false)}
                                      className="p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                                      title="Reject Action"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => handleActionApproval(run.id, action.id, true)}
                                      className="p-1 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                      title="Approve Action"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                  </>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className={
                                      action.status === 'approved'
                                        ? 'text-emerald-400 border-emerald-400 text-[8px]'
                                        : 'text-rose-400 border-rose-400 text-[8px]'
                                    }
                                  >
                                    {action.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-[9px] text-muted-foreground font-mono overflow-x-auto max-h-16">
                              {action.error ? (
                                <span className="text-rose-400 flex items-center gap-1">
                                  <AlertTriangle className="h-2 w-2" /> {action.error}
                                </span>
                              ) : (
                                <pre>{JSON.stringify(action.config, null, 2)}</pre>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Execution button once at least 1 action is approved/rejected */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExecuteActions(run.id)}
                        className="w-full text-xs gap-1 border-primary/50 text-primary"
                        disabled={!run.proposedActions.some((a) => a.status === 'approved')}
                      >
                        Execute Approved Actions <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })
            )}
          </div>
        </Card>
      </div>

      {/* Traces detail Drawer */}
      {selectedAgent && (
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="max-w-4xl bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Terminal className="h-5 w-5 text-primary" /> Run history of agent: {selectedAgent.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {runs.filter((r) => r.agentId === selectedAgent.id).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No execution logs found for this agent.</p>
              ) : (
                runs
                  .filter((r) => r.agentId === selectedAgent.id)
                  .map((run) => (
                    <div key={run.id} className="p-4 bg-background/50 border border-border rounded-lg space-y-4">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(run.startedAt).toLocaleString()}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              run.status === 'completed'
                                ? 'text-emerald-500 border-emerald-500'
                                : run.status === 'failed'
                                  ? 'text-rose-500 border-rose-500'
                                  : 'text-amber-500 border-amber-500'
                            }
                          >
                            {run.status}
                          </Badge>
                        </div>
                        {run.tokenUsage && (
                          <div className="text-[10px] text-muted-foreground">
                            Tokens: {run.tokenUsage.totalTokens} (${run.estimatedCost?.toFixed(6)} USD)
                          </div>
                        )}
                      </div>

                      {/* Reasoning Trace */}
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-foreground">Reasoning Trace:</span>
                        <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed bg-black/20 p-3 rounded">
                          {run.reasoningTrace}
                        </p>
                      </div>

                      {/* Proposed / Executed Actions Logs */}
                      {run.executedActions && run.executedActions.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-foreground">Execution Audit Results:</span>
                          <div className="grid gap-2">
                            {run.executedActions.map((exec) => (
                              <div
                                key={exec.id}
                                className="p-2 bg-black/40 border border-border/30 rounded flex items-center justify-between"
                              >
                                <div>
                                  <Badge className="bg-primary/20 text-primary border-none text-[8px] uppercase mr-2">
                                    {exec.type}
                                  </Badge>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {exec.error ? exec.error : `Output: ${JSON.stringify(exec.result)}`}
                                  </span>
                                </div>
                                <Badge
                                  className={
                                    exec.status === 'executed'
                                      ? 'bg-emerald-500/20 text-emerald-400 border-none text-[8px]'
                                      : 'bg-rose-500/20 text-rose-400 border-none text-[8px]'
                                  }
                                >
                                  {exec.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Execution Setup Dialog */}
      <Dialog open={!!executionAgent} onOpenChange={() => setExecutionAgent(null)}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Play className="h-5 w-5 text-emerald-500" /> Run Agent: {executionAgent?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-xs text-muted-foreground italic">"{executionAgent?.goal}"</p>

            <div className="space-y-3">
              <span className="text-xs font-bold text-foreground">Provide prompt variables:</span>
              {Object.keys(variables).length === 0 ? (
                <p className="text-xs text-muted-foreground">No variables required for this prompt.</p>
              ) : (
                Object.keys(variables).map((v) => (
                  <div key={v} className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">{v}</label>
                    <Input
                      value={variables[v]}
                      onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                      placeholder={`Enter value for ${v}`}
                      required
                    />
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="ghost" onClick={() => setExecutionAgent(null)}>
                Cancel
              </Button>
              <Button onClick={handleRunAgent} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Run Agent Trigger'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Builder Dialog */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Plus className="h-5 w-5 text-primary" /> Configure AI Agent
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateAgent} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Agent Name</label>
              <Input
                placeholder="e.g. Campaign Assistant Agent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Stated Goal</label>
              <textarea
                placeholder="e.g. Draft content promotions and set up tasks when status changes."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
                rows={3}
                className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Prompt template</label>
              <select
                value={promptId}
                onChange={(e) => setPromptId(e.target.value)}
                required
                className="w-full h-10 bg-background border border-border rounded-lg px-3 text-xs text-foreground"
              >
                <option value="">-- Select prompt from Prompt Library --</option>
                {prompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.provider})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">Staging actions whitelist</label>
              <div className="space-y-2 bg-background/50 border border-border p-3 rounded-lg">
                {[
                  { val: 'generate_content_draft', label: 'Generate Content Drafts' },
                  { val: 'create_task', label: 'Create Tasks' },
                  { val: 'update_status', label: 'Update Status' },
                ].map((act) => (
                  <div key={act.val} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allowedActions.includes(act.val)}
                      onChange={() => toggleActionSelection(act.val)}
                      className="h-4 w-4 rounded border-border bg-background text-primary"
                    />
                    <span className="text-xs text-foreground">{act.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsBuilderOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Agent</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
