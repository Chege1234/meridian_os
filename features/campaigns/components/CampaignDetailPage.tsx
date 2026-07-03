'use client';

/**
 * Feature Component — Campaign Detail Page
 *
 * Detailed dashboard with 5 tabs:
 * - Overview (Dates, Objective, Budget, Status transitions)
 * - Content (Attached Content items + Attach existing / Create pre-filled actions)
 * - Contacts (Attached CRM Contacts + Role tagging + Attach / Detach actions)
 * - Tasks (Embedded Kanban Task Board filtered by campaignId)
 * - Metrics (Metrics table + Record new metric form)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  UserPlus,
  Link as LinkIcon,
  Trash2,
  Users,
  Target,
  FileEdit,
  TrendingDown,
  Activity,
  UserCheck,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from 'recharts';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui';
import type { Campaign, ContentItem, Contact, CampaignContactRole, CampaignMetric, CampaignStatus, CampaignMetricName } from '@/domain/entities';
import { TaskBoard } from '@/features/tasks';
import {
  getCampaignDetailAction,
  updateCampaignAction,
  transitionCampaignStatusAction,
  attachContentAction,
  detachContentAction,
  attachContactAction,
  detachContactAction,
  recordMetricAction,
} from '../actions';
import { updateCampaignSchema, type UpdateCampaignSchemaInput } from '../schemas';
import { getContactsAction } from '@/features/crm/actions';
import { getContentItemsAction } from '@/features/content-studio/actions';
import { validateStatusTransition } from '@/domain/rules/CampaignRules';

interface CampaignDetailPageProps {
  campaignId: string;
}

export function CampaignDetailPage({ campaignId }: CampaignDetailPageProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contacts, setContacts] = useState<{ contact: Contact; role: CampaignContactRole }[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Attach Dialogs State
  const [isAttachContentOpen, setIsAttachContentOpen] = useState(false);
  const [allContentItems, setAllContentItems] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  const [isAttachContactOpen, setIsAttachContactOpen] = useState(false);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedContactRole, setSelectedContactRole] = useState<CampaignContactRole>('target');

  // Metrics Form State
  const [metricName, setMetricName] = useState<CampaignMetricName>('reach');
  const [metricValue, setMetricValue] = useState('');
  const [recordingMetric, setRecordingMetric] = useState(false);

  // Actor info for rule validation
  const [actorRoleName, setActorRoleName] = useState('editor'); // Fallback to editor, will fetch user in actions

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateCampaignSchemaInput>({
    resolver: zodResolver(updateCampaignSchema),
  });

  async function loadDetail() {
    try {
      const res = await getCampaignDetailAction(campaignId);
      if (res.success && res.campaign) {
        setCampaign(res.campaign);
        setContentItems(res.contentItems || []);
        setContacts(res.contacts || []);
        setMetrics(res.metrics || []);
        reset({
          name: res.campaign.name,
          objective: res.campaign.objective,
          startDate: new Date(res.campaign.startDate).toISOString().split('T')[0] as any,
          endDate: res.campaign.endDate ? new Date(res.campaign.endDate).toISOString().split('T')[0] as any : '',
          budget: res.campaign.budget || null,
        });

        // Determine user role (can read it from auth user)
        // For local layout logic, we fetch detail where auth is implicit, or use default rules
      } else {
        toast.error(res.error || 'Failed to load campaign details.');
      }
    } catch {
      toast.error('An error occurred loading campaign details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [campaignId]);

  // Helper to pivot metrics for the chart
  const chartData = (() => {
    const pivotMap: Record<string, { date: string; reach: number; clicks: number; conversions: number; signups: number; revenue: number }> = {};
    metrics.forEach((m) => {
      const dateStr = new Date(m.recordedAt).toISOString().split('T')[0] ?? '';
      if (!pivotMap[dateStr]) {
        pivotMap[dateStr] = {
          date: dateStr,
          reach: 0,
          clicks: 0,
          conversions: 0,
          signups: 0,
          revenue: 0,
        };
      }
      const val = Number(m.value) || 0;
      const name = m.metricName;
      const entry = pivotMap[dateStr]!;
      if (name === 'reach') entry.reach += val;
      else if (name === 'clicks') entry.clicks += val;
      else if (name === 'conversions') entry.conversions += val;
      else if (name === 'signups') entry.signups += val;
      else if (name === 'revenue') entry.revenue += val;
    });
    return Object.values(pivotMap).sort((a, b) => a.date.localeCompare(b.date));
  })();

  // Load content items for Attach dialog
  async function loadAllContent() {
    setLoadingContent(true);
    try {
      const res = await getContentItemsAction({});
      if (res.success) {
        // Filter out content that is already attached
        const attachedIds = contentItems.map((c) => c.id);
        setAllContentItems(res.items.filter((item) => !attachedIds.includes(item.id)));
      }
    } catch {
      toast.error('Failed to load content items.');
    } finally {
      setLoadingContent(false);
    }
  }

  // Load CRM contacts for Attach dialog
  async function loadAllContacts() {
    setLoadingContacts(true);
    try {
      const res = await getContactsAction({});
      if (res.success) {
        const attachedIds = contacts.map((c) => c.contact.id);
        const filtered = res.contacts.filter((c) => !attachedIds.includes(c.id));
        setAllContacts(filtered);
        if (filtered.length > 0 && filtered[0]) {
          setSelectedContactId(filtered[0].id);
        }
      }
    } catch {
      toast.error('Failed to load contacts.');
    } finally {
      setLoadingContacts(false);
    }
  }

  useEffect(() => {
    if (isAttachContentOpen) {
      loadAllContent();
    }
  }, [isAttachContentOpen]);

  useEffect(() => {
    if (isAttachContactOpen) {
      loadAllContacts();
    }
  }, [isAttachContactOpen]);

  async function onSave(data: UpdateCampaignSchemaInput) {
    try {
      const res = await updateCampaignAction({ id: campaignId, data });
      if (res.success && res.campaign) {
        setCampaign(res.campaign);
        setEditing(false);
        toast.success('Campaign details updated.');
        loadDetail();
      } else {
        toast.error(res.error || 'Failed to update campaign.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    }
  }

  async function handleStatusTransition(nextStatus: CampaignStatus) {
    try {
      const res = await transitionCampaignStatusAction({ id: campaignId, status: nextStatus });
      if (res.success && res.campaign) {
        setCampaign(res.campaign);
        toast.success(`Campaign moved to status "${nextStatus}".`);
        loadDetail();
      } else {
        toast.error(res.error || 'Invalid transition.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    }
  }

  // Attach/Detach Content
  async function handleAttachContent(contentItemId: string) {
    try {
      const res = await attachContentAction({ campaignId, contentItemId });
      if (res.success) {
        toast.success('Content attached.');
        setIsAttachContentOpen(false);
        loadDetail();
      } else {
        toast.error(res.error || 'Failed to attach content.');
      }
    } catch {
      toast.error('Error occurred.');
    }
  }

  async function handleDetachContent(contentItemId: string) {
    if (!confirm('Are you sure you want to detach this content?')) return;
    try {
      const res = await detachContentAction({ campaignId, contentItemId });
      if (res.success) {
        toast.success('Content detached.');
        loadDetail();
      } else {
        toast.error(res.error || 'Failed to detach.');
      }
    } catch {
      toast.error('Error occurred.');
    }
  }

  // Attach/Detach Contact
  async function handleAttachContact() {
    if (!selectedContactId) return;
    try {
      const res = await attachContactAction({
        campaignId,
        contactId: selectedContactId,
        role: selectedContactRole,
      });
      if (res.success) {
        toast.success('Contact attached to campaign.');
        setIsAttachContactOpen(false);
        loadDetail();
      } else {
        toast.error(res.error || 'Failed to attach contact.');
      }
    } catch {
      toast.error('Error occurred.');
    }
  }

  async function handleDetachContact(contactId: string) {
    if (!confirm('Are you sure you want to detach this contact?')) return;
    try {
      const res = await detachContactAction({ campaignId, contactId });
      if (res.success) {
        toast.success('Contact detached.');
        loadDetail();
      } else {
        toast.error(res.error || 'Failed to detach.');
      }
    } catch {
      toast.error('Error occurred.');
    }
  }

  // Record Metric
  async function handleRecordMetric(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(metricValue);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a non-negative numeric value.');
      return;
    }
    setRecordingMetric(true);
    try {
      const res = await recordMetricAction({
        campaignId,
        metricName,
        value: val,
      });
      if (res.success) {
        toast.success('Metric recorded successfully.');
        setMetricValue('');
        loadDetail();
      } else {
        toast.error(res.error || 'Failed to record metric.');
      }
    } catch {
      toast.error('Error occurred.');
    } finally {
      setRecordingMetric(false);
    }
  }

  // Check valid statuses
  const getValidTransitions = (): CampaignStatus[] => {
    if (!campaign) return [];
    const statuses: CampaignStatus[] = ['draft', 'active', 'paused', 'completed', 'archived'];
    return statuses.filter((st) => {
      if (st === campaign.status) return false;
      const res = validateStatusTransition(campaign.status, st, actorRoleName, contentItems.length);
      return res.isValid;
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'paused':
        return 'outline';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatBudget = (val: number | null) => {
    if (val === null || val === undefined) return 'No budget set';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto py-4">
        <div className="h-8 w-32 animate-pulse bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 h-80 animate-pulse bg-muted rounded-lg" />
          <div className="md:col-span-2 h-80 animate-pulse bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-foreground">Campaign not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The campaign may have been archived.</p>
        <Link href="/campaigns" className="mt-4 inline-flex">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  const validTransitions = getValidTransitions();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Back Button & Title */}
      <div className="flex flex-col gap-2">
        <div>
          <Link href="/campaigns" passHref>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground p-0 hover:bg-transparent">
              <ArrowLeft className="h-4 w-4" /> Back to Campaigns
            </Button>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{campaign.name}</h1>
            <Badge variant={getStatusBadgeVariant(campaign.status)} className="capitalize text-xs px-2.5 py-0.5">
              {campaign.status}
            </Badge>
          </div>

          {/* Quick Status Controls */}
          {validTransitions.length > 0 && (
            <div className="flex items-center gap-1.5 bg-card p-1.5 border rounded-lg shadow-sm">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2">Transition To</span>
              {validTransitions.map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant="outline"
                  className="capitalize text-xs h-7 py-1 px-2.5 cursor-pointer shadow-sm"
                  onClick={() => handleStatusTransition(st)}
                >
                  {st}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border/60">
        {['overview', 'content', 'contacts', 'tasks', 'metrics'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all capitalize cursor-pointer ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left Card: Overview display / edit */}
            <Card className="md:col-span-2 border border-border/80 bg-card">
              <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Campaign Overview
                </CardTitle>
                {!editing && (
                  <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => setEditing(true)}>
                    <FileEdit className="h-3.5 w-3.5" /> Edit Details
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-5">
                {!editing ? (
                  <div className="space-y-5 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Objective</span>
                      <p className="text-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border whitespace-pre-wrap">
                        {campaign.objective}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 bg-muted/10 p-3 rounded-lg border border-border/30">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Timeline</span>
                        <div className="flex items-center gap-1.5 mt-1 text-foreground font-medium">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(campaign.startDate)} — {campaign.endDate ? formatDate(campaign.endDate) : 'Ongoing'}</span>
                        </div>
                      </div>

                      <div className="space-y-1 bg-muted/10 p-3 rounded-lg border border-border/30">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Allocated Budget</span>
                        <div className="flex items-center gap-1.5 mt-1 text-foreground font-semibold">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{formatBudget(campaign.budget)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channels</span>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {campaign.channel.map((ch) => (
                          <Badge key={ch} variant="outline" className="capitalize px-2.5 py-0.5 bg-muted/20 border-border/80 text-foreground">
                            {ch}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign Name</label>
                      <Input {...register('name')} />
                      {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Objective</label>
                      <textarea
                        {...register('objective')}
                        rows={4}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      {errors.objective && <p className="text-xs text-red-500">{errors.objective.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</label>
                        <Input type="date" {...register('startDate')} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Date</label>
                        <Input type="date" {...register('endDate')} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget ($)</label>
                      <Input type="number" step="0.01" {...register('budget', { valueAsNumber: true })} />
                      {errors.budget && <p className="text-xs text-red-500">{errors.budget.message}</p>}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={!isDirty}>
                        Save Changes
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Right Card: Quick stats summary */}
            <Card className="border border-border/80 bg-card">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Campaign Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/10">
                  <div className="text-xs text-muted-foreground">Content Items</div>
                  <Badge variant="secondary" className="font-semibold text-sm">{contentItems.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/10">
                  <div className="text-xs text-muted-foreground">Attached Contacts</div>
                  <Badge variant="secondary" className="font-semibold text-sm">{contacts.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/10">
                  <div className="text-xs text-muted-foreground">Logged Metrics</div>
                  <Badge variant="secondary" className="font-semibold text-sm">{metrics.length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <Card className="border border-border/80 bg-card p-5">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">Attached Content Items</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setIsAttachContentOpen(true)}>
                  <LinkIcon className="h-4 w-4" /> Attach Existing
                </Button>
                <Link href={`/content?campaignId=${campaignId}`} passHref>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" /> Create New Content
                  </Button>
                </Link>
              </div>
            </div>

            {contentItems.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-8 w-8 text-muted-foreground/35 mx-auto" />
                <h4 className="mt-2 text-xs font-semibold text-foreground">No content items attached</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Attach content to enable transitioning to Active.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border/80 overflow-hidden bg-card">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caption / Title</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/10 border-b border-border/40">
                        <TableCell className="capitalize text-xs font-semibold">{item.platform}</TableCell>
                        <TableCell className="capitalize text-xs">{item.type.replace('_', ' ')}</TableCell>
                        <TableCell className="text-xs font-medium max-w-sm truncate">{item.caption || item.body || <span className="text-muted-foreground/50">—</span>}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize text-[10px] px-2 py-0">{item.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50/10 dark:hover:bg-red-950/10"
                            onClick={() => handleDetachContent(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Attach Content Dialog */}
            <Dialog open={isAttachContentOpen} onOpenChange={setIsAttachContentOpen}>
              <DialogContent className="sm:max-w-[475px]">
                <DialogHeader>
                  <DialogTitle>Attach Existing Content</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2 max-h-[300px] overflow-y-auto pr-1">
                  {loadingContent ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">Loading content items...</div>
                  ) : allContentItems.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">No available content items to attach.</div>
                  ) : (
                    allContentItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg bg-muted/20">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold capitalize">{item.platform} • {item.type.replace('_', ' ')}</span>
                          <span className="text-[10px] text-muted-foreground max-w-xs truncate">{item.caption || item.body || 'No text'}</span>
                        </div>
                        <Button size="sm" onClick={() => handleAttachContent(item.id)}>
                          Attach
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAttachContentOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        )}

        {/* CONTACTS TAB */}
        {activeTab === 'contacts' && (
          <Card className="border border-border/80 bg-card p-5">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">Attached Contacts</h3>
              <Button size="sm" className="gap-1" onClick={() => setIsAttachContactOpen(true)}>
                <UserPlus className="h-4 w-4" /> Attach Contact
              </Button>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-8 w-8 text-muted-foreground/35 mx-auto" />
                <h4 className="mt-2 text-xs font-semibold text-foreground">No contacts attached</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Link contacts to track targets or referrers.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border/80 overflow-hidden bg-card">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organization</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map(({ contact, role }) => (
                      <TableRow key={contact.id} className="hover:bg-muted/10 border-b border-border/40">
                        <TableCell className="text-xs font-semibold text-foreground">{contact.name}</TableCell>
                        <TableCell className="text-xs">{contact.organization || <span className="text-muted-foreground/45">—</span>}</TableCell>
                        <TableCell className="text-xs">{contact.email || <span className="text-muted-foreground/45">—</span>}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-[10px] px-2 py-0 border-primary/40 bg-primary/5 text-primary">
                            {role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50/10 dark:hover:bg-red-950/10"
                            onClick={() => handleDetachContact(contact.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Attach Contact Dialog */}
            <Dialog open={isAttachContactOpen} onOpenChange={setIsAttachContactOpen}>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle>Attach CRM Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {loadingContacts ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">Loading contacts...</div>
                  ) : allContacts.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">No available contacts to link.</div>
                  ) : (
                    <>
                      {/* Select Contact */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Contact</label>
                        <select
                          value={selectedContactId}
                          onChange={(e) => setSelectedContactId(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {allContacts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.organization ? `(${c.organization})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Select Role */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign Role</label>
                        <select
                          value={selectedContactRole}
                          onChange={(e) => setSelectedContactRole(e.target.value as CampaignContactRole)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="target">Target (Leads/Prospects)</option>
                          <option value="participant">Participant (Joined / Signed Up)</option>
                          <option value="referrer">Referrer (Affiliates/Partners)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAttachContactOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={handleAttachContact} disabled={allContacts.length === 0}>
                    Link Contact
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <Card className="border border-border/80 bg-card p-5">
            <TaskBoard campaignId={campaignId} />
          </Card>
        )}

        {/* METRICS TAB */}
        {activeTab === 'metrics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left Card: Record Metric Form */}
            <Card className="border border-border/80 bg-card">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Record Campaign Metric
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-5">
                <form onSubmit={handleRecordMetric} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metric Type</label>
                    <select
                      value={metricName}
                      onChange={(e) => setMetricName(e.target.value as CampaignMetricName)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none"
                    >
                      <option value="reach">Reach</option>
                      <option value="clicks">Clicks</option>
                      <option value="conversions">Conversions</option>
                      <option value="signups">Signups</option>
                      <option value="revenue">Revenue ($)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Value</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 500"
                      value={metricValue}
                      onChange={(e) => setMetricValue(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={recordingMetric}>
                    {recordingMetric ? 'Recording...' : 'Record Metric'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Right Card: Performance Chart + Log Table */}
            <Card className="md:col-span-2 border border-border/80 bg-card p-5 space-y-6">
              <div>
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Campaign Performance Chart</h3>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">Aggregated Metrics</Badge>
                </div>

                {chartData.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/35 mx-auto" />
                    <h4 className="mt-2 text-xs font-semibold text-foreground">No metrics recorded yet</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Use the form on the left to record campaign performance.</p>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <ChartTooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                          labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                          itemStyle={{ fontSize: '11px' }}
                        />
                        <ChartLegend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                        <Line type="monotone" dataKey="reach" name="Reach" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#818cf8" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="conversions" name="Conversions" stroke="#fb7185" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#34d399" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recorded Metrics Log</h3>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">Immutable Audit Trail</Badge>
                </div>

                {metrics.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No individual logs recorded yet.
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/80 overflow-hidden bg-card max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-muted/40 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metric</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Value</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recorded At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metrics.map((metric) => (
                          <TableRow key={metric.id} className="hover:bg-muted/10 border-b border-border/40">
                            <TableCell className="capitalize text-xs font-semibold flex items-center gap-1.5">
                              {metric.metricName === 'revenue' ? (
                                <DollarSign className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Activity className="h-3.5 w-3.5 text-blue-500" />
                              )}
                              {metric.metricName}
                            </TableCell>
                            <TableCell className="text-xs font-medium">
                              {metric.metricName === 'revenue'
                                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metric.value)
                                : new Intl.NumberFormat('en-US').format(metric.value)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-[10px] px-2 py-0 border-border/60">
                                {metric.source}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(metric.recordedAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
