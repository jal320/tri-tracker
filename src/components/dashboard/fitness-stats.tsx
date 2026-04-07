'use client'

import { useState } from 'react'

const TOOLTIPS: Record<string, string> = {
  CTL: 'Chronic Training Load — your long-term fitness built over ~42 days. Higher = more fit.',
  ATL: 'Acute Training Load — your short-term fatigue from the last ~7 days. Higher = more tired.',
  TSB: 'Training Stress Balance — fitness minus fatigue (CTL minus ATL). Positive = fresh, negative = fatigued.',
  'Weekly TSS': 'Training Stress Score — total training load this week across all sports.',
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

interface FitnessStatsProps {
  ctl: number
  atl: number
  tsb: number
  weeklyTSS: number
  weeklyTSSGoal: number
  trend: number[]
}

export function FitnessStats({ ctl, atl, tsb, weeklyTSS, weeklyTSSGoal, trend }: FitnessStatsProps) {
  const tsbColor = tsb >= 5 ? 'var(--color-brand)' : tsb <= -20 ? 'var(--color-run)' : 'var(--color-text-1)'
  const tsbLabel = tsb >= 10 ? 'fresh & ready' : tsb >= 0 ? 'balanced' : tsb >= -10 ? 'light fatigue' : tsb >= -20 ? 'moderate fatigue' : 'heavy fatigue'

  const stats = [
    { label: 'CTL', value: Math.round(ctl).toString(), delta: 'fitness', up: true },
    { label: 'ATL', value: Math.round(atl).toString(), delta: 'fatigue', up: false },
    { label: 'TSB', value: Math.round(tsb).toString(), delta: tsbLabel, warn: tsb <= -20, color: tsbColor },
    { label: 'Weekly TSS', value: Math.round(weeklyTSS).toString(), delta: `of ${weeklyTSSGoal} goal`, up: weeklyTSS >= weeklyTSSGoal * 0.8 },
  ]

  const maxTrend = Math.max(...trend, 1)

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '0.5px solid var(--color-border)',
      borderRadius: '12px',
      padding: '16px 18px',
      marginBottom: '14px',
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '12px',
      }}>
        Fitness trends
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'var(--color-surface-2)',
            borderRadius: '8px', padding: '10px 12px',
          }}>
            <div style={{
              fontSize: '11px', color: 'var(--color-text-3)', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px',
              display: 'flex', alignItems: 'center',
            }}>
              {s.label}
              <InfoIcon label={s.label} />
            </div>
            <div style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: '24px', fontWeight: 500,
              color: s.color || (s.warn ? 'var(--color-run)' : 'var(--color-text-1)'),
            }}>
              {s.value}
            </div>
            <div style={{
              fontSize: '11px', marginTop: '2px',
              color: s.warn ? 'var(--color-text-3)' : s.up ? 'var(--color-brand)' : 'var(--color-text-3)',
            }}>
              {s.delta}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '52px', marginBottom: '6px' }}>
        {trend.map((v, i) => (
          <div key={i} style={{
            flex: 1,
            height: `${(v / maxTrend) * 100}%`,
            background: i === trend.length - 1 ? 'var(--color-brand)' : 'var(--color-bike-light)',
            borderRadius: '2px 2px 0 0',
            opacity: i === trend.length - 1 ? 1 : 0.6,
            minHeight: '2px',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>13 weeks ago</span>
        <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>today</span>
      </div>
    </div>
  )
}
