'use client';

/**
 * Dashboard Clock
 *
 * Live client-side clock that ticks every second.
 * Displays date on top, large time below — matches the HUD header design.
 */

import { useEffect, useState } from 'react';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDate(d: Date) {
  return d
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}

function formatTime(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(h)}:${pad(m)}:${pad(s)} ${ampm}`;
}

export function DashboardClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mer-muted opacity-0">
          &nbsp;
        </span>
        <span className="text-3xl font-bold tracking-tight text-mer-text opacity-0">
          &nbsp;
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mer-muted">
        {formatDate(now)}
      </span>
      <span className="mt-0.5 text-3xl font-bold tracking-tight text-mer-text tabular-nums">
        {formatTime(now)}
      </span>
    </div>
  );
}
