'use client';

/**
 * Feature Component â€” AnalyticsDashboard
 *
 * Tying together Personal Dashboards (widgets grid + customizer) and Saved Reports.
 * Manages date ranges, active dashboard layouts, loading states, and mutations.
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Dashboard, SavedReport, ReportType, DashboardWidget } from '@/domain/entities';
import { DateRangePicker, type DateRange } from '@/shared/components/DateRangePicker';
import { CampaignPerformanceChart } from './CampaignPerformanceChart';
import { ContentPerformanceChart } from './ContentPerformanceChart';
import { CrmPerformanceChart } from './CrmPerformanceChart';
import { AiCostChart } from './AiCostChart';
import { DashboardCustomizer } from './DashboardCustomizer';
import { SavedReportsView } from './SavedReportsView';
import { Button } from '@/shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { LayoutGrid, FileSpreadsheet, Settings, Trash2, RefreshCw } from 'lucide-react';
import {
  getCampaignPerformanceAction,
  getContentPerformanceAction,
  getCrmActivitySummaryAction,
  getAiUsageCostAction,
  getDashboardsAction,
  createDashboardAction,
  updateDashboardLayoutAction,
  deleteDashboardAction,
  getSavedReportsAction,
  saveReportAction,
  runSavedReportAction,
  deleteSavedReportAction,
} from '../actions';
import { getAutomationRunsAction } from '@/features/automation/actions';
import { getAgentRunsAction } from '@/features/agents/actions';
import Link from 'next/link';


const DEFAULT_RANGE: DateRange = {
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '', // 30 days ago
  endDate: new Date().toISOString().split('T')[0] ?? '',
};

export default function AnalyticsDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports'>('dashboard');
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGE);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [activeDashboard, setActiveDashboard] = useState<Dashboard | null>(null);
  const [savingLayout, setSavingLayout] = useState(false);

  // Fetch pending approvals counts
  const { data: autoRes } = useQuery({
    queryKey: ['automationRuns', 'pending_approval'],
    queryFn: () => getAutomationRunsAction({ status: 'pending_approval' }),
    staleTime: 30000, // 30 secs
  });

  const { data: agentRes } = useQuery({
    queryKey: ['agentRuns', 'pending_approval'],
    queryFn: () => getAgentRunsAction({ status: 'pending_approval' }),
    staleTime: 30000, // 30 secs
  });

  const pendingAutosCount = autoRes?.success && autoRes.runs ? autoRes.runs.length : 0;
  const pendingAgentsCount = agentRes?.success && agentRes.runs ? agentRes.runs.length : 0;

  // Load Dashboards & Reports Lists on Mount
  const { data: dRes } = useQuery({
    queryKey: ['dashboards'],
    queryFn: () => getDashboardsAction(),
    staleTime: 60000, // 1 min
  });

  const { data: rRes } = useQuery({
    queryKey: ['savedReports'],
    queryFn: () => getSavedReportsAction(),
    staleTime: 60000, // 1 min
  });

  const dashboards = dRes?.success && dRes.dashboards ? dRes.dashboards : [];
  const reports = rRes?.success && rRes.savedReports ? rRes.savedReports : [];

  useEffect(() => {
    if (dashboards.length > 0 && !activeDashboard) {
      setActiveDashboard(dashboards[0] ?? null);
    }
  }, [dashboards, activeDashboard]);

  // Fetch Aggregated Metrics when Date Range or Active Dashboard changes
  const { data: metricsData, isLoading: loadingData } = useQuery({
    queryKey: ['analyticsMetrics', { dateRange, activeDashboardId: activeDashboard?.id }],
    queryFn: async () => {
      const [campRes, contRes, crmRes, aiRes] = await Promise.all([
        getCampaignPerformanceAction({
          campaignId: null,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
        getContentPerformanceAction({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          platform: null,
          status: null,
        }),
        getCrmActivitySummaryAction({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
        getAiUsageCostAction({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          provider: null,
        }),
      ]);
      return {
        campaignData: campRes.success && 'data' in campRes && campRes.data ? campRes.data : [],
        contentData: contRes.success && 'data' in contRes && contRes.data ? contRes.data : null,
        crmData: crmRes.success && 'data' in crmRes && crmRes.data ? crmRes.data : null,
        aiData: aiRes.success && 'data' in aiRes && aiRes.data ? aiRes.data : [],
      };
    },
    staleTime: 30000, // 30 secs
  });

  const campaignData = metricsData?.campaignData || [];
  const contentData = metricsData?.contentData || null;
  const crmData = metricsData?.crmData || null;
  const aiData = metricsData?.aiData || [];

  // Dashboard Operations
  const handleSaveLayout = async (name: string, widgets: DashboardWidget[]) => {
    setSavingLayout(true);
    try {
      if (activeDashboard) {
        // Update
        const res = await updateDashboardLayoutAction({
          id: activeDashboard.id,
          name,
          layout: widgets,
        });
        if (res.success && 'dashboard' in res && res.dashboard) {
          setActiveDashboard(res.dashboard);
          queryClient.invalidateQueries({ queryKey: ['dashboards'] });
        } else {
          alert(res.error || 'Failed to update layout.');
        }
      } else {
        // Create
        const res = await createDashboardAction({ name, layout: widgets });
        if (res.success && 'dashboard' in res && res.dashboard) {
          setActiveDashboard(res.dashboard);
          queryClient.invalidateQueries({ queryKey: ['dashboards'] });
        } else {
          alert(res.error || 'Failed to create dashboard.');
        }
      }
      setIsCustomizing(false);
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving layout.');
    } finally {
      setSavingLayout(false);
    }
  };

  const handleDeleteDashboard = async () => {
    if (!activeDashboard) return;
    if (!confirm('Are you sure you want to delete this dashboard?')) return;

    try {
      const res = await deleteDashboardAction(activeDashboard.id);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['dashboards'] });
        const filtered = dashboards.filter((d) => d.id !== activeDashboard.id);
        setActiveDashboard(filtered.length > 0 ? filtered[0] ?? null : null);
      } else {
        alert(res.error || 'Failed to delete dashboard.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while deleting dashboard.');
    }
  };

  // Report Operations
  const handleCreateReport = async (name: string, type: ReportType, filters: any) => {
    try {
      const res = await saveReportAction({ name, reportType: type, filters });
      if (res.success && 'savedReport' in res && res.savedReport) {
        queryClient.invalidateQueries({ queryKey: ['savedReports'] });
      } else {
        throw new Error(res.error || 'Failed to save report.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved report?')) return;
    try {
      const res = await deleteSavedReportAction(id);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['savedReports'] });
      } else {
        alert(res.error || 'Failed to delete report.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunReport = async (id: string) => {
    return await runSavedReportAction(id);
  };

  // Get active layout or fall back to default seeded layout if none exists
  const activeLayout: DashboardWidget[] = activeDashboard?.layout || [
    { id: 'w1', type: 'campaign_performance', title: 'Campaign Performance Graph', position: 0, filters: {} },
    { id: 'w2', type: 'content_funnel', title: 'Content Pipeline Funnel', position: 1, filters: {} },
    { id: 'w3', type: 'crm_summary', title: 'CRM Activity Summary', position: 2, filters: {} },
    { id: 'w4', type: 'ai_cost', title: 'AI LLM Operations Cost', position: 3, filters: {} },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      {/* â”€â”€ Page header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
            Meridian OS
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-mer-text">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-mer-muted">
            Realtime reporting, cost aggregations, and metrics across all modules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dashboard selector */}
          {activeTab === 'dashboard' && !isCustomizing && dashboards.length > 0 && (
            <select
              value={activeDashboard?.id || ''}
              onChange={(e) =>
                setActiveDashboard(dashboards.find((d) => d.id === e.target.value) || null)
              }
              className="rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.7)] px-3 py-1.5 text-xs text-mer-text outline-none focus:border-[var(--mer-border-hover)]"
            >
              {dashboards.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.isShared ? '(Shared)' : ''}
                </option>
              ))}
            </select>
          )}

          <DateRangePicker value={dateRange} onChange={setDateRange} />

          {activeTab === 'dashboard' && !isCustomizing && (
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCustomizing(true)}
                title="Customize widgets"
              >
                <Settings className="h-4 w-4" />
              </Button>
              {activeDashboard && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDeleteDashboard}
                  title="Delete dashboard"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex gap-1 rounded-xl border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.6)] p-1 w-fit backdrop-blur-sm">
        {([
          { key: 'dashboard', label: 'Dashboard View', icon: LayoutGrid },
          { key: 'reports',   label: 'Saved Reports',  icon: FileSpreadsheet },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              if (key === 'dashboard') setIsCustomizing(false);
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === key
                ? 'bg-[rgba(77,216,255,0.12)] text-mer-cyan border border-[rgba(77,216,255,0.25)] shadow-[0_0_8px_rgba(77,216,255,0.15)]'
                : 'text-mer-muted hover:text-mer-text'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* â”€â”€ Main content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'dashboard' ? (
        isCustomizing ? (
          <DashboardCustomizer
            currentDashboard={activeDashboard}
            onSaveLayout={handleSaveLayout}
            onCancel={() => setIsCustomizing(false)}
            saving={savingLayout}
          />
        ) : (
          <div className="space-y-4">
            {/* Pending approvals alert */}
            {(pendingAutosCount > 0 || pendingAgentsCount > 0) && (
              <div className="flex flex-col gap-4 rounded-[16px] border border-[rgba(232,169,60,0.25)] bg-[rgba(232,169,60,0.06)] p-4 backdrop-blur-md md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(232,169,60,0.15)]">
                    <Settings className="h-4 w-4 animate-spin text-mer-amber" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-mer-amber">
                      Pending Approvals Queue
                    </p>
                    <p className="text-xs text-mer-muted mt-0.5">
                      {pendingAutosCount} rule-based run{pendingAutosCount !== 1 ? 's' : ''} and{' '}
                      {pendingAgentsCount} agent-proposed run{pendingAgentsCount !== 1 ? 's' : ''} awaiting confirmation.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {pendingAutosCount > 0 && (
                    <Link
                      href="/automation"
                      className="rounded-xl border border-[rgba(232,169,60,0.3)] bg-[rgba(232,169,60,0.12)] px-4 py-1.5 text-xs font-semibold text-mer-amber transition-colors hover:bg-[rgba(232,169,60,0.2)]"
                    >
                      Review Automations
                    </Link>
                  )}
                  {pendingAgentsCount > 0 && (
                    <Link
                      href="/agents"
                      className="rounded-xl border border-[rgba(232,169,60,0.3)] bg-[rgba(232,169,60,0.12)] px-4 py-1.5 text-xs font-semibold text-mer-amber transition-colors hover:bg-[rgba(232,169,60,0.2)]"
                    >
                      Review AI Agents
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Widget grid â€” each widget in a glass panel */}
            <div className="grid grid-cols-1 gap-4">
              {activeLayout
                .sort((a, b) => a.position - b.position)
                .map((widget) => (
                  <div
                    key={widget.id}
                    className="relative overflow-hidden rounded-[16px] border border-[var(--mer-border-glow)] bg-[var(--mer-surface)] backdrop-blur-md transition-all duration-300 hover:border-[var(--mer-border-hover)] hover:shadow-[0_0_24px_var(--mer-glow-cyan)]"
                  >
                    {/* Widget header */}
                    <div className="flex items-center justify-between border-b border-[var(--mer-border-glow)] px-5 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
                        {widget.title}
                      </p>
                      <RefreshCw className="h-3 w-3 text-mer-muted/40" />
                    </div>

                    {/* Widget content */}
                    <div className="p-5">
                      {widget.type === 'campaign_performance' && (
                        <CampaignPerformanceChart data={campaignData} loading={loadingData} />
                      )}
                      {widget.type === 'content_funnel' && (
                        <ContentPerformanceChart data={contentData} loading={loadingData} />
                      )}
                      {widget.type === 'crm_summary' && (
                        <CrmPerformanceChart data={crmData} loading={loadingData} />
                      )}
                      {widget.type === 'ai_cost' && (
                        <AiCostChart data={aiData} loading={loadingData} />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )
      ) : (
        <SavedReportsView
          reports={reports}
          onCreateReport={handleCreateReport}
          onDeleteReport={handleDeleteReport}
          onRunReport={handleRunReport}
          dateRange={dateRange}
        />
      )}
    </div>
  );
}
