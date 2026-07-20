'use client';

/**
 * Meridian UI — InspectorPanel
 *
 * Stacked label/value readout in the style of Image 2's satellite detail panel.
 * Used for: CRM contact detail, Campaign detail, Content asset detail.
 *
 * Props interface is stable — just pass an array of field objects.
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { GlassPanel } from './GlassPanel';

export interface InspectorField {
  label: string;
  value: React.ReactNode;
  /** Render value in monospace (e.g. IDs, codes, URLs) */
  mono?: boolean;
  /** Optional full-width field that spans the entire row */
  fullWidth?: boolean;
}

interface InspectorPanelProps {
  fields: InspectorField[];
  title?: string;
  className?: string;
  /** Number of columns in a grid layout (default 2 for wide panels) */
  columns?: 1 | 2;
}

export function InspectorPanel({
  fields,
  title,
  className,
  columns = 2,
}: InspectorPanelProps) {
  return (
    <GlassPanel className={cn('p-5', className)}>
      {title && (
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
          {title}
        </p>
      )}

      <div
        className={cn(
          'gap-x-6 gap-y-4',
          columns === 2 ? 'grid grid-cols-2' : 'flex flex-col',
        )}
      >
        {fields.map((field, i) => (
          <div
            key={i}
            className={cn(field.fullWidth && 'col-span-2')}
          >
            {/* Label */}
            <dt className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-mer-muted">
              {field.label}
            </dt>
            {/* Value */}
            <dd
              className={cn(
                'text-sm font-medium text-mer-text leading-snug',
                field.mono && 'font-mono text-xs tracking-wide text-mer-cyan',
              )}
            >
              {field.value}
            </dd>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
