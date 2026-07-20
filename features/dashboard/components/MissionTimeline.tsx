'use client';

/**
 * Mission Timeline
 *
 * Top-right panel. Shows:
 * - Horizontal time scrubber bar (08:00 → 24:00) with tick markers
 * - Vertical list of schedule entries (time, project name, category badge)
 * Mirrors the reference image's "MISSION TIMELINE" panel exactly.
 */

import { cn } from '@/shared/lib/utils';
import type { TimelineItem } from '@/shared/components/ui/Timeline';

// ─── Static schedule entries (matching reference image) ──────────────────────
const SCHEDULE = [
  { time: '11:30', name: 'Project Pegasus', category: 'UPDATE',      color: '#4DD8FF' },
  { time: '13:45', name: 'Mark III Systems',category: 'DIAGNOSTICS', color: '#E8A93C' },
  { time: '15:00', name: 'Team Stand-up',   category: 'MEETING',     color: '#34D399' },
  { time: '17:20', name: 'Data Sync',       category: 'BACKUP',      color: '#3B82F6' },
  { time: '19:30', name: 'Threat Scan',     category: 'SECURITY',    color: '#F0576B' },
];

// ─── Horizontal scrubber hours ───────────────────────────────────────────────
const HOURS = ['08:00', '12:00', '16:00', '20:00', '24:00'];

// Current "now" marker position (fraction 0→1 across 08:00–24:00)
function getNowFraction() {
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  return Math.min(1, Math.max(0, (h - 8) / 16));
}

export function MissionTimeline({ items }: { items?: TimelineItem[] }) {
  const nowFrac = getNowFraction();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
        Mission Timeline
      </p>

      {/* Horizontal scrubber */}
      <div className="relative mb-4">
        {/* Hour labels */}
        <div className="mb-1 flex justify-between">
          {HOURS.map((h) => (
            <span key={h} className="text-[9px] font-mono text-mer-muted">
              {h}
            </span>
          ))}
        </div>

        {/* Track */}
        <div className="relative h-1 w-full rounded-full bg-[rgba(77,216,255,0.12)]">
          {/* Filled portion up to now */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[rgba(77,216,255,0.4)]"
            style={{ width: `${nowFrac * 100}%` }}
          />

          {/* Tick dots at each hour */}
          {HOURS.map((h, i) => (
            <span
              key={h}
              className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${(i / (HOURS.length - 1)) * 100}%`,
                backgroundColor:
                  i / (HOURS.length - 1) <= nowFrac ? '#4DD8FF' : 'rgba(77,216,255,0.3)',
                boxShadow:
                  i / (HOURS.length - 1) <= nowFrac
                    ? '0 0 6px rgba(77,216,255,0.8)'
                    : 'none',
              }}
            />
          ))}

          {/* Now indicator */}
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#4DD8FF] bg-[#070C16] shadow-[0_0_10px_rgba(77,216,255,0.9)]"
            style={{ left: `${nowFrac * 100}%` }}
          />
        </div>
      </div>

      {/* Schedule entries */}
      <ul className="flex-1 space-y-2 overflow-y-auto">
        {SCHEDULE.map((entry) => (
          <li
            key={entry.time}
            className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-[rgba(77,216,255,0.05)]"
          >
            {/* Time */}
            <span className="w-10 flex-shrink-0 font-mono text-[11px] text-mer-muted">
              {entry.time}
            </span>

            {/* Name */}
            <span className="flex-1 truncate text-xs font-medium text-mer-text">
              {entry.name}
            </span>

            {/* Category badge */}
            <span
              className="flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                color: entry.color,
                backgroundColor: `${entry.color}18`,
                border: `1px solid ${entry.color}30`,
              }}
            >
              {entry.category}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
