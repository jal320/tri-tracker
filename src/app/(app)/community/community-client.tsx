'use client'

import { useState } from 'react'
import { estimateTSS } from '@/lib/tss'

interface Activity {
  id: string
  user_id: string
  sport: string
  name: string
  distance_m: number | null
  moving_time_s: number | null
  start_time: string
  avg_hr: number | null
  suffer_score: number | null
  avg_power_w: number | null
  normalized_power_w: number | null
  elevation_gain_m: number | null
}

interface Member {
  id: string
  full_name: string | null
  email: string | null
}

interface WeeklyStat {
  userId: string
  name: string
  email: string
  tss: number
  miles: number
  hours: number
  isCurrentUser: boolean
}

interface Race {
  id: string
  name: string
  location: string | null
  race_date: string
  distance_type: string
}

const SPORT_EMOJI: Record<string, string> = { swim: '🏊', bike: '🚴', run: '🏃', other: '🏅' }
const SPORT_BG: Record<string, string> = {
  swim: 'var(--color-swim-light)',
  bike: 'var(--color-bike-light)',
  run: 'var(--color-run-light)',
  other: 'var(--color-surface-2)',
}
const SPORT_COLOR: Record<string, string> = {
  swim: 'var(--color-swim)',
  bike: 'var(--color-bike)',
  run: 'var(--color-run)',
  other: 'var(--color-text-3)',
}

function getInitials(name: string, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = ['#1D9E75', '#185FA5', '#993C1D', '#7F77DD', '#854F0B']

function Avatar({ name, email, index, size = 32 }: { name: string; email: string; index: number; size?: number }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 500, flexShrink: 0,
    }}>
      {getInitials(name, email)}
    </div>
  )
}

function formatDistance(sport: string, meters: number | null): string {
  if (!meters) return '—'
  if (sport === 'swim') return `${Math.round(meters * 1.094).toLocaleString()} yds`
  return `${(meters / 1609.34).toFixed(1)} mi`
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
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ActivityFeed({ activities, members, currentUserId }: {
  activities: Activity[]
  members: Member[]
  currentUserId: string
}) {
  const getMember = (userId: string) => members.find(m => m.id === userId)
  const getMemberIndex = (userId: string) => members.findIndex(m => m.id === userId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-2)', fontSize: '14px' }}>
          No group activities yet. Invite friends to get started.
        </div>
      ) : (
        activities.map(a => {
          const member = getMember(a.user_id)
          const memberIndex = getMemberIndex(a.user_id)
          const tss = estimateTSS(a)
          const isMe = a.user_id === currentUserId

          return (
            <div key={a.id} style={{
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '12px', padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Avatar
                  name={member?.full_name || ''}
                  email={member?.email || ''}
                  index={memberIndex}
                  size={36}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)' }}>
                    {member?.full_name || member?.email?.split('@')[0]} {isMe && <span style={{ fontSize: '11px', color: 'var(--color-brand)' }}>(you)</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{formatDate(a.start_time)}</div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 500, padding: '3px 9px',
                  borderRadius: '20px', background: SPORT_BG[a.sport],
                  color: SPORT_COLOR[a.sport], textTransform: 'capitalize',
                }}>
                  {a.sport}
                </span>
              </div>

              <div style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontSize: '18px', fontWeight: 700,
                color: 'var(--color-text-1)', marginBottom: '10px',
              }}>
                {a.name}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { label: 'Distance', value: formatDistance(a.sport, a.distance_m) },
                  { label: 'Time', value: formatDuration(a.moving_time_s) },
                  { label: 'Avg HR', value: a.avg_hr ? `${a.avg_hr} bpm` : '—' },
                  { label: 'TSS', value: tss.toString() },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'var(--color-surface-2)',
                    borderRadius: '6px', padding: '8px 10px',
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                      {s.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '16px', fontWeight: 600, color: 'var(--color-text-1)' }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function Leaderboard({ weeklyStats, metric }: { weeklyStats: WeeklyStat[]; metric: 'tss' | 'miles' | 'hours' }) {
  const sorted = [...weeklyStats].sort((a, b) => b[metric] - a[metric])
  const max = sorted[0]?.[metric] || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {sorted.map((s, i) => (
        <div key={s.userId} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '8px',
          background: s.isCurrentUser ? 'var(--color-bike-light)' : 'var(--color-surface-2)',
          border: s.isCurrentUser ? '0.5px solid #9FE1CB' : '0.5px solid transparent',
        }}>
          <div style={{
            fontFamily: 'var(--font-barlow-condensed)',
            fontSize: '18px', fontWeight: 700, width: '20px', textAlign: 'center',
            color: s.isCurrentUser ? 'var(--color-brand)' : 'var(--color-text-3)',
          }}>
            {i + 1}
          </div>
          <Avatar name={s.name} email={s.email} index={weeklyStats.findIndex(w => w.userId === s.userId)} size={30} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)', marginBottom: '3px' }}>
              {s.name} {s.isCurrentUser && <span style={{ fontSize: '11px', color: 'var(--color-brand)' }}>(you)</span>}
            </div>
            <div style={{ height: '3px', background: 'var(--color-surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(s[metric] / max) * 100}%`,
                background: 'var(--color-brand)', borderRadius: '2px',
              }} />
            </div>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-2)', flexShrink: 0 }}>
            {metric === 'hours' ? `${s[metric]}h` : metric === 'miles' ? `${s[metric]} mi` : s[metric]}
            {metric === 'tss' && ' TSS'}
          </div>
        </div>
      ))}
    </div>
  )
}

function HeadToHead({ weeklyStats, members, currentUserId }: {
  weeklyStats: WeeklyStat[]
  members: Member[]
  currentUserId: string
}) {
  const others = weeklyStats.filter(s => !s.isCurrentUser)
  const [rivalId, setRivalId] = useState(others[0]?.userId || '')
  const me = weeklyStats.find(s => s.isCurrentUser)
  const rival = weeklyStats.find(s => s.userId === rivalId)

  if (!me || !rival) return (
    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-2)', fontSize: '14px' }}>
      No other members yet to compare with.
    </div>
  )

  const stats = [
    { label: 'Weekly TSS', me: me.tss, them: rival.tss, unit: '' },
    { label: 'Miles', me: me.miles, them: rival.miles, unit: ' mi' },
    { label: 'Hours', me: me.hours, them: rival.hours, unit: 'h' },
  ]

  const meIndex = weeklyStats.findIndex(s => s.isCurrentUser)
  const rivalIndex = weeklyStats.findIndex(s => s.userId === rivalId)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <Avatar name={me.name} email={me.email} index={meIndex} size={52} />
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)', marginTop: '6px' }}>{me.name}</div>
        </div>
        <div style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontSize: '24px', fontWeight: 700, color: 'var(--color-text-3)', flex: 1, textAlign: 'center',
        }}>
          VS
        </div>
        <div style={{ textAlign: 'center' }}>
          <Avatar name={rival.name} email={rival.email} index={rivalIndex} size={52} />
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)', marginTop: '6px' }}>{rival.name}</div>
        </div>
        {others.length > 1 && (
          <select
            value={rivalId}
            onChange={e => setRivalId(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: '8px',
              border: '0.5px solid var(--color-border-2)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-1)', fontSize: '13px',
            }}
          >
            {others.map(o => (
              <option key={o.userId} value={o.userId}>{o.name}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {stats.map(s => {
          const meWins = s.me >= s.them
          const max = Math.max(s.me, s.them, 1)
          return (
            <div key={s.label} style={{
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '10px', padding: '14px 16px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)', marginBottom: '10px' }}>
                {s.label}
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-barlow-condensed)',
                  fontSize: '24px', fontWeight: 700,
                  color: meWins ? 'var(--color-brand)' : 'var(--color-text-2)',
                  minWidth: '60px',
                }}>
                  {s.me}{s.unit}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '2px', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
                    <div style={{ width: `${(s.me / (s.me + s.them)) * 100}%`, background: 'var(--color-brand)' }} />
                    <div style={{ flex: 1, background: '#378ADD' }} />
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-barlow-condensed)',
                  fontSize: '24px', fontWeight: 700,
                  color: !meWins ? '#185FA5' : 'var(--color-text-2)',
                  minWidth: '60px', textAlign: 'right',
                }}>
                  {s.them}{s.unit}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CommunityClient({ activities, members, weeklyStats, races, currentUserId }: {
  activities: Activity[]
  members: Member[]
  weeklyStats: WeeklyStat[]
  races: Race[]
  currentUserId: string
}) {
  const [activeTab, setActiveTab] = useState<'feed' | 'headtohead' | 'races'>('feed')
  const [leaderboardMetric, setLeaderboardMetric] = useState<'tss' | 'miles' | 'hours'>('tss')

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontSize: '32px', fontWeight: 700,
          color: 'var(--color-text-1)', marginBottom: '4px',
        }}>
          Community
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
          {members.length} athlete{members.length !== 1 ? 's' : ''} in your group
        </p>
      </div>

      <div style={{
        display: 'flex', gap: '0',
        borderBottom: '0.5px solid var(--color-border)',
        marginBottom: '20px',
      }}>
        {[
          { key: 'feed', label: 'Activity feed' },
          { key: 'headtohead', label: 'Head-to-head' },
          { key: 'races', label: 'Shared races' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
            fontSize: '13px', fontWeight: 500,
            padding: '10px 16px', background: 'transparent', border: 'none',
            borderBottom: activeTab === tab.key ? '2px solid var(--color-brand)' : '2px solid transparent',
            color: activeTab === tab.key ? 'var(--color-brand)' : 'var(--color-text-2)',
            cursor: 'pointer', marginBottom: '-0.5px',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'start' }}>
        <div>
          {activeTab === 'feed' && (
            <ActivityFeed activities={activities} members={members} currentUserId={currentUserId} />
          )}
          {activeTab === 'headtohead' && (
            <HeadToHead weeklyStats={weeklyStats} members={members} currentUserId={currentUserId} />
          )}
          {activeTab === 'races' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {races.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-2)', fontSize: '14px' }}>
                  No shared races yet. Add races on the Races page.
                </div>
              ) : (
                races.map(r => {
                  const daysOut = Math.ceil((new Date(r.race_date + 'T12:00:00').getTime() - Date.now()) / 86400000)
                  return (
                    <div key={r.id} style={{
                      background: 'var(--color-surface)',
                      border: '0.5px solid var(--color-border)',
                      borderRadius: '12px', padding: '16px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-1)', marginBottom: '4px' }}>
                          {r.name}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                          {r.location} · {new Date(r.race_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '11px', fontWeight: 500, padding: '2px 8px',
                          borderRadius: '20px', background: 'var(--color-bike-light)',
                          color: 'var(--color-brand)', marginBottom: '4px',
                          display: 'inline-block',
                        }}>
                          {r.distance_type}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
                          {daysOut}d away
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        <div>
          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px', padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                Weekly leaderboard
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['tss', 'miles', 'hours'] as const).map(m => (
                  <button key={m} onClick={() => setLeaderboardMetric(m)} style={{
                    fontSize: '11px', fontWeight: 500,
                    padding: '3px 8px', borderRadius: '20px', cursor: 'pointer',
                    background: leaderboardMetric === m ? 'var(--color-brand)' : 'transparent',
                    border: leaderboardMetric === m ? 'none' : '0.5px solid var(--color-border-2)',
                    color: leaderboardMetric === m ? '#fff' : 'var(--color-text-2)',
                    textTransform: 'uppercase',
                  }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <Leaderboard weeklyStats={weeklyStats} metric={leaderboardMetric} />
          </div>
        </div>
      </div>
    </div>
  )
}
