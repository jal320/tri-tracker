interface Activity {
  id: string
  sport: string
  name: string
  distance_m: number | null
  moving_time_s: number | null
  start_time: string
  avg_hr: number | null
  tss: number | null
  suffer_score: number | null
}

const SPORT_EMOJI: Record<string, string> = { swim: '🏊', bike: '🚴', run: '🏃', other: '🏅' }
const SPORT_BG: Record<string, string> = {
  swim: 'var(--color-swim-light)',
  bike: 'var(--color-bike-light)',
  run: 'var(--color-run-light)',
  other: 'var(--color-surface-2)',
}

function formatDistance(sport: string, meters: number | null, units = 'imperial'): string {
  if (!meters) return '—'
  if (sport === 'swim') {
    return units === 'imperial'
      ? `${Math.round(meters * 1.094).toLocaleString()} yds`
      : `${Math.round(meters)} m`
  }
  return units === 'imperial'
    ? `${(meters / 1609.34).toFixed(1)} mi`
    : `${(meters / 1000).toFixed(1)} km`
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function RecentActivities({
  activities,
  onConnectStrava,
}: {
  activities: Activity[]
  onConnectStrava?: () => void
}) {
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

      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '12px' }}>
            No activities yet. Connect Strava to sync your training.
          </div>
          <a href="/api/strava/auth" style={{
            display: 'inline-block', padding: '8px 16px', borderRadius: '8px',
            background: '#FC4C02', color: '#fff',
            fontSize: '13px', fontWeight: 500, textDecoration: 'none',
          }}>
            Connect Strava
          </a>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activities.slice(0, 4).map((a, i) => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 0',
                borderBottom: i < Math.min(activities.length, 4) - 1
                  ? '0.5px solid var(--color-border)' : 'none',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: SPORT_BG[a.sport] || SPORT_BG.other,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', flexShrink: 0,
                }}>
                  {SPORT_EMOJI[a.sport] || SPORT_EMOJI.other}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>
                    {formatDistance(a.sport, a.distance_m)} · {formatDuration(a.moving_time_s)} · {formatDate(a.start_time)}
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)', flexShrink: 0 }}>
                  {a.suffer_score ? `${a.suffer_score} SS` : '—'}
                </div>
              </div>
            ))}
          </div>
          <a href="/activities" style={{
            display: 'block', marginTop: '12px', textAlign: 'center',
            fontSize: '13px', color: 'var(--color-brand)', textDecoration: 'none',
            padding: '6px', borderRadius: '6px',
          }}>
            View all activities →
          </a>
        </>
      )}
    </div>
  )
}
