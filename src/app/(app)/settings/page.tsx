'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { useTheme } from '@/components/providers/theme-provider'

function SettingsContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'profile'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const { theme, setTheme } = useTheme()
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial')

  const [profile, setProfile] = useState({ full_name: '', height: '', weight: '', max_hr: '', ftp_watts: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings/profile')
      .then(r => r.json())
      .then(d => {
        if (d.full_name !== undefined) setProfile({
          full_name: d.full_name || '',
          height:    d.height_cm  ? String(Math.round(d.height_cm / 2.54))     : '',
          weight:    d.weight_kg  ? String(Math.round(d.weight_kg / 0.453592)) : '',
          max_hr:    d.max_hr     ? String(d.max_hr)    : '',
          ftp_watts: d.ftp_watts  ? String(d.ftp_watts) : '',
        })
      })
      .catch(() => {})
  }, [])

  async function saveProfile() {
    setProfileSaving(true)
    setProfileSaved(false)
    await fetch('/api/settings/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }
  const [appearanceSaving, setAppearanceSaving] = useState(false)
  const [appearanceSaved, setAppearanceSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings/appearance')
      .then(r => r.json())
      .then(d => {
        if (d.units) setUnits(d.units)
      })
      .catch(() => {})
  }, [])

  async function saveAppearance(nextTheme: typeof theme, nextUnits: typeof units) {
    setAppearanceSaving(true)
    setAppearanceSaved(false)
    await fetch('/api/settings/appearance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: nextTheme, units: nextUnits }),
    })
    setAppearanceSaving(false)
    setAppearanceSaved(true)
    setTimeout(() => setAppearanceSaved(false), 2000)
  }

  function handleTheme(t: typeof theme) {
    setTheme(t)
    saveAppearance(t, units)
  }

  function handleUnits(u: typeof units) {
    setUnits(u)
    saveAppearance(theme, u)
  }

  const success = searchParams.get('success')
  const error = searchParams.get('error')

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/strava/sync', { method: 'POST' })
      const data = await res.json()
      if (data.synced !== undefined) {
        setSyncResult(`Synced ${data.synced} activities`)
      } else {
        setSyncResult(data.error || 'Sync failed')
      }
    } catch {
      setSyncResult('Sync failed')
    }
    setSyncing(false)
  }

  const tabs = ['profile', 'connections', 'appearance']

  return (
    <div style={{ maxWidth: '680px' }}>
      <h1 style={{
        fontFamily: 'var(--font-barlow-condensed)',
        fontSize: '32px', fontWeight: 700,
        color: 'var(--color-text-1)', marginBottom: '20px',
      }}>
        Settings
      </h1>

      <div style={{
        display: 'flex', gap: '0',
        borderBottom: '0.5px solid var(--color-border)',
        marginBottom: '24px',
      }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            fontSize: '13px', fontWeight: 500,
            padding: '10px 16px',
            background: 'transparent', border: 'none',
            borderBottom: activeTab === tab ? '2px solid var(--color-brand)' : '2px solid transparent',
            color: activeTab === tab ? 'var(--color-brand)' : 'var(--color-text-2)',
            cursor: 'pointer', textTransform: 'capitalize',
            marginBottom: '-0.5px',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Full name',       key: 'full_name',       placeholder: 'Jake Lansberry', type: 'text' },
            { label: 'Height (inches)', key: 'height',          placeholder: '70',             type: 'number' },
            { label: 'Weight (lbs)',    key: 'weight',          placeholder: '165',            type: 'number' },
            { label: 'Max heart rate',  key: 'max_hr',          placeholder: '185',            type: 'number' },
            { label: 'FTP (watts)',     key: 'ftp_watts',       placeholder: '280',            type: 'number' },
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
                type={field.type}
                placeholder={field.placeholder}
                value={(profile as any)[field.key]}
                onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border-2)',
                  borderRadius: '8px', fontSize: '14px',
                  color: 'var(--color-text-1)',
                }}
              />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={saveProfile}
              disabled={profileSaving}
              style={{
                padding: '10px 20px', borderRadius: '8px',
                background: 'var(--color-brand)', border: 'none',
                color: '#fff', fontSize: '14px', fontWeight: 500,
                cursor: profileSaving ? 'not-allowed' : 'pointer',
                opacity: profileSaving ? 0.6 : 1,
              }}
            >
              {profileSaving ? 'Saving…' : 'Save profile'}
            </button>
            {profileSaved && (
              <span style={{ fontSize: '13px', color: 'var(--color-brand)' }}>Saved</span>
            )}
          </div>
        </div>
      )}

      {activeTab === 'connections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {success === 'strava' && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px',
              background: 'var(--color-bike-light)',
              border: '0.5px solid var(--color-brand)',
              fontSize: '13px', color: 'var(--color-brand)',
            }}>
              Strava connected successfully!
            </div>
          )}
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px',
              background: 'var(--color-run-light)',
              border: '0.5px solid var(--color-run)',
              fontSize: '13px', color: 'var(--color-run)',
            }}>
              {error === 'strava_denied' ? 'Strava connection was cancelled.' : 'Something went wrong connecting Strava.'}
            </div>
          )}

          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px', padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: '#FC4C02', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px', flexShrink: 0,
              }}>
                🏃
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-1)' }}>
                  Strava
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                  Sync your activities, routes, and training data
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: 500,
                  color: 'var(--color-text-2)', marginBottom: '6px',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  History to import
                </label>
                <select style={{
                  padding: '8px 12px', borderRadius: '8px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border-2)',
                  color: 'var(--color-text-1)', fontSize: '14px',
                }}>
                  <option value="3">Last 3 months</option>
                  <option value="6">Last 6 months</option>
                  <option value="12">Last 12 months</option>
                  <option value="24">All time</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="/api/strava/auth" style={{
                  padding: '10px 20px', borderRadius: '8px',
                  background: '#FC4C02', border: 'none',
                  color: '#fff', fontSize: '14px', fontWeight: 500,
                  cursor: 'pointer', textDecoration: 'none',
                  display: 'inline-block',
                }}>
                  Connect Strava
                </a>
                <button onClick={handleSync} disabled={syncing} style={{
                  padding: '10px 20px', borderRadius: '8px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border-2)',
                  color: 'var(--color-text-1)', fontSize: '14px',
                  fontWeight: 500, cursor: syncing ? 'not-allowed' : 'pointer',
                  opacity: syncing ? 0.6 : 1,
                }}>
                  {syncing ? 'Syncing...' : 'Sync now'}
                </button>
              </div>

              {syncResult && (
                <div style={{
                  fontSize: '13px', color: 'var(--color-text-2)',
                  padding: '8px 12px', background: 'var(--color-surface-2)',
                  borderRadius: '6px',
                }}>
                  {syncResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{
              fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px',
            }}>
              Theme
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['light', 'dark', 'system'] as const).map(t => (
                <button key={t} onClick={() => handleTheme(t)} style={{
                  padding: '8px 16px', borderRadius: '8px',
                  border: theme === t
                    ? '0.5px solid var(--color-brand)'
                    : '0.5px solid var(--color-border-2)',
                  background: theme === t ? 'var(--color-bike-light)' : 'var(--color-surface)',
                  color: theme === t ? 'var(--color-brand)' : 'var(--color-text-1)',
                  fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', textTransform: 'capitalize',
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px',
            }}>
              Units
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {([
                { value: 'imperial', label: 'Imperial (mi, lbs, °F)' },
                { value: 'metric',   label: 'Metric (km, kg, °C)' },
              ] as const).map(u => (
                <button key={u.value} onClick={() => handleUnits(u.value)} style={{
                  padding: '8px 16px', borderRadius: '8px',
                  border: units === u.value
                    ? '0.5px solid var(--color-brand)'
                    : '0.5px solid var(--color-border-2)',
                  background: units === u.value ? 'var(--color-bike-light)' : 'var(--color-surface)',
                  color: units === u.value ? 'var(--color-brand)' : 'var(--color-text-1)',
                  fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer',
                }}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {(appearanceSaving || appearanceSaved) && (
            <div style={{
              fontSize: '13px',
              color: appearanceSaved ? 'var(--color-brand)' : 'var(--color-text-2)',
            }}>
              {appearanceSaving ? 'Saving…' : 'Saved'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}
