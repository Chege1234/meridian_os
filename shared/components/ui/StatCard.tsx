'use client';

/**
 * Meridian UI — StatCard
 *
 * KPI stat card with a glowing hexagonal icon badge, animated number,
 * and optional delta chip. Mirrors Image 1's stat cards.
 *
 * Props are stable — data wiring only depends on the props interface below.
 */

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { GlassPanel } from './GlassPanel';
import { NumberTicker } from '@/shared/components/magic-ui/NumberTicker';

export interface StatCardProps {
  /** Eyebrow label (uppercase, muted) */
  label: string;
  /** Numeric value to animate to */
  value: number;
  /** Optional suffix, e.g. "%" or "K" */
  suffix?: string;
  /** Optional prefix, e.g. "$" */
  prefix?: string;
  /** Decimal places for the number ticker */
  decimalPlaces?: number;
  /** Percentage delta vs previous period. Positive = green, negative = red. */
  delta?: number;
  /** Label shown next to the delta, e.g. "vs last month" */
  deltaLabel?: string;
  /** Status text shown below value, e.g. "Optimal" */
  statusLabel?: string;
  /** React node to render as the icon */
  icon: React.ReactNode;
  /** Icon color token — defaults to cyan */
  iconColor?: 'cyan' | 'green' | 'amber' | 'red' | 'blue';
  className?: string;
}

const ICON_COLORS: Record<NonNullable<StatCardProps['iconColor']>, string> = {
  cyan:  'text-mer-cyan  bg-[rgba(77,216,255,0.12)]  shadow-[0_0_16px_rgba(77,216,255,0.25)]',
  green: 'text-mer-green bg-[rgba(52,211,153,0.12)]  shadow-[0_0_16px_rgba(52,211,153,0.25)]',
  amber: 'text-mer-amber bg-[rgba(232,169,60,0.12)]  shadow-[0_0_16px_rgba(232,169,60,0.25)]',
  red:   'text-mer-red   bg-[rgba(240,87,107,0.12)]  shadow-[0_0_16px_rgba(240,87,107,0.25)]',
  blue:  'text-mer-blue  bg-[rgba(59,130,246,0.12)]  shadow-[0_0_16px_rgba(59,130,246,0.25)]',
};

const DELTA_COLORS: Record<'up' | 'down' | 'neutral', string> = {
  up:      'text-mer-green',
  down:    'text-mer-red',
  neutral: 'text-mer-muted',
};

export function StatCard({
  label,
  value,
  suffix,
  prefix,
  decimalPlaces = 0,
  delta,
  deltaLabel,
  statusLabel,
  icon,
  iconColor = 'cyan',
  className,
}: StatCardProps) {
  const deltaDir =
    delta === undefined || delta === 0 ? 'neutral' : delta > 0 ? 'up' : 'down';

  const DeltaIcon =
    deltaDir === 'up' ? TrendingUp :
    deltaDir === 'down' ? TrendingDown :
    Minus;

  return (
    <GlassPanel className={cn('p-5', className)}>
      {/* Header row — label + icon badge */}
      <div className="mb-3 flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
          {label}
        </p>

        {/* Hex icon badge */}
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl',
            ICON_COLORS[iconColor],
          )}
          style={{
            clipPath:
              'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)',
          }}
        >
          {icon}
        </div>
      </div>

      {/* Value row */}
      <div className="flex items-baseline gap-1">
        {prefix && (
          <span className="text-sm font-medium text-mer-muted">{prefix}</span>
        )}
        <span className="text-3xl font-bold tracking-tight text-mer-text">
          <NumberTicker
            value={value}
            decimalPlaces={decimalPlaces}
            className="text-mer-text"
          />
        </span>
        {suffix && (
          <span className="text-sm font-medium text-mer-muted">{suffix}</span>
        )}
      </div>

      {/* Delta + status row */}
      {(delta !== undefined || statusLabel) && (
        <div className="mt-2 flex items-center gap-2">
          {delta !== undefined && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                DELTA_COLORS[deltaDir],
              )}
            >
              <DeltaIcon className="h-3 w-3" />
              {Math.abs(delta)}%
            </span>
          )}
          {deltaLabel && (
            <span className="text-xs text-mer-muted">{deltaLabel}</span>
          )}
          {statusLabel && !deltaLabel && (
            <span className="text-xs text-mer-muted">{statusLabel}</span>
          )}
        </div>
      )}
    </GlassPanel>
  );
}
