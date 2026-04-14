'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const GOAL_OPTIONS = [
  { key: 'finish', label: 'Just finish strong', emoji: '🏁', desc: 'Complete the race and enjoy the journey' },
  { key: 'target_time', label: 'Beat a target time', emoji: '⏱', desc: 'Hit a specific finish time goal' },
  { key: 'pr', label: 'Set a new PR', emoji: '🔥', desc: 'Beat my previous best time' },
  { key: 'qualify_worlds', label: 'Qualify for Worlds', emoji: '🌍', desc: 'Earn a 70.3 World Championship slot' },
  { key: 'beat_rival', label: 'Beat a rival', emoji: '⚔️', desc: 'Finish ahead of someone specific' },
]

const DISTANCE_OPTIONS = [
  { key: 'sprint', label: 'Sprint', desc: '750m / 20km / 5km' },
  { key: 'olympic', label: 'Olympic', desc: '1.5km / 40km / 10km' },
  { key: '70.3', label: '70.3 Half Iron', desc: '1.2mi / 56mi / 13.1mi' },
  { key: '140.6', label: '140.6 Full Iron', desc: '2.4mi / 112mi / 26.2mi' },
]

const COACH_MESSAGES = [
  "Hey! I'm your Tri Coach. Let's get you set up so I can help you train smarter. First — what's your name?",
  "Great to meet you! Now let's talk about your next race. When is it and what distance?",
  "Perfect. What's your main goal for this race?",
  "Almost done. A few optional details help me give better training advice — but you can skip these.",
  "You're all set! Let's get to work.",
]

export function OnboardingClient({ userId, email }: { userId: string; email: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [name, setName] = useState('')
  const [raceDate, setRaceDate] = useState('')
  const [raceName, setRaceName] = useState('')
  const [raceDistance, setRaceDistance] = useState('70.3')
  const [raceLocation, setRaceLocation] = useState('')
  const [goal, setGoal] = useState('')
  const [goalTime, setGoalTime] = useState('')
  const [maxHR, setMaxHR] = useState('')
  const [ftp, setFtp] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')

  async function handleFinish() {
    setSaving(true)
    setSaveError('')

    const goalTimeS = goalTime
      ? parseInt(goalTime.split(':')[0]) * 3600 + parseInt(goalTime.split(':')[1] || '0') * 60
      : null

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        name,
        maxHR: maxHR ? parseInt(maxHR) : null,
        ftp: ftp ? parseInt(ftp) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        race: raceDate ? {
          name: raceName || 'My Race',
          location: raceLocation,
          race_date: raceDate,
          distance_type: raceDistance,
          goal_type: goal || 'finish',
          goal_finish_time_s: goalTimeS,
          is_group_race: true,
        } : null,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setSaveError(data.error || 'Something went wrong. Please try again.')
      return
    }

    router.push(next)
  }

  const canProceed = [
    name.length > 0,
    raceDate.length > 0,
    goal.length > 0,
    true,
  ][step]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>

        {/* Logo */}
        <div style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontSize: '28px', fontWeight: 800,
          letterSpacing: '0.03em', textTransform: 'uppercase',
          color: '#ffffff', marginBottom: '32px', textAlign: 'center',
        }}>
          BRICK<span style={{ color: '#1D9E75' }}>HAUS</span>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              flex: 1, height: '3px', borderRadius: '2px',
              background: i <= step ? '#1D9E75' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Tri Coach message */}
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          marginBottom: '24px',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#1D9E75', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '18px', flexShrink: 0,
          }}>
            🤖
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '14px 16px',
            fontSize: '14px', color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.6, flex: 1,
          }}>
            {COACH_MESSAGES[step]}
          </div>
        </div>

        {/* Step content */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', padding: '24px',
          marginBottom: '16px',
        }}>

          {step === 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your name
              </label>
              <input
                type="text"
                placeholder="Jake Lansberry"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '0.5px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff', fontSize: '16px', outline: 'none',
                }}
              />
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Race name
                  </label>
                  <input
                    type="text"
                    placeholder="Patriot Half"
                    value={raceName}
                    onChange={e => setRaceName(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '0.5px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#fff', fontSize: '14px', outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Race date *
                  </label>
                  <input
                    type="date"
                    value={raceDate}
                    onChange={e => setRaceDate(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '0.5px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#fff', fontSize: '14px', outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Location
                </label>
                <input
                  type="text"
                  placeholder="East Freetown, MA"
                  value={raceLocation}
                  onChange={e => setRaceLocation(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '0.5px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff', fontSize: '14px', outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Distance
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {DISTANCE_OPTIONS.map(d => (
                    <button key={d.key} onClick={() => setRaceDistance(d.key)} style={{
                      padding: '10px 6px', borderRadius: '8px', cursor: 'pointer',
                      border: raceDistance === d.key ? '1px solid #1D9E75' : '0.5px solid rgba(255,255,255,0.15)',
                      background: raceDistance === d.key ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.04)',
                      color: raceDistance === d.key ? '#1D9E75' : 'rgba(255,255,255,0.6)',
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{d.label}</div>
                      <div style={{ fontSize: '10px', opacity: 0.7 }}>{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {GOAL_OPTIONS.map(g => (
                <button key={g.key} onClick={() => setGoal(g.key)} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                  border: goal === g.key ? '1px solid #1D9E75' : '0.5px solid rgba(255,255,255,0.12)',
                  background: goal === g.key ? 'rgba(29,158,117,0.12)' : 'rgba(255,255,255,0.04)',
                  textAlign: 'left', width: '100%',
                }}>
                  <span style={{ fontSize: '24px', flexShrink: 0 }}>{g.emoji}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: goal === g.key ? '#1D9E75' : '#fff', marginBottom: '2px' }}>
                      {g.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{g.desc}</div>
                  </div>
                </button>
              ))}
              {(goal === 'target_time' || goal === 'pr') && (
                <div style={{ marginTop: '4px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Goal finish time (h:mm)
                  </label>
                  <input
                    type="text"
                    placeholder="5:00"
                    value={goalTime}
                    onChange={e => setGoalTime(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '0.5px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#fff', fontSize: '14px', outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', lineHeight: 1.5 }}>
                These help me calculate your training zones and TSS. Skip anything you don't know — you can set them later in Settings.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Max heart rate', placeholder: '185 bpm', value: maxHR, onChange: setMaxHR },
                  { label: 'FTP (watts)', placeholder: '280w', value: ftp, onChange: setFtp },
                  { label: 'Weight (lbs)', placeholder: '165', value: weight, onChange: setWeight },
                  { label: 'Height (in)', placeholder: '70', value: height, onChange: setHeight },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {f.label}
                    </label>
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      value={f.value}
                      onChange={e => f.onChange(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '8px',
                        border: '0.5px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#fff', fontSize: '14px', outline: 'none',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {saveError && (
          <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(220,60,60,0.15)', border: '0.5px solid rgba(220,60,60,0.4)', fontSize: '13px', color: '#e05555' }}>
            {saveError}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              padding: '12px 20px', borderRadius: '10px',
              border: '0.5px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: 'rgba(255,255,255,0.6)',
              fontSize: '14px', cursor: 'pointer',
            }}>
              Back
            </button>
          )}
          <button
            onClick={() => step < 3 ? setStep(s => s + 1) : handleFinish()}
            disabled={!canProceed || saving}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px',
              background: canProceed && !saving ? '#1D9E75' : 'rgba(29,158,117,0.3)',
              border: 'none', color: '#fff',
              fontSize: '15px', fontWeight: 500,
              cursor: canProceed && !saving ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Setting up your account...' : step < 3 ? 'Continue →' : 'Enter Brickhaus →'}
          </button>
          {step === 3 && (
            <button onClick={handleFinish} disabled={saving} style={{
              padding: '12px 20px', borderRadius: '10px',
              border: '0.5px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: 'rgba(255,255,255,0.4)',
              fontSize: '14px', cursor: 'pointer',
            }}>
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
