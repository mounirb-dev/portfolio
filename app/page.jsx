'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import BadgeCard from '@/components/badge-card'
import ConfigPanel from '@/components/config-panel'
import { PRESETS } from '@/components/presets'
import { Settings2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Page() {
  const [index, setIndex] = useState(0)
  const [data, setData] = useState(PRESETS[0])
  const [showPanel, setShowPanel] = useState(false)
  const itemRefs = useRef([])

  const goTo = useCallback((nextIndex) => {
    setIndex((current) => {
      const base = typeof nextIndex === 'function' ? nextIndex(current) : nextIndex
      const wrapped = (base + PRESETS.length) % PRESETS.length
      setData(PRESETS[wrapped])
      return wrapped
    })
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight') goTo((i) => i + 1)
      if (e.key === 'ArrowLeft') goTo((i) => i - 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goTo])

  useEffect(() => {
    itemRefs.current[index]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [index])

  return (
    <main className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:28px_28px]"
      />

      {/* Badge scene — fills viewport */}
      <div className="absolute inset-0">
        <BadgeCard data={data} />
      </div>

      {/* Company carousel arrows */}
      <button
        onClick={() => goTo(index - 1)}
        className="absolute top-1/2 left-4 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/70 transition-colors hover:bg-white/12"
        aria-label="Previous company"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => goTo(index + 1)}
        className="absolute top-1/2 right-4 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/70 transition-colors hover:bg-white/12"
        aria-label="Next company"
      >
        <ChevronRight size={18} />
      </button>

      {/* Company icon wheel selector */}
      <div className="absolute right-16 bottom-6 left-16 z-20">
        <div className="scrollbar-none flex items-center justify-between gap-1 overflow-x-auto scroll-smooth py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PRESETS.map((preset, i) => {
            const isActive = i === index
            return (
              <button
                key={preset.company}
                ref={(el) => { itemRefs.current[i] = el }}
                onClick={() => goTo(i)}
                aria-label={preset.company}
                title={preset.company}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                  isActive
                    ? 'scale-110 border-white/30 bg-white/12 opacity-100'
                    : 'border-white/8 bg-white/4 opacity-45 hover:opacity-80'
                }`}
                style={isActive ? { boxShadow: `0 0 0 1px ${preset.colors.accentColor}55` } : undefined}
              >
                {preset.logoImage ? (
                  <img
                    src={preset.logoImage}
                    alt=""
                    className={`h-6 w-6 object-contain ${preset.logoInvert ? '[filter:invert(1)_brightness(1.15)]' : ''}`}
                    draggable={false}
                  />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: preset.colors.accentColor }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Customize button + panel */}
      <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-3">
        <button
          onClick={() => setShowPanel((v) => !v)}
          className={`flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 font-mono text-xs tracking-widest text-white/70 transition-colors ${
            showPanel ? 'bg-white/12' : 'bg-white/6'
          }`}
          aria-label="Toggle customization panel"
        >
          <Settings2 size={13} />
          {showPanel ? 'CLOSE' : 'CUSTOMIZE'}
        </button>

        {showPanel && (
          <div className="max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl border border-white/8 bg-[#121212]/95 p-5 backdrop-blur-lg">
            <ConfigPanel data={data} onChange={setData} />
          </div>
        )}
      </div>
    </main>
  )
}
