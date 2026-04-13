'use client'

export function StravaReconnectBanner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      marginBottom: '16px',
      borderRadius: '10px',
      background: 'var(--color-run-light)',
      border: '0.5px solid var(--color-run)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '16px' }}>⚠</span>
        <span style={{ fontSize: '13px', color: 'var(--color-text-1)' }}>
          Strava is not connected — activity data won't sync until you reconnect.
        </span>
      </div>
      <a
        href="/api/strava/auth"
        style={{
          padding: '6px 14px',
          borderRadius: '6px',
          background: '#FC4C02',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 500,
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        Reconnect Strava
      </a>
    </div>
  )
}
