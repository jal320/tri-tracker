interface PlannedWorkout {
  sport: string
  title: string
  duration_s: number | null
  zone: number | null
  tss_estimate: number | null
  swim_distance_m: number | null
  bike_distance_m: number | null
  run_distance_m: number | null
}

const SPORT_COLORS: Record<string, string> = {
  swim: 'var(--color-swim)',
  bike: 'var(--color-bike)',
  run:  'var(--color-run)',
}

const SPORT_BG: Record<string, string> = {
  swim: 'var(--color-swim-light)',
  bike: 'var(--color-bike-light)',
  run:  'var(--color-run-light)',
}

const ZONE_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Recovery',  color: '#185FA5', bg: 'var(--color-swim-light)' },
  2: { label: 'Zone 2',    color: '#0F6E56', bg: 'var(--color-bike-light)' },
  3: { label: 'Tempo',     color: '#854F0B', bg: '#FAEEDA' },
  4: { label: 'Threshold', color: '#993C1D', bg: 'var(--color-run-light)' },
  5: { label: 'VO2 Max',   color: '#A32D2D', bg: '#FCEBEB' },
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

function formatDistance(workout: PlannedWorkout): string {
  if (workout.sport === 'swim' && workout.swim_distance_m) {
    return `${Math.round(workout.swim_distance_m * 1.094).toLocaleString()} yds`
  }
  if (workout.sport === 'bike' && workout.bike_distance_m) {
    return `${(workout.bike_distance_m / 1609.34).toFixed(1)} mi`
  }
  if (workout.sport === 'run' && workout.run_distance_m) {
    return `${(workout.run_distance_m / 1609.34).toFixed(1)} mi`
  }
  return ''
}

function WorkoutTile({ workout }: { workout: PlannedWorkout }) {
  const color = SPORT_COLORS[workout.sport] ?? 'var(--color-text-3)'
  const bg    = SPORT_BG[workout.sport]    ?? 'var(--color-surface-2)'
  const zone  = workout.zone ? ZONE_LABELS[workout.zone] : null
  const dist  = formatDistance(workout)

  return (
    <div style={{
      background: bg,
      border: `0.5px solid ${color}`,
      borderRadius: '8px',
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: color, flexShrink: 0,
        }} />
        <span style={{
          fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--color-text-2)',
        }}>
          {workout.sport}
        </span>
      </div>
      <div style={{
        fontSize: '14px', fontWeight: 500,
        color: 'var(--color-text-1)', lineHeight: 1.3, marginBottom: '5px',
      }}>
        {workout.title}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>
        {dist && `${dist} · `}{formatDuration(workout.duration_s)}
        {workout.tss_estimate ? ` · ${Math.round(workout.tss_estimate)} TSS` : ''}
      </div>
      {zone && (
        <div style={{
          display: 'inline-block', marginTop: '6px',
          fontSize: '11px', fontWeight: 500,
          padding: '2px 8px', borderRadius: '20px',
          background: zone.bg, color: zone.color,
        }}>
          {zone.label}
        </div>
      )}
    </div>
  )
}

export function TodaysPlan({ workouts }: { workouts: PlannedWorkout[] }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })

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
        Today's plan — {today}
      </div>

      {workouts.length === 0 ? (
        <div style={{
          fontSize: '13px', color: 'var(--color-text-3)',
          padding: '8px 0',
        }}>
          No workouts planned for today.{' '}
          <a href="/training" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>
            Add one in Training →
          </a>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(workouts.length, 3)}, 1fr)`,
          gap: '10px',
        }}>
          {workouts.map((w, i) => (
            <WorkoutTile key={i} workout={w} />
          ))}
        </div>
      )}
    </div>
  )
}
