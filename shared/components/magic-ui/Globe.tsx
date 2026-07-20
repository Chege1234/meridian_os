"use client"

/**
 * Magic UI — Globe (vendored)
 * WebGL autorotating globe via cobe.
 * Source: https://magicui.design/r/globe.json
 * Colors adapted to Meridian OS cyan palette.
 * Markers include North Cyprus coordinates (Nicosia / Famagusta / Kyrenia).
 */

import { useEffect, useRef } from "react"
import createGlobe, { type COBEOptions } from "cobe"
import { useMotionValue, useSpring } from "framer-motion"
import { cn } from "@/shared/lib/utils"

const MOVEMENT_DAMPING = 1400

export const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 1,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.8,
  /* Deep navy base, cyan accent glow */
  baseColor: [0.05, 0.08, 0.16],
  markerColor: [77 / 255, 216 / 255, 255 / 255],
  glowColor: [0.1, 0.45, 0.7],
  markers: [
    /* North Cyprus — primary locations */
    { location: [35.1856, 33.3823], size: 0.08 }, // Nicosia (Lefkosa)
    { location: [35.1264, 33.9395], size: 0.07 }, // Famagusta (Gazimagusa)
    { location: [35.3387, 33.3199], size: 0.06 }, // Kyrenia (Girne)
    { location: [35.1667, 32.9833], size: 0.05 }, // Morphou (Guzelyurt)
    /* Cyprus island + nearby region */
    { location: [34.6786, 33.0413], size: 0.04 }, // Limassol
    { location: [37.9755, 23.7348], size: 0.05 }, // Athens
    { location: [41.0082, 28.9784], size: 0.06 }, // Istanbul
    { location: [35.6762, 51.4231], size: 0.05 }, // Tehran (student source)
    { location: [24.7136, 46.6753], size: 0.05 }, // Riyadh
    { location: [51.5074, -0.1278], size: 0.05 }, // London
  ],
}

export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string
  config?: COBEOptions
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phiRef = useRef(0)
  const widthRef = useRef(0)
  const pointerInteracting = useRef<number | null>(null)

  const r = useMotionValue(0)
  const rs = useSpring(r, { mass: 1, damping: 30, stiffness: 100 })

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      r.set(r.get() + delta / MOVEMENT_DAMPING)
    }
  }

  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) {
        widthRef.current = canvasRef.current.offsetWidth
      }
    }

    window.addEventListener("resize", onResize)
    onResize()

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      onRender: (state) => {
        if (!pointerInteracting.current) phiRef.current += 0.004
        state.phi = phiRef.current + rs.get()
        state.width = widthRef.current * 2
        state.height = widthRef.current * 2
      },
    })

    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1"
    }, 0)

    return () => {
      globe.destroy()
      window.removeEventListener("resize", onResize)
    }
  }, [rs, config])

  return (
    <div
      className={cn(
        "absolute inset-0 mx-auto aspect-square w-full max-w-[600px]",
        className
      )}
    >
      <canvas
        className="size-full opacity-0 transition-opacity duration-700 contain-[layout_paint_size]"
        ref={canvasRef}
        onPointerDown={(e) => updatePointerInteraction(e.clientX)}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  )
}
