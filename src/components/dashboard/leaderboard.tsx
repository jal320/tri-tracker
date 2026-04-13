const ENTRY_COLORS = [
  { color: '#185FA5', bg: '#E6F1FB' },
  { color: '#854F0B', bg: '#FAEEDA' },
  { color: '#993C1D', bg: '#FAECE7' },
  { color: '#4A3D8F', bg: '#EEEAF9' },
  { color: '#1D6B47', bg: '#E3F5EC' },
]

interface LeaderboardEntry {
  name: string
  tss: number
  isMe: boolean
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getWeekLabel(): string {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)}–${fmt(sunday)}`
}

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const max = entries[0]?.tss || 1

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

      {entries.length <= 1 ? (
        <div style={{ fontSize: '13px', color: 'var(--color-text-3)', padding: '8px 0' }}>
          Invite friends to compare weekly training.{' '}
          <a href="/community" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>
            See community →
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {entries.slice(0, 5).map((a, i) => {
            const palette = a.isMe
              ? { color: 'var(--color-brand)', bg: 'var(--color-bike-light)' }
              : ENTRY_COLORS[i % ENTRY_COLORS.length]
            return (
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
                  background: palette.bg, color: palette.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 500, flexShrink: 0,
                }}>
                  {getInitials(a.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)', marginBottom: '3px' }}>
                    {a.name}{' '}
                    {a.isMe && <span style={{ fontSize: '11px', color: 'var(--color-brand)' }}>(you)</span>}
                  </div>
                  <div style={{ height: '3px', background: 'var(--color-surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${(a.tss / max) * 100}%`,
                      background: palette.color, borderRadius: '2px',
                    }} />
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-2)', flexShrink: 0 }}>
                  {a.tss}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{
        marginTop: '10px', paddingTop: '10px',
        borderTop: '0.5px solid var(--color-border)',
        fontSize: '12px', color: 'var(--color-text-3)',
      }}>
        Week of {getWeekLabel()} · TSS = Training Stress Score
      </div>
    </div>
  )
}
