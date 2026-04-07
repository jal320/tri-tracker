interface DayData {
  label: string
  isToday?: boolean
  swim: number
  bike: number
  run: number
  tss: number
}

export function WeeklyOverview({ days }: { days: DayData[] }) {
  const max = Math.max(...days.map(d => d.swim + d.bike + d.run), 1)
  const totalTss = days.reduce((sum, d) => sum + d.tss, 0)

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
        This week
      </div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {days.map((day) => {
          const total = day.swim + day.bike + day.run
          const swimH = day.swim ? (day.swim / max) * 48 : 0
          const bikeH = day.bike ? (day.bike / max) * 48 : 0
          const runH = day.run ? (day.run / max) * 48 : 0
          return (
            <div key={day.label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                fontSize: '11px', fontWeight: 500, marginBottom: '4px',
                color: day.isToday ? 'var(--color-brand)' : 'var(--color-text-3)',
              }}>
                {day.label}{day.isToday ? ' ▸' : ''}
              </div>
              <div style={{
                height: '48px', display: 'flex',
                alignItems: 'flex-end', justifyContent: 'center', gap: '2px',
              }}>
                {swimH > 0 && <div style={{ width: '8px', height: `${swimH}px`, background: 'var(--color-swim)', borderRadius: '2px 2px 0 0' }} />}
                {bikeH > 0 && <div style={{ width: '8px', height: `${bikeH}px`, background: 'var(--color-bike)', borderRadius: '2px 2px 0 0' }} />}
                {runH > 0 && <div style={{ width: '8px', height: `${runH}px`, background: 'var(--color-run)', borderRadius: '2px 2px 0 0' }} />}
                {total === 0 && <div style={{ width: '2px', height: '4px', background: 'var(--color-border-2)', borderRadius: '1px', marginBottom: '2px' }} />}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-3)', marginTop: '3px' }}>
                {day.tss > 0 ? day.tss : '—'}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: '10px', borderTop: '0.5px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { label: 'Swim', color: 'var(--color-swim)' },
            { label: 'Bike', color: 'var(--color-bike)' },
            { label: 'Run', color: 'var(--color-run)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-2)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)' }}>
          {totalTss} TSS this week
        </div>
      </div>
    </div>
  )
}
