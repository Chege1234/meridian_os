'use client';

/**
 * Performance Analytics
 *
 * Recharts area/line chart with 1D / 1W / 1M / 3M period tabs.
 * Uses a cyan gradient fill under the curve matching the HUD aesthetic.
 */

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/shared/lib/utils';

// ─── Mock data per period ───────────────────────────────────────────────────

const DATA_1D = [
  { label: '00:00', value: 38 },
  { label: '03:00', value: 42 },
  { label: '06:00', value: 35 },
  { label: '09:00', value: 55 },
  { label: '12:00', value: 68 },
  { label: '15:00', value: 74 },
  { label: '18:00', value: 82 },
  { label: '21:00', value: 76 },
  { label: '24:00', value: 71 },
];

const DATA_1W = [
  { label: 'SAT',  value: 45 },
  { label: 'SUN',  value: 38 },
  { label: 'MON',  value: 52 },
  { label: 'TUE',  value: 61 },
  { label: 'WED',  value: 55 },
  { label: 'THU',  value: 74 },
  { label: 'FRI',  value: 82 },
];

const DATA_1M = [
  { label: 'W1', value: 48 },
  { label: 'W2', value: 55 },
  { label: 'W3', value: 63 },
  { label: 'W4', value: 71 },
];

const DATA_3M = [
  { label: 'Jan', value: 52 },
  { label: 'Feb', value: 59 },
  { label: 'Mar', value: 68 },
  { label: 'Apr', value: 74 },
  { label: 'May', value: 82 },
  { label: 'Jun', value: 78 },
];

const PERIODS = [
  { key: '1D', data: DATA_1D },
  { key: '1W', data: DATA_1W },
  { key: '1M', data: DATA_1M },
  { key: '3M', data: DATA_3M },
] as const;

type Period = (typeof PERIODS)[number]['key'];

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[rgba(77,216,255,0.25)] bg-[rgba(7,12,22,0.92)] px-3 py-2 text-xs backdrop-blur-md">
      <p className="text-mer-muted">{label}</p>
      <p className="font-bold text-mer-cyan">{payload[0]?.value}%</p>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PerformanceAnalytics() {
  const [period, setPeriod] = useState<Period>('1W');
  const active = PERIODS.find((p) => p.key === period)!;
  const peak = Math.max(...active.data.map((d) => d.value));

  return (
    <div className="flex h-full flex-col">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
          Performance Analytics
        </p>
        <div className="flex items-center gap-0.5 rounded-lg border border-[var(--mer-border-glow)] bg-[rgba(7,12,22,0.5)] p-0.5">
          {PERIODS.map(({ key }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200',
                period === key
                  ? 'bg-[rgba(77,216,255,0.18)] text-mer-cyan shadow-[0_0_8px_rgba(77,216,255,0.25)]'
                  : 'text-mer-muted hover:text-mer-text',
              )}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={active.data}
            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id="perf-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4DD8FF" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#4DD8FF" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(77,216,255,0.08)"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              tick={{ fill: '#8B9BB8', fontSize: 9, fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: '#8B9BB8', fontSize: 9, fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(77,216,255,0.3)', strokeWidth: 1 }} />

            {/* Peak reference line */}
            <ReferenceLine
              y={peak}
              stroke="rgba(77,216,255,0.4)"
              strokeDasharray="3 3"
              label={{
                value: `${peak}%`,
                position: 'right',
                fill: '#4DD8FF',
                fontSize: 9,
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#4DD8FF"
              strokeWidth={2}
              fill="url(#perf-gradient)"
              dot={{ fill: '#4DD8FF', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#4DD8FF', stroke: 'rgba(77,216,255,0.4)', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
