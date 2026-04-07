'use client'

import { useState } from 'react'

interface Race {
  id: string
  name: string
  location: string | null
  race_date: string
  distance_type: string
  goal_type: string | null
  goal_finish_time_s: number | null
  goal_swim_s: number | null
  goal_t1_s: number | null
  goal_bike_s: number | null
  goal_t2_s: number | null
  goal_run_s: number | null
  projected_swim_s: number | null
  projected_t1_s: number | null
  projected_bike_s: number | null
  projected_t2_s: number | null
  projected_run_s: number | null
  is_group_race: boolean
  created_by: string
}

function formatTime(seconds: number | null): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

function pad(n: number) { return String(n).padStart(2, '0') }

function Countdown({ raceDate }: { raceDate: string }) {
  const [tick, setTick] = useState(0)

  if (typeof window !== 'undefined') {
    setTimeout(() => setTick(t => t + 1), 1000)
  }

  const diff = new Date(raceDate).getTime() - Date.now()
  if (diff <= 0) return <span style={{ color: 'var(--color-brand)', fontWeight: 500 }}>Race day!</span>

  const days = Math.floor(diff / 86400000)
  const hrs = Math.floor((diff % 86400000) / 3600000)
  const min = Math.floor((diff % 3600000) / 60000)
  const sec = Math.floor((diff % 60000) / 1000)

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {[
        { val: days, label: 'days', raw: true },
        { val: hrs, label: 'hrs' },
        { val: min, label: 'min' },
        { val: sec, label: 'sec' },
      ].map((u, i) => (
        <div key={u.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && <span style={{ color: 'var(--color-text-3)', fontSize: '18px', marginBottom: '8px' }}>:</span>}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: '28px', fontWeight: 700,
              color: 'var(--color-text-1)', lineHeight: 1,
            }}>
              {u.raw ? u.val : pad(u.val)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {u.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SplitRow({ label, goal, projected, color }: {
  label: string
  goal: number | null
  projected: number | null
  color: string
}) {
  const diff = goal && projected ? projected - goal : null
  const ahead = diff !== null && diff < 0

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '80px 1fr 1fr 80px',
      gap: '12px', alignItems: 'center',
      padding: '10px 0',
      borderBottom: '0.5px solid var(--color-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)' }}>{label}</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-barlow-condensed)',
        fontSize: '18px', fontWeight: 600, color: 'var(--color-text-1)',
      }}>
        {formatTime(goal)}
      </div>
      <div style={{
        fontFamily: 'var(--font-barlow-condensed)',
        fontSize: '18px', fontWeight: 600,
        color: projected ? (ahead ? 'var(--color-brand)' : 'var(--color-run)') : 'var(--color-text-3)',
      }}>
        {formatTime(projected) || 'No data yet'}
      </div>
      {diff !== null && (
        <div style={{
          fontSize: '12px', fontWeight: 500, textAlign: 'right',
          color: ahead ? 'var(--color-brand)' : 'var(--color-run)',
        }}>
          {ahead ? '−' : '+'}{formatTime(Math.abs(diff))}
        </div>
      )}
    </div>
  )
}

function AddRaceModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const [form, setForm] = useState({
    name: '', location: '', race_date: '',
    distance_type: '70.3', goal_type: 'target_time',
    goal_finish_time_s: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.name || !form.race_date) return
    setSaving(true)

    const totalSeconds = form.goal_finish_time_s
      ? parseInt(form.goal_finish_time_s.split(':')[0]) * 3600 +
        parseInt(form.goal_finish_time_s.split(':')[1] || '0') * 60
      : null

    const res = await fetch('/api/races', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        goal_finish_time_s: totalSeconds,
        is_group_race: true,
      }),
    })

    setSaving(false)
    if (res.ok) {
      onClose()
      window.location.reload()
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--color-surface)',
        border: '0.5px solid var(--color-border)',
        borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '480px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{
            fontFamily: 'var(--font-barlow-condensed)',
            fontSize: '22px', fontWeight: 700, color: 'var(--color-text-1)',
          }}>
            Add race
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { label: 'Race name', key: 'name', placeholder: 'Patriot Half' },
            { label: 'Location', key: 'location', placeholder: 'East Freetown, MA' },
            { label: 'Race date', key: 'race_date', placeholder: '', type: 'date' },
            { label: 'Goal time (h:mm)', key: 'goal_finish_time_s', placeholder: '5:00' },
          ].map(field => (
            <div key={field.key}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 500,
                color: 'var(--color-text-2)', marginBottom: '6px',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {field.label}
              </label>
              <input
                type={field.type || 'text'}
                placeholder={field.placeholder}
                value={(form as any)[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  border: '0.5px solid var(--color-border-2)',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-1)', fontSize: '14px',
                }}
              />
            </div>
          ))}

          <div>
            <label style={{
              display: 'block', fontSize: '12px', fontWeight: 500,
              color: 'var(--color-text-2)', marginBottom: '6px',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Distance
            </label>
            <select
              value={form.distance_type}
              onChange={e => setForm(f => ({ ...f, distance_type: e.target.value }))}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: '0.5px solid var(--color-border-2)',
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-1)', fontSize: '14px',
              }}
            >
              <option value="sprint">Sprint</option>
              <option value="olympic">Olympic</option>
              <option value="70.3">70.3 Half Iron</option>
              <option value="140.6">140.6 Full Iron</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.race_date}
            style={{
              padding: '10px', borderRadius: '8px',
              background: 'var(--color-brand)', border: 'none',
              color: '#fff', fontSize: '14px', fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving || !form.name || !form.race_date ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Add race'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function RacesClient({ races, userId }: { races: Race[]; userId: string }) {
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Race | null>(races[0] || null)

  const upcoming = races.filter(r => new Date(r.race_date + 'T12:00:00') >= new Date())
  const past = races.filter(r => new Date(r.race_date + 'T12:00:00') < new Date())

  const splits = selected ? [
    { label: 'Swim', goal: selected.goal_swim_s, projected: selected.projected_swim_s, color: 'var(--color-swim)' },
    { label: 'T1', goal: selected.goal_t1_s, projected: selected.projected_t1_s, color: 'var(--color-text-3)' },
    { label: 'Bike', goal: selected.goal_bike_s, projected: selected.projected_bike_s, color: 'var(--color-bike)' },
    { label: 'T2', goal: selected.goal_t2_s, projected: selected.projected_t2_s, color: 'var(--color-text-3)' },
    { label: 'Run', goal: selected.goal_run_s, projected: selected.projected_run_s, color: 'var(--color-run)' },
  ] : []

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontSize: '32px', fontWeight: 700, color: 'var(--color-text-1)',
        }}>
          Races
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: '8px 16px', borderRadius: '8px',
            background: 'var(--color-brand)', border: 'none',
            color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}
        >
          + Add race
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', alignItems: 'start' }}>
        <div>
          {upcoming.length > 0 && (
            <>
              <div style={{
                fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '8px',
              }}>
                Upcoming
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {upcoming.map(r => {
                  const daysOut = Math.ceil((new Date(r.race_date + 'T12:00:00').getTime() - Date.now()) / 86400000)
                  const isSelected = selected?.id === r.id
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelected(r)}
                      style={{
                        background: isSelected ? 'var(--color-bike-light)' : 'var(--color-surface)',
                        border: isSelected ? '0.5px solid var(--color-brand)' : '0.5px solid var(--color-border)',
                        borderRadius: '10px', padding: '12px 14px', cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)', marginBottom: '3px' }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-2)', marginBottom: '6px' }}>
                        {r.location} · {new Date(r.race_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 500, padding: '2px 8px',
                          borderRadius: '20px', background: 'var(--color-bike-light)',
                          color: 'var(--color-brand)',
                        }}>
                          {r.distance_type}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
                          {daysOut}d away
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <div style={{
                fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '8px',
              }}>
                Past
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {past.map(r => (
                  <div
                    key={r.id}
                    onClick={() => setSelected(r)}
                    style={{
                      background: selected?.id === r.id ? 'var(--color-surface-2)' : 'var(--color-surface)',
                      border: '0.5px solid var(--color-border)',
                      borderRadius: '10px', padding: '12px 14px', cursor: 'pointer',
                      opacity: 0.7,
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)', marginBottom: '3px' }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>
                      {r.location} · {new Date(r.race_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {selected && (
          <div>
            <div style={{
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '12px', padding: '20px 24px',
              marginBottom: '14px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: '4px', background: 'var(--color-brand)',
              }} />
              <div style={{ paddingLeft: '8px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--color-brand)', marginBottom: '4px',
                }}>
                  {selected.distance_type}
                </div>
                <div style={{
                  fontFamily: 'var(--font-barlow-condensed)',
                  fontSize: '28px', fontWeight: 700, color: 'var(--color-text-1)',
                  marginBottom: '2px',
                }}>
                  {selected.name}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '16px' }}>
                  {selected.location} · {new Date(selected.race_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <Countdown raceDate={selected.race_date} />
              </div>
            </div>

            <div style={{
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '12px', padding: '20px 24px',
              marginBottom: '14px',
            }}>
              <div style={{
                fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '16px',
              }}>
                Split projections
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '80px 1fr 1fr 80px',
                gap: '12px', marginBottom: '8px',
              }}>
                <div />
                <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-3)' }}>
                  Goal
                </div>
                <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-3)' }}>
                  Projected
                </div>
                <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-3)', textAlign: 'right' }}>
                  Delta
                </div>
              </div>

              {splits.map(s => (
                <SplitRow key={s.label} {...s} />
              ))}

              <div style={{
                display: 'grid', gridTemplateColumns: '80px 1fr 1fr 80px',
                gap: '12px', paddingTop: '12px', marginTop: '4px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-1)' }}>Total</div>
                <div style={{
                  fontFamily: 'var(--font-barlow-condensed)',
                  fontSize: '22px', fontWeight: 700, color: 'var(--color-text-1)',
                }}>
                  {formatTime(selected.goal_finish_time_s)}
                </div>
                <div style={{
                  fontFamily: 'var(--font-barlow-condensed)',
                  fontSize: '22px', fontWeight: 700, color: 'var(--color-text-3)',
                }}>
                  {selected.projected_swim_s ? formatTime(
                    (selected.projected_swim_s || 0) +
                    (selected.projected_t1_s || 0) +
                    (selected.projected_bike_s || 0) +
                    (selected.projected_t2_s || 0) +
                    (selected.projected_run_s || 0)
                  ) : 'No data yet'}
                </div>
              </div>

              <div style={{
                marginTop: '16px', padding: '12px',
                background: 'var(--color-surface-2)', borderRadius: '8px',
                fontSize: '12px', color: 'var(--color-text-2)', lineHeight: 1.5,
              }}>
                Projected splits are calculated from your recent Strava data. Connect more training data for better projections.
              </div>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddRaceModal onClose={() => setShowAdd(false)} userId={userId} />}
    </div>
  )
}
