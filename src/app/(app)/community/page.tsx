import { createClient } from '@/lib/supabase/server'
import { CommunityClient } from './community-client'
import { estimateTSS } from '@/lib/tss'

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all group members
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, strava_connected_at')

  // Get all activities for all group members
  const { data: allActivities } = await supabase
    .from('strava_activities')
    .select('id, user_id, sport, name, distance_m, moving_time_s, start_time, avg_hr, suffer_score, avg_power_w, normalized_power_w, elevation_gain_m')
    .in('user_id', (members || []).map(m => m.id))
    .order('start_time', { ascending: false })
    .limit(50)

  // Get shared races
  const { data: races } = await supabase
    .from('races')
    .select('*, race_participants(user_id)')
    .eq('is_group_race', true)
    .gte('race_date', new Date().toISOString().split('T')[0])
    .order('race_date', { ascending: true })

  // Weekly TSS per user
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)

  const weeklyStats = (members || []).map(member => {
    const memberActivities = (allActivities || []).filter(
      a => a.user_id === member.id && new Date(a.start_time) >= weekStart
    )
    const tss = memberActivities.reduce((sum, a) => sum + estimateTSS(a), 0)
    const miles = memberActivities.reduce((sum, a) => sum + (a.distance_m || 0) / 1609.34, 0)
    const hours = memberActivities.reduce((sum, a) => sum + (a.moving_time_s || 0) / 3600, 0)
    return {
      userId: member.id,
      name: member.full_name || member.email?.split('@')[0] || 'Athlete',
      email: member.email || '',
      tss: Math.round(tss),
      miles: Math.round(miles * 10) / 10,
      hours: Math.round(hours * 10) / 10,
      isCurrentUser: member.id === user!.id,
    }
  }).sort((a, b) => b.tss - a.tss)

  return (
    <CommunityClient
      activities={allActivities || []}
      members={members || []}
      weeklyStats={weeklyStats}
      races={races || []}
      currentUserId={user!.id}
    />
  )
}
