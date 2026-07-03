'use client';

/**
 * Shared Component — DateRangePicker
 *
 * Provides a premium interface to select date ranges with quick presets.
 * Exposes accessibility features and fits into the sleek dark-mode aesthetics.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Calendar } from 'lucide-react';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESETS = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Last 365 Days', days: 365 },
];

export function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(value.startDate);
  const [tempEnd, setTempEnd] = useState(value.endDate);

  useEffect(() => {
    setTempStart(value.startDate);
    setTempEnd(value.endDate);
  }, [value]);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0] ?? '';
  };

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    const range = {
      startDate: formatDate(start),
      endDate: formatDate(end),
    };
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(tempStart) > new Date(tempEnd)) {
      alert('Start date must be before or equal to end date.');
      return;
    }
    onChange({
      startDate: tempStart,
      endDate: tempEnd,
    });
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div>
        <Button
          id="date-range-picker-trigger"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white"
        >
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>
            {value.startDate} to {value.endDate}
          </span>
        </Button>
      </div>

      {isOpen && (
        <>
          {/* Backdrop to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-xl ring-1 ring-black/5 focus:outline-none z-50">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Presets</div>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => handlePresetClick(preset.days)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <div className="border-t border-slate-900 my-2" />

              <form onSubmit={handleCustomApply} className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Custom Range</div>
                <div className="space-y-2">
                  <div>
                    <label htmlFor="custom-start-date" className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Start Date
                    </label>
                    <Input
                      id="custom-start-date"
                      type="date"
                      value={tempStart}
                      onChange={(e) => setTempStart(e.target.value)}
                      className="h-8 border-slate-800 bg-slate-900/40 text-xs text-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-end-date" className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      End Date
                    </label>
                    <Input
                      id="custom-end-date"
                      type="date"
                      value={tempEnd}
                      onChange={(e) => setTempEnd(e.target.value)}
                      className="h-8 border-slate-800 bg-slate-900/40 text-xs text-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-400 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-sky-600 text-xs text-white hover:bg-sky-500"
                  >
                    Apply
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
