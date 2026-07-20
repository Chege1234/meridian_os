'use client';

/**
 * Meridian UI — AskMeridianCard
 *
 * AI assistant input card. Mirrors Image 1's "Ask Meridian…" panel exactly.
 * Reusable for: Dashboard AI panel, Content Studio AI generation, Agent chat.
 *
 * Props interface is stable — onSubmit receives the query string.
 */

import * as React from 'react';
import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { GlassPanel } from './GlassPanel';

interface AskMeridianCardProps {
  placeholder?: string;
  onSubmit: (query: string) => void;
  /** Optional pre-rendered content above the input (e.g. chat history) */
  children?: React.ReactNode;
  className?: string;
  /** If true, shows a compact single-line version */
  compact?: boolean;
}

export function AskMeridianCard({
  placeholder = 'Ask Meridian…',
  onSubmit,
  children,
  className,
  compact = false,
}: AskMeridianCardProps) {
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setQuery('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <GlassPanel className={cn('flex flex-col', compact ? 'p-3' : 'p-5', className)}>
      {/* Header */}
      {!compact && (
        <div className="mb-4 flex items-center gap-2">
          {/* Meridian AI badge */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(77,216,255,0.12)] shadow-[0_0_12px_rgba(77,216,255,0.3)]">
            <Sparkles className="h-4 w-4 text-mer-cyan" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-mer-muted">
              AI Assistant
            </p>
            <p className="text-sm font-medium text-mer-text leading-tight">
              How can I assist you today?
            </p>
          </div>
        </div>
      )}

      {/* Scrollable content area (chat history, suggestions, etc.) */}
      {children && (
        <div className="mb-3 flex-1 overflow-y-auto text-sm text-mer-text">
          {children}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={compact ? 1 : 2}
            className={cn(
              'w-full resize-none rounded-xl px-4 py-2.5 text-sm',
              'bg-[rgba(7,12,22,0.6)] text-mer-text placeholder:text-mer-muted',
              'border border-[var(--mer-border-glow)]',
              'outline-none focus:border-[var(--mer-border-hover)]',
              'transition-colors duration-200',
              compact && 'rows-1',
            )}
            aria-label="Ask Meridian"
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!query.trim()}
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
            'bg-[rgba(77,216,255,0.12)] text-mer-cyan',
            'border border-[var(--mer-border-glow)]',
            'transition-all duration-200',
            'hover:bg-[rgba(77,216,255,0.22)] hover:shadow-[0_0_12px_rgba(77,216,255,0.3)]',
            'disabled:cursor-not-allowed disabled:opacity-30',
            'cursor-pointer',
          )}
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </GlassPanel>
  );
}
