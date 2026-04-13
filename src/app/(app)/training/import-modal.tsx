'use client'

import { useState, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImportWorkout {
  date: string
  sport: 'swim' | 'bike' | 'run'
  title: string
  duration_s: number
  zone: number
  description?: string
  distance_m?: number
}

interface ParseResult {
  workouts: ImportWorkout[]
  errors: { row: number; message: string }[]
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseDate(val: string): string {
  const v = val.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  // MM/DD/YYYY or M/D/YYYY
  const mdy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`
  // DD/MM/YYYY (European)
  const dmy = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  throw new Error(`Invalid date "${v}" — use YYYY-MM-DD`)
}

function parseDuration(val: string): number {
  const v = val.trim()
  if (!v) throw new Error('Duration is required')
  // HH:MM:SS
  const hms = v.match(/^(\d+):(\d{2}):(\d{2})$/)
  if (hms) return +hms[1] * 3600 + +hms[2] * 60 + +hms[3]
  // H:MM
  const hm = v.match(/^(\d+):(\d{2})$/)
  if (hm) return +hm[1] * 3600 + +hm[2] * 60
  // Plain seconds (intervals.icu sometimes exports this way)
  const secs = parseFloat(v)
  if (!isNaN(secs) && secs > 600) return Math.round(secs) // treat large numbers as seconds
  if (!isNaN(secs) && secs > 0) return Math.round(secs * 60) // treat small numbers as minutes
  throw new Error(`Invalid duration "${v}" — use minutes (45), hours:minutes (1:30), or HH:MM:SS`)
}

function parseSport(val: string): 'swim' | 'bike' | 'run' {
  const v = val.toLowerCase().trim()
  if (['swim', 'swimming', 'openwater', 'open water swim'].includes(v)) return 'swim'
  if (['bike', 'ride', 'cycling', 'virtualride', 'virtual ride', 'ebikeride', 'mtb', 'gravel', 'cycle'].includes(v)) return 'bike'
  if (['run', 'running', 'trail run', 'trailrun', 'virtualrun', 'treadmill'].includes(v)) return 'run'
  throw new Error(`Unknown sport "${val}" — use swim, bike, or run`)
}

function parseZone(val: string): number {
  if (!val?.trim()) return 2
  const z = parseInt(val.trim())
  if (isNaN(z) || z < 1 || z > 5) return 2
  return z
}

function parseDistanceM(val: string, sport: 'swim' | 'bike' | 'run'): number | undefined {
  if (!val?.trim()) return undefined
  const d = parseFloat(val.trim())
  if (isNaN(d) || d <= 0) return undefined
  if (sport === 'swim') return Math.round(d * 0.9144)    // yards → meters
  return Math.round(d * 1609.34)                         // miles → meters
}

// ─── Format detectors ─────────────────────────────────────────────────────────

function detectFormat(headers: string[]): 'template' | 'icu' {
  // intervals.icu CSV exports have a "type" column (workout type like "Run", "Ride")
  if (headers.includes('type') || headers.includes('load') || headers.includes('moving time')) return 'icu'
  return 'template'
}

// ─── Row parsers ──────────────────────────────────────────────────────────────

function parseTemplateRow(row: Record<string, string>, rowNum: number): ImportWorkout {
  const date = parseDate(row['date'] || row['Date'] || '')
  const sport = parseSport(row['sport'] || row['Sport'] || '')
  const title = (row['title'] || row['Title'] || row['name'] || row['Name'] || '').trim()
  if (!title) throw new Error('Title is required')
  const duration_s = parseDuration(row['duration'] || row['Duration'] || '')
  const zone = parseZone(row['zone'] || row['Zone'] || '')
  const description = (row['notes'] || row['Notes'] || row['description'] || row['Description'] || '').trim() || undefined
  const distance_m = parseDistanceM(row['distance'] || row['Distance'] || '', sport)
  return { date, sport, title, duration_s, zone, description, distance_m }
}

function parseICURow(row: Record<string, string>, rowNum: number): ImportWorkout {
  const date = parseDate(row['date'] || row['Date'] || '')
  const sport = parseSport(row['type'] || row['Type'] || row['sport'] || row['Sport'] || '')
  const title = (row['name'] || row['Name'] || row['title'] || row['Title'] || '').trim()
  if (!title) throw new Error('Title is required')

  // intervals.icu durations can be in various formats
  const durationRaw = row['duration'] || row['Duration'] || row['moving time'] || row['Moving Time'] || row['time'] || ''
  const duration_s = parseDuration(durationRaw)

  const description = (row['description'] || row['Description'] || row['notes'] || row['Notes'] || '').trim() || undefined

  // intervals.icu doesn't have zones; try to infer from load or default to 2
  const loadVal = parseFloat(row['load'] || row['Load'] || '0')
  let zone = 2
  if (loadVal > 0) {
    const perHour = loadVal / (duration_s / 3600)
    if (perHour >= 90) zone = 5
    else if (perHour >= 75) zone = 4
    else if (perHour >= 60) zone = 3
    else if (perHour >= 45) zone = 2
    else zone = 1
  }

  // Distance: intervals.icu exports in meters
  const distRaw = parseFloat(row['distance'] || row['Distance'] || '0')
  const distance_m = distRaw > 0 ? Math.round(distRaw) : undefined

  return { date, sport, title, duration_s, zone, description, distance_m }
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseWorkoutFile(text: string): ParseResult {
  const workouts: ImportWorkout[] = []
  const errors: { row: number; message: string }[] = []

  // Normalize line endings and split
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  // Skip comment lines and blanks to find the header row
  let headerLineIdx = -1
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim()
    if (l && !l.startsWith('#')) { headerLineIdx = i; break }
  }
  if (headerLineIdx === -1) return { workouts: [], errors: [{ row: 0, message: 'No header row found' }] }

  const headers = parseCSVLine(lines[headerLineIdx]).map(h => h.toLowerCase().replace(/['"]/g, '').trim())
  const format = detectFormat(headers)

  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('#')) continue

    const values = parseCSVLine(line)
    const row = Object.fromEntries(headers.map((h, j) => [h, (values[j] || '').replace(/^"|"$/g, '')]))

    // Skip rows that look empty
    if (Object.values(row).every(v => !v.trim())) continue

    try {
      const workout = format === 'icu' ? parseICURow(row, i + 1) : parseTemplateRow(row, i + 1)
      workouts.push(workout)
    } catch (e) {
      errors.push({ row: i + 1, message: (e as Error).message })
    }
  }

  return { workouts, errors }
}

// ─── Template generator ───────────────────────────────────────────────────────

export function downloadCSVTemplate() {
  const today = new Date()
  const d = (offset: number) => {
    const dt = new Date(today)
    dt.setDate(today.getDate() + offset)
    return dt.toISOString().split('T')[0]
  }

  const rows = [
    'date,sport,title,duration,zone,distance,notes',
    `${d(1)},run,Easy aerobic run,45,2,6,"Keep HR in zone 2. Conversational pace throughout."`,
    `${d(2)},swim,Endurance swim,40,2,2000,"200yd warm-up then 4x400yd at aerobic pace. Focus on stroke efficiency."`,
    `${d(3)},bike,Zone 2 ride,1:30,2,30,"Flat or rolling route. Stay aerobic the whole time."`,
    `${d(5)},run,Tempo intervals,50,4,7,"2mi warm-up / 4x1mi at threshold pace (2min RI) / 1mi cool-down."`,
    `${d(6)},bike,FTP intervals,1:15,4,35,"20min warm-up / 3x10min at FTP with 5min RI / 15min cool-down."`,
    `${d(7)},swim,Technique swim,35,2,1500,"Drill sets: catch-up drill 4x100 / single-arm 4x50 / easy 200 cool-down."`,
  ]

  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'brickhaus-workout-template.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Constants ────────────────────────────────────────────────────────────────

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
const ZONE_LABELS: Record<number, string> = { 1: 'Recovery', 2: 'Zone 2', 3: 'Tempo', 4: 'Threshold', 5: 'VO2 Max' }
const ZONE_RATES: Record<number, number> = { 1: 35, 2: 55, 3: 70, 4: 85, 5: 100 }

function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function estimateTSS(w: ImportWorkout): number {
  return Math.round((w.duration_s / 3600) * (ZONE_RATES[w.zone] || 55))
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportModal({ onClose, onImported }: {
  onClose: () => void
  onImported: () => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setFileName(file.name)
    setParsed(null)
    setImported(false)
    setImportError(null)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      setParsed(parseWorkoutFile(text))
    }
    reader.readAsText(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  async function handleImport() {
    if (!parsed?.workouts.length) return
    setImporting(true)
    setImportError(null)
    try {
      const res = await fetch('/api/coach/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workouts: parsed.workouts }),
      })
      if (!res.ok) {
        const d = await res.json()
        setImportError(d.error || 'Import failed.')
        return
      }
      setImported(true)
      setTimeout(onImported, 1200)
    } catch {
      setImportError('Network error. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const validCount = parsed?.workouts.length ?? 0
  const errorCount = parsed?.errors.length ?? 0
  const totalTSS = parsed?.workouts.reduce((s, w) => s + estimateTSS(w), 0) ?? 0

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '16px',
          width: '100%', maxWidth: '600px',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 80px)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '0.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: '22px', fontWeight: 700,
              color: 'var(--color-text-1)', margin: 0,
            }}>
              Import Workouts
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--color-text-3)', marginTop: '2px' }}>
              Upload a .csv or .icu file to add workouts to your calendar
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Template download */}
          <div style={{
            padding: '14px 16px', borderRadius: '10px',
            background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: '2px' }}>
                CSV Template
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-3)', lineHeight: 1.4 }}>
                Columns: date, sport, title, duration, zone, distance, notes
              </div>
            </div>
            <button
              onClick={downloadCSVTemplate}
              style={{
                padding: '7px 14px', borderRadius: '7px', flexShrink: 0,
                border: '0.5px solid var(--color-border-2)',
                background: 'var(--color-surface)', color: 'var(--color-text-1)',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              ⬇ Download template
            </button>
          </div>

          {/* Supported formats note */}
          <div style={{ fontSize: '12px', color: 'var(--color-text-3)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--color-text-2)' }}>Supported formats:</strong>{' '}
            CSV template (above) · intervals.icu CSV export
            <br />
            <strong style={{ color: 'var(--color-text-2)' }}>Duration:</strong> minutes (45), hours:minutes (1:30), or HH:MM:SS
            <br />
            <strong style={{ color: 'var(--color-text-2)' }}>Distance:</strong> miles for bike/run · yards for swim (optional)
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `1.5px dashed ${dragOver ? 'var(--color-brand)' : 'var(--color-border-2)'}`,
              borderRadius: '10px',
              padding: '28px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer',
              background: dragOver ? 'var(--color-bike-light)' : 'transparent',
              transition: 'border-color 0.15s, background 0.15s',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '28px' }}>📂</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)' }}>
              {fileName ? fileName : 'Drag & drop or click to browse'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
              .csv and .icu files accepted
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.icu"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>

          {/* Parse results */}
          {parsed && (
            <>
              {/* Summary */}
              <div style={{
                display: 'flex', gap: '8px', flexWrap: 'wrap',
              }}>
                {validCount > 0 && (
                  <div style={{
                    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                    background: 'var(--color-bike-light)', color: 'var(--color-brand)',
                    border: '0.5px solid var(--color-brand)',
                  }}>
                    {validCount} workout{validCount !== 1 ? 's' : ''} ready · ~{totalTSS} TSS
                  </div>
                )}
                {errorCount > 0 && (
                  <div style={{
                    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                    background: 'rgba(231,76,60,0.1)', color: '#e74c3c',
                    border: '0.5px solid rgba(231,76,60,0.3)',
                  }}>
                    {errorCount} row{errorCount !== 1 ? 's' : ''} with errors
                  </div>
                )}
                {validCount === 0 && errorCount === 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>
                    No workouts found in file.
                  </div>
                )}
              </div>

              {/* Errors */}
              {errorCount > 0 && (
                <div style={{
                  background: 'rgba(231,76,60,0.06)',
                  border: '0.5px solid rgba(231,76,60,0.2)',
                  borderRadius: '8px', padding: '10px 14px',
                  display: 'flex', flexDirection: 'column', gap: '4px',
                }}>
                  {parsed.errors.map((err, i) => (
                    <div key={i} style={{ fontSize: '12px', color: '#e74c3c' }}>
                      Row {err.row}: {err.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Workout preview */}
              {validCount > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    Preview
                  </div>
                  {parsed.workouts.slice(0, 8).map((w, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '7px',
                      background: SPORT_BG[w.sport] || 'var(--color-surface-2)',
                      border: `0.5px solid ${SPORT_COLORS[w.sport] || 'var(--color-border)'}`,
                    }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                        color: SPORT_COLORS[w.sport], minWidth: '28px',
                      }}>
                        {w.sport.slice(0, 3)}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-3)', minWidth: '70px' }}>
                        {new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.title}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-2)', flexShrink: 0 }}>
                        {fmtDuration(w.duration_s)} · {ZONE_LABELS[w.zone]}
                      </span>
                    </div>
                  ))}
                  {validCount > 8 && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-3)', textAlign: 'center', padding: '4px' }}>
                      + {validCount - 8} more workouts
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '0.5px solid var(--color-border)',
          display: 'flex', gap: '10px', alignItems: 'center',
          flexShrink: 0,
        }}>
          {importError && (
            <span style={{ fontSize: '13px', color: '#e74c3c', flex: 1 }}>{importError}</span>
          )}
          {imported && (
            <span style={{ fontSize: '13px', color: 'var(--color-brand)', fontWeight: 500, flex: 1 }}>
              {validCount} workouts added to your calendar!
            </span>
          )}
          {!importError && !imported && <div style={{ flex: 1 }} />}
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              border: '0.5px solid var(--color-border-2)',
              background: 'transparent', color: 'var(--color-text-2)',
              fontSize: '13px', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!validCount || importing || imported}
            style={{
              padding: '8px 18px', borderRadius: '8px',
              background: imported ? 'var(--color-surface-2)' : 'var(--color-brand)',
              border: 'none',
              color: imported ? 'var(--color-brand)' : validCount ? '#fff' : 'var(--color-text-3)',
              fontSize: '13px', fontWeight: 600,
              cursor: !validCount || importing || imported ? 'not-allowed' : 'pointer',
              opacity: importing ? 0.7 : 1,
            }}
          >
            {importing ? 'Importing…' : imported ? 'Imported!' : validCount ? `Import ${validCount} workouts` : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
