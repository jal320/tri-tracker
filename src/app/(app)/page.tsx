import { createClient } from '@/lib/supabase/server'
import { estimateTSS } from '@/lib/tss'
import { RaceBanner } from '@/components/dashboard/race-banner'
import { TodaysPlan } from '@/components/dashboard/todays-plan'
import { WeeklyOverview } from '@/components/dashboard/weekly-overview'
import { FitnessStats } from '@/components/dashboard/fitness-stats'
import { RecentActivities } from '@/components/dashboard/recent-activities'
import { Leaderboard } from '@/components/dashboard/leaderboard'
import { TriCoachNudge } from '@/components/dashboard/tri-coach-nudge'

function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const weekStart = getWeekStart()

  const [{ data: activities }, { data: weekActivities }] = await Promise.all([
    supabase
      .from('strava_activities')
      .select('id, sport, name, distance_m, moving_time_s, start_time, avg_hr, suffer_score')
      .eq('user_id', user!.id)
      .order('start_time', { ascending: false })
      .limit(4),
    supabase
      .from('strava_activities')
      .select('sport, start_time, moving_time_s, avg_hr, suffer_score, avg_power_w, normalized_power_w')
      .eq('user_id', user!.id)
      .gte('start_time', weekStart.toISOString()),
  ])

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1

  const days = DAY_LABELS.map((label, i) => {
    const dayActivities = (weekActivities || []).filter(a => {
      const d = new Date(a.start_time).getDay()
      const di = d === 0 ? 6 : d - 1
      return di === i
    })

    const tss = dayActivities.reduce((sum, a) => sum + estimateTSS(a), 0)
    const swim = dayActivities.filter(a => a.sport === 'swim').reduce((s, a) => s + estimateTSS(a), 0)
    const bike = dayActivities.filter(a => a.sport === 'bike').reduce((s, a) => s + estimateTSS(a), 0)
    const run = dayActivities.filter(a => a.sport === 'run').reduce((s, a) => s + estimateTSS(a), 0)

    return {
      label,
      isToday: i === todayIndex,
      swim: Math.round(swim),
      bike: Math.round(bike),
      run: Math.round(run),
      tss: Math.round(tss),
    }
  })

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
          <WeeklyOverview days={days} />
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
