'use client'

import { useState } from 'react'
import { estimateTSS } from '@/lib/tss'
import { ImportModal } from './import-modal'

interface PlannedWorkout {
  id: string
  sport: string
  title: string
  planned_date: string
  duration_s: number | null
  zone: number | null
  tss_estimate: number | null
  swim_distance_m: number | null
  bike_distance_m: number | null
  run_distance_m: number | null
  description: string | null
  is_private: boolean
}

interface CompletedWorkout {
  id: string
  sport: string
  name: string
  distance_m: number | null
  moving_time_s: number | null
  start_time: string
  suffer_score: number | null
  avg_hr: number | null
  avg_power_w: number | null
  normalized_power_w: number | null
}

const SPORT_COLORS: Record<string, string> = {
  swim: 'var(--color-swim)',
  bike: 'var(--color-bike)',
  run: 'var(--color-run)',
  other: 'var(--color-text-3)',
}

const SPORT_BG: Record<string, string> = {
  swim: 'var(--color-swim-light)',
  bike: 'var(--color-bike-light)',
  run: 'var(--color-run-light)',
  other: 'var(--color-surface-2)',
}

const ZONE_LABELS: Record<number, string> = {
  1: 'Recovery', 2: 'Zone 2', 3: 'Tempo', 4: 'Threshold', 5: 'VO2 Max'
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

function formatDistance(sport: string, meters: number | null): string {
  if (!meters) return ''
  if (sport === 'swim') return `${Math.round(meters * 1.094).toLocaleString()} yds`
  return `${(meters / 1609.34).toFixed(1)} mi`
}

function AddWorkoutModal({ date, userId, onClose, onSaved }: {
  date: string
  userId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [sport, setSport] = useState<'swim' | 'bike' | 'run'>('run')
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [zone, setZone] = useState('2')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title) return
    setSaving(true)

    const durationParts = duration.split(':')
    const durationS = durationParts.length === 2
      ? parseInt(durationParts[0]) * 3600 + parseInt(durationParts[1]) * 60
      : parseInt(duration) * 60

    const distanceM = distance
      ? sport === 'swim'
        ? parseFloat(distance) / 1.094
        : parseFloat(distance) * 1609.34
      : null

    const body: any = {
      user_id: userId,
      sport,
      title,
      planned_date: date,
      duration_s: durationS || null,
      zone: parseInt(zone),
      description: description || null,
    }

    if (sport === 'swim') body.swim_distance_m = distanceM
    if (sport === 'bike') body.bike_distance_m = distanceM
    if (sport === 'run') body.run_distance_m = distanceM

    await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSaving(false)
    onSaved()
    onClose()
  }

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h2 style={{
            fontFamily: 'var(--font-barlow-condensed)',
            fontSize: '22px', fontWeight: 700, color: 'var(--color-text-1)',
          }}>
            Add workout
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '20px' }}>{displayDate}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Sport
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['swim', 'bike', 'run'] as const).map(s => (
                <button key={s} onClick={() => setSport(s)} style={{
                  flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer',
                  border: sport === s ? `1px solid ${SPORT_COLORS[s]}` : '0.5px solid var(--color-border-2)',
                  background: sport === s ? SPORT_BG[s] : 'transparent',
                  color: sport === s ? SPORT_COLORS[s] : 'var(--color-text-2)',
                  fontSize: '13px', fontWeight: 500, textTransform: 'capitalize',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Title
            </label>
            <input
              type="text"
              placeholder={sport === 'swim' ? 'e.g. Aerobic base + drills' : sport === 'bike' ? 'e.g. FTP intervals 4×8 min' : 'e.g. Easy tempo run'}
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: '0.5px solid var(--color-border-2)',
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-1)', fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Duration (h:mm or min)
              </label>
              <input
                type="text"
                placeholder={sport === 'swim' ? '45' : '1:30'}
                value={duration}
                onChange={e => setDuration(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  border: '0.5px solid var(--color-border-2)',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-1)', fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {sport === 'swim' ? 'Distance (yds)' : 'Distance (mi)'}
              </label>
              <input
                type="text"
                placeholder={sport === 'swim' ? '2400' : sport === 'bike' ? '40' : '6'}
                value={distance}
                onChange={e => setDistance(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  border: '0.5px solid var(--color-border-2)',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-1)', fontSize: '14px',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Intensity zone
            </label>
            <select
              value={zone}
              onChange={e => setZone(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: '0.5px solid var(--color-border-2)',
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-1)', fontSize: '14px',
              }}
            >
              {Object.entries(ZONE_LABELS).map(([z, label]) => (
                <option key={z} value={z}>Zone {z} — {label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Notes (optional)
            </label>
            <textarea
              placeholder="Workout description or goals..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: '0.5px solid var(--color-border-2)',
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-1)', fontSize: '14px',
                resize: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !title}
            style={{
              padding: '10px', borderRadius: '8px',
              background: 'var(--color-brand)', border: 'none',
              color: '#fff', fontSize: '14px', fontWeight: 500,
              cursor: saving || !title ? 'not-allowed' : 'pointer',
              opacity: saving || !title ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save workout'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CalendarView({ year, month, planned, completed, onDayClick }: {
  year: number
  month: number
  planned: PlannedWorkout[]
  completed: CompletedWorkout[]
  onDayClick: (date: string) => void
}) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const cells = Array.from({ length: startOffset + daysInMonth }, (_, i) => {
    if (i < startOffset) return null
    const day = i - startOffset + 1
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayPlanned = planned.filter(w => w.planned_date === dateStr)
    const dayCompleted = completed.filter(w => w.start_time.split('T')[0] === dateStr)
    return { day, dateStr, planned: dayPlanned, completed: dayCompleted }
  })

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px', marginBottom: '1px',
      }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{
            fontSize: '11px', fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'var(--color-text-3)',
            textAlign: 'center', padding: '8px 0',
          }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
      }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />
          const isToday = cell.dateStr === today
          const hasPlan = cell.planned.length > 0
          const hasCompleted = cell.completed.length > 0

          return (
            <div
              key={cell.dateStr}
              onClick={() => onDayClick(cell.dateStr)}
              style={{
                minHeight: '80px',
                background: isToday ? 'var(--color-bike-light)' : 'var(--color-surface)',
                border: isToday ? '1px solid var(--color-brand)' : '0.5px solid var(--color-border)',
                borderRadius: '8px', padding: '6px',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
            >
              <div style={{
                fontSize: '12px', fontWeight: isToday ? 600 : 400,
                color: isToday ? 'var(--color-brand)' : 'var(--color-text-2)',
                marginBottom: '4px',
              }}>
                {cell.day}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {cell.planned.slice(0, 2).map(w => (
                  <div key={w.id} style={{
                    fontSize: '10px', fontWeight: 500,
                    padding: '2px 5px', borderRadius: '3px',
                    background: SPORT_BG[w.sport],
                    color: SPORT_COLORS[w.sport],
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {w.title}
                  </div>
                ))}
                {cell.completed.slice(0, 2).map(w => (
                  <div key={w.id} style={{
                    fontSize: '10px', fontWeight: 500,
                    padding: '2px 5px', borderRadius: '3px',
                    background: SPORT_BG[w.sport],
                    color: SPORT_COLORS[w.sport],
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    opacity: 0.7,
                    textDecoration: 'line-through',
                  }}>
                    {w.name}
                  </div>
                ))}
                {(cell.planned.length + cell.completed.length) > 2 && (
                  <div style={{ fontSize: '10px', color: 'var(--color-text-3)' }}>
                    +{cell.planned.length + cell.completed.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekListView({ planned, completed, onDayClick }: {
  planned: PlannedWorkout[]
  completed: CompletedWorkout[]
  onDayClick: (date: string) => void
}) {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
  weekStart.setHours(0, 0, 0, 0)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    return {
      dateStr,
      label: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      isToday: dateStr === today.toISOString().split('T')[0],
      planned: planned.filter(w => w.planned_date === dateStr),
      completed: completed.filter(w => w.start_time.split('T')[0] === dateStr),
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {days.map(day => (
        <div key={day.dateStr} style={{
          background: 'var(--color-surface)',
          border: day.isToday ? '1px solid var(--color-brand)' : '0.5px solid var(--color-border)',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px',
            background: day.isToday ? 'var(--color-bike-light)' : 'var(--color-surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: '13px', fontWeight: 500,
              color: day.isToday ? 'var(--color-brand)' : 'var(--color-text-2)',
            }}>
              {day.label}
            </span>
            <button
              onClick={() => onDayClick(day.dateStr)}
              style={{
                fontSize: '12px', padding: '3px 10px', borderRadius: '6px',
                border: '0.5px solid var(--color-border-2)',
                background: 'transparent', color: 'var(--color-text-2)',
                cursor: 'pointer',
              }}
            >
              + Add
            </button>
          </div>

          {(day.planned.length > 0 || day.completed.length > 0) ? (
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {day.planned.map(w => (
                <div key={w.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '6px',
                  background: SPORT_BG[w.sport],
                  border: `0.5px solid ${SPORT_COLORS[w.sport]}`,
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: SPORT_COLORS[w.sport], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)' }}>{w.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>
                      {formatDuration(w.duration_s)}
                      {w.zone && ` · Zone ${w.zone} — ${ZONE_LABELS[w.zone]}`}
                      {w.tss_estimate && ` · ~${Math.round(w.tss_estimate)} TSS`}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 500, padding: '2px 7px',
                    borderRadius: '20px', background: 'rgba(255,255,255,0.15)',
                    color: SPORT_COLORS[w.sport], textTransform: 'capitalize',
                  }}>
                    {w.sport}
                  </span>
                </div>
              ))}
              {day.completed.map(w => {
                const tss = estimateTSS(w)
                return (
                  <div key={w.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '6px',
                    background: 'var(--color-surface-2)',
                    border: '0.5px solid var(--color-border)',
                    opacity: 0.8,
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: SPORT_COLORS[w.sport], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)' }}>✓ {w.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>
                        {formatDuration(w.moving_time_s)} · {tss} TSS
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 500, padding: '2px 7px',
                      borderRadius: '20px', background: SPORT_BG[w.sport],
                      color: SPORT_COLORS[w.sport], textTransform: 'capitalize',
                    }}>
                      {w.sport}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '12px 14px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>Rest day</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function TrainingClient({ plannedWorkouts, completedWorkouts, userId }: {
  plannedWorkouts: PlannedWorkout[]
  completedWorkouts: CompletedWorkout[]
  userId: string
}) {
  const now = new Date()
  const [view, setView] = useState<'month' | 'week'>('month')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [addDate, setAddDate] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [workouts, setWorkouts] = useState(plannedWorkouts)

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  async function handleSaved() {
    const res = await fetch(`/api/workouts?userId=${userId}&year=${year}&month=${month + 1}`)
    const data = await res.json()
    setWorkouts(data)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontSize: '32px', fontWeight: 700, color: 'var(--color-text-1)',
        }}>
          Training
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{
            display: 'flex', gap: '2px', background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)', borderRadius: '8px', padding: '3px',
          }}>
            {(['month', 'week'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 14px', borderRadius: '6px', cursor: 'pointer',
                background: view === v ? 'var(--color-surface)' : 'transparent',
                border: view === v ? '0.5px solid var(--color-border)' : 'none',
                color: view === v ? 'var(--color-text-1)' : 'var(--color-text-2)',
                fontSize: '13px', fontWeight: 500, textTransform: 'capitalize',
              }}>
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowImport(true)}
            style={{
              padding: '8px 14px', borderRadius: '8px',
              background: 'transparent',
              border: '0.5px solid var(--color-border-2)',
              color: 'var(--color-text-2)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            ⬆ Import
          </button>
          <button
            onClick={() => setAddDate(new Date().toISOString().split('T')[0])}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              background: 'var(--color-brand)', border: 'none',
              color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            + Add workout
          </button>
        </div>
      </div>

      {view === 'month' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button onClick={prevMonth} style={{
            padding: '6px 12px', borderRadius: '6px',
            border: '0.5px solid var(--color-border-2)',
            background: 'transparent', color: 'var(--color-text-2)',
            cursor: 'pointer', fontSize: '14px',
          }}>←</button>
          <span style={{
            fontFamily: 'var(--font-barlow-condensed)',
            fontSize: '20px', fontWeight: 600, color: 'var(--color-text-1)',
            minWidth: '160px', textAlign: 'center',
          }}>
            {monthLabel}
          </span>
          <button onClick={nextMonth} style={{
            padding: '6px 12px', borderRadius: '6px',
            border: '0.5px solid var(--color-border-2)',
            background: 'transparent', color: 'var(--color-text-2)',
            cursor: 'pointer', fontSize: '14px',
          }}>→</button>
        </div>
      )}

      {view === 'month' ? (
        <CalendarView
          year={year}
          month={month}
          planned={workouts}
          completed={completedWorkouts}
          onDayClick={setAddDate}
        />
      ) : (
        <WeekListView
          planned={workouts}
          completed={completedWorkouts}
          onDayClick={setAddDate}
        />
      )}

      {addDate && (
        <AddWorkoutModal
          date={addDate}
          userId={userId}
          onClose={() => setAddDate(null)}
          onSaved={handleSaved}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={async () => {
            setShowImport(false)
            await handleSaved()
          }}
        />
      )}
    </div>
  )
}
