'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ChatUI, Message } from '@/components/coach/chat-ui'

interface Race {
  id: string
  name: string
  race_date: string
  distance_type: string
  goal_type: string | null
  goal_finish_time_s: number | null
}

interface Fitness {
  ctl: number
  atl: number
  tsb: number
}

interface PlanWorkout {
  date: string
  sport: 'swim' | 'bike' | 'run'
  title: string
  duration_s: number
  zone: number
  description?: string
}

const SPORT_COLORS: Record<string, string> = {
  swim: 'var(--color-swim)',
  bike: 'var(--color-bike)',
  run: 'var(--color-run)',
}
const SPORT_BG: Record<string, string> = {
  swim: 'var(--color-swim-light)',
  bike: 'var(--color-bike-light)',
  run: 'var(--color-run-light)',
}
const ZONE_LABELS: Record<number, string> = {
  1: 'Recovery', 2: 'Zone 2', 3: 'Tempo', 4: 'Threshold', 5: 'VO2 Max',
}
const ZONE_RATES: Record<number, number> = { 1: 35, 2: 55, 3: 70, 4: 85, 5: 100 }

function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr + 'T12:00:00').getTime() - Date.now()) / 86400000)
}

function estimateTSS(w: PlanWorkout): number {
  return Math.round((w.duration_s / 3600) * (ZONE_RATES[w.zone] || 55))
}

function extractPlan(content: string): PlanWorkout[] | null {
  const match = content.match(/```plan\n([\s\S]*?)\n```/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1])
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

function groupByWeek(workouts: PlanWorkout[]): { label: string; days: { date: string; workouts: PlanWorkout[] }[] }[] {
  const byDate: Record<string, PlanWorkout[]> = {}
  for (const w of workouts) {
    if (!byDate[w.date]) byDate[w.date] = []
    byDate[w.date].push(w)
  }

  const sortedDates = Object.keys(byDate).sort()
  if (!sortedDates.length) return []

  const weeks: { label: string; days: { date: string; workouts: PlanWorkout[] }[] }[] = []
  let weekNum = 1
  let weekStart: Date | null = null

  for (const date of sortedDates) {
    const d = new Date(date + 'T12:00:00')
    if (!weekStart || (d.getTime() - weekStart.getTime()) >= 7 * 86400000) {
      weekStart = d
      weeks.push({ label: `Week ${weekNum++}`, days: [] })
    }
    weeks[weeks.length - 1].days.push({ date, workouts: byDate[date] })
  }

  return weeks
}

function PlanPreviewModal({ plan, onClose, onSave }: {
  plan: PlanWorkout[]
  onClose: () => void
  onSave: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weeks = groupByWeek(plan)
  const totalTSS = plan.reduce((s, w) => s + estimateTSS(w), 0)
  const sportCounts = plan.reduce((acc: Record<string, number>, w) => {
    acc[w.sport] = (acc[w.sport] || 0) + 1
    return acc
  }, {})

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/coach/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workouts: plan }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to save plan.')
        return
      }
      setSaved(true)
      setTimeout(onSave, 1200)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 20px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '16px',
          width: '100%', maxWidth: '680px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '0.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: '24px', fontWeight: 700,
              color: 'var(--color-text-1)', margin: 0,
            }}>
              Training Plan Preview
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--color-text-2)', marginTop: '4px', display: 'flex', gap: '16px' }}>
              <span>{plan.length} workouts · {weeks.length} weeks</span>
              <span>~{totalTSS} total TSS</span>
              {Object.entries(sportCounts).map(([sport, count]) => (
                <span key={sport} style={{ color: SPORT_COLORS[sport] }}>
                  {count} {sport}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--color-text-3)', fontSize: '20px',
              cursor: 'pointer', padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Weeks */}
        <div style={{ maxHeight: '55vh', overflowY: 'auto', padding: '16px 24px' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--color-brand)',
                marginBottom: '8px',
              }}>
                {week.label}
                <span style={{ color: 'var(--color-text-3)', fontWeight: 400, marginLeft: '8px', textTransform: 'none', letterSpacing: 0 }}>
                  {week.days.reduce((s, d) => s + d.workouts.reduce((ss, w) => ss + estimateTSS(w), 0), 0)} TSS
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {week.days.map(({ date, workouts }) =>
                  workouts.map((w, i) => (
                    <div key={`${date}-${i}`} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '10px 12px', borderRadius: '8px',
                      background: SPORT_BG[w.sport] || 'var(--color-surface-2)',
                      border: `0.5px solid ${SPORT_COLORS[w.sport] || 'var(--color-border)'}`,
                    }}>
                      <div style={{ flexShrink: 0, minWidth: '80px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: SPORT_COLORS[w.sport], textTransform: 'capitalize' }}>
                          {w.sport}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
                          {fmtDate(date)}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-1)' }}>
                          {w.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-2)', marginTop: '2px' }}>
                          {fmtDuration(w.duration_s)} · {ZONE_LABELS[w.zone] || `Zone ${w.zone}`} · ~{estimateTSS(w)} TSS
                        </div>
                        {w.description && (
                          <div style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '3px', lineHeight: 1.4 }}>
                            {w.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '0.5px solid var(--color-border)',
          display: 'flex', gap: '10px', alignItems: 'center',
        }}>
          {error && (
            <span style={{ fontSize: '13px', color: 'var(--color-error, #e74c3c)', flex: 1 }}>
              {error}
            </span>
          )}
          {saved && (
            <span style={{ fontSize: '13px', color: 'var(--color-brand)', flex: 1, fontWeight: 500 }}>
              Plan saved to Training calendar!
            </span>
          )}
          {!saved && !error && <div style={{ flex: 1 }} />}
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: '8px',
              border: '0.5px solid var(--color-border-2)',
              background: 'transparent', color: 'var(--color-text-2)',
              fontSize: '13px', cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            style={{
              padding: '9px 20px', borderRadius: '8px',
              background: saved ? 'var(--color-surface-2)' : 'var(--color-brand)',
              border: 'none', color: saved ? 'var(--color-brand)' : '#fff',
              fontSize: '13px', fontWeight: 600,
              cursor: saving || saved ? 'default' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : saved ? 'Saved!' : `Save ${plan.length} workouts to calendar`}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CoachClient({ races, athleteName, fitness, hasApiKey }: {
  races: Race[]
  athleteName: string | null
  fitness: Fitness
  hasApiKey: boolean
}) {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hey${athleteName ? ` ${athleteName.split(' ')[0]}` : ''}! I'm Coach Brick. I can build you a personalized training plan based on your goals and current fitness, or just answer questions about your training. What would you like to work on?`,
  }])
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [detectedPlan, setDetectedPlan] = useState<PlanWorkout[] | null>(null)
  const [showPlanModal, setShowPlanModal] = useState(false)

  // Goal form state
  const [selectedRaceId, setSelectedRaceId] = useState<string>(races[0]?.id || '')
  const [daysPerWeek, setDaysPerWeek] = useState(5)

  // Detect plan in any assistant message
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        const plan = extractPlan(messages[i].content)
        if (plan) {
          setDetectedPlan(plan)
          return
        }
      }
    }
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setStreaming(true)
    setStreamingContent('')

    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
          pagePath: '/coach',
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: err.error || 'Something went wrong.' }])
        setStreaming(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setStreamingContent(full)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: full }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setStreaming(false)
      setStreamingContent('')
    }
  }, [messages])

  function handleGeneratePlan() {
    const race = races.find(r => r.id === selectedRaceId)
    if (race) {
      const days = daysUntil(race.race_date)
      const weeks = Math.max(1, Math.round(days / 7))
      sendMessage(
        `Build me a ${weeks}-week training plan targeting ${race.name} (${race.distance_type}) on ${fmtDate(race.race_date)} — ${days} days away. I can train ${daysPerWeek} days per week.`
      )
    } else {
      sendMessage(
        `Build me a training plan. I can train ${daysPerWeek} days per week.`
      )
    }
  }

  const tsbStatus = fitness.tsb >= 10 ? 'Fresh' : fitness.tsb >= 0 ? 'Balanced' : fitness.tsb >= -10 ? 'Slight fatigue' : 'Fatigued'
  const tsbColor = fitness.tsb >= 10 ? 'var(--color-brand)' : fitness.tsb >= 0 ? 'var(--color-text-2)' : 'var(--color-run)'

  return (
    <div style={{
      height: 'calc(100vh - var(--nav-height) - 40px)',
      display: 'flex',
      gap: '16px',
      minHeight: '500px',
    }}>
      {/* Left sidebar */}
      <div style={{
        width: '260px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflowY: 'auto',
      }}>
        {/* Coach identity */}
        <div style={{
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'var(--color-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              B
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-1)' }}>Coach Brick</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>AI Triathlon Coach</div>
            </div>
          </div>
          <div style={{
            fontSize: '12px', color: 'var(--color-text-2)', lineHeight: 1.5,
            padding: '8px 10px', borderRadius: '8px',
            background: 'var(--color-surface-2)',
          }}>
            I analyze your training data, fitness metrics, and race goals to build smart, personalized plans.
          </div>
        </div>

        {/* Current fitness */}
        <div style={{
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '12px',
          padding: '14px 16px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '10px' }}>
            Your Fitness
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Fitness (CTL)', value: Math.round(fitness.ctl), color: 'var(--color-brand)' },
              { label: 'Fatigue (ATL)', value: Math.round(fitness.atl), color: 'var(--color-run)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>Form (TSB)</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: tsbColor }}>
                {Math.round(fitness.tsb) > 0 ? '+' : ''}{Math.round(fitness.tsb)} · {tsbStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Plan generator */}
        <div style={{
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '12px',
          padding: '14px 16px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '12px' }}>
            Generate Plan
          </div>

          {races.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-2)', marginBottom: '4px' }}>
                Target Race
              </label>
              <select
                value={selectedRaceId}
                onChange={e => setSelectedRaceId(e.target.value)}
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: '7px',
                  border: '0.5px solid var(--color-border-2)',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-1)', fontSize: '12px',
                }}
              >
                {races.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {daysUntil(r.race_date)}d
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-2)', marginBottom: '6px' }}>
              Training days per week
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[3, 4, 5, 6, 7].map(d => (
                <button
                  key={d}
                  onClick={() => setDaysPerWeek(d)}
                  style={{
                    flex: 1, padding: '5px 0', borderRadius: '6px', fontSize: '12px',
                    fontWeight: daysPerWeek === d ? 600 : 400,
                    border: daysPerWeek === d ? '1px solid var(--color-brand)' : '0.5px solid var(--color-border-2)',
                    background: daysPerWeek === d ? 'var(--color-bike-light)' : 'transparent',
                    color: daysPerWeek === d ? 'var(--color-brand)' : 'var(--color-text-2)',
                    cursor: 'pointer',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={streaming}
            style={{
              width: '100%', padding: '9px', borderRadius: '8px',
              background: streaming ? 'var(--color-surface-2)' : 'var(--color-brand)',
              border: 'none', color: streaming ? 'var(--color-text-3)' : '#fff',
              fontSize: '13px', fontWeight: 600,
              cursor: streaming ? 'not-allowed' : 'pointer',
            }}
          >
            Build Training Plan
          </button>
        </div>

        {/* Upcoming races */}
        {races.length > 0 && (
          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px',
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '10px' }}>
              Upcoming Races
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {races.slice(0, 4).map(r => (
                <div key={r.id} style={{
                  padding: '8px 10px', borderRadius: '8px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-1)' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '2px' }}>
                    {r.distance_type} · {fmtDate(r.race_date)} · {daysUntil(r.race_date)}d away
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No API key warning */}
        {!hasApiKey && (
          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '12px', color: 'var(--color-text-2)', lineHeight: 1.5,
          }}>
            Add your Anthropic API key in{' '}
            <a href="/settings?tab=connections" style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 500 }}>
              Settings → Connections
            </a>{' '}
            to activate Coach Brick.
          </div>
        )}
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1,
        background: 'var(--color-surface)',
        border: '0.5px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Plan ready banner */}
        {detectedPlan && (
          <div style={{
            padding: '10px 16px',
            background: 'var(--color-bike-light)',
            borderBottom: '0.5px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: '13px', color: 'var(--color-brand)', fontWeight: 500 }}>
              Coach built you a {Math.ceil(detectedPlan.length / 7 * 7 / 7)}-week plan with {detectedPlan.length} workouts
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowPlanModal(true)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                  background: 'var(--color-brand)', border: 'none', color: '#fff', cursor: 'pointer',
                }}
              >
                Preview & Save to Calendar
              </button>
              <button
                onClick={() => setDetectedPlan(null)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--color-text-3)', fontSize: '16px', cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Chat UI — strip raw plan JSON blocks from display */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ChatUI
            messages={messages.map(msg =>
              msg.role === 'assistant'
                ? { ...msg, content: msg.content.replace(/```plan\n[\s\S]*?\n```/g, '').trim() }
                : msg
            )}
            streaming={streaming}
            streamingContent={streamingContent}
            onSend={sendMessage}
            placeholder="Ask Coach Brick anything about your training…"
            noKeyConfigured={!hasApiKey}
          />
        </div>
      </div>

      {/* Plan preview modal */}
      {showPlanModal && detectedPlan && (
        <PlanPreviewModal
          plan={detectedPlan}
          onClose={() => setShowPlanModal(false)}
          onSave={() => {
            setShowPlanModal(false)
            setDetectedPlan(null)
          }}
        />
      )}
    </div>
  )
}
