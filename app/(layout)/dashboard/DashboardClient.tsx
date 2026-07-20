'use client';

import * as React from 'react';
import { useState } from 'react';
import { 
  Home, 
  Users, 
  Megaphone, 
  PenTool, 
  Brain, 
  Clock, 
  Sparkles, 
  Send 
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ClientGlobe } from '@/shared/components/ui/ClientGlobe';

interface TimelineItem {
  id: string;
  time: string;
  title: string;
  category?: string;
  status?: 'default' | 'active' | 'warning' | 'success' | 'error';
}

interface DashboardClientProps {
  data: {
    name: string;
    roleName: string;
    totalContacts: number;
    activeCampaigns: number;
    contentInProgress: number;
    aiSpend: number;
    timelineItems: TimelineItem[];
  };
}

/* ============================================================================
 * 1. TECH CARD (Custom Chamfered-Corner widget with polygon icon badge)
 * ============================================================================ */
function TechCard({ 
  label, 
  value, 
  icon, 
  themeColor = 'cyan', 
  prefix = ''
}: { 
  label: string; 
  value: React.ReactNode; 
  icon: React.ReactNode; 
  themeColor?: 'cyan' | 'blue' | 'amber' | 'green';
  prefix?: string;
}) {
  const colors = {
    cyan: {
      border: 'rgba(77, 216, 255, 0.22)',
      iconBg: 'rgba(77, 216, 255, 0.08)',
      iconBorder: 'border-[rgba(77,216,255,0.25)]',
      iconText: 'text-mer-cyan',
      shadow: 'hover:drop-shadow-[0_0_12px_rgba(77,216,255,0.15)]'
    },
    blue: {
      border: 'rgba(59, 130, 246, 0.22)',
      iconBg: 'rgba(59, 130, 246, 0.08)',
      iconBorder: 'border-[rgba(59,130,246,0.25)]',
      iconText: 'text-mer-blue',
      shadow: 'hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.15)]'
    },
    amber: {
      border: 'rgba(232, 169, 60, 0.22)',
      iconBg: 'rgba(232, 169, 60, 0.08)',
      iconBorder: 'border-[rgba(232,169,60,0.25)]',
      iconText: 'text-mer-amber',
      shadow: 'hover:drop-shadow-[0_0_12px_rgba(232,169,60,0.15)]'
    },
    green: {
      border: 'rgba(52, 211, 153, 0.22)',
      iconBg: 'rgba(52, 211, 153, 0.08)',
      iconBorder: 'border-[rgba(52,211,153,0.25)]',
      iconText: 'text-mer-green',
      shadow: 'hover:drop-shadow-[0_0_12px_rgba(52,211,153,0.15)]'
    }
  };
  
  const theme = colors[themeColor];
  
  return (
    <div className={cn("filter transition-all duration-300", theme.shadow)}>
      <div 
        className="relative p-[1.2px]"
        style={{
          background: `linear-gradient(135deg, ${theme.border} 0%, rgba(77,216,255,0.03) 50%, ${theme.border} 100%)`,
          clipPath: 'polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)'
        }}
      >
        <div 
          className="flex items-center gap-4 bg-[rgba(10,18,34,0.7)] backdrop-blur-md px-4 py-3 select-none"
          style={{
            clipPath: 'polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)'
          }}
        >
          {/* Hex icon badge */}
          <div 
            className={cn("flex h-10 w-10 items-center justify-center border shrink-0", theme.iconBg, theme.iconBorder, theme.iconText)}
            style={{
              clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)'
            }}
          >
            {icon}
          </div>
          
          {/* Stats Values */}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-mer-muted truncate">
              {label}
            </p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-mer-text">
              {prefix}{value}
            </p>
          </div>
          
          {/* Chevron/Notch detail on right side */}
          <div className="flex flex-col gap-0.5 opacity-25 text-mer-muted pr-1">
            <div className="w-1.5 h-1.5 border-t border-r border-mer-cyan" />
            <div className="w-1.5 h-1.5 border-b border-r border-mer-cyan" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. HOLOGRAPHIC GLOBE BASE (concentric 3D platform with projection rays)
 * ============================================================================ */
function HolographicBase() {
  return (
    <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[340px] h-[90px] pointer-events-none flex flex-col items-center justify-center">
      <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Ring 1 (outermost) */}
        <div 
          className="absolute rounded-full border border-mer-cyan/15 w-[300px] h-[75px] animate-pulse"
          style={{
            transform: 'rotateX(75deg)',
            boxShadow: '0 0 20px rgba(77,216,255,0.05), inset 0 0 20px rgba(77,216,255,0.05)',
          }}
        />
        {/* Ring 2 */}
        <div 
          className="absolute rounded-full border border-mer-cyan/30 w-[240px] h-[60px]"
          style={{
            transform: 'rotateX(75deg)',
            boxShadow: '0 0 15px rgba(77,216,255,0.08), inset 0 0 15px rgba(77,216,255,0.08)',
          }}
        />
        {/* Ring 3 */}
        <div 
          className="absolute rounded-full border-2 border-mer-cyan/50 w-[180px] h-[45px]"
          style={{
            transform: 'rotateX(75deg)',
            boxShadow: '0 0 25px rgba(77,216,255,0.2), inset 0 0 20px rgba(77,216,255,0.2)',
          }}
        />
        {/* Ring 4 (inner) */}
        <div 
          className="absolute rounded-full border-2 border-mer-cyan w-[110px] h-[28px]"
          style={{
            transform: 'rotateX(75deg)',
            boxShadow: '0 0 30px rgba(77,216,255,0.45), inset 0 0 30px rgba(77,216,255,0.45)',
          }}
        />
        {/* Ring 5 (center dot/core) */}
        <div 
          className="absolute rounded-full bg-mer-cyan w-[45px] h-[12px] blur-[1px]"
          style={{
            transform: 'rotateX(75deg)',
            boxShadow: '0 0 40px rgba(77,216,255,0.95)',
          }}
        />
        
        {/* Projector light beam extending upwards */}
        <div 
          className="absolute bottom-[6px] w-[70px] h-[160px] bg-gradient-to-t from-mer-cyan/40 via-mer-cyan/5 to-transparent blur-md"
          style={{
            clipPath: 'polygon(15% 100%, 85% 100%, 100% 0%, 0% 0%)',
            transform: 'translateY(-65px)',
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================================
 * 3. ACTIVITY TIMELINE PANEL
 * ============================================================================ */
function ActivityTimelinePanel({ items }: { items: TimelineItem[] }) {
  return (
    <div className="relative h-full flex flex-col justify-between p-5 bg-[rgba(13,20,35,0.6)] backdrop-blur-md border border-[var(--mer-border-glow)] rounded-2xl hover:border-[var(--mer-border-hover)] transition-all duration-300">
      <div>
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-[var(--mer-border-glow)] pb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mer-muted">
            ACTIVITY TIMELINE
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-mer-muted uppercase tracking-wider border border-[var(--mer-border-glow)] rounded px-2 py-0.5 bg-[rgba(255,255,255,0.02)]">
            <Clock className="h-3 w-3" />
            <span>Today</span>
          </div>
        </div>

        {/* Vertical Rail + Items */}
        <div className="relative pl-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--mer-border-glow)]" />
          
          <ul className="space-y-4">
            {items.map((item, index) => {
              const isBrand = item.category === 'BRAND' || item.category === 'SYSTEM';
              const dotColor = isBrand 
                ? 'bg-mer-green shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                : 'bg-mer-muted/60';
                
              const categoryColor = isBrand
                ? 'text-mer-green'
                : 'text-mer-muted';
                
              return (
                <li key={item.id || index} className="group relative flex items-start gap-4">
                  {/* Dot */}
                  <div className="absolute left-[-20px] top-[5px] z-10 flex h-2.5 w-2.5 items-center justify-center">
                    <span className={cn('h-2.5 w-2.5 rounded-full ring-4 ring-[#070C16] transition-transform duration-200 group-hover:scale-125', dotColor)} />
                  </div>
                  
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-mer-muted">{item.time}</span>
                      {item.category && (
                        <span className={cn('text-[9px] font-bold uppercase tracking-widest', categoryColor)}>
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] font-medium text-mer-text leading-snug">
                      {item.title}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 4. GLOBAL NETWORK MAP (SVG vector nodes + bezier arcs)
 * ============================================================================ */
function GlobalNetworkMap() {
  return (
    <div className="relative h-full flex flex-col justify-between p-5 bg-[rgba(13,20,35,0.6)] backdrop-blur-md border border-[var(--mer-border-glow)] rounded-2xl hover:border-[var(--mer-border-hover)] transition-all duration-300">
      {/* Header */}
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mer-muted mb-2">
        GLOBAL NETWORK
      </div>
      
      {/* Map Content */}
      <div className="relative flex-1 flex items-center justify-center py-2">
        <svg 
          viewBox="0 0 800 360" 
          className="w-full h-full max-h-[160px] opacity-80"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* North America */}
          <path 
            d="M 60 70 L 90 60 L 130 50 L 210 65 L 240 60 L 250 80 L 210 95 L 180 90 L 195 115 L 170 135 L 180 155 L 165 155 L 155 135 L 150 135 L 140 120 L 130 125 L 110 110 L 95 120 Z" 
            fill="rgba(77,216,255,0.03)" 
            stroke="rgba(77,216,255,0.12)" 
            strokeWidth="1.2" 
          />
          {/* Greenland */}
          <path 
            d="M 195 40 L 230 35 L 220 55 L 190 50 Z" 
            fill="rgba(77,216,255,0.03)" 
            stroke="rgba(77,216,255,0.12)" 
            strokeWidth="1.2" 
          />
          {/* South America */}
          <path 
            d="M 175 160 L 190 160 L 205 175 L 220 195 L 225 215 L 205 255 L 190 305 L 180 305 L 170 255 L 165 215 L 170 185 Z" 
            fill="rgba(77,216,255,0.03)" 
            stroke="rgba(77,216,255,0.12)" 
            strokeWidth="1.2" 
          />
          {/* Europe */}
          <path 
            d="M 345 70 L 375 75 L 405 70 L 415 85 L 400 100 L 380 115 L 350 110 L 335 100 L 335 85 Z" 
            fill="rgba(77,216,255,0.03)" 
            stroke="rgba(77,216,255,0.12)" 
            strokeWidth="1.2" 
          />
          {/* Africa */}
          <path 
            d="M 340 120 L 370 120 L 405 135 L 420 160 L 415 185 L 400 220 L 385 270 L 370 270 L 365 230 L 350 200 L 335 160 L 330 135 Z" 
            fill="rgba(77,216,255,0.03)" 
            stroke="rgba(77,216,255,0.12)" 
            strokeWidth="1.2" 
          />
          {/* Asia */}
          <path 
            d="M 410 70 L 465 65 L 545 60 L 605 70 L 635 80 L 625 105 L 595 110 L 615 140 L 600 165 L 575 170 L 565 150 L 550 165 L 535 165 L 530 150 L 500 180 L 485 180 L 475 150 L 455 160 L 435 150 L 415 130 Z" 
            fill="rgba(77,216,255,0.03)" 
            stroke="rgba(77,216,255,0.12)" 
            strokeWidth="1.2" 
          />
          {/* Australia */}
          <path 
            d="M 570 230 L 610 230 L 620 260 L 595 280 L 560 265 Z" 
            fill="rgba(77,216,255,0.03)" 
            stroke="rgba(77,216,255,0.12)" 
            strokeWidth="1.2" 
          />

          {/* Curved connection arcs */}
          <path d="M 120 100 Q 155 85 190 110" stroke="url(#arc-glow-grad)" strokeWidth="1.5" strokeDasharray="4 2" />
          <path d="M 190 110 Q 275 60 360 90" stroke="url(#arc-glow-grad)" strokeWidth="1.5" />
          <path d="M 360 90 Q 480 50 600 95" stroke="url(#arc-glow-grad)" strokeWidth="1.5" />
          <path d="M 600 95 Q 585 170 590 240" stroke="url(#arc-glow-grad)" strokeWidth="1.2" strokeDasharray="3 3" />
          <path d="M 190 110 Q 200 165 210 210" stroke="url(#arc-glow-grad)" strokeWidth="1.2" />
          <path d="M 360 90 Q 380 170 385 230" stroke="url(#arc-glow-grad)" strokeWidth="1.2" />
          <path d="M 210 210 Q 300 240 385 230" stroke="url(#arc-glow-grad)" strokeWidth="1.5" />

          {/* Node dot points */}
          <circle cx="120" cy="100" r="3" fill="#4DD8FF" />
          <circle cx="120" cy="100" r="6.5" fill="none" stroke="#4DD8FF" strokeWidth="1" className="animate-pulse" />
          
          <circle cx="190" cy="110" r="3" fill="#4DD8FF" />
          
          <circle cx="360" cy="90" r="3" fill="#4DD8FF" />
          <circle cx="360" cy="90" r="6.5" fill="none" stroke="#4DD8FF" strokeWidth="1" className="animate-pulse" />

          <circle cx="600" cy="95" r="3" fill="#4DD8FF" />
          
          <circle cx="590" cy="240" r="3" fill="#4DD8FF" />
          <circle cx="590" cy="240" r="6.5" fill="none" stroke="#4DD8FF" strokeWidth="1" className="animate-pulse" />

          <circle cx="210" cy="210" r="3" fill="#4DD8FF" />
          <circle cx="385" cy="230" r="3" fill="#4DD8FF" />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="arc-glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#4DD8FF" stopOpacity="1" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Footer */}
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-mer-muted mt-2 border-t border-[var(--mer-border-glow)] pt-3">
        <span className="h-1.5 w-1.5 rounded-full bg-mer-green animate-pulse shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
        <span>Network Status: <span className="text-mer-green font-medium">Online</span></span>
      </div>
    </div>
  );
}

/* ============================================================================
 * 5. RADAR / OSCILLOSCOPE MONITOR
 * ============================================================================ */
function RadarOscilloscope() {
  return (
    <div className="relative h-full flex flex-col justify-between p-5 bg-[rgba(13,20,35,0.6)] backdrop-blur-md border border-[var(--mer-border-glow)] rounded-2xl hover:border-[var(--mer-border-hover)] transition-all duration-300">
      <div className="relative w-full h-full min-h-[160px] flex items-center justify-center">
        
        {/* Radar Rings Grid */}
        <div className="absolute w-[150px] h-[150px] rounded-full border border-mer-cyan/15 flex items-center justify-center">
          <div className="w-[105px] h-[105px] rounded-full border border-mer-cyan/10 flex items-center justify-center">
            <div className="w-[60px] h-[60px] rounded-full border border-mer-cyan/5 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-mer-cyan/30" />
            </div>
          </div>
        </div>
        
        {/* Crosshair Lines */}
        <div className="absolute w-[160px] h-px bg-mer-cyan/10" />
        <div className="absolute h-[160px] w-px bg-mer-cyan/10" />
        
        {/* Sweep scanner radar line */}
        <div 
          className="absolute w-[75px] h-[75px] origin-bottom-left bottom-1/2 left-1/2 bg-gradient-to-tr from-mer-cyan/15 to-transparent blur-[0.8px]"
          style={{
            clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
            animation: 'radar-sweep 4s linear infinite',
            transformOrigin: '0% 100%',
          }}
        />
        
        {/* Cardiac wave overlay in the center */}
        <svg 
          viewBox="0 0 200 100" 
          className="absolute w-[140px] h-[60px] z-10 overflow-visible"
          fill="none"
        >
          <path 
            d="M -10 50 L 55 50 L 63 42 L 67 58 L 75 12 L 83 88 L 91 50 L 98 55 L 103 50 L 210 50" 
            stroke="#4DD8FF" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(77,216,255,0.75))'
            }}
          />
        </svg>
        
        {/* Grid cells detail */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-[0.025] pointer-events-none">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-mer-cyan" />
          ))}
        </div>
      </div>
      
      {/* Radar sweep keyframe animation embedded */}
      <style jsx global>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================================
 * 6. AI ASSISTANT CARD (with Glowing Star & Interactive text box)
 * ============================================================================ */
function AIAssistantPanel() {
  const [query, setQuery] = useState('');
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!query.trim()) return;
    console.log('[AI Assistant Input]', query);
    setQuery('');
  };

  return (
    <div className="relative h-full flex flex-col justify-between p-5 bg-[rgba(13,20,35,0.6)] backdrop-blur-md border border-[var(--mer-border-glow)] rounded-2xl hover:border-[var(--mer-border-hover)] transition-all duration-300">
      
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(77,216,255,0.08)] border border-[rgba(77,216,255,0.2)]">
          <Sparkles className="h-4 w-4 text-mer-cyan" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mer-muted">
          AI ASSISTANT
        </span>
      </div>

      {/* Main row: text and glowing star */}
      <div className="flex items-center justify-between gap-4 py-2">
        <p className="text-sm font-medium text-mer-text leading-snug">
          How can I assist you today, Lewis?
        </p>
        
        {/* Large Glowing 4-Point Star */}
        <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-mer-cyan/15 to-mer-blue/20 rounded-full blur-xl animate-pulse" />
          <svg viewBox="0 0 50 50" className="w-11 h-11 text-mer-cyan relative z-10 animate-[spin_30s_linear_infinite]" style={{ filter: 'drop-shadow(0 0 6px rgba(77,216,255,0.6))' }}>
            <path d="M 25 0 Q 25 25 50 25 Q 25 25 25 50 Q 25 25 0 25 Q 25 25 25 0 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Textarea Form inside glowing container */}
      <div className="mt-4 flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Meridian..."
            rows={1}
            className={cn(
              'w-full resize-none rounded-xl px-4 py-2.5 text-sm',
              'bg-[rgba(7,12,22,0.5)] text-mer-text placeholder:text-mer-muted',
              'border border-[var(--mer-border-glow)]',
              'outline-none focus:border-[var(--mer-border-hover)]',
              'transition-all duration-200',
            )}
            aria-label="Ask Meridian"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!query.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(77,216,255,0.08)] border border-[var(--mer-border-glow)] text-mer-cyan transition-all hover:bg-[rgba(77,216,255,0.18)] hover:shadow-[0_0_10px_rgba(77,216,255,0.25)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Send query"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
 * MAIN DASHBOARD CLIENT COMPONENT (Bento-grid setup matching Image 1)
 * ============================================================================ */
export default function DashboardClient({ data }: DashboardClientProps) {
  return (
    <div className="animate-fade-up space-y-4">
      {/* ── TOP SECTION: Three Column layout ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        
        {/* Left Column: Welcome + stats */}
        <div className="flex flex-col justify-between space-y-4 lg:col-span-3">
          {/* Welcome back box */}
          <div className="mb-1 select-none">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mer-muted">
              WELCOME BACK,
            </p>
            <h1 className="mt-1.5 text-4xl font-bold tracking-tight text-mer-text">
              {data.name}.
            </h1>
            <p className="mt-1 text-xs text-mer-muted capitalize">
              {data.roleName}
            </p>
          </div>
          
          {/* Stats stacked list */}
          <div className="flex-1 flex flex-col justify-between space-y-3.5">
            <TechCard
              label="Total Contacts"
              value={data.totalContacts}
              icon={<Users className="h-4.5 w-4.5" />}
              themeColor="cyan"
            />
            <TechCard
              label="Active Campaigns"
              value={data.activeCampaigns}
              icon={<Megaphone className="h-4.5 w-4.5" />}
              themeColor="blue"
            />
            <TechCard
              label="Content In Progress"
              value={data.contentInProgress}
              icon={<PenTool className="h-4.5 w-4.5" />}
              themeColor="amber"
            />
            <TechCard
              label="AI Spend (Month)"
              value={data.aiSpend}
              prefix="$"
              icon={<Brain className="h-4.5 w-4.5" />}
              themeColor="green"
            />
          </div>
        </div>

        {/* Center Column: Globe Centerpiece */}
        <div className="relative flex min-h-[380px] flex-col items-center justify-center overflow-hidden lg:col-span-5 bg-[rgba(13,20,35,0.2)] border border-[rgba(77,216,255,0.06)] rounded-2xl">
          {/* Subtle backdrop radial glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-72 w-72 rounded-full bg-[rgba(77,216,255,0.04)] blur-3xl" />
          </div>

          {/* Client Globe */}
          <div className="relative h-[320px] w-full mt-2">
            <React.Suspense fallback={null}>
              <ClientGlobe />
            </React.Suspense>
          </div>

          {/* 3D Holographic Platform Base */}
          <HolographicBase />

          {/* Systems status overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full border border-[rgba(52,211,153,0.2)] bg-[rgba(7,12,22,0.85)] px-4 py-1.5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mer-green shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-mer-green">
              All systems operational
            </span>
          </div>
        </div>

        {/* Right Column: Mission Timeline */}
        <div className="lg:col-span-4">
          <ActivityTimelinePanel items={data.timelineItems} />
        </div>
      </div>

      {/* ── BOTTOM SECTION: System Monitor row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Global Network Map Card */}
        <div className="lg:col-span-5">
          <GlobalNetworkMap />
        </div>
        
        {/* Radar oscilloscope Card */}
        <div className="lg:col-span-3">
          <RadarOscilloscope />
        </div>
        
        {/* AI Assistant chat Card */}
        <div className="lg:col-span-4">
          <AIAssistantPanel />
        </div>
      </div>
    </div>
  );
}
