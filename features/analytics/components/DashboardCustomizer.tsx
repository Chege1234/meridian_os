'use client';

/**
 * Feature Component — DashboardCustomizer
 *
 * Provides personal dashboard customization controls.
 * Supports adding widgets, reordering (position modification), and deleting widgets.
 */

import React, { useState } from 'react';
import type { Dashboard, DashboardWidget, WidgetType } from '@/domain/entities';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ArrowUp, ArrowDown, Trash2, Plus, LayoutGrid, Check } from 'lucide-react';

interface DashboardCustomizerProps {
  currentDashboard: Dashboard | null;
  onSaveLayout: (name: string, widgets: DashboardWidget[]) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const WIDGET_OPTIONS: { type: WidgetType; label: string }[] = [
  { type: 'campaign_performance', label: 'Campaign Performance Graph' },
  { type: 'content_funnel', label: 'Content Pipeline Funnel' },
  { type: 'crm_summary', label: 'CRM Activity Summary' },
  { type: 'ai_cost', label: 'AI LLM Operations Cost' },
];

export function DashboardCustomizer({ currentDashboard, onSaveLayout, onCancel, saving }: DashboardCustomizerProps) {
  const [name, setName] = useState(currentDashboard?.name || 'My Dashboard');
  const [widgets, setWidgets] = useState<DashboardWidget[]>(
    currentDashboard?.layout ? [...currentDashboard.layout].sort((a, b) => a.position - b.position) : []
  );

  const handleAddWidget = (type: WidgetType, label: string) => {
    const newWidget: DashboardWidget = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title: label,
      position: widgets.length,
      filters: {},
    };
    setWidgets([...widgets, newWidget]);
  };

  const handleRemoveWidget = (id: string) => {
    const updated = widgets
      .filter((w) => w.id !== id)
      .map((w, idx) => ({ ...w, position: idx }));
    setWidgets(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newWidgets = [...widgets];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= newWidgets.length) return;

    // Swap
    const temp = newWidgets[index]!;
    newWidgets[index] = newWidgets[targetIdx]!;
    newWidgets[targetIdx] = temp;

    // Re-assign positions
    const finalized = newWidgets.map((w, idx) => ({ ...w, position: idx }));
    setWidgets(finalized);
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, title: newTitle } : w));
    setWidgets(updated);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Dashboard name is required.');
      return;
    }
    onSaveLayout(name, widgets);
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-sky-400" />
            Customize Dashboard Widgets
          </h3>
          <p className="text-xs text-slate-500 mt-1">Configure widgets layout and ordering (BR-200/201)</p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs text-slate-400 hover:text-white">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-sky-600 text-xs text-white hover:bg-sky-500 flex items-center gap-1.5"
          >
            {saving ? (
              <div className="h-3 w-3 animate-spin rounded-full border border-t-white" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save Layout
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="dashboard-name-input" className="block text-xs font-semibold text-slate-400 mb-1.5">
            Dashboard Name
          </label>
          <Input
            id="dashboard-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-md border-slate-800 bg-slate-900/40 text-sm text-slate-200"
            placeholder="e.g. Executive Summary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Re-ordering List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-xs font-semibold text-slate-400">Current Layout widgets</div>
            {widgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed border-slate-800 text-slate-500 text-xs">
                No widgets added yet. Click from options on the right to add.
              </div>
            ) : (
              <div className="space-y-2">
                {widgets.map((widget, idx) => (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/20"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs font-bold text-slate-600 w-4">{idx + 1}</span>
                      <Input
                        type="text"
                        value={widget.title}
                        onChange={(e) => handleTitleChange(widget.id, e.target.value)}
                        className="h-8 border-transparent bg-transparent hover:border-slate-800 focus:bg-slate-950 focus:border-slate-800 text-xs text-slate-200 font-medium py-0"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-white disabled:opacity-30"
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-white disabled:opacity-30"
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === widgets.length - 1}
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500 hover:bg-rose-950/20 hover:text-rose-400"
                        onClick={() => handleRemoveWidget(widget.id)}
                        title="Remove Widget"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget Picker */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 font-medium">Add Widget Options</div>
            <div className="grid grid-cols-1 gap-2">
              {WIDGET_OPTIONS.map((opt) => (
                <Button
                  key={opt.type}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs border-slate-800 bg-slate-900/10 text-slate-300 hover:bg-slate-800 hover:text-white py-4"
                  onClick={() => handleAddWidget(opt.type, opt.label)}
                >
                  <Plus className="h-4 w-4 mr-2 text-sky-400" />
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
