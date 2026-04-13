import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ── Helpers ────────────────────────────────────────────────────────────────

function getMeta(html: string, ...names: string[]): string | null {
  for (const name of names) {
    const m =
      html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, 'i'))
    if (m?.[1]?.trim()) return m[1].trim()
  }
  return null
}

function getJsonLd(html: string): Record<string, any>[] {
  const results: Record<string, any>[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      const obj = JSON.parse(m[1])
      if (Array.isArray(obj)) results.push(...obj)
      else results.push(obj)
    } catch {}
  }
  return results
}

function extractName(html: string): string | null {
  // 1. og:title / twitter:title
  const og = getMeta(html, 'og:title', 'twitter:title')
  if (og) {
    // Strip common site suffixes like " | IRONMAN" or " - Active.com"
    return og.replace(/\s*[\|–\-]\s*.{3,30}$/, '').trim() || og
  }

  // 2. JSON-LD name
  for (const ld of getJsonLd(html)) {
    if (ld.name && (ld['@type'] === 'SportsEvent' || ld['@type'] === 'Event')) {
      return String(ld.name).trim()
    }
  }

  // 3. <title> tag
  const title = html.match(/<title[^>]*>([^<]{4,})<\/title>/i)?.[1]
  if (title) return title.replace(/\s*[\|–\-]\s*.{3,30}$/, '').trim()

  // 4. First <h1>
  const h1 = html.match(/<h1[^>]*>([^<]{4,})<\/h1>/i)?.[1]
  return h1?.replace(/<[^>]+>/g, '').trim() || null
}

function extractLocation(html: string): string | null {
  // 1. JSON-LD location
  for (const ld of getJsonLd(html)) {
    const loc = ld.location || ld.address
    if (loc) {
      const city    = loc.addressLocality || loc.city || ''
      const region  = loc.addressRegion   || loc.state || ''
      const country = loc.addressCountry  || ''
      const parts = [city, region || country].filter(Boolean)
      if (parts.length) return parts.join(', ')
    }
  }

  // 2. og:locality / og:region
  const locality = getMeta(html, 'og:locality')
  const region   = getMeta(html, 'og:region')
  if (locality) return [locality, region].filter(Boolean).join(', ')

  // 3. Regex for "City, ST" or "City, Country" patterns in page text
  const text = html.replace(/<[^>]+>/g, ' ')
  const m = text.match(/\b([A-Z][a-zA-Z\s]{2,20}),\s*([A-Z]{2}|[A-Z][a-z]{3,15})\b/)
  return m ? `${m[1].trim()}, ${m[2].trim()}` : null
}

function extractDate(html: string): string | null {
  // 1. JSON-LD startDate
  for (const ld of getJsonLd(html)) {
    const d = ld.startDate || ld.date
    if (d) {
      const parsed = new Date(d)
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]
    }
  }

  // 2. Meta tags
  for (const name of ['event:start_time', 'og:event_start_time', 'article:published_time']) {
    const val = getMeta(html, name)
    if (val) {
      const parsed = new Date(val)
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]
    }
  }

  // 3. Regex patterns in raw text
  const text = html.replace(/<[^>]+>/g, ' ')

  // "June 8, 2026" / "Jun 8 2026"
  const monthNames = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?'
  const longDate = text.match(new RegExp(`(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(20\\d{2})`, 'i'))
  if (longDate) {
    const d = new Date(`${longDate[1]} ${longDate[2]}, ${longDate[3]}`)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }

  // "2026-06-08" or "06/08/2026"
  const iso = text.match(/\b(20\d{2})[\/\-](0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])\b/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

  const mdy = text.match(/\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(20\d{2})\b/)
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`

  return null
}

function extractDistanceType(html: string): string {
  const text = (html.replace(/<[^>]+>/g, ' ') + ' ' + (getMeta(html, 'og:title', 'og:description') || '')).toLowerCase()

  if (/140\.6|full[\s\-]iron(?:man)?|ironman[\s\-]triathlon\b/.test(text)) return '140.6'
  if (/70\.3|half[\s\-]iron(?:man)?|ironman[\s\-]70/.test(text))            return '70.3'
  if (/olympic[\s\-](?:distance|tri)|itu[\s\-]|international[\s\-]distance/.test(text)) return 'olympic'
  if (/sprint[\s\-](?:distance|tri(?:athlon)?)/.test(text))                  return 'sprint'
  // Loose fallbacks
  if (/\bsprint\b/.test(text))  return 'sprint'
  if (/\bolympic\b/.test(text)) return 'olympic'

  return 'other'
}

// ── Route ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await request.json()
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  let html: string
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Brickhaus/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch (err: any) {
    return NextResponse.json({ error: `Could not fetch page: ${err.message}` }, { status: 422 })
  }

  const name          = extractName(html)
  const location      = extractLocation(html)
  const race_date     = extractDate(html)
  const distance_type = extractDistanceType(html)

  if (!name && !race_date) {
    return NextResponse.json({ error: 'Could not find race details on this page' }, { status: 422 })
  }

  return NextResponse.json({ name, location, race_date, distance_type })
}
