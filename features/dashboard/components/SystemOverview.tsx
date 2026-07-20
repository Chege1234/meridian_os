'use client';

/**
 * System Overview — Snowflake topology diagram
 *
 * Renders an animated SVG network of 6 nodes arranged radially around a
 * central hub, connected by glowing lines — matching the reference image's
 * "SYSTEM OVERVIEW" panel.
 */

import { useEffect, useRef } from 'react';

const CX = 110; // SVG center x
const CY = 100; // SVG center y
const R  = 68;  // orbit radius

// 6 evenly spaced outer nodes (start offset so one points straight up)
const OUTER_NODES = Array.from({ length: 6 }, (_, i) => {
  const angle = (i * 60 - 90) * (Math.PI / 180);
  return {
    x: CX + R * Math.cos(angle),
    y: CY + R * Math.sin(angle),
  };
});

// Intermediate mid-nodes at half radius for the snowflake "branch" look
const MID_NODES = Array.from({ length: 6 }, (_, i) => {
  const angle = (i * 60 - 90) * (Math.PI / 180);
  return {
    x: CX + (R * 0.55) * Math.cos(angle),
    y: CY + (R * 0.55) * Math.sin(angle),
  };
});

export function SystemOverview() {
  const rotateRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let angle = 0;
    let raf: number;
    const tick = () => {
      angle = (angle + 0.18) % 360;
      if (rotateRef.current) {
        rotateRef.current.setAttribute(
          'transform',
          `rotate(${angle} ${CX} ${CY})`
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 220 200"
        className="w-full max-w-[200px]"
        aria-label="System topology diagram"
      >
        <defs>
          <radialGradient id="sov-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4DD8FF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4DD8FF" stopOpacity="0" />
          </radialGradient>
          <filter id="sov-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sov-glow-strong">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Rotating group — snowflake arms */}
        <g ref={rotateRef}>
          {/* Arms from center to outer nodes */}
          {OUTER_NODES.map((n, i) => (
            <line
              key={`arm-${i}`}
              x1={CX} y1={CY}
              x2={n.x} y2={n.y}
              stroke="#4DD8FF"
              strokeWidth="0.8"
              strokeOpacity="0.55"
              filter="url(#sov-glow)"
            />
          ))}

          {/* Cross-links between adjacent outer nodes (hexagon outline) */}
          {OUTER_NODES.map((n, i) => {
            const next = OUTER_NODES[(i + 1) % 6]!;
            return (
              <line
                key={`hex-${i}`}
                x1={n.x} y1={n.y}
                x2={next.x} y2={next.y}
                stroke="#4DD8FF"
                strokeWidth="0.5"
                strokeOpacity="0.25"
              />
            );
          })}

          {/* Mid node rings */}
          {MID_NODES.map((n, i) => (
            <circle
              key={`mid-${i}`}
              cx={n.x}
              cy={n.y}
              r="3"
              fill="#0D1628"
              stroke="#4DD8FF"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
          ))}

          {/* Outer node circles */}
          {OUTER_NODES.map((n, i) => (
            <g key={`outer-${i}`} filter="url(#sov-glow)">
              <circle
                cx={n.x} cy={n.y}
                r="5"
                fill="#0D1628"
                stroke="#4DD8FF"
                strokeWidth="1.2"
              />
              <circle
                cx={n.x} cy={n.y}
                r="2"
                fill="#4DD8FF"
                opacity="0.9"
              />
            </g>
          ))}
        </g>

        {/* Static center hub (does not rotate) */}
        <circle
          cx={CX} cy={CY}
          r={R + 8}
          fill="none"
          stroke="#4DD8FF"
          strokeWidth="0.4"
          strokeOpacity="0.15"
          strokeDasharray="4 6"
        />

        {/* Center glow background */}
        <circle
          cx={CX} cy={CY}
          r="22"
          fill="url(#sov-center-glow)"
        />

        {/* Center hub node */}
        <g filter="url(#sov-glow-strong)">
          <circle
            cx={CX} cy={CY}
            r="10"
            fill="#0A1525"
            stroke="#4DD8FF"
            strokeWidth="1.5"
          />
          <circle cx={CX} cy={CY} r="4" fill="#4DD8FF" opacity="0.95" />
        </g>
      </svg>

      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-mer-muted">
        All Systems Operational
      </p>
    </div>
  );
}
