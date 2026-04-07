import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function refreshStravaToken(refreshToken: string) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  return res.json()
}

export async function POST() {
  const serverSupabase = await createServerClient()
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('strava_access_token, strava_refresh_token, strava_token_expires_at, strava_history_months')
    .eq('id', user.id)
    .single()

  if (!profile?.strava_access_token) {
    return NextResponse.json({ error: 'Strava not connected' }, { status: 400 })
  }

  let accessToken = profile.strava_access_token

  const expiresAt = new Date(profile.strava_token_expires_at).getTime()
  if (Date.now() > expiresAt - 60000) {
    const refreshed = await refreshStravaToken(profile.strava_refresh_token)
    if (refreshed.access_token) {
      accessToken = refreshed.access_token
      await adminSupabase
        .from('profiles')
        .update({
          strava_access_token: refreshed.access_token,
          strava_refresh_token: refreshed.refresh_token,
          strava_token_expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
        })
        .eq('id', user.id)
    }
  }

  const months = profile.strava_history_months || 3
  const after = Math.floor(Date.now() / 1000) - months * 30 * 24 * 60 * 60

  const activitiesRes = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  const activities = await activitiesRes.json()

  if (!Array.isArray(activities)) {
    console.error('Strava API error:', activities)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }

  const sportMap: Record<string, string> = {
    Ride: 'bike', VirtualRide: 'bike', EBikeRide: 'bike',
    Run: 'run', VirtualRun: 'run', TrailRun: 'run',
    Swim: 'swim',
  }

  const rows = activities.map((a: any) => ({
    user_id: user.id,
    strava_id: a.id,
    name: a.name,
    sport: sportMap[a.type] || 'other',
    start_time: a.start_date,
    elapsed_time_s: a.elapsed_time,
    moving_time_s: a.moving_time,
    distance_m: a.distance ? parseFloat(a.distance) : null,
    avg_speed_ms: a.average_speed ? parseFloat(a.average_speed) : null,
    max_speed_ms: a.max_speed ? parseFloat(a.max_speed) : null,
    avg_hr: a.average_heartrate ? Math.round(a.average_heartrate) : null,
    max_hr: a.max_heartrate ? Math.round(a.max_heartrate) : null,
    avg_power_w: a.average_watts ? parseFloat(a.average_watts) : null,
    normalized_power_w: a.weighted_average_watts ? parseFloat(a.weighted_average_watts) : null,
    elevation_gain_m: a.total_elevation_gain ? parseFloat(a.total_elevation_gain) : null,
    suffer_score: a.suffer_score ? Math.round(a.suffer_score) : null,
    strava_kudos_count: a.kudos_count || 0,
    strava_map_polyline: a.map?.summary_polyline || null,
  }))

  console.log(`Upserting ${rows.length} activities for user ${user.id}`)
  console.log('Sample row:', JSON.stringify(rows[0], null, 2))

  const { error } = await adminSupabase
    .from('strava_activities')
    .upsert(rows, { onConflict: 'strava_id' })

  if (error) {
    console.error('Upsert error:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await adminSupabase
    .from('profiles')
    .update({
      strava_last_synced_at: new Date().toISOString(),
      strava_sync_error: null,
    })
    .eq('id', user.id)

  return NextResponse.json({ synced: rows.length })
}
