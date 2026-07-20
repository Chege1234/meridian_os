'use client';

/**
 * Meridian UI — GlassPanel
 *
 * Convenience wrapper for the dark-glass panel style used throughout
 * Meridian OS: translucent surface + backdrop-blur + glowing cyan border.
 * Import and wrap any container that needs the panel treatment.
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds a subtle outer cyan glow on hover */
  glow?: boolean;
  /** Makes the panel slightly more opaque (for primary content panels) */
  elevated?: boolean;
  /** Adds a BorderBeam active indicator — only for high-emphasis panels */
  asChild?: boolean;
}

export function GlassPanel({
  className,
  glow = true,
  elevated = false,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        // Base glass style
        'relative overflow-hidden rounded-[16px]',
        'border border-[var(--mer-border-glow)]',
        'backdrop-blur-md',
        elevated
          ? 'bg-[rgba(15,24,44,0.75)]'
          : 'bg-[var(--mer-surface)]',
        // Hover glow
        glow && [
          'transition-shadow duration-300',
          'hover:border-[var(--mer-border-hover)]',
          'hover:shadow-[0_0_24px_var(--mer-glow-cyan)]',
        ],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
