import { createClient } from '@/lib/supabase/server'
import { ActivitiesClient } from './activities-client'

export default async function ActivitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: activities } = await supabase
    .from('strava_activities')
    .select('id, sport, name, distance_m, moving_time_s, elapsed_time_s, start_time, avg_hr, max_hr, avg_power_w, normalized_power_w, elevation_gain_m, suffer_score, strava_map_polyline')
    .eq('user_id', user!.id)
    .order('start_time', { ascending: false })

  return <ActivitiesClient activities={activities || []} />
}
