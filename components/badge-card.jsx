'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const SPRING_STIFFNESS = 0.07
const SPRING_DAMPING = 0.75
const CARD_W = 260
const CARD_H = 380
const ANCHOR_Y = 40
const STRAP_LENGTH = 130 // visible strap from anchor to card top

// --- Shared logo image cache (used by the strap canvas) ---
const logoImageCache = new Map()
function getLogoImage(src) {
  if (!src) return null
  let img = logoImageCache.get(src)
  if (!img) {
    img = new Image()
    img.src = src
    logoImageCache.set(src, img)
  }
  return img.complete && img.naturalWidth > 0 ? img : null
}

// --- Generic company wordmark (no brand-specific logo image) ---
function BrandMark({ text, color = 'currentColor', size = 13 }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 leading-none"
      style={{ color }}
    >
      <span
        className="rounded-full"
        style={{ width: size * 0.4, height: size * 0.4, background: color }}
      />
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: size, fontWeight: 600, letterSpacing: '-0.02em' }}>
        {text}
      </span>
    </span>
  )
}

// --- Barcode SVG ---
function Barcode({ color }) {
  const bars = [3,1,2,1,3,2,1,2,1,3,1,2,2,1,1,3,2,1,2,1,3,1,2,1,3,2,1,1,2,3,1,2,1,2,3]
  let x = 0
  return (
    <svg width="200" height="36" viewBox="0 0 200 36" className="block">
      {bars.map((w, i) => {
        const rect = i % 2 === 0 ? (
          <rect key={i} x={x} y={0} width={w * 3.5} height={36} fill={color} rx={0.3} />
        ) : null
        x += w * 3.5
        return rect
      })}
    </svg>
  )
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function formatLiveDate(d) {
  const day = String(d.getDate()).padStart(2, '0')
  const month = MONTHS[d.getMonth()]
  const year = String(d.getFullYear()).slice(-2)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${day}/${month}/${year} > ${h}:${m}:${s}`
}

// --- Card front face ---
function CardFront({ data, shinePct, now }) {
  const c = data.colors
  const vars = {
    '--card-bg': c.cardBg,
    '--accent': c.accentColor,
    '--name-color': c.nameColor,
    '--role-color': c.roleColor,
    '--meta-color': c.metaColor,
    '--footer-bg': c.footerBg,
    '--footer-text': c.footerText,
    '--shine-x': `${shinePct.x}%`,
    '--shine-y': `${shinePct.y}%`,
  }

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden]" style={vars}>
      <div className="relative h-full w-full bg-[var(--card-bg)]">
        {/* Tilt shine */}
        <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-[radial-gradient(ellipse_at_var(--shine-x)_var(--shine-y),rgba(255,255,255,0.07)_0%,transparent_60%)]" />
        {/* Ring hole */}
        <div className="absolute top-3.5 left-1/2 z-[11] h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[1.5px] border-[#333] bg-black" />
        {/* Top meta row with logo */}
        <div className="absolute top-0 right-0 left-0 z-[12] flex items-start px-4 pt-[34px]">
          <BrandMark text={data.company.split(' ')[0]} color="white" size={16} />
        </div>
        {/* Hero logo / event code */}
        <div className="pointer-events-none absolute top-[54px] right-0 bottom-[145px] left-0 z-[3] flex select-none items-center justify-center">
          {data.logoImage ? (
            <img
              src={data.logoImage}
              alt={data.company}
              className={`mx-auto h-auto max-h-[52%] w-[48%] object-contain ${data.logoInvert ? '[filter:invert(1)_brightness(1.15)]' : ''}`}
              draggable={false}
            />
          ) : (
            <span
              className="font-sans text-[64px] leading-none font-black tracking-[-0.03em] text-[var(--accent-color)]"
              style={{ '--accent-color': c.accentColor }}
            >
              {data.eventCode}
            </span>
          )}
        </div>
        {/* Bottom content */}
        <div className="absolute right-0 bottom-0 left-0 z-[7] flex flex-col justify-end">
          <div className="px-5 pb-2">
            <h2 className="font-sans text-[32px] leading-[1.05] font-bold tracking-[-0.02em] text-[var(--name-color)]">{data.name}</h2>
          </div>
          <div className="my-2.5 h-px bg-white/7" />
          <div className="flex items-end justify-between px-5 pb-3">
            <div>
              <p className="font-mono text-[10px] leading-[1.7] tracking-[0.12em] text-[var(--meta-color)]">{data.venue.toUpperCase()}</p>
              <p className="font-mono text-[10px] tracking-[0.12em] text-[var(--meta-color)] opacity-60">{data.address.toUpperCase()}</p>
            </div>
            <div
              className="h-3.5 w-3.5 rounded-sm opacity-90"
              style={{ background: c.accentColor, transform: 'rotate(45deg)' }}
              aria-hidden="true"
            />
          </div>
          <div className="flex h-9 items-center justify-center bg-[var(--footer-bg)]">
            <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--footer-text)]">{data.website}</span>
          </div>
        </div>
        {/* Edge gloss */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.4)]" />
      </div>
    </div>
  )
}

// --- Card back face ---
function CardBack({ data, shinePct }) {
  const c = data.colors
  const qrValue = data.website
    ? data.website.startsWith('http') ? data.website : `https://${data.website}`
    : 'https://example.com'

  const vars = {
    '--card-bg': c.cardBg,
    '--accent': c.accentColor,
    '--accent-30': `${c.accentColor}30`,
    '--name-color': c.nameColor,
    '--role-color': c.roleColor,
    '--meta-color': c.metaColor,
    '--footer-bg': c.footerBg,
    '--footer-text': c.footerText,
    '--shine-x': `${100 - shinePct.x}%`,
    '--shine-y': `${shinePct.y}%`,
  }

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]" style={vars}>
      <div className="relative flex h-full w-full flex-col bg-[var(--card-bg)]">
        {/* Shine */}
        <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-[radial-gradient(ellipse_at_var(--shine-x)_var(--shine-y),rgba(255,255,255,0.07)_0%,transparent_60%)]" />
        {/* Ring hole */}
        <div className="absolute top-3.5 left-1/2 z-[11] h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[1.5px] border-[#333] bg-black" />

        {/* Top accent bar */}
        <div className="h-1 shrink-0 bg-[var(--accent)]" />

        {/* All content in one vertical stack */}
        <div className="z-[5] flex flex-1 flex-col gap-[7px] px-5 pt-7">

          {/* Logo row */}
          <div className="flex items-center justify-between">
            <BrandMark text={data.company.split(' ')[0]} color="white" size={17} />
            {data.logoImage && (
              <img
                src={data.logoImage}
                alt={data.company}
                className={`h-6 w-auto object-contain ${data.logoInvert ? '[filter:invert(1)_brightness(1.15)]' : ''}`}
                draggable={false}
              />
            )}
          </div>

          {/* Tagline */}
          <div>
            {data.tagline && (
              <p className="mt-[3px] font-mono text-[9px] leading-[1.4] tracking-[0.04em] text-[var(--meta-color)] opacity-70">
                {data.tagline}
              </p>
            )}
          </div>

          <div className="h-px bg-[var(--accent-30)]" />

          {/* QR code + contact info side by side */}
          <div className="flex items-start gap-2.5">
            <div className="shrink-0 overflow-hidden rounded-md bg-white p-[5px]">
              <QRCodeSVG value={qrValue} size={78} bgColor="#ffffff" fgColor="#000000" level="M" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-px">
              <div>
                <p className="mb-0.5 font-mono text-[8px] tracking-[0.18em] text-[var(--meta-color)]">SCAN TO VISIT</p>
                <p className="overflow-hidden font-mono text-[9px] leading-[1.3] font-semibold tracking-[0.03em] text-ellipsis whitespace-nowrap text-[var(--accent)]">{data.website}</p>
              </div>
              {data.email && (
                <div>
                  <p className="mb-0.5 font-mono text-[8px] tracking-[0.15em] text-[var(--meta-color)]">EMAIL</p>
                  <a
                    href={`mailto:${data.email}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="overflow-hidden font-mono text-[8.5px] leading-[1.3] text-ellipsis whitespace-nowrap text-[var(--role-color)] underline decoration-[var(--role-color)]/40 underline-offset-2"
                  >
                    {data.email}
                  </a>
                </div>
              )}
              {data.phone && (
                <div>
                  <p className="mb-0.5 font-mono text-[8px] tracking-[0.15em] text-[var(--meta-color)]">PHONE</p>
                  <a
                    href={`https://wa.me/${data.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-[8.5px] leading-[1.3] whitespace-nowrap text-[var(--role-color)] underline decoration-[var(--role-color)]/40 underline-offset-2"
                  >
                    {data.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-[var(--accent-30)]" />

          {/* Address */}
          <div>
            <p className="mb-1 font-mono text-[8px] tracking-[0.18em] text-[var(--meta-color)]">ADDRESS</p>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="overflow-hidden font-mono text-[9.5px] leading-[1.5] text-ellipsis whitespace-nowrap text-[var(--role-color)]">{data.venue}</p>
                <p className="overflow-hidden font-mono text-[9.5px] leading-[1.5] text-ellipsis whitespace-nowrap text-[var(--role-color)] opacity-70">{data.address}</p>
              </div>
              <p className="shrink-0 text-right font-mono text-[9.5px] whitespace-nowrap text-[var(--role-color)] opacity-60">{data.location}</p>
            </div>
          </div>

          <div className="h-px bg-[var(--accent-30)]" />

          {/* Barcode */}
          <div>
            <Barcode color={c.accentColor + 'aa'} />
            <p className="mt-[3px] font-mono text-[7px] tracking-[0.22em] text-[var(--meta-color)] opacity-40">
              {'*' + data.name.replace(/\s/g, '').toUpperCase().slice(0, 12).padEnd(12, '0') + '*'}
            </p>
          </div>
        </div>

        {/* Footer bar — pushed to bottom */}
        <div className="mt-auto flex h-9 shrink-0 items-center justify-between bg-[var(--footer-bg)] px-5">
          <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--footer-text)]">{data.website}</span>
          <div
            className="h-3 w-3 rounded-sm opacity-80"
            style={{ background: c.accentColor, transform: 'rotate(45deg)' }}
            aria-hidden="true"
          />
        </div>

        {/* Edge gloss */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.4)]" />
      </div>
    </div>
  )
}

export default function BadgeCard({ data }) {
  const containerRef = useRef(null)
  const cardRef = useRef(null)
  const canvasRef = useRef(null)

  const pos = useRef({ x: 0, y: 0 })
  const vel = useRef({ x: 0, y: 0 })
  const tilt = useRef({ rx: 0, ry: 0 })
  const tiltTarget = useRef({ rx: 0, ry: 0 })
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const hasMounted = useRef(false)
  const rafId = useRef(0)
  const didDrag = useRef(false)

  const [shinePct, setShinePct] = useState({ x: 50, y: 50 })
  const [now, setNow] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [flipAngle, setFlipAngle] = useState(0)
  const flipRef = useRef(0)
  const flipTarget = useRef(0)
  const flipRaf = useRef(0)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const getAnchor = useCallback(() => {
    if (!containerRef.current) return { x: 0, y: ANCHOR_Y }
    const rect = containerRef.current.getBoundingClientRect()
    return { x: rect.width * 0.5, y: ANCHOR_Y }
  }, [])

  const drawRope = useCallback((data) => {
    const canvas = canvasRef.current
    if (!canvas || !containerRef.current) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = containerRef.current.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const anchor = getAnchor()
    const cardTopX = pos.current.x + CARD_W / 2
    // Strap ends above the card at the top of the swivel clip
    const cardTopY = pos.current.y - 18
    const midY = anchor.y + (cardTopY - anchor.y) * 0.5

    // --- Sample points along the Bezier curve for the strap ---
    const steps = 80
    const pts = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const mt = 1 - t
      // Cubic Bezier: P0=anchor, P1=(anchor.x,midY), P2=(cardTopX,midY), P3=(cardTopX,cardTopY)
      const x =
        mt * mt * mt * anchor.x +
        3 * mt * mt * t * anchor.x +
        3 * mt * t * t * cardTopX +
        t * t * t * cardTopX
      const y =
        mt * mt * mt * anchor.y +
        3 * mt * mt * t * midY +
        3 * mt * t * t * midY +
        t * t * t * cardTopY
      // Derivative for tangent
      const dx =
        3 * mt * mt * (anchor.x - anchor.x) +
        6 * mt * t * (cardTopX - anchor.x) +
        3 * t * t * (cardTopX - cardTopX)
      const dy =
        3 * mt * mt * (midY - anchor.y) +
        6 * mt * t * (midY - midY) +
        3 * t * t * (cardTopY - midY)
      const len = Math.hypot(dx, dy) || 1
      pts.push({ x, y, tx: dx / len, ty: dy / len })
    }

    // --- Strap width and edges ---
    const strapHalf = 15 // strap is ~30px wide (Vercel Ship lanyard look)

    const buildEdgePath = (sign) => {
      ctx.beginPath()
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]
        const nx = -p.ty * sign
        const ny = p.tx * sign
        const x = p.x + nx * strapHalf
        const y = p.y + ny * strapHalf
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
    }

    // --- Drop shadow ---
    ctx.save()
    ctx.beginPath()
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      const nx = -p.ty
      const ny = p.tx
      if (i === 0) ctx.moveTo(p.x + nx * strapHalf, p.y + ny * strapHalf)
      else ctx.lineTo(p.x + nx * strapHalf, p.y + ny * strapHalf)
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i]
      const nx = -p.ty
      const ny = p.tx
      ctx.lineTo(p.x - nx * strapHalf, p.y - ny * strapHalf)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.filter = 'blur(4px)'
    ctx.fill()
    ctx.restore()

    // --- Strap fill (dark) ---
    ctx.save()
    ctx.beginPath()
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      const nx = -p.ty
      const ny = p.tx
      if (i === 0) ctx.moveTo(p.x + nx * strapHalf, p.y + ny * strapHalf)
      else ctx.lineTo(p.x + nx * strapHalf, p.y + ny * strapHalf)
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i]
      const nx = -p.ty
      const ny = p.tx
      ctx.lineTo(p.x - nx * strapHalf, p.y - ny * strapHalf)
    }
    ctx.closePath()
    ctx.fillStyle = '#0a0a0a'
    ctx.fill()
    // Subtle inner shading
    const midPt = pts[Math.floor(pts.length / 2)]
    const grad = ctx.createLinearGradient(
      midPt.x - strapHalf,
      midPt.y,
      midPt.x + strapHalf,
      midPt.y,
    )
    grad.addColorStop(0, 'rgba(255,255,255,0.08)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0)')
    grad.addColorStop(0.6, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.4)')
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()

    // --- Repeating company logo + wordmark along the strap ---
    // Compute cumulative arc-length for even text spacing
    const cumLen = [0]
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x
      const dy = pts[i].y - pts[i - 1].y
      cumLen.push(cumLen[i - 1] + Math.hypot(dx, dy))
    }
    const totalLen = cumLen[cumLen.length - 1]

    const sampleAt = (targetLen) => {
      // Binary search for point at arc length
      let lo = 0, hi = cumLen.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (cumLen[mid] < targetLen) lo = mid + 1
        else hi = mid
      }
      return pts[Math.max(0, Math.min(lo, pts.length - 1))]
    }

    ctx.save()
    const accentColor = data.colors?.accentColor || '#888'
    const logoImg = getLogoImage(data.logoImage)
    const labelSpacing = 80 // px between each mark along the strap
    const startOffset = 45
    const iconH = 11
    const dotRadius = 3
    for (let d = startOffset; d < totalLen - 20; d += labelSpacing) {
      const p = sampleAt(d)
      if (logoImg) {
        const iconW = iconH * (logoImg.naturalWidth / logoImg.naturalHeight)
        ctx.drawImage(logoImg, p.x - iconW / 2, p.y - iconH / 2, iconW, iconH)
      } else {
        ctx.fillStyle = accentColor
        ctx.beginPath()
        ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()

    // --- Edge highlights ---
    ctx.save()
    buildEdgePath(1)
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.stroke()
    buildEdgePath(-1)
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'
    ctx.stroke()
    ctx.restore()

    // --- Black plastic swivel clip connecting strap to card ---
    // Clip body sits between strap end (cardTopY) and card hole (pos.current.y + 16)
    const clipTopY = cardTopY
    const cardRingY = pos.current.y + 16

    ctx.save()
    ctx.translate(cardTopX, clipTopY)

    // Drop shadow for entire clip assembly
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.filter = 'blur(4px)'
    ctx.beginPath()
    ctx.roundRect(-10, 0, 20, 26, 4)
    ctx.fill()
    ctx.restore()

    // Clip body gradient (matte black plastic)
    const clipGrad = ctx.createLinearGradient(-10, 0, 10, 0)
    clipGrad.addColorStop(0, '#0d0d0d')
    clipGrad.addColorStop(0.5, '#2e2e2e')
    clipGrad.addColorStop(1, '#070707')
    ctx.fillStyle = clipGrad
    ctx.beginPath()
    ctx.roundRect(-10, 0, 20, 26, 4)
    ctx.fill()

    // Specular highlight strip
    ctx.fillStyle = 'rgba(255,255,255,0.14)'
    ctx.beginPath()
    ctx.roundRect(-8, 3, 3, 20, 1.5)
    ctx.fill()

    // Edge outline
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'
    ctx.lineWidth = 0.7
    ctx.beginPath()
    ctx.roundRect(-10, 0, 20, 26, 4)
    ctx.stroke()
    ctx.restore()

    // Hook: thin curved line from clip bottom into card ring hole
    ctx.save()
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cardTopX, clipTopY + 26)
    ctx.lineTo(cardTopX, cardRingY + 2)
    ctx.stroke()
    // Hook highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(cardTopX - 0.6, clipTopY + 26)
    ctx.lineTo(cardTopX - 0.6, cardRingY + 2)
    ctx.stroke()
    ctx.restore()
  }, [getAnchor])

  const animate = useCallback(() => {
    if (!hasMounted.current) return
    const card = cardRef.current
    if (!card) return

    if (!dragging.current) {
      const anchor = getAnchor()
      const restX = anchor.x - CARD_W / 2
      const restY = anchor.y + STRAP_LENGTH
      vel.current.x += (restX - pos.current.x) * SPRING_STIFFNESS
      vel.current.y += (restY - pos.current.y) * SPRING_STIFFNESS
      vel.current.x *= SPRING_DAMPING
      vel.current.y *= SPRING_DAMPING
      pos.current.x += vel.current.x
      pos.current.y += vel.current.y
    }

    tilt.current.rx += (tiltTarget.current.rx - tilt.current.rx) * 0.1
    tilt.current.ry += (tiltTarget.current.ry - tilt.current.ry) * 0.1

    // Apply tilt only — flip is handled by the inner div via React state
    card.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) rotateX(${tilt.current.rx}deg) rotateY(${tilt.current.ry}deg)`

    drawRope(card.__badgeData || data)
    rafId.current = requestAnimationFrame(animate)
  }, [getAnchor, drawRope])

  // Smooth flip animation
  const animateFlip = useCallback(() => {
    const diff = flipTarget.current - flipRef.current
    flipRef.current += diff * 0.12
    setFlipAngle(flipRef.current)
    if (Math.abs(diff) > 0.1) {
      flipRaf.current = requestAnimationFrame(animateFlip)
    } else {
      flipRef.current = flipTarget.current
      setFlipAngle(flipTarget.current)
    }
  }, [])

  const triggerFlip = useCallback(() => {
    const next = flipped ? 0 : 180
    flipTarget.current = next
    setFlipped(!flipped)
    cancelAnimationFrame(flipRaf.current)
    flipRaf.current = requestAnimationFrame(animateFlip)
  }, [flipped, animateFlip])

  useEffect(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    pos.current = { x: rect.width / 2 - CARD_W / 2, y: ANCHOR_Y + STRAP_LENGTH }
    hasMounted.current = true
    rafId.current = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(rafId.current)
      cancelAnimationFrame(flipRaf.current)
    }
  }, [animate])

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.__badgeData = data
    }
  }, [data])

  const onPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    didDrag.current = false
    dragOffset.current = {
      x: e.clientX - (containerRef.current?.getBoundingClientRect().left ?? 0) - pos.current.x,
      y: e.clientY - (containerRef.current?.getBoundingClientRect().top ?? 0) - pos.current.y,
    }
    document.body.style.cursor = 'grabbing'
  }, [])

  const onPointerMove = useCallback((e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const lx = e.clientX - rect.left
    const ly = e.clientY - rect.top
    if (dragging.current) {
      const nx = lx - dragOffset.current.x
      const ny = ly - dragOffset.current.y
      const dx = nx - pos.current.x
      const dy = ny - pos.current.y
      if (Math.abs(dx) + Math.abs(dy) > 4) didDrag.current = true
      pos.current.x = nx
      pos.current.y = ny
      vel.current = { x: 0, y: 0 }
    }
    const cx = pos.current.x + CARD_W / 2
    const cy = pos.current.y + CARD_H / 2
    const dx = (lx - cx) / (CARD_W / 2)
    const dy = (ly - cy) / (CARD_H / 2)
    if (dx * dx + dy * dy < 4) {
      tiltTarget.current.rx = -dy * 12
      tiltTarget.current.ry = dx * 12
      setShinePct({
        x: ((lx - pos.current.x) / CARD_W) * 100,
        y: ((ly - pos.current.y) / CARD_H) * 100,
      })
    }
  }, [])

  const onPointerUp = useCallback((e) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    const wasDragging = didDrag.current
    dragging.current = false
    didDrag.current = false
    tiltTarget.current = { rx: 0, ry: 0 }
    document.body.style.cursor = 'auto'
    vel.current = { x: vel.current.x * 1.5, y: vel.current.y * 1.5 }
    if (!wasDragging) {
      triggerFlip()
    }
  }, [triggerFlip])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden [perspective:1200px]"
      onPointerMove={onPointerMove}
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-[1]" />

      {/* Nail pin */}
      <div
        className="pointer-events-none absolute top-9 left-[calc(50%-2px)] h-2 w-1 rounded-sm bg-[#444] z-[2]"
      />

      {/* Outer card div: position + tilt via rAF */}
      <div
        ref={cardRef}
        className="absolute z-[3] h-[380px] w-[260px] cursor-grab [transform-origin:top_center] [transform-style:preserve-3d] will-change-transform select-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          if (!dragging.current) {
            document.body.style.cursor = 'auto'
            tiltTarget.current = { rx: 0, ry: 0 }
          }
        }}
      >
        {/* Inner flip container: rotates around Y for flip */}
        <div
          className="relative h-full w-full rounded-2xl [transform-style:preserve-3d] shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.06)] [transition:none]"
          style={{ transform: `rotateY(${flipAngle}deg)` }}
        >
          <CardFront data={data} shinePct={shinePct} now={now} />
          <CardBack data={data} shinePct={shinePct} />
        </div>
      </div>
    </div>
  )
}
