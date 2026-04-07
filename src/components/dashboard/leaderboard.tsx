const ATHLETES = [
  { initials: 'JL', name: 'Jake L.', tss: 342, color: '#1D9E75', bg: '#E1F5EE', isMe: true },
  { initials: 'MR', name: 'Mike R.', tss: 298, color: '#185FA5', bg: '#E6F1FB', isMe: false },
  { initials: 'AS', name: 'Alex S.', tss: 211, color: '#993C1D', bg: '#FAECE7', isMe: false },
]

export function Leaderboard() {
  const max = ATHLETES[0].tss
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
        Weekly leaderboard
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {ATHLETES.map((a, i) => (
          <div key={a.name} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', borderRadius: '8px',
            background: a.isMe ? 'var(--color-bike-light)' : 'var(--color-surface-2)',
            border: a.isMe ? '0.5px solid #9FE1CB' : '0.5px solid transparent',
          }}>
            <div style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: '17px', fontWeight: 700, width: '18px', textAlign: 'center',
              color: a.isMe ? 'var(--color-brand)' : 'var(--color-text-3)',
            }}>
              {i + 1}
            </div>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: a.bg, color: a.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 500, flexShrink: 0,
            }}>
              {a.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)', marginBottom: '3px' }}>
                {a.name} {a.isMe && <span style={{ fontSize: '11px', color: 'var(--color-brand)' }}>(you)</span>}
              </div>
              <div style={{ height: '3px', background: 'var(--color-surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(a.tss / max) * 100}%`,
                  background: a.color, borderRadius: '2px',
                }} />
              </div>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-2)', flexShrink: 0 }}>
              {a.tss}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: '10px', paddingTop: '10px',
        borderTop: '0.5px solid var(--color-border)',
        fontSize: '12px', color: 'var(--color-text-3)',
      }}>
        Week of Apr 1–7 · TSS = Training Stress Score
      </div>
    </div>
  )
}
