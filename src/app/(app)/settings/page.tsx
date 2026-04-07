'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function SettingsContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'profile'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

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
            { label: 'Full name', placeholder: 'Jake Lansberry', type: 'text' },
            { label: 'Height', placeholder: '5\'10"', type: 'text' },
            { label: 'Weight', placeholder: '165 lbs', type: 'text' },
            { label: 'Max heart rate', placeholder: '185 bpm', type: 'number' },
            { label: 'FTP (watts)', placeholder: '280', type: 'number' },
            { label: 'Threshold pace', placeholder: '7:30 /mi', type: 'text' },
          ].map(field => (
            <div key={field.label}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 500,
                color: 'var(--color-text-2)', marginBottom: '6px',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {field.label}
              </label>
              <input type={field.type} placeholder={field.placeholder} style={{
                width: '100%', padding: '8px 12px',
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border-2)',
                borderRadius: '8px', fontSize: '14px',
                color: 'var(--color-text-1)',
              }} />
            </div>
          ))}
          <button style={{
            padding: '10px 20px', borderRadius: '8px',
            background: 'var(--color-brand)', border: 'none',
            color: '#fff', fontSize: '14px', fontWeight: 500,
            cursor: 'pointer', alignSelf: 'flex-start',
          }}>
            Save profile
          </button>
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
              {['light', 'dark', 'system'].map(t => (
                <button key={t} style={{
                  padding: '8px 16px', borderRadius: '8px',
                  border: '0.5px solid var(--color-border-2)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-1)',
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
              {['Imperial (mi, lbs, °F)', 'Metric (km, kg, °C)'].map(u => (
                <button key={u} style={{
                  padding: '8px 16px', borderRadius: '8px',
                  border: '0.5px solid var(--color-border-2)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-1)',
                  fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer',
                }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
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
