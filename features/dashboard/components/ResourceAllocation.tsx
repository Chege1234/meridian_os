'use client';

/**
 * Resource Allocation
 *
 * Donut chart (PieChart) using recharts.
 * Shows: Compute 42%, Storage 24%, Network 18%, Memory 16%.
 * Total utilisation label sits in the hole.
 */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const SEGMENTS = [
  { name: 'Compute', value: 42, color: '#4DD8FF' },
  { name: 'Storage', value: 24, color: '#3B82F6' },
  { name: 'Network', value: 18, color: '#34D399' },
  { name: 'Memory',  value: 16, color: '#8B5CF6' },
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[rgba(77,216,255,0.25)] bg-[rgba(7,12,22,0.92)] px-3 py-2 text-xs backdrop-blur-md">
      <p className="font-bold" style={{ color: d.color }}>{d.name}</p>
      <p className="text-mer-muted">{d.value}%</p>
    </div>
  );
}

export function ResourceAllocation() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
        Resource Allocation
      </p>

      <div className="flex flex-1 items-center gap-4">
        {/* Donut */}
        <div className="relative h-[110px] w-[110px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SEGMENTS}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={52}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {SEGMENTS.map((seg) => (
                  <Cell key={seg.name} fill={seg.color} opacity={0.9} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none text-mer-text">78%</span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-mer-muted">
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <ul className="flex flex-col gap-2">
          {SEGMENTS.map((seg) => (
            <li key={seg.name} className="flex items-center gap-2">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: seg.color,
                  boxShadow: `0 0 6px ${seg.color}99`,
                }}
              />
              <span className="text-xs text-mer-muted">{seg.name}</span>
              <span className="ml-auto text-xs font-semibold text-mer-text tabular-nums">
                {seg.value}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
