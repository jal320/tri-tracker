import Anthropic from '@anthropic-ai/sdk'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { estimateTSS } from '@/lib/tss'
import { calculateFitness, getLatestFitness } from '@/lib/fitness'

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function fmtTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtDist(m: number): string {
  const miles = m / 1609.34
  return miles >= 10 ? `${Math.round(miles)}mi` : `${(miles).toFixed(1)}mi`
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr + 'T12:00:00').getTime() - Date.now()) / 86400000)
}

function tsbStatus(tsb: number): string {
  if (tsb >= 10) return 'fresh and primed'
  if (tsb >= 0)  return 'balanced'
  if (tsb >= -10) return 'slight fatigue'
  if (tsb >= -20) return 'moderate fatigue'
  return 'heavy fatigue — recovery needed'
}

async function buildSystemPrompt(
  userId: string,
  profileName: string | null,
  pagePath: string,
): Promise<string> {
  const supabase = adminClient()
  const today = new Date().toISOString().split('T')[0]
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString()

  const [
    { data: activities },
    { data: recentActivities },
    { data: races },
    { data: allActivities },
  ] = await Promise.all([
    supabase
      .from('strava_activities')
      .select('sport, start_time, moving_time_s, avg_hr, suffer_score, avg_power_w, normalized_power_w')
      .eq('user_id', userId)
      .order('start_time', { ascending: true }),
    supabase
      .from('strava_activities')
      .select('sport, name, distance_m, moving_time_s, start_time, avg_hr, suffer_score, avg_power_w, normalized_power_w, elevation_gain_m')
      .eq('user_id', userId)
      .gte('start_time', twoWeeksAgo)
      .order('start_time', { ascending: false }),
    supabase
      .from('races')
      .select('name, location, race_date, distance_type, goal_type, goal_finish_time_s')
      .or(`created_by.eq.${userId},is_group_race.eq.true`)
      .gte('race_date', today)
      .order('race_date', { ascending: true }),
    supabase
      .from('strava_activities')
      .select('sport, start_time, moving_time_s, avg_hr, suffer_score, avg_power_w, normalized_power_w')
      .eq('user_id', userId)
      .gte('start_time', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])

  const snapshots = calculateFitness(activities || [])
  const fitness = getLatestFitness(snapshots)

  const athleteName = profileName || 'Athlete'

  // ── Fitness block ──────────────────────────────────────────────────────
  const fitnessBlock = `
## Current Fitness (as of today)
- CTL (chronic training load / fitness): ${Math.round(fitness.ctl)}
- ATL (acute training load / fatigue): ${Math.round(fitness.atl)}
- TSB (form/freshness): ${Math.round(fitness.tsb)} → ${tsbStatus(fitness.tsb)}
- Today's TSS so far: ${Math.round(fitness.dailyTSS)}`

  // ── This week ──────────────────────────────────────────────────────────
  const weekTSS = (allActivities || []).reduce((s, a) => s + estimateTSS(a), 0)
  const weekBySport = (allActivities || []).reduce((acc: Record<string, number>, a) => {
    acc[a.sport] = (acc[a.sport] || 0) + estimateTSS(a)
    return acc
  }, {})
  const weekBlock = `
## This Week's Training
- Total TSS: ${Math.round(weekTSS)}
${Object.entries(weekBySport).map(([sport, tss]) => `- ${sport}: ${Math.round(tss)} TSS`).join('\n')}`

  // ── Recent activities ──────────────────────────────────────────────────
  const recentBlock = recentActivities?.length
    ? `\n## Recent Activities (last 14 days)\n` + recentActivities.slice(0, 8).map(a => {
        const parts = [
          new Date(a.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          a.sport.toUpperCase(),
          a.name,
          a.distance_m ? fmtDist(a.distance_m) : null,
          a.moving_time_s ? fmtTime(a.moving_time_s) : null,
          a.avg_hr ? `${a.avg_hr}bpm avg HR` : null,
          `${estimateTSS(a)} TSS`,
        ].filter(Boolean)
        return `- ${parts.join(' | ')}`
      }).join('\n')
    : '\n## Recent Activities\nNo activities recorded yet.'

  // ── Upcoming races ─────────────────────────────────────────────────────
  const racesBlock = races?.length
    ? `\n## Upcoming Races\n` + races.map(r => {
        const days = daysUntil(r.race_date)
        const goal = r.goal_finish_time_s ? ` | Goal: ${fmtTime(r.goal_finish_time_s)}` : ''
        return `- ${r.name} (${r.distance_type}) — ${fmtDate(r.race_date)} — ${days} days away${r.location ? ` — ${r.location}` : ''}${goal}`
      }).join('\n')
    : '\n## Upcoming Races\nNo races scheduled.'

  // ── Page context ───────────────────────────────────────────────────────
  const pageContextMap: Record<string, string> = {
    '/':           'The athlete is currently on their dashboard, which shows weekly training overview, fitness stats, today\'s planned workouts, and the leaderboard.',
    '/fitness':    'The athlete is currently viewing their Fitness page, which shows CTL/ATL/TSB trend charts, weekly TSS breakdown by sport, and heart rate zone distribution.',
    '/races':      'The athlete is currently viewing their Races page, showing upcoming and past races with split projections.',
    '/training':   'The athlete is currently viewing their Training calendar for the month.',
    '/activities': 'The athlete is currently viewing their Activities log.',
    '/community':  'The athlete is currently viewing the Community page showing group leaderboard and shared activities.',
    '/settings':   'The athlete is currently in Settings.',
    '/coach':      'The athlete is in the Training Coach page, dedicated to building and managing training plans.',
  }
  const pageCtx = pageContextMap[pagePath] || `The athlete is on page: ${pagePath}`

  const planInstructions = pagePath === '/coach' ? `

## Generating Training Plans
When the athlete asks you to build, create, or generate a training plan, respond with a coaching explanation followed by a structured plan block.

After your prose explanation, output a JSON code block with the language identifier \`plan\` containing an array of workout objects. Every object must have:
- date: "YYYY-MM-DD"
- sport: "swim" | "bike" | "run"
- title: string (concise workout name, e.g. "Zone 2 bike", "Threshold run intervals")
- duration_s: number (seconds)
- zone: 1 | 2 | 3 | 4 | 5
- description: string (brief coaching notes, 1-2 sentences)

Rules:
- Start the plan from tomorrow or the next logical training day
- Space workouts appropriately — never schedule more than the athlete's requested days per week
- Include at least one complete rest day per week (no entry needed for rest days)
- Build TSS progressively — roughly 10% per week — then taper the final 1-2 weeks before race day
- Scale volume to the athlete's current CTL (current fitness: ${Math.round(fitness.ctl)} CTL)
- Mix sports appropriately for the race distance
- Only output the \`\`\`plan block when explicitly asked to generate/build/create a plan

Example format (do not copy these workouts, generate real ones):
\`\`\`plan
[
  {"date":"2026-04-15","sport":"run","title":"Easy aerobic run","duration_s":2700,"zone":2,"description":"Conversational pace, keep HR in zone 2 throughout."},
  {"date":"2026-04-16","sport":"swim","title":"Endurance swim","duration_s":2400,"zone":2,"description":"Focus on stroke efficiency. 200m warm-up, 4×400m at aerobic pace, 200m cool-down."}
]
\`\`\`
` : ''

  return `You are Coach Brick, an expert AI triathlon coach embedded in Brickhaus — a triathlon training app. You are coaching ${athleteName}.

Your coaching philosophy:
- Data-driven and specific: always reference the athlete's actual numbers
- Periodization-aware: respect the training load and recovery signals
- Race-focused: all training decisions connect back to race goals
- Honest but encouraging: give clear guidance without sugarcoating readiness issues
- Concise and actionable: give concrete workouts, paces, durations — not just generic advice

When suggesting workouts, be specific: include duration, intensity zones, and sport. Reference their current CTL/ATL/TSB to justify load recommendations. When they're near a race, shift to taper guidance.

${fitnessBlock}
${weekBlock}
${recentBlock}
${racesBlock}

## Current Context
${pageCtx}

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${planInstructions}
Respond in a direct, coach-like tone. Use markdown formatting for structure when listing workouts or plans. Keep responses focused and actionable. You may ask one clarifying question at a time if needed.`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get API key and profile — server-side only
  const { data: profile } = await adminClient()
    .from('profiles')
    .select('anthropic_api_key, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.anthropic_api_key) {
    return NextResponse.json(
      { error: 'No API key configured. Add your Anthropic API key in Settings → Connections.' },
      { status: 400 }
    )
  }

  const { messages, pagePath = '/' } = await request.json()
  if (!messages?.length) return NextResponse.json({ error: 'No messages' }, { status: 400 })

  const systemPrompt = await buildSystemPrompt(user.id, profile.full_name, pagePath)

  const anthropic = new Anthropic({ apiKey: profile.anthropic_api_key })

  // Stream the response — filter to text deltas only (skip thinking blocks)
  let stream: ReturnType<typeof anthropic.messages.stream>
  try {
    stream = anthropic.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(new TextEncoder().encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err: any) {
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
