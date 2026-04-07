import { createClient } from '@/lib/supabase/server'
import { RaceBanner } from '@/components/dashboard/race-banner'
import { TodaysPlan } from '@/components/dashboard/todays-plan'
import { WeeklyOverview } from '@/components/dashboard/weekly-overview'
import { FitnessStats } from '@/components/dashboard/fitness-stats'
import { RecentActivities } from '@/components/dashboard/recent-activities'
import { Leaderboard } from '@/components/dashboard/leaderboard'
import { TriCoachNudge } from '@/components/dashboard/tri-coach-nudge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: activities } = await supabase
    .from('strava_activities')
    .select('id, sport, name, distance_m, moving_time_s, start_time, avg_hr, suffer_score')
    .eq('user_id', user!.id)
    .order('start_time', { ascending: false })
    .limit(4)

  return (
    <div>
      <RaceBanner />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '16px',
        alignItems: 'start',
      }}>
        <div>
          <TodaysPlan />
          <WeeklyOverview />
          <FitnessStats />
        </div>
        <div>
          <RecentActivities activities={activities || []} />
          <Leaderboard />
          <TriCoachNudge />
        </div>
      </div>
    </div>
  )
}
