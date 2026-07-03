'use client';

/**
 * Feature Component — AiCostChart
 *
 * Displays AI provider token usage and estimated operation costs.
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
} from 'recharts';
import type { AiUsageCost } from '@/domain/repositories';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';

interface AiCostChartProps {
  data: AiUsageCost[];
  loading: boolean;
}

export function AiCostChart({ data, loading }: AiCostChartProps) {
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
        <p className="text-sm font-medium">No AI conversation/usage logs found for the selected range.</p>
      </div>
    );
  }

  const totalCost = data.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalTokens = data.reduce((sum, item) => sum + item.totalTokens, 0);
  const totalConversations = data.reduce((sum, item) => sum + item.totalConversations, 0);

  // Group by provider for a small summary chart
  const providerSummary: Record<string, { name: string; cost: number; tokens: number }> = {};
  data.forEach((item) => {
    const prov = item.provider;
    if (!providerSummary[prov]) {
      providerSummary[prov] = { name: prov, cost: 0, tokens: 0 };
    }
    providerSummary[prov].cost += item.estimatedCost;
    providerSummary[prov].tokens += item.totalTokens;
  });

  const chartData = Object.values(providerSummary).map((item) => ({
    name: item.name.toUpperCase(),
    cost: parseFloat(item.cost.toFixed(4)),
    tokens: item.tokens,
  }));

  return (
    <div className="space-y-6">
      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-800 bg-slate-950/20">
          <CardContent className="pt-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estimated Total Spend</div>
            <div className="text-3xl font-extrabold text-rose-400 mt-2">${totalCost.toFixed(4)}</div>
            <p className="text-[11px] text-slate-500 mt-1">Based on token tracking variables</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-950/20">
          <CardContent className="pt-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Tokens Consumed</div>
            <div className="text-3xl font-extrabold text-slate-100 mt-2">{totalTokens.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">Prompt and Completion tokens combined</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-950/20">
          <CardContent className="pt-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total AI Interactions</div>
            <div className="text-3xl font-extrabold text-sky-400 mt-2">{totalConversations}</div>
            <p className="text-[11px] text-slate-500 mt-1">Logged requests to prompt libraries</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid for Table and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost by Provider Chart */}
        <Card className="border-slate-800 bg-slate-950/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-200">Cost by Provider ($)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="cost" name="Cost ($)" fill="#fb7185" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Logs table */}
        <Card className="border-slate-800 bg-slate-950/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-200">AI Cost Breakdown by Model & Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto h-64 overflow-y-auto">
              <Table>
                <TableHeader className="border-slate-850 sticky top-0 bg-slate-950 z-10">
                  <TableRow>
                    <TableHead className="text-slate-400 text-xs font-semibold">User</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold">Model</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold">Prompt Reference</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold text-right">Tokens</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, idx) => (
                    <TableRow key={idx} className="border-slate-900 hover:bg-slate-900/10">
                      <TableCell className="text-slate-300 font-medium text-xs">{row.userName}</TableCell>
                      <TableCell className="text-slate-400 text-xs capitalize">{row.model} ({row.provider})</TableCell>
                      <TableCell className="text-slate-300 text-xs max-w-[120px] truncate">{row.promptTitle}</TableCell>
                      <TableCell className="text-slate-300 text-xs text-right">{row.totalTokens.toLocaleString()}</TableCell>
                      <TableCell className="text-rose-400 text-xs text-right font-medium">${row.estimatedCost.toFixed(5)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
