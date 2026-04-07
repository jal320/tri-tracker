export function TriCoachNudge() {
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
          Your TSB is -14 — you are carrying moderate fatigue. Consider dropping Thursday&apos;s bike to 45 min easy if legs feel heavy after today&apos;s intervals.
        </div>
        <button style={{
          fontSize: '12px', padding: '4px 10px', borderRadius: '6px',
          border: '0.5px solid var(--color-border-2)',
          background: 'var(--color-surface)', color: 'var(--color-text-2)', cursor: 'pointer',
        }}>
          View full analysis →
        </button>
      </div>
    </div>
  )
}
