'use client';

/**
 * Feature Component — SavedReportsView
 *
 * Handles creation, listing, execution, and CSV export of saved reports.
 */

import React, { useState } from 'react';
import type { SavedReport, ReportType } from '@/domain/entities';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { FileSpreadsheet, Play, Trash2, Plus, Filter, RefreshCw } from 'lucide-react';

interface SavedReportsViewProps {
  reports: SavedReport[];
  onCreateReport: (name: string, type: ReportType, filters: any) => Promise<void>;
  onDeleteReport: (id: string) => Promise<void>;
  onRunReport: (id: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  dateRange: { startDate: string; endDate: string };
}

const REPORT_TYPES: { type: ReportType; label: string; desc: string }[] = [
  { type: 'campaign_performance', label: 'Campaign Performance', desc: 'Reach, clicks, conversions, and revenue aggregates.' },
  { type: 'content_performance', label: 'Content Performance', desc: 'Volume by platform, funnel status, and editing review times.' },
  { type: 'crm_activity', label: 'CRM Activity Summary', desc: 'Contact signups, interactions breakdown, and task completions.' },
  { type: 'ai_usage_cost', label: 'AI Usage & Cost', desc: 'Operation token count and financial aggregates.' },
];

export function SavedReportsView({ reports, onCreateReport, onDeleteReport, onRunReport, dateRange }: SavedReportsViewProps) {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<SavedReport | null>(null);
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // New report form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ReportType>('campaign_performance');
  const [creating, setCreating] = useState(false);

  const handleRun = async (report: SavedReport) => {
    setRunningId(report.id);
    setActiveReport(report);
    setReportData(null);
    try {
      const res = await onRunReport(report.id);
      if (res.success && res.data) {
        // Flatten the data if it is content_performance (it returns an object, not an array)
        if (report.reportType === 'content_performance') {
          // Flatten aging table data as main list
          setReportData(res.data.aging || []);
        } else if (report.reportType === 'crm_activity') {
          // Turn the object into key-value array for rendering
          const summary = res.data;
          setReportData([
            { Metric: 'Contacts Created', Value: summary.contactsCreated },
            { Metric: 'Task Completion Rate', Value: `${Math.round(summary.taskCompletionRate * 100)}%` },
            { Metric: 'Tasks Completed', Value: `${summary.tasksCompleted} / ${summary.tasksTotal}` },
            ...summary.interactionsByType.map((item: any) => ({
              Metric: `Interaction: ${item.type}`,
              Value: item.count,
            })),
          ]);
        } else {
          setReportData(res.data);
        }
      } else {
        alert(res.error || 'Failed to run report.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while running the report.');
    } finally {
      setRunningId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      // Save current dateRange into filters
      await onCreateReport(newName, newType, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      setNewName('');
      setShowCreate(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create report.');
    } finally {
      setCreating(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0 || !activeReport) return;

    const headers = Object.keys(reportData[0]);
    const csvRows = [headers.join(',')];

    reportData.forEach((row) => {
      const values = headers.map((header) => {
        const val = row[header];
        const stringified = typeof val === 'object' ? JSON.stringify(val) : String(val);
        const escaped = stringified.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeReport.name.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel: Saved Reports List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Saved Report Queries</h3>
          <Button
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            className="bg-slate-900 border border-slate-800 text-xs text-sky-400 hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Report
          </Button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="border border-slate-800 bg-slate-950 p-4 rounded-lg space-y-4">
            <div>
              <label htmlFor="report-name" className="block text-xs font-semibold text-slate-400 mb-1">
                Report Name
              </label>
              <Input
                id="report-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Content Funnel Q2"
                className="h-8 border-slate-800 bg-slate-900/40 text-xs text-slate-200"
                required
              />
            </div>
            <div>
              <label htmlFor="report-type" className="block text-xs font-semibold text-slate-400 mb-1">
                Report Type
              </label>
              <select
                id="report-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value as ReportType)}
                className="w-full rounded-md border border-slate-800 bg-slate-900 text-xs text-slate-200 p-2 focus:outline-none"
              >
                {REPORT_TYPES.map((opt) => (
                  <option key={opt.type} value={opt.type}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreate(false)}
                className="text-xs text-slate-400"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={creating} className="bg-sky-600 text-xs text-white">
                {creating ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {reports.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-slate-900 text-slate-500 text-xs">
              No saved reports. Generate and save reports to run them regularly.
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                  activeReport?.id === report.id
                    ? 'border-sky-500 bg-sky-950/10'
                    : 'border-slate-850 bg-slate-900/20 hover:border-slate-800'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 truncate">{report.name}</div>
                  <div className="text-[10px] text-slate-500 capitalize mt-0.5">
                    {report.reportType.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-sky-400 hover:bg-slate-800/60"
                    onClick={() => handleRun(report)}
                    disabled={runningId === report.id}
                    title="Run Report"
                  >
                    {runningId === report.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5 fill-current" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-rose-500 hover:bg-rose-950/20 hover:text-rose-400"
                    onClick={() => onDeleteReport(report.id)}
                    title="Delete Saved Report"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Active Report Results */}
      <div className="lg:col-span-2 space-y-4">
        {activeReport ? (
          <Card className="border-slate-800 bg-slate-950/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-900">
              <div>
                <CardTitle className="text-base font-semibold text-slate-200">{activeReport.name}</CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Type: <span className="capitalize">{activeReport.reportType.replace('_', ' ')}</span> | Target Range:{' '}
                  {dateRange.startDate} to {dateRange.endDate}
                </p>
              </div>

              {reportData && reportData.length > 0 && (
                <Button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white flex items-center gap-1.5 h-8"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {runningId === activeReport.id ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500" />
                </div>
              ) : reportData ? (
                reportData.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-slate-500 text-xs">
                    No matching records found for the filters and date range.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96">
                    <Table>
                      <TableHeader className="border-slate-850 sticky top-0 bg-slate-950 z-10">
                        <TableRow>
                          {Object.keys(reportData[0]).map((header) => (
                            <TableHead key={header} className="text-slate-400 text-xs font-semibold capitalize">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((row, idx) => (
                          <TableRow key={idx} className="border-slate-900 hover:bg-slate-900/10">
                            {Object.keys(row).map((header) => (
                              <TableCell key={header} className="text-slate-300 text-xs">
                                {typeof row[header] === 'number' && header.toLowerCase().includes('cost')
                                  ? `$${row[header].toFixed(4)}`
                                  : String(row[header])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-900 rounded-lg">
                  Click the Play button on the left to run this saved report layout.
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex h-96 flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg bg-slate-950/10">
            <Filter className="h-8 w-8 text-slate-600 mb-2" />
            <p className="font-semibold text-slate-400">No Report Selected</p>
            <p className="text-[11px] text-slate-500 mt-1">Select an existing report from the list or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
