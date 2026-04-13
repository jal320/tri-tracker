import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { calculateFitness, getLatestFitness } from '@/lib/fitness'
import { CoachClient } from './coach-client'

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function CoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: races },
    { data: profile },
    { data: allActivities },
    { data: keyProfile },
  ] = await Promise.all([
    supabase
      .from('races')
      .select('id, name, race_date, distance_type, goal_type, goal_finish_time_s')
      .or(`created_by.eq.${user!.id},is_group_race.eq.true`)
      .gte('race_date', today)
      .order('race_date', { ascending: true })
      .limit(10),
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('strava_activities')
      .select('sport, start_time, moving_time_s, avg_hr, suffer_score, avg_power_w, normalized_power_w')
      .eq('user_id', user!.id)
      .order('start_time', { ascending: true }),
    adminClient()
      .from('profiles')
      .select('anthropic_api_key')
      .eq('id', user!.id)
      .single(),
  ])

  const snapshots = calculateFitness(allActivities || [])
  const fitness = getLatestFitness(snapshots)

  return (
    <CoachClient
      races={races || []}
      athleteName={profile?.full_name || null}
      fitness={{ ctl: fitness.ctl, atl: fitness.atl, tsb: fitness.tsb }}
      hasApiKey={!!keyProfile?.anthropic_api_key}
    />
  )
}
