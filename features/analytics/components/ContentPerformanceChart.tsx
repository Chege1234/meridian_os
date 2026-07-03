'use client';

/**
 * Feature Component — ContentPerformanceChart
 *
 * Visualizes editorial flow, volume by platform/author, and stages duration.
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
  Legend,
  Cell,
} from 'recharts';
import type { ContentPerformance } from '@/domain/repositories';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';

interface ContentPerformanceChartProps {
  data: ContentPerformance | null;
  loading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  review: '#f59e0b',
  approved: '#3b82f6',
  scheduled: '#8b5cf6',
  published: '#10b981',
  archived: '#64748b',
};

export function ContentPerformanceChart({ data, loading }: ContentPerformanceChartProps) {
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
        <p className="text-sm font-medium">No content data found for the selected range.</p>
      </div>
    );
  }

  const funnelData = [
    { name: 'Draft', value: data.funnel.draft },
    { name: 'Review', value: data.funnel.review },
    { name: 'Approved', value: data.funnel.approved },
    { name: 'Scheduled', value: data.funnel.scheduled },
    { name: 'Published', value: data.funnel.published },
  ];

  const totalContent = funnelData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      {/* Visual stats and charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel chart */}
        <Card className="border-slate-800 bg-slate-950/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-200">Content Funnel Stage Counts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="value" name="Items Count" radius={[4, 4, 0, 0]}>
                    {funnelData.map((entry, index) => {
                      const colorKey = entry.name.toLowerCase();
                      return <Cell key={`cell-${index}`} fill={STATUS_COLORS[colorKey] || '#3b82f6'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform breakdown */}
        <Card className="border-slate-800 bg-slate-950/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-200">Volume by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            {data.byPlatform.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-slate-500 text-xs">No platform data.</div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byPlatform} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis dataKey="platform" type="category" stroke="#64748b" fontSize={11} tickLine={false} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="count" name="Count" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Aging Table */}
      <Card className="border-slate-800 bg-slate-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-200">Content Aging & Review Times (Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.aging.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-slate-500 text-xs">No aging timeline data available.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-slate-850">
                  <TableRow>
                    <TableHead className="text-slate-400 text-xs font-semibold">Content Item</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold">Platform</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold text-right">In Draft</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold text-right">In Review</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold text-right">Approved</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold text-right">Scheduled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.aging.map((row) => (
                    <TableRow key={row.contentItemId} className="border-slate-900 hover:bg-slate-900/10">
                      <TableCell className="text-slate-300 font-medium text-xs max-w-xs truncate">{row.title}</TableCell>
                      <TableCell className="text-slate-400 text-xs capitalize">{row.platform}</TableCell>
                      <TableCell className="text-slate-300 text-xs text-right">{row.timeInDraftHours} hrs</TableCell>
                      <TableCell className="text-amber-500 text-xs text-right font-medium">{row.timeInReviewHours} hrs</TableCell>
                      <TableCell className="text-slate-300 text-xs text-right">{row.timeInApprovedHours} hrs</TableCell>
                      <TableCell className="text-slate-300 text-xs text-right">{row.timeInScheduledHours} hrs</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
