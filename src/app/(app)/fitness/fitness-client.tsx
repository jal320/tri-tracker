'use client'

import { useState } from 'react'

const TOOLTIPS: Record<string, string> = {
  CTL:         'Chronic Training Load — your long-term fitness built over ~42 days. Higher means more fit.',
  ATL:         'Acute Training Load — short-term fatigue from the last ~7 days. Higher means more tired.',
  TSB:         'Training Stress Balance — CTL minus ATL. Positive = fresh and ready. Negative = fatigued.',
  'Today TSS': 'Training Stress Score for today — the total load from all activities completed today.',
}

function InfoIcon({ label }: { label: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block', marginLeft: '5px' }}>
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{
          width: '14px', height: '14px', borderRadius: '50%',
          border: '1px solid var(--color-text-3)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '9px', fontWeight: 600, color: 'var(--color-text-3)',
          cursor: 'default', lineHeight: 1, verticalAlign: 'middle',
        }}
      >
        i
      </div>
      {visible && (
        <div style={{
          position: 'absolute', bottom: '20px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border-2)',
          borderRadius: '8px', padding: '8px 10px',
          fontSize: '12px', color: 'var(--color-text-2)',
          lineHeight: 1.5, width: '200px',
          zIndex: 50, pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {TOOLTIPS[label]}
        </div>
      )}
    </div>
  )
}

interface Snapshot {
  date: string
  ctl: number
  atl: number
  tsb: number
  dailyTSS: number
}

interface Week {
  label: string
  swim: number
  bike: number
  run: number
  total: number
}

interface ZoneData {
  zone: number
  count: number
  pct: number
}

const ZONE_COLORS = ['var(--color-swim)', 'var(--color-bike)', '#EF9F27', 'var(--color-run)', 'var(--color-danger)']
const ZONE_LABELS = ['Zone 1 · Recovery', 'Zone 2 · Aerobic', 'Zone 3 · Tempo', 'Zone 4 · Threshold', 'Zone 5 · VO2 Max']

export function FitnessClient({ snapshots, weeks, zoneData }: {
  snapshots: Snapshot[]
  weeks: Week[]
  zoneData: ZoneData[]
}) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const latest = snapshots[snapshots.length - 1] || { ctl: 0, atl: 0, tsb: 0, dailyTSS: 0 }

  const maxCTL = Math.max(...snapshots.map(s => s.ctl), 1)
  const maxWeekTSS = Math.max(...weeks.map(w => w.total), 1)

  const tsbColor = latest.tsb >= 5 ? 'var(--color-brand)' : latest.tsb <= -20 ? 'var(--color-danger)' : 'var(--color-text-1)'
  const tsbLabel = latest.tsb >= 10 ? 'Fresh & ready' : latest.tsb >= 0 ? 'Balanced' : latest.tsb >= -10 ? 'Light fatigue' : latest.tsb >= -20 ? 'Moderate fatigue' : 'Heavy fatigue'

  return (
    <div>
      <h1 style={{
        fontFamily: 'var(--font-barlow-condensed)',
        fontSize: '32px', fontWeight: 700,
        color: 'var(--color-text-1)', marginBottom: '20px',
      }}>
        Fitness
      </h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'CTL', value: Math.round(latest.ctl), sub: 'Fitness', color: 'var(--color-brand)' },
          { label: 'ATL', value: Math.round(latest.atl), sub: 'Fatigue', color: 'var(--color-swim)' },
          { label: 'TSB', value: Math.round(latest.tsb), sub: tsbLabel, color: tsbColor },
          { label: 'Today TSS', value: Math.round(latest.dailyTSS), sub: 'Training load', color: 'var(--color-run)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px', padding: '16px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
              {s.label}
              <InfoIcon label={s.label} />
            </div>
            <div style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '32px', fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-2)', marginTop: '4px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* CTL/ATL/TSB chart */}
      <div style={{
        background: 'var(--color-surface)',
        border: '0.5px solid var(--color-border)',
        borderRadius: '12px', padding: '16px 18px', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
            90-day fitness trend
          </div>
          <div style={{ display: 'flex', gap: '14px' }}>
            {[
              { label: 'CTL', color: 'var(--color-brand)' },
              { label: 'ATL', color: 'var(--color-swim)' },
              { label: 'TSB', color: 'var(--color-run)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-2)' }}>
                <div style={{ width: '10px', height: '3px', borderRadius: '2px', background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', height: '140px' }}>
          <svg width="100%" height="140" preserveAspectRatio="none" viewBox={`0 0 ${snapshots.length} 140`}>
            {/* Zero line */}
            <line x1="0" y1="70" x2={snapshots.length} y2="70" stroke="var(--color-border-2)" strokeWidth="0.5" strokeDasharray="2,2" />

            {/* TSB area */}
            <polyline
              points={snapshots.map((s, i) => `${i},${70 - (s.tsb / maxCTL) * 60}`).join(' ')}
              fill="none" stroke="var(--color-run)" strokeWidth="1" opacity="0.6"
            />

            {/* ATL line */}
            <polyline
              points={snapshots.map((s, i) => `${i},${140 - (s.atl / maxCTL) * 130}`).join(' ')}
              fill="none" stroke="var(--color-swim)" strokeWidth="1.5" opacity="0.7"
            />

            {/* CTL line */}
            <polyline
              points={snapshots.map((s, i) => `${i},${140 - (s.ctl / maxCTL) * 130}`).join(' ')}
              fill="none" stroke="var(--color-brand)" strokeWidth="2"
            />
          </svg>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>90 days ago</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>today</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Weekly TSS */}
        <div style={{
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '12px', padding: '16px 18px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '16px' }}>
            Weekly TSS — last 12 weeks
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '80px', marginBottom: '8px' }}>
            {weeks.map((w, i) => {
              const swimH = (w.swim / maxWeekTSS) * 80
              const bikeH = (w.bike / maxWeekTSS) * 80
              const runH = (w.run / maxWeekTSS) * 80
              const isLast = i === weeks.length - 1
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '1px', height: '80px' }}>
                  {swimH > 0 && <div style={{ width: '100%', height: `${swimH}px`, background: 'var(--color-swim)', borderRadius: '2px 2px 0 0', opacity: isLast ? 1 : 0.7 }} />}
                  {bikeH > 0 && <div style={{ width: '100%', height: `${bikeH}px`, background: 'var(--color-bike)', opacity: isLast ? 1 : 0.7 }} />}
                  {runH > 0 && <div style={{ width: '100%', height: `${runH}px`, background: 'var(--color-run)', borderRadius: w.swim === 0 && w.bike === 0 ? '2px 2px 0 0' : '0', opacity: isLast ? 1 : 0.7 }} />}
                  {w.total === 0 && <div style={{ width: '2px', height: '2px', background: 'var(--color-border-2)' }} />}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>{weeks[0]?.label}</span>
            <span style={{ fontSize: '11px', color: 'var(--color-brand)', fontWeight: 500 }}>this week</span>
          </div>
        </div>

        {/* Zone distribution */}
        <div style={{
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '12px', padding: '16px 18px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '16px' }}>
            HR zone distribution
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {zoneData.map((z, i) => (
              <div key={z.zone}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>{ZONE_LABELS[i]}</span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)' }}>{z.pct}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--color-surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${z.pct}%`,
                    background: ZONE_COLORS[i], borderRadius: '3px',
                    transition: 'width 0.5s',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
