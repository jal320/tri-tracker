'use client'

import { useEffect, useState } from 'react'

function pad(n: number) { return String(n).padStart(2, '0') }

export function RaceBanner() {
  const [countdown, setCountdown] = useState({ days: 0, hrs: 0, min: 0, sec: 0 })

  useEffect(() => {
    function tick() {
      const diff = new Date('2026-06-08T07:00:00').getTime() - Date.now()
      if (diff <= 0) return
      setCountdown({
        days: Math.floor(diff / 86400000),
        hrs: Math.floor((diff % 86400000) / 3600000),
        min: Math.floor((diff % 3600000) / 60000),
        sec: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '0.5px solid var(--color-border)',
      borderRadius: '12px',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '4px', background: 'var(--color-brand)',
      }} />
      <div style={{ paddingLeft: '8px' }}>
        <div style={{
          fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--color-brand)', marginBottom: '4px',
        }}>
          Next race · 70.3
        </div>
        <div style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontSize: '26px', fontWeight: 700,
          color: 'var(--color-text-1)', letterSpacing: '0.02em',
        }}>
          Eagleman 70.3 — Cambridge, MD
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-2)', marginTop: '2px' }}>
          June 8, 2025 · 1.2mi swim / 56mi bike / 13.1mi run
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
        {[
          { val: countdown.days, label: 'days', raw: true },
          { val: countdown.hrs, label: 'hrs' },
          { val: countdown.min, label: 'min' },
          { val: countdown.sec, label: 'sec' },
        ].map((unit, i) => (
          <div key={unit.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {i > 0 && (
              <span style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontSize: '28px', fontWeight: 300,
                color: 'var(--color-text-3)', marginBottom: '12px',
              }}>:</span>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontSize: '36px', fontWeight: 700,
                color: 'var(--color-text-1)', lineHeight: 1,
              }}>
                {unit.raw ? unit.val : pad(unit.val)}
              </div>
              <div style={{
                fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--color-text-3)', marginTop: '2px',
              }}>
                {unit.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}