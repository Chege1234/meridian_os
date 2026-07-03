'use client';

/**
 * Feature Component — AnalyticsDashboard
 *
 * Tying together Personal Dashboards (widgets grid + customizer) and Saved Reports.
 * Manages date ranges, active dashboard layouts, loading states, and mutations.
 */

import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports'>('dashboard');
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGE);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Dashboards & Reports List State
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<Dashboard | null>(null);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [savingLayout, setSavingLayout] = useState(false);

  // Aggregated Data State
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [contentData, setContentData] = useState<any>(null);
  const [crmData, setCrmData] = useState<any>(null);
  const [aiData, setAiData] = useState<any[]>([]);

  // Approvals State
  const [pendingAutosCount, setPendingAutosCount] = useState(0);
  const [pendingAgentsCount, setPendingAgentsCount] = useState(0);

  // Fetch pending approvals counts
  useEffect(() => {
    async function loadApprovals() {
      try {
        const autoRes = await getAutomationRunsAction({ status: 'pending_approval' });
        if (autoRes.success && autoRes.runs) {
          setPendingAutosCount(autoRes.runs.length);
        }
        const agentRes = await getAgentRunsAction({ status: 'pending_approval' });
        if (agentRes.success && agentRes.runs) {
          setPendingAgentsCount(agentRes.runs.length);
        }
      } catch (err) {
        console.warn('Failed to load pending approvals counts for analytics:', err);
      }
    }
    loadApprovals();
  }, []);


  // Load Dashboards & Reports Lists on Mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const dRes = await getDashboardsAction();
        if (dRes.success && dRes.dashboards) {
          setDashboards(dRes.dashboards);
          if (dRes.dashboards.length > 0) {
            setActiveDashboard(dRes.dashboards[0] ?? null);
          }
        }
        const rRes = await getSavedReportsAction();
        if (rRes.success && rRes.savedReports) {
          setReports(rRes.savedReports);
        }
      } catch (err) {
        console.error('Failed to load initial configurations:', err);
      }
    }
    loadConfig();
  }, []);

  // Fetch Aggregated Metrics when Date Range or Active Dashboard changes
  useEffect(() => {
    async function fetchData() {
      setLoadingData(true);
      try {
        // Fetch all metrics concurrently
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

        if (campRes.success && 'data' in campRes && campRes.data) setCampaignData(campRes.data);
        if (contRes.success && 'data' in contRes && contRes.data) setContentData(contRes.data);
        if (crmRes.success && 'data' in crmRes && crmRes.data) setCrmData(crmRes.data);
        if (aiRes.success && 'data' in aiRes && aiRes.data) setAiData(aiRes.data as any[]);
      } catch (err) {
        console.error('Failed to fetch analytics metrics:', err);
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [dateRange, activeDashboard]);

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
          setDashboards(dashboards.map((d) => (d.id === (res as any).dashboard!.id ? (res as any).dashboard! : d)));
        } else {
          alert(res.error || 'Failed to update layout.');
        }
      } else {
        // Create
        const res = await createDashboardAction({ name, layout: widgets });
        if (res.success && 'dashboard' in res && res.dashboard) {
          setActiveDashboard(res.dashboard);
          setDashboards([...dashboards, (res as any).dashboard]);
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
        const filtered = dashboards.filter((d) => d.id !== activeDashboard.id);
        setDashboards(filtered);
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
        setReports([...reports, (res as any).savedReport]);
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
        setReports(reports.filter((r) => r.id !== id));
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
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-100">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
            Operations Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Realtime reporting, cost aggregations, and business metrics across Meridian OS modules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dashboard Selector */}
          {activeTab === 'dashboard' && !isCustomizing && dashboards.length > 0 && (
            <select
              value={activeDashboard?.id || ''}
              onChange={(e) => setActiveDashboard(dashboards.find((d) => d.id === e.target.value) || null)}
              className="rounded-md border border-slate-800 bg-slate-950 text-xs text-slate-300 p-2 focus:outline-none"
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
                className="h-8 w-8 border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                title="Customize widgets"
              >
                <Settings className="h-4 w-4" />
              </Button>
              {activeDashboard && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteDashboard}
                  className="h-8 w-8 text-rose-500 hover:bg-rose-950/20 hover:text-rose-400"
                  title="Delete dashboard"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-900 gap-6">
        <Button
          variant="ghost"
          onClick={() => {
            setActiveTab('dashboard');
            setIsCustomizing(false);
          }}
          className={`pb-3 rounded-none border-b-2 text-xs font-semibold px-1 ${
            activeTab === 'dashboard'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="h-4 w-4 mr-1.5 inline-block align-text-bottom" />
          Dashboard View
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('reports')}
          className={`pb-3 rounded-none border-b-2 text-xs font-semibold px-1 ${
            activeTab === 'reports'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4 mr-1.5 inline-block align-text-bottom" />
          Saved Reports
        </Button>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'dashboard' ? (
        isCustomizing ? (
          <DashboardCustomizer
            currentDashboard={activeDashboard}
            onSaveLayout={handleSaveLayout}
            onCancel={() => setIsCustomizing(false)}
            saving={savingLayout}
          />
          <div className="grid grid-cols-1 gap-6">
            {(pendingAutosCount > 0 || pendingAgentsCount > 0) && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded text-amber-500 shrink-0">
                    <Settings className="h-5 w-5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-400">Pending Approvals Queue</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      You have {pendingAutosCount} rule-based runs and {pendingAgentsCount} agent-proposed runs staged waiting for confirmation.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {pendingAutosCount > 0 && (
                    <Link
                      href="/automation"
                      className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-semibold"
                    >
                      Review Automations
                    </Link>
                  )}
                  {pendingAgentsCount > 0 && (
                    <Link
                      href="/agents"
                      className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-semibold"
                    >
                      Review AI Agents
                    </Link>
                  )}
                </div>
              </div>
            )}
            {/* Render Widgets Grid */}

            {activeLayout
              .sort((a, b) => a.position - b.position)
              .map((widget) => {
                return (
                  <Card key={widget.id} className="border-slate-800 bg-slate-950/40 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                        {widget.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
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
                    </CardContent>
                  </Card>
                );
              })}
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
