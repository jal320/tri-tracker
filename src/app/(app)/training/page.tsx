import { createClient } from '@/lib/supabase/server'
import { TrainingClient } from './training-client'

export default async function TrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: plannedWorkouts } = await supabase
    .from('planned_workouts')
    .select('*')
    .eq('user_id', user!.id)
    .gte('planned_date', monthStart.toISOString().split('T')[0])
    .lte('planned_date', monthEnd.toISOString().split('T')[0])
    .order('planned_date', { ascending: true })

  const { data: completedWorkouts } = await supabase
    .from('strava_activities')
    .select('id, sport, name, distance_m, moving_time_s, start_time, suffer_score, avg_hr, avg_power_w, normalized_power_w')
    .eq('user_id', user!.id)
    .gte('start_time', monthStart.toISOString())
    .lte('start_time', monthEnd.toISOString())
    .order('start_time', { ascending: true })

  return (
    <TrainingClient
      plannedWorkouts={plannedWorkouts || []}
      completedWorkouts={completedWorkouts || []}
      userId={user!.id}
    />
  )
}
