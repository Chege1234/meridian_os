"use client"

import React, { useEffect, useRef } from "react"
import { cn } from "@/shared/lib/utils"

/* ============================================================================
 * SEEDED PSEUDO-RANDOM GENERATOR FOR DETERMINISTIC SHORELINE FRACTAL NOISE
 * ============================================================================ */
function seededRandom(x: number, y: number): number {
  const sinVal = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return sinVal - Math.floor(sinVal)
}

/* Subdivide polygon edges & displace midpoints to create intricate shorelines */
function subdividePolygon(poly: [number, number][], depth: number): [number, number][] {
  if (depth <= 0 || poly.length < 2) return poly
  const result: [number, number][] = []
  for (let i = 0; i < poly.length - 1; i++) {
    const p1 = poly[i]
    const p2 = poly[i + 1]
    if (!p1 || !p2) continue

    const mx = (p1[0] + p2[0]) / 2
    const my = (p1[1] + p2[1]) / 2

    const dx = p2[0] - p1[0]
    const dy = p2[1] - p1[1]
    const len = Math.sqrt(dx * dx + dy * dy)

    let nx = 0, ny = 0
    if (len > 0) {
      nx = -dy / len
      ny = dx / len
    }

    const rand = seededRandom(p1[0] + i, p1[1] + depth)
    const displacement = (rand - 0.5) * len * 0.2
    const mid: [number, number] = [mx + nx * displacement, my + ny * displacement]

    result.push(p1)
    result.push(mid)
  }
  const last = poly[poly.length - 1]
  if (last) result.push(last)
  return subdividePolygon(result, depth - 1)
}

/* Base continent vector polygons in 800x360 coordinate space */
const LAND_POLYGONS: [number, number][][] = [
  // Europe
  [
    [340, 70], [360, 60], [380, 50], [405, 55], [420, 70],
    [415, 88], [395, 100], [375, 115], [350, 110], [335, 95], [340, 70]
  ],
  // Africa
  [
    [340, 120], [365, 120], [405, 135], [420, 155], [430, 175],
    [420, 205], [400, 235], [385, 270], [375, 270], [365, 240],
    [355, 210], [345, 185], [335, 155], [330, 135], [340, 120]
  ],
  // Asia
  [
    [415, 70], [465, 65], [545, 60], [610, 70], [640, 85],
    [630, 110], [600, 115], [620, 145], [600, 170], [575, 175],
    [565, 150], [545, 165], [530, 165], [525, 150], [495, 180],
    [480, 180], [470, 150], [455, 160], [435, 150], [415, 130], [415, 70]
  ],
  // Middle East & India
  [
    [415, 125], [440, 125], [455, 140], [465, 175], [445, 175],
    [435, 150], [415, 135], [415, 125]
  ],
  // North America
  [
    [60, 70], [90, 60], [130, 50], [210, 65], [240, 60],
    [250, 80], [210, 95], [180, 90], [195, 115], [170, 135],
    [180, 155], [165, 155], [155, 135], [150, 135], [140, 120],
    [130, 125], [110, 110], [95, 120], [60, 70]
  ],
  // South America
  [
    [175, 160], [195, 160], [210, 175], [225, 195], [230, 215],
    [210, 255], [195, 305], [185, 305], [175, 255], [168, 215],
    [170, 185], [175, 160]
  ],
  // Australia
  [
    [570, 230], [610, 230], [625, 260], [600, 280], [560, 265], [570, 230]
  ],
  // Greenland
  [
    [195, 40], [230, 35], [220, 55], [190, 50], [195, 40]
  ],
  // Japan
  [
    [620, 100], [635, 105], [630, 120], [615, 115], [620, 100]
  ]
]

interface LandPoint {
  x: number
  y: number
  z: number
}

interface Particle {
  x: number
  y: number
  z: number
  speed: number
  opacity: number
  size: number
}

export function Globe({ className }: { className?: string; config?: unknown }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDragging = useRef(false)
  const previousMousePosition = useRef({ x: 0, y: 0 })
  
  // Center on Europe, Africa, Middle East, Asia (initial longitude around 25-35 deg East)
  const phiRef = useRef(-0.55) 
  const thetaRef = useRef(0.32) 
  const baseAngleRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number

    /* 1. Build Offscreen Landmask Canvas */
    const offCanvas = document.createElement("canvas")
    offCanvas.width = 800
    offCanvas.height = 360
    const octx = offCanvas.getContext("2d")

    if (octx) {
      octx.fillStyle = "#000000"
      octx.fillRect(0, 0, 800, 360)
      octx.fillStyle = "#ffffff"

      LAND_POLYGONS.forEach((poly) => {
        const sub = subdividePolygon(poly, 3)
        const first = sub[0]
        if (!first) return

        octx.beginPath()
        octx.moveTo(first[0], first[1])
        for (let i = 1; i < sub.length; i++) {
          const pt = sub[i]
          if (pt) octx.lineTo(pt[0], pt[1])
        }
        octx.closePath()
        octx.fill()
      })
    }

    const maskData = octx ? octx.getImageData(0, 0, 800, 360) : null

    const checkIsLand = (mx: number, my: number): boolean => {
      if (!maskData) return false
      const ix = Math.floor(mx)
      const iy = Math.floor(my)
      if (ix < 0 || ix >= 800 || iy < 0 || iy >= 360) return false
      const idx = (iy * 800 + ix) * 4
      return maskData.data[idx]! > 120
    }

    /* 2. Generate 3D Land Points on Fibonacci Sphere */
    const totalSamples = 8000
    const landPoints: LandPoint[] = []
    const goldenRatio = (1 + Math.sqrt(5)) / 2

    for (let i = 0; i < totalSamples; i++) {
      const y = 1 - (i / (totalSamples - 1)) * 2
      const radius = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = (2 * Math.PI * i) / goldenRatio

      const x = Math.cos(theta) * radius
      const z = Math.sin(theta) * radius

      const lat = Math.asin(y) * (180 / Math.PI)
      const lon = Math.atan2(z, x) * (180 / Math.PI)

      const mx = ((lon + 180) / 360) * 800
      const my = ((90 - lat) / 180) * 360

      if (checkIsLand(mx, my)) {
        landPoints.push({ x, y, z })
      }
    }

    /* 3. Precompute Neural Line Connections */
    const connections: [number, number][] = []
    const maxDist = 0.048
    const windowSize = 240

    for (let i = 0; i < landPoints.length; i++) {
      const p1 = landPoints[i]
      if (!p1) continue

      const end = Math.min(landPoints.length, i + windowSize)
      for (let j = i + 1; j < end; j++) {
        const p2 = landPoints[j]
        if (!p2) continue

        const dx = p1.x - p2.x
        const dy = p1.y - p2.y
        const dz = p1.z - p2.z
        const dSq = dx * dx + dy * dy + dz * dz
        if (dSq < maxDist * maxDist) {
          connections.push([i, j])
        }
      }
    }

    /* 4. Rising Holographic Light Particles */
    const particles: Particle[] = Array.from({ length: 45 }, () => ({
      x: (Math.random() - 0.5) * 0.8,
      y: 1.1 + Math.random() * 0.2,
      z: (Math.random() - 0.5) * 0.8,
      speed: 0.003 + Math.random() * 0.005,
      opacity: 0.2 + Math.random() * 0.6,
      size: 1 + Math.random() * 1.5,
    }))

    /* 5. Main Render Loop */
    const render = () => {
      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      if (!isDragging.current) {
        phiRef.current += 0.0035 // Auto-rotate longitude
      }
      baseAngleRef.current += 0.01

      const phi = phiRef.current
      const theta = thetaRef.current
      const cosP = Math.cos(phi)
      const sinP = Math.sin(phi)
      const cosT = Math.cos(theta)
      const sinT = Math.sin(theta)

      const globeRadius = Math.min(width, height) * 0.31
      const centerX = width / 2
      const centerY = height * 0.44

      /* ── A. PROJECTOR BASE PLATFORM (Multi-layered 3D concentric rings) ── */
      const baseYOffset = globeRadius * 1.35
      const platformCenterY = centerY + baseYOffset

      // Base Platform Background Glow
      const platformGlow = ctx.createRadialGradient(
        centerX, platformCenterY, 0,
        centerX, platformCenterY, globeRadius * 1.4
      )
      platformGlow.addColorStop(0, "rgba(77, 216, 255, 0.28)")
      platformGlow.addColorStop(0.4, "rgba(77, 216, 255, 0.08)")
      platformGlow.addColorStop(1, "rgba(77, 216, 255, 0)")
      ctx.fillStyle = platformGlow
      ctx.beginPath()
      ctx.ellipse(centerX, platformCenterY, globeRadius * 1.4, globeRadius * 0.4, 0, 0, Math.PI * 2)
      ctx.fill()

      // Concentric Rings Specs: [radiusRatio, dashArray, color, rotateSpeed, width]
      const baseRings = [
        { rRatio: 1.35, dash: [4, 8], color: "rgba(77, 216, 255, 0.25)", speed: 0.3, width: 1 },
        { rRatio: 1.15, dash: [], color: "rgba(77, 216, 255, 0.45)", speed: -0.5, width: 1.5 },
        { rRatio: 0.90, dash: [12, 6], color: "rgba(77, 216, 255, 0.70)", speed: 0.8, width: 1.5 },
        { rRatio: 0.65, dash: [], color: "rgba(77, 216, 255, 0.85)", speed: -1.0, width: 2.0 },
        { rRatio: 0.35, dash: [], color: "rgba(77, 216, 255, 1.00)", speed: 0, width: 2.5 },
      ]

      baseRings.forEach((ring) => {
        ctx.save()
        ctx.strokeStyle = ring.color
        ctx.lineWidth = ring.width
        if (ring.dash.length > 0) ctx.setLineDash(ring.dash)
        
        ctx.beginPath()
        ctx.ellipse(
          centerX, platformCenterY,
          globeRadius * ring.rRatio,
          globeRadius * ring.rRatio * 0.3,
          0, 0, Math.PI * 2
        )
        ctx.stroke()

        // Draw glowing point lights on active rings
        if (ring.rRatio === 0.90 || ring.rRatio === 1.15) {
          const numNodes = 6
          const nodeAngle = baseAngleRef.current * ring.speed
          for (let n = 0; n < numNodes; n++) {
            const a = nodeAngle + (n * Math.PI * 2) / numNodes
            const nx = centerX + Math.cos(a) * globeRadius * ring.rRatio
            const ny = platformCenterY + Math.sin(a) * globeRadius * ring.rRatio * 0.3
            ctx.fillStyle = "#4DD8FF"
            ctx.beginPath()
            ctx.arc(nx, ny, 2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        ctx.restore()
      })

      // Central Projector Core Dot
      const coreDotGlow = ctx.createRadialGradient(
        centerX, platformCenterY, 0,
        centerX, platformCenterY, 14
      )
      coreDotGlow.addColorStop(0, "rgba(255, 255, 255, 1)")
      coreDotGlow.addColorStop(0.5, "rgba(77, 216, 255, 0.9)")
      coreDotGlow.addColorStop(1, "rgba(77, 216, 255, 0)")
      ctx.fillStyle = coreDotGlow
      ctx.beginPath()
      ctx.arc(centerX, platformCenterY, 14, 0, Math.PI * 2)
      ctx.fill()

      /* ── B. SMOOTH CONICAL LIGHT CONE ── */
      ctx.save()
      const coneGradient = ctx.createLinearGradient(0, platformCenterY, 0, centerY)
      coneGradient.addColorStop(0, "rgba(77, 216, 255, 0.40)")
      coneGradient.addColorStop(0.4, "rgba(77, 216, 255, 0.15)")
      coneGradient.addColorStop(1, "rgba(77, 216, 255, 0.0)")

      ctx.fillStyle = coneGradient
      ctx.beginPath()
      ctx.moveTo(centerX - globeRadius * 0.65, platformCenterY)
      ctx.quadraticCurveTo(
        centerX - globeRadius * 0.85, centerY + globeRadius * 0.5,
        centerX - globeRadius * 1.05, centerY
      )
      ctx.lineTo(centerX + globeRadius * 1.05, centerY)
      ctx.quadraticCurveTo(
        centerX + globeRadius * 0.85, centerY + globeRadius * 0.5,
        centerX + globeRadius * 0.65, platformCenterY
      )
      ctx.closePath()
      ctx.fill()

      // Vertical projection light rays
      ctx.strokeStyle = "rgba(77, 216, 255, 0.18)"
      ctx.lineWidth = 1
      const numRays = 18
      for (let r = 0; r < numRays; r++) {
        const ratio = (r / (numRays - 1)) - 0.5
        const bx = centerX + ratio * globeRadius * 1.2
        const tx = centerX + ratio * globeRadius * 2.1
        ctx.beginPath()
        ctx.moveTo(bx, platformCenterY)
        ctx.lineTo(tx, centerY - globeRadius * 0.2)
        ctx.stroke()
      }
      ctx.restore()

      /* ── C. RISING LIGHT PARTICLES ── */
      ctx.fillStyle = "#4DD8FF"
      particles.forEach((p) => {
        p.y -= p.speed
        if (p.y < -0.2) {
          p.y = 1.15
          p.x = (Math.random() - 0.5) * 0.7
          p.z = (Math.random() - 0.5) * 0.7
        }
        const py = centerY + p.y * globeRadius
        const px = centerX + p.x * globeRadius * (1.2 - p.y * 0.3)
        ctx.globalAlpha = p.opacity * Math.max(0, 1 - (1.15 - p.y))
        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1.0

      /* ── D. CENTRAL GLOBE CORE GLOW ── */
      const coreGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, globeRadius
      )
      coreGlow.addColorStop(0, "rgba(77, 216, 255, 0.50)")
      coreGlow.addColorStop(0.35, "rgba(77, 216, 255, 0.18)")
      coreGlow.addColorStop(0.75, "rgba(77, 216, 255, 0.05)")
      coreGlow.addColorStop(1, "rgba(77, 216, 255, 0)")
      ctx.fillStyle = coreGlow
      ctx.beginPath()
      ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2)
      ctx.fill()

      /* ── E. ROTATED 3D CYBERNETIC MESH GLOBE ── */
      const rotatedPoints = landPoints.map((p) => {
        // Rotate Y (longitude)
        const x1 = p.x * cosP - p.z * sinP
        const z1 = p.x * sinP + p.z * cosP
        const y1 = p.y

        // Rotate X (latitude tilt)
        const y2 = y1 * cosT - z1 * sinT
        const z2 = y1 * sinT + z1 * cosT
        const x2 = x1

        return {
          px: centerX + x2 * globeRadius,
          py: centerY + y2 * globeRadius,
          z: z2,
        }
      })

      // Draw Neural Lines
      connections.forEach(([i, j]) => {
        const p1 = rotatedPoints[i]
        const p2 = rotatedPoints[j]
        if (!p1 || !p2) return

        const avgZ = (p1.z + p2.z) / 2

        // Opacity depends on depth: front lines bright cyan, back lines subtle
        const alpha = avgZ > 0 
          ? 0.25 + avgZ * 0.45 
          : Math.max(0.04, 0.18 + avgZ * 0.15)

        ctx.strokeStyle = `rgba(77, 216, 255, ${alpha.toFixed(3)})`
        ctx.lineWidth = avgZ > 0 ? 0.75 : 0.45
        ctx.beginPath()
        ctx.moveTo(p1.px, p1.py)
        ctx.lineTo(p2.px, p2.py)
        ctx.stroke()
      })

      // Draw Glowing Data Points
      rotatedPoints.forEach((p) => {
        const alpha = p.z > 0 ? 0.45 + p.z * 0.55 : Math.max(0.08, 0.25 + p.z * 0.2)
        const radius = p.z > 0 ? 0.95 + p.z * 0.4 : 0.65

        ctx.fillStyle = p.z > 0 ? "#E7F1FF" : "rgba(77, 216, 255, 0.6)"
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(p.px, p.py, radius, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1.0

      /* ── F. ORBITAL RINGS & SATELLITE NODES ── */
      const orbits = [
        { radiusMult: 1.25, tilt: 0.35, speed: 0.8, color: "rgba(77, 216, 255, 0.35)" },
        { radiusMult: 1.42, tilt: -0.25, speed: -0.6, color: "rgba(77, 216, 255, 0.22)" },
      ]

      orbits.forEach((orb) => {
        ctx.save()
        ctx.strokeStyle = orb.color
        ctx.lineWidth = 1
        ctx.setLineDash([6, 6])
        ctx.beginPath()
        ctx.ellipse(
          centerX, centerY,
          globeRadius * orb.radiusMult,
          globeRadius * orb.radiusMult * 0.35,
          orb.tilt, 0, Math.PI * 2
        )
        ctx.stroke()

        // Orbiting Satellite Node
        const satAngle = baseAngleRef.current * orb.speed
        const sx = centerX + Math.cos(satAngle) * globeRadius * orb.radiusMult
        const sy = centerY + Math.sin(satAngle) * globeRadius * orb.radiusMult * 0.35
        
        ctx.fillStyle = "#4DD8FF"
        ctx.shadowColor = "#4DD8FF"
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(sx, sy, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    /* 6. Handle Canvas Resize */
    const handleResize = () => {
      if (!canvas.parentElement) return
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    render()

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  /* 7. Mouse & Touch Drag Handlers */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true
    previousMousePosition.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return
    const deltaX = e.clientX - previousMousePosition.current.x
    const deltaY = e.clientY - previousMousePosition.current.y

    phiRef.current += deltaX * 0.005
    thetaRef.current = Math.max(-0.8, Math.min(0.8, thetaRef.current + deltaY * 0.003))

    previousMousePosition.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = false
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // Ignore if pointer capture release fails
    }
  }

  return (
    <div className={cn("relative size-full flex items-center justify-center select-none", className)}>
      <canvas
        ref={canvasRef}
        className="size-full cursor-grab active:cursor-grabbing contain-[layout_paint_size]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  )
}
