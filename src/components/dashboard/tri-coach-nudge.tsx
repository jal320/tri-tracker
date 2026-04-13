export function TriCoachNudge({ tsb }: { tsb: number }) {
  const rounded = Math.round(tsb)
  const label =
    rounded >= 10  ? 'You are fresh and ready to perform. This is a good week to hit a key session.' :
    rounded >= 0   ? 'You are well-balanced. Maintain your current load and stay consistent.' :
    rounded >= -10 ? `Your TSB is ${rounded} — light fatigue. Keep intensity moderate and sleep well.` :
    rounded >= -20 ? `Your TSB is ${rounded} — moderate fatigue. Consider reducing volume slightly before your next hard day.` :
                     `Your TSB is ${rounded} — you are carrying heavy fatigue. Prioritize recovery before your next hard effort.`

  return (
    <div style={{
      background: 'var(--color-surface-2)',
      border: '0.5px dashed var(--color-border-2)',
      borderRadius: '12px',
      padding: '14px 16px',
      display: 'flex', gap: '12px', alignItems: 'flex-start',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'var(--color-brand)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', flexShrink: 0,
      }}>
        🤖
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)', marginBottom: '4px' }}>
          Tri Coach
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-2)', lineHeight: 1.5, marginBottom: '8px' }}>
          {label}
        </div>
        <a href="/fitness" style={{
          display: 'inline-block',
          fontSize: '12px', padding: '4px 10px', borderRadius: '6px',
          border: '0.5px solid var(--color-border-2)',
          background: 'var(--color-surface)', color: 'var(--color-text-2)',
          textDecoration: 'none',
        }}>
          View full analysis →
        </a>
      </div>
    </div>
  )
}
