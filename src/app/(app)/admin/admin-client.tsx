'use client'

import { useState } from 'react'

interface Member {
  id: string
  full_name: string | null
  email: string | null
  role: string
  created_at: string
  strava_connected_at: string | null
  strava_last_synced_at: string | null
  onboarding_complete: boolean
  last_sign_in: string | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const AVATAR_COLORS = ['#1D9E75', '#185FA5', '#993C1D', '#7F77DD', '#854F0B']

function Avatar({ name, email, index }: { name: string; email: string; index: number }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%',
      background: AVATAR_COLORS[index % AVATAR_COLORS.length],
      color: '#fff', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '13px', fontWeight: 500, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export function AdminClient({ members, currentUserId }: {
  members: Member[]
  currentUserId: string
}) {
  const [activeTab, setActiveTab] = useState<'users' | 'stats'>('users')
  const [updating, setUpdating] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  async function updateRole(userId: string, role: string) {
    setUpdating(userId)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    })
    setUpdating(null)
    window.location.reload()
  }

  async function removeUser(userId: string) {
    setUpdating(userId)
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    setUpdating(null)
    setConfirmRemove(null)
    window.location.reload()
  }

  const stravaConnected = members.filter(m => m.strava_connected_at).length
  const onboarded = members.filter(m => m.onboarding_complete).length
  const activeThisWeek = members.filter(m => {
    if (!m.last_sign_in) return false
    return Date.now() - new Date(m.last_sign_in).getTime() < 7 * 86400000
  }).length

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontSize: '32px', fontWeight: 700, color: 'var(--color-text-1)', marginBottom: '4px',
        }}>
          Admin
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
          Manage your Brickhaus group
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Total members', value: members.length },
          { label: 'Strava connected', value: stravaConnected },
          { label: 'Onboarded', value: onboarded },
          { label: 'Active this week', value: activeThisWeek },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px', padding: '16px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '6px' }}>
              {s.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: '32px', fontWeight: 700, color: 'var(--color-brand)',
            }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--color-border)', marginBottom: '20px' }}>
        {[
          { key: 'users', label: 'Users' },
          { key: 'stats', label: 'Login stats' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
            fontSize: '13px', fontWeight: 500, padding: '10px 16px',
            background: 'transparent', border: 'none',
            borderBottom: activeTab === tab.key ? '2px solid var(--color-brand)' : '2px solid transparent',
            color: activeTab === tab.key ? 'var(--color-brand)' : 'var(--color-text-2)',
            cursor: 'pointer', marginBottom: '-0.5px',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {members.map((m, i) => {
            const isMe = m.id === currentUserId
            return (
              <div key={m.id} style={{
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '12px', padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: '14px',
              }}>
                <Avatar name={m.full_name || ''} email={m.email || ''} index={i} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-1)' }}>
                      {m.full_name || m.email?.split('@')[0]}
                    </span>
                    {isMe && <span style={{ fontSize: '11px', color: 'var(--color-brand)' }}>(you)</span>}
                    <span style={{
                      fontSize: '11px', fontWeight: 500, padding: '1px 7px',
                      borderRadius: '20px',
                      background: m.role === 'admin' ? 'var(--color-bike-light)' : 'var(--color-surface-2)',
                      color: m.role === 'admin' ? 'var(--color-brand)' : 'var(--color-text-3)',
                    }}>
                      {m.role}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>{m.email}</div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
                      Joined {formatDateShort(m.created_at)}
                    </span>
                    <span style={{ fontSize: '11px', color: m.strava_connected_at ? 'var(--color-brand)' : 'var(--color-text-3)' }}>
                      {m.strava_connected_at ? '✓ Strava connected' : '✗ Strava not connected'}
                    </span>
                    <span style={{ fontSize: '11px', color: m.onboarding_complete ? 'var(--color-brand)' : 'var(--color-text-3)' }}>
                      {m.onboarding_complete ? '✓ Onboarded' : '✗ Not onboarded'}
                    </span>
                  </div>
                </div>

                {!isMe && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <select
                      value={m.role}
                      onChange={e => updateRole(m.id, e.target.value)}
                      disabled={updating === m.id}
                      style={{
                        padding: '6px 10px', borderRadius: '6px',
                        border: '0.5px solid var(--color-border-2)',
                        background: 'var(--color-surface-2)',
                        color: 'var(--color-text-1)', fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => setConfirmRemove(m.id)}
                      disabled={updating === m.id}
                      style={{
                        padding: '6px 12px', borderRadius: '6px',
                        border: '0.5px solid var(--color-run)',
                        background: 'transparent', color: 'var(--color-run)',
                        fontSize: '12px', cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {members.map((m, i) => (
            <div key={m.id} style={{
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '12px', padding: '16px 18px',
              display: 'grid', gridTemplateColumns: '200px 1fr 1fr 1fr',
              gap: '16px', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar name={m.full_name || ''} email={m.email || ''} index={i} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)' }}>
                    {m.full_name || m.email?.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>{m.role}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-3)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last sign in</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-1)' }}>{formatDateShort(m.last_sign_in)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-3)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Strava sync</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-1)' }}>{formatDateShort(m.strava_last_synced_at)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-3)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Member since</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-1)' }}>{formatDate(m.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm remove modal */}
      {confirmRemove && (
        <div onClick={() => setConfirmRemove(null)} style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '16px', padding: '24px',
            width: '100%', maxWidth: '400px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: '22px', fontWeight: 700,
              color: 'var(--color-text-1)', marginBottom: '8px',
            }}>
              Remove member?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-2)', marginBottom: '20px', lineHeight: 1.5 }}>
              This will remove their access to Brickhaus. Their data will remain in the database but they won't be able to sign in.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmRemove(null)} style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                border: '0.5px solid var(--color-border-2)',
                background: 'transparent', color: 'var(--color-text-2)',
                fontSize: '14px', cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={() => removeUser(confirmRemove)} style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                border: 'none', background: 'var(--color-run)',
                color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              }}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
