'use client'

import { useEffect, useState } from 'react'

const DISTANCE_LABELS: Record<string, string> = {
  sprint: '0.47mi swim / 12.4mi bike / 3.1mi run',
  olympic: '0.93mi swim / 24.8mi bike / 6.2mi run',
  '70.3': '1.2mi swim / 56mi bike / 13.1mi run',
  '140.6': '2.4mi swim / 112mi bike / 26.2mi run',
}

export interface NextRace {
  name: string
  location: string | null
  race_date: string
  distance_type: string
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function RaceBanner({ race }: { race: NextRace | null }) {
  const [countdown, setCountdown] = useState({ days: 0, hrs: 0, min: 0, sec: 0 })

  useEffect(() => {
    if (!race) return
    function tick() {
      const diff = new Date(race!.race_date + 'T07:00:00').getTime() - Date.now()
      if (diff <= 0) return
      setCountdown({
        days: Math.floor(diff / 86400000),
        hrs:  Math.floor((diff % 86400000) / 3600000),
        min:  Math.floor((diff % 3600000) / 60000),
        sec:  Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [race])

  if (!race) return null

  const distanceLabel = DISTANCE_LABELS[race.distance_type] ?? race.distance_type
  const raceDate = new Date(race.race_date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

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
          Next race · {race.distance_type}
        </div>
        <div style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontSize: '26px', fontWeight: 700,
          color: 'var(--color-text-1)', letterSpacing: '0.02em',
        }}>
          {race.name}{race.location ? ` — ${race.location}` : ''}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-2)', marginTop: '2px' }}>
          {raceDate} · {distanceLabel}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
        {[
          { val: countdown.days, label: 'days', raw: true },
          { val: countdown.hrs,  label: 'hrs' },
          { val: countdown.min,  label: 'min' },
          { val: countdown.sec,  label: 'sec' },
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
