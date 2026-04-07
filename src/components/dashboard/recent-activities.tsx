const ACTIVITIES = [
  { sport: 'bike', name: 'Monday endurance ride', meta: '42.1 mi · 2h 18min · Mon', tss: 68 },
  { sport: 'run', name: 'Easy recovery run', meta: '4.8 mi · 44min · Mon', tss: 38 },
  { sport: 'swim', name: 'Masters swim — speed', meta: '3,200 yds · 65min · Sun', tss: 55 },
  { sport: 'bike', name: 'Long ride w/ brick run', meta: '58.4 mi · 3h 05min · Sat', tss: 118 },
]

const SPORT_EMOJI: Record<string, string> = { swim: '🏊', bike: '🚴', run: '🏃' }
const SPORT_BG: Record<string, string> = {
  swim: 'var(--color-swim-light)',
  bike: 'var(--color-bike-light)',
  run: 'var(--color-run-light)',
}

export function RecentActivities() {
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
        Recent activities
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {ACTIVITIES.map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 0',
            borderBottom: i < ACTIVITIES.length - 1 ? '0.5px solid var(--color-border)' : 'none',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: SPORT_BG[a.sport],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', flexShrink: 0,
            }}>
              {SPORT_EMOJI[a.sport]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {a.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>{a.meta}</div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)', flexShrink: 0 }}>
              {a.tss} TSS
            </div>
          </div>
        ))}
      </div>
      <button style={{
        marginTop: '12px', width: '100%', padding: '8px', borderRadius: '8px',
        background: '#FC4C02', border: 'none', color: '#fff',
        fontSize: '13px', fontWeight: 500, cursor: 'pointer',
      }}>
        Connect Strava
      </button>
    </div>
  )
}
