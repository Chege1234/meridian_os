'use client';

/**
 * Feature Component — CrmPerformanceChart
 *
 * Displays CRM activity cards and interaction type distributions.
 */

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { CrmActivitySummary } from '@/domain/repositories';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';

interface CrmPerformanceChartProps {
  data: CrmActivitySummary | null;
  loading: boolean;
}

export function CrmPerformanceChart({ data, loading }: CrmPerformanceChartProps) {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-80 flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400">
        <p className="text-sm font-medium">No CRM activity data found for the selected range.</p>
      </div>
    );
  }

  const completionPercent = Math.round(data.taskCompletionRate * 100);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-800 bg-slate-950/20">
          <CardContent className="pt-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Contacts</div>
            <div className="text-3xl font-extrabold text-slate-100 mt-2">{data.contactsCreated}</div>
            <p className="text-[11px] text-slate-500 mt-1">Created within selected date range</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-950/20">
          <CardContent className="pt-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Task Completion Rate</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-sky-400">{completionPercent}%</span>
              <span className="text-slate-500 text-xs">({data.tasksCompleted}/{data.tasksTotal})</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-sky-400 h-1.5 rounded-full"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-950/20">
          <CardContent className="pt-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Interactions</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">
              {data.interactionsByType.reduce((sum, item) => sum + item.count, 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Interactions logged by type</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactions Chart */}
      <Card className="border-slate-800 bg-slate-950/20">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-200">Interactions by Communication Type</CardTitle>
        </CardHeader>
        <CardContent>
          {data.interactionsByType.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-slate-500 text-xs">No interactions logged.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.interactionsByType} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="type" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Logged Interactions" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
