'use client';

/**
 * Meridian UI — Timeline
 *
 * Vertical timeline with dot nodes and optional "now" marker.
 * Mirrors Image 1's "Mission Timeline" panel.
 * Used for: Dashboard activity, CRM contact history, Content version history.
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  category?: string;
  status?: 'default' | 'active' | 'warning' | 'success' | 'error';
}

interface TimelineProps {
  items: TimelineItem[];
  /** Index of the current "now" item — draws a horizontal marker */
  nowIndex?: number;
  className?: string;
  /** Show a coloured left-rail accent based on status */
  showStatusRail?: boolean;
}

const STATUS_DOT: Record<NonNullable<TimelineItem['status']>, string> = {
  default: 'bg-mer-muted/60',
  active:  'bg-mer-cyan shadow-[0_0_6px_rgba(77,216,255,0.6)]',
  warning: 'bg-mer-amber shadow-[0_0_6px_rgba(232,169,60,0.6)]',
  success: 'bg-mer-green shadow-[0_0_6px_rgba(52,211,153,0.6)]',
  error:   'bg-mer-red   shadow-[0_0_6px_rgba(240,87,107,0.6)]',
};

const STATUS_CATEGORY: Record<NonNullable<TimelineItem['status']>, string> = {
  default: 'text-mer-muted',
  active:  'text-mer-cyan',
  warning: 'text-mer-amber',
  success: 'text-mer-green',
  error:   'text-mer-red',
};

export function Timeline({
  items,
  nowIndex,
  className,
  showStatusRail = true,
}: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Vertical rail */}
      <div className="absolute left-[17px] top-0 h-full w-px bg-[var(--mer-border-glow)]" />

      <ul className="space-y-1">
        {items.map((item, index) => {
          const status = item.status ?? 'default';
          const isNow = index === nowIndex;

          return (
            <React.Fragment key={item.id}>
              {/* "Now" horizontal marker */}
              {isNow && (
                <li className="relative flex items-center py-1" aria-label="Current time">
                  <div className="absolute left-0 h-px w-full bg-mer-cyan opacity-40" />
                  <span className="relative z-10 ml-10 text-[10px] font-semibold uppercase tracking-widest text-mer-cyan">
                    Now
                  </span>
                </li>
              )}

              <li className="group relative flex items-start gap-4 py-2">
                {/* Dot node */}
                <div className="relative z-10 mt-1 flex-shrink-0">
                  <span
                    className={cn(
                      'block h-2.5 w-2.5 rounded-full ring-2 ring-[var(--mer-bg-base)] transition-all duration-200',
                      STATUS_DOT[status],
                      'group-hover:scale-110',
                    )}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pr-2">
                  {/* Time + category row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-mer-muted">
                      {item.time}
                    </span>
                    {item.category && (
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-widest',
                          showStatusRail
                            ? STATUS_CATEGORY[status]
                            : 'text-mer-muted',
                        )}
                      >
                        {item.category}
                      </span>
                    )}
                  </div>
                  {/* Title */}
                  <p className="mt-0.5 text-sm font-medium text-mer-text leading-snug">
                    {item.title}
                  </p>
                </div>
              </li>
            </React.Fragment>
          );
        })}
      </ul>
    </div>
  );
}
