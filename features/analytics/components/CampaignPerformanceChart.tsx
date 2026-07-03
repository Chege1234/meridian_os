'use client';

/**
 * Feature Component — CampaignPerformanceChart
 *
 * Visualizes reach, clicks, conversions, and revenue metrics over time using Recharts.
 */

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { CampaignPerformanceMetric } from '@/domain/repositories';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';

interface CampaignPerformanceChartProps {
  data: CampaignPerformanceMetric[];
  loading: boolean;
  campaignId?: string | null;
}

export function CampaignPerformanceChart({ data, loading, campaignId }: CampaignPerformanceChartProps) {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400">
        <p className="text-sm font-medium">No performance data found for the selected range.</p>
        <p className="text-xs text-slate-500 mt-1">Try selecting a broader date range or recording campaign metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800/80 bg-slate-950/40">
          <CardContent className="pt-4">
            <div className="text-xs text-slate-400 font-medium">Total Reach</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {data.reduce((sum, item) => sum + item.reach, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800/80 bg-slate-950/40">
          <CardContent className="pt-4">
            <div className="text-xs text-slate-400 font-medium">Total Clicks</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {data.reduce((sum, item) => sum + item.clicks, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800/80 bg-slate-950/40">
          <CardContent className="pt-4">
            <div className="text-xs text-slate-400 font-medium">Conversions</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {data.reduce((sum, item) => sum + item.conversions, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800/80 bg-slate-950/40">
          <CardContent className="pt-4">
            <div className="text-xs text-slate-400 font-medium">Total Revenue</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              ${data.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-80 w-full rounded-lg border border-slate-800 bg-slate-950/30 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
              labelStyle={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
            <Line type="monotone" dataKey="reach" name="Reach" stroke="#38bdf8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#818cf8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="conversions" name="Conversions" stroke="#fb7185" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
