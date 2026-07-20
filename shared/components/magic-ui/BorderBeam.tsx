"use client"

/**
 * Magic UI — Border Beam (vendored)
 * Animated beam of light that travels along the border of its container.
 * Source: https://magicui.design/r/border-beam.json
 */

import { motion, type MotionStyle, type Transition } from "framer-motion"
import { cn } from "@/shared/lib/utils"

interface BorderBeamProps {
  /** Size of the beam square in px */
  size?: number
  /** Duration in seconds */
  duration?: number
  /** Delay offset in seconds */
  delay?: number
  /** Gradient start color */
  colorFrom?: string
  /** Gradient end color */
  colorTo?: string
  /** Custom motion transition */
  transition?: Transition
  className?: string
  style?: React.CSSProperties
  /** Reverse animation direction */
  reverse?: boolean
  /** Initial offset position 0–100 */
  initialOffset?: number
  /** Border width in px */
  borderWidth?: number
}

export const BorderBeam = ({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#4DD8FF",
  colorTo = "#3B82F6",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1,
}: BorderBeamProps) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--border-beam-width) border-transparent mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect [mask-clip:padding-box,border-box]"
      style={
        {
          "--border-beam-width": `${borderWidth}px`,
        } as React.CSSProperties
      }
    >
      <motion.div
        className={cn(
          "absolute aspect-square",
          "bg-linear-to-l from-(--color-from) via-(--color-to) to-transparent",
          className
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            "--color-from": colorFrom,
            "--color-to": colorTo,
            ...style,
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          delay: -delay,
          ...transition,
        }}
      />
    </div>
  )
}
