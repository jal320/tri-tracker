export function FitnessStats() {
  const stats = [
    { label: 'CTL', value: '74', delta: '+3 this week', up: true },
    { label: 'ATL', value: '88', delta: '+12 vs CTL', up: false },
    { label: 'TSB', value: '-14', delta: 'moderate fatigue', up: false, warn: true },
    { label: 'Weekly TSS', value: '342', delta: 'of 451 goal', up: true },
  ]
  const trend = [30, 38, 45, 42, 50, 55, 60, 58, 65, 70, 68, 74, 74]

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
            }}>
              {s.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: '24px', fontWeight: 500,
              color: s.warn ? 'var(--color-run)' : 'var(--color-text-1)',
            }}>
              {s.value}
            </div>
            <div style={{
              fontSize: '11px', marginTop: '2px',
              color: s.warn ? 'var(--color-text-3)' : s.up ? 'var(--color-brand)' : 'var(--color-run)',
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
            height: `${(v / 74) * 100}%`,
            background: i === trend.length - 1 ? 'var(--color-brand)' : 'var(--color-bike-light)',
            borderRadius: '2px 2px 0 0',
            opacity: i === trend.length - 1 ? 1 : 0.6,
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
