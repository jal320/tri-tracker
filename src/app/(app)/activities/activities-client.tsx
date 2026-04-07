'use client'

import { useState } from 'react'
import { estimateTSS } from '@/lib/tss'

interface Activity {
  id: string
  sport: string
  name: string
  distance_m: number | null
  moving_time_s: number | null
  elapsed_time_s: number | null
  start_time: string
  avg_hr: number | null
  max_hr: number | null
  avg_power_w: number | null
  normalized_power_w: number | null
  elevation_gain_m: number | null
  suffer_score: number | null
  strava_map_polyline: string | null
}

const SPORT_EMOJI: Record<string, string> = { swim: '🏊', bike: '🚴', run: '🏃', other: '🏅' }
const SPORT_BG: Record<string, string> = {
  swim: 'var(--color-swim-light)',
  bike: 'var(--color-bike-light)',
  run: 'var(--color-run-light)',
  other: 'var(--color-surface-2)',
}
const SPORT_COLOR: Record<string, string> = {
  swim: 'var(--color-swim)',
  bike: 'var(--color-bike)',
  run: 'var(--color-run)',
  other: 'var(--color-text-3)',
}

function formatDistance(sport: string, meters: number | null): string {
  if (!meters) return '—'
  if (sport === 'swim') return `${Math.round(meters * 1.094).toLocaleString()} yds`
  return `${(meters / 1609.34).toFixed(1)} mi`
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`
}

function formatPace(sport: string, meters: number | null, seconds: number | null): string {
  if (!meters || !seconds) return '—'
  if (sport === 'swim') {
    const per100m = (seconds / meters) * 100
    const m = Math.floor(per100m / 60)
    const s = Math.round(per100m % 60)
    return `${m}:${String(s).padStart(2,'0')}/100yd`
  }
  if (sport === 'run') {
    const perMile = (seconds / meters) * 1609.34
    const m = Math.floor(perMile / 60)
    const s = Math.round(perMile % 60)
    return `${m}:${String(s).padStart(2,'0')}/mi`
  }
  if (sport === 'bike') {
    const mph = (meters / seconds) * 2.237
    return `${mph.toFixed(1)} mph`
  }
  return '—'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
}

function ActivityRow({ activity, onDeepDive }: { activity: Activity; onDeepDive: (a: Activity) => void }) {
  const tss = estimateTSS(activity)

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '0.5px solid var(--color-border)',
      borderRadius: '10px',
      padding: '14px 16px',
      display: 'grid',
      gridTemplateColumns: '40px 1fr auto',
      gap: '12px',
      alignItems: 'center',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: SPORT_BG[activity.sport] || SPORT_BG.other,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0,
      }}>
        {SPORT_EMOJI[activity.sport] || SPORT_EMOJI.other}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            fontSize: '14px', fontWeight: 500, color: 'var(--color-text-1)',
          }}>
            {activity.name}
          </span>
          <span style={{
            fontSize: '11px', fontWeight: 500, padding: '1px 7px',
            borderRadius: '20px',
            background: SPORT_BG[activity.sport],
            color: SPORT_COLOR[activity.sport],
            textTransform: 'capitalize',
          }}>
            {activity.sport}
          </span>
        </div>
        <div style={{
          display: 'flex', gap: '16px', flexWrap: 'wrap',
          fontSize: '12px', color: 'var(--color-text-2)',
        }}>
          <span>{formatDate(activity.start_time)}</span>
          <span>{formatDistance(activity.sport, activity.distance_m)}</span>
          <span>{formatDuration(activity.moving_time_s)}</span>
          <span>{formatPace(activity.sport, activity.distance_m, activity.moving_time_s)}</span>
          {activity.avg_hr && <span>❤ {activity.avg_hr} bpm</span>}
          {activity.elevation_gain_m && activity.sport !== 'swim' && (
            <span>↑ {Math.round(activity.elevation_gain_m * 3.281)} ft</span>
          )}
          <span style={{ color: 'var(--color-brand)', fontWeight: 500 }}>{tss} TSS</span>
        </div>
      </div>

      <button
        onClick={() => onDeepDive(activity)}
        style={{
          padding: '6px 14px', borderRadius: '6px',
          border: '0.5px solid var(--color-border-2)',
          background: 'transparent', color: 'var(--color-text-2)',
          fontSize: '12px', fontWeight: 500, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Deep Dive
      </button>
    </div>
  )
}

function DeepDiveModal({ activity, onClose }: { activity: Activity; onClose: () => void }) {
  const tss = estimateTSS(activity)

  const stats = [
    { label: 'Distance', value: formatDistance(activity.sport, activity.distance_m) },
    { label: 'Moving time', value: formatDuration(activity.moving_time_s) },
    { label: 'Pace / speed', value: formatPace(activity.sport, activity.distance_m, activity.moving_time_s) },
    { label: 'Avg HR', value: activity.avg_hr ? `${activity.avg_hr} bpm` : '—' },
    { label: 'Max HR', value: activity.max_hr ? `${activity.max_hr} bpm` : '—' },
    { label: 'Avg power', value: activity.avg_power_w ? `${Math.round(activity.avg_power_w)}w` : '—' },
    { label: 'Norm power', value: activity.normalized_power_w ? `${Math.round(activity.normalized_power_w)}w` : '—' },
    { label: 'Elevation', value: activity.elevation_gain_m ? `${Math.round(activity.elevation_gain_m * 3.281)} ft` : '—' },
    { label: 'Suffer score', value: activity.suffer_score ? activity.suffer_score.toString() : '—' },
    { label: 'TSS (est.)', value: tss.toString() },
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '16px',
          padding: '24px',
          width: '100%', maxWidth: '560px',
          maxHeight: '80vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>{SPORT_EMOJI[activity.sport]}</span>
              <h2 style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontSize: '22px', fontWeight: 700,
                color: 'var(--color-text-1)',
              }}>
                {activity.name}
              </h2>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
              {formatDate(activity.start_time)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--color-text-3)', fontSize: '20px',
              cursor: 'pointer', padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '10px', marginBottom: '16px',
        }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: 'var(--color-surface-2)',
              borderRadius: '8px', padding: '10px 12px',
            }}>
              <div style={{
                fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--color-text-3)', marginBottom: '4px',
              }}>
                {s.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontSize: '20px', fontWeight: 600,
                color: 'var(--color-text-1)',
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '12px', borderRadius: '8px',
          background: 'var(--color-surface-2)',
          fontSize: '13px', color: 'var(--color-text-2)',
          lineHeight: 1.5,
        }}>
          Full HR/power graphs and lap splits will be available once stream data is synced from Strava.
        </div>
      </div>
    </div>
  )
}

export function ActivitiesClient({ activities }: { activities: Activity[] }) {
  const [filter, setFilter] = useState<'all' | 'swim' | 'bike' | 'run'>('all')
  const [search, setSearch] = useState('')
  const [deepDive, setDeepDive] = useState<Activity | null>(null)

  const filtered = activities.filter(a => {
    if (filter !== 'all' && a.sport !== filter) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    all: activities.length,
    swim: activities.filter(a => a.sport === 'swim').length,
    bike: activities.filter(a => a.sport === 'bike').length,
    run: activities.filter(a => a.sport === 'run').length,
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontSize: '32px', fontWeight: 700,
          color: 'var(--color-text-1)', marginBottom: '4px',
        }}>
          Activities
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
          {activities.length} activities synced from Strava
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'swim', 'bike', 'run'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                fontSize: '12px', fontWeight: 500,
                border: filter === f ? 'none' : '0.5px solid var(--color-border-2)',
                background: filter === f ? 'var(--color-brand)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--color-text-2)',
              }}
            >
              {f === 'all' ? `All (${counts.all})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search activities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '6px 12px', borderRadius: '20px',
            border: '0.5px solid var(--color-border-2)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-1)',
            fontSize: '12px', outline: 'none',
            minWidth: '200px',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px',
            color: 'var(--color-text-2)', fontSize: '14px',
          }}>
            No activities found
          </div>
        ) : (
          filtered.map(a => (
            <ActivityRow key={a.id} activity={a} onDeepDive={setDeepDive} />
          ))
        )}
      </div>

      {deepDive && (
        <DeepDiveModal activity={deepDive} onClose={() => setDeepDive(null)} />
      )}
    </div>
  )
}
