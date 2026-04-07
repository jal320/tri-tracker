interface Workout {
    sport: 'swim' | 'bike' | 'run'
    title: string
    duration: string
    distance?: string
    zone?: number
    tss?: number
    isRest?: boolean
  }
  
  const SPORT_COLORS: Record<string, string> = {
    swim: 'var(--color-swim)',
    bike: 'var(--color-bike)',
    run: 'var(--color-run)',
  }
  
  const SPORT_BG: Record<string, string> = {
    swim: 'var(--color-swim-light)',
    bike: 'var(--color-bike-light)',
    run: 'var(--color-run-light)',
  }
  
  const ZONE_LABELS: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: 'Recovery', color: '#185FA5', bg: 'var(--color-swim-light)' },
    2: { label: 'Zone 2', color: '#0F6E56', bg: 'var(--color-bike-light)' },
    3: { label: 'Tempo', color: '#854F0B', bg: '#FAEEDA' },
    4: { label: 'Threshold', color: '#993C1D', bg: 'var(--color-run-light)' },
    5: { label: 'VO2 Max', color: '#A32D2D', bg: '#FCEBEB' },
  }
  
  function WorkoutTile({ workout, active }: { workout: Workout; active?: boolean }) {
    const zone = workout.zone ? ZONE_LABELS[workout.zone] : null
  
    return (
      <div style={{
        background: active ? SPORT_BG[workout.sport] : 'var(--color-surface-2)',
        border: `0.5px solid ${active ? SPORT_COLORS[workout.sport] : 'var(--color-border)'}`,
        borderRadius: '8px',
        padding: '12px 14px',
        opacity: workout.isRest ? 0.5 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: SPORT_COLORS[workout.sport], flexShrink: 0,
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
          {workout.distance && `${workout.distance} · `}{workout.duration}
          {workout.tss && ` · ${workout.tss} TSS`}
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
  
  const SAMPLE_WORKOUTS: Workout[] = [
    { sport: 'swim', title: 'Aerobic base + drills', duration: '50 min', distance: '2,400 yds', zone: 2 },
    { sport: 'bike', title: 'FTP intervals 4×8 min', duration: '1h 15min', tss: 75, zone: 4 },
    { sport: 'run', title: 'Rest day', duration: '—', isRest: true },
  ]
  
  export function TodaysPlan() {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric'
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          {SAMPLE_WORKOUTS.map((w, i) => (
            <WorkoutTile key={i} workout={w} active={i === 1} />
          ))}
        </div>
      </div>
    )
  }