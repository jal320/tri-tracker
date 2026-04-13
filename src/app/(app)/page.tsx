import { createClient } from '@/lib/supabase/server'
import { estimateTSS } from '@/lib/tss'
import { calculateFitness, getLatestFitness, getTrend } from '@/lib/fitness'
import { RaceBanner } from '@/components/dashboard/race-banner'
import { TodaysPlan } from '@/components/dashboard/todays-plan'
import { WeeklyOverview } from '@/components/dashboard/weekly-overview'
import { FitnessStats } from '@/components/dashboard/fitness-stats'
import { RecentActivities } from '@/components/dashboard/recent-activities'
import { Leaderboard } from '@/components/dashboard/leaderboard'

function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const weekStart = getWeekStart()

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: recentActivities },
    { data: weekActivities },
    { data: allActivities },
    { data: nextRace },
    { data: todayWorkouts },
    { data: members },
    { data: allWeekActivities },
  ] = await Promise.all([
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
    supabase
      .from('strava_activities')
      .select('sport, start_time, moving_time_s, avg_hr, suffer_score, avg_power_w, normalized_power_w')
      .eq('user_id', user!.id)
      .order('start_time', { ascending: true }),
    supabase
      .from('races')
      .select('name, location, race_date, distance_type')
      .eq('created_by', user!.id)
      .gte('race_date', today)
      .order('race_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('planned_workouts')
      .select('sport, title, duration_s, zone, tss_estimate, swim_distance_m, bike_distance_m, run_distance_m')
      .eq('user_id', user!.id)
      .eq('planned_date', today)
      .order('sport'),
    supabase
      .from('profiles')
      .select('id, full_name, email'),
    supabase
      .from('strava_activities')
      .select('user_id, sport, moving_time_s, suffer_score, avg_hr, avg_power_w, normalized_power_w')
      .gte('start_time', weekStart.toISOString())
      .limit(500),
  ])

  // Calculate weekly bars
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  const days = DAY_LABELS.map((label, i) => {
    const dayActivities = (weekActivities || []).filter(a => {
      const d = new Date(a.start_time).getDay()
      const di = d === 0 ? 6 : d - 1
      return di === i
    })
    const tss = dayActivities.reduce((sum, a) => sum + estimateTSS(a), 0)
    return {
      label,
      isToday: i === todayIndex,
      swim: Math.round(dayActivities.filter(a => a.sport === 'swim').reduce((s, a) => s + estimateTSS(a), 0)),
      bike: Math.round(dayActivities.filter(a => a.sport === 'bike').reduce((s, a) => s + estimateTSS(a), 0)),
      run: Math.round(dayActivities.filter(a => a.sport === 'run').reduce((s, a) => s + estimateTSS(a), 0)),
      tss: Math.round(tss),
    }
  })

  // Calculate fitness metrics
  const snapshots = calculateFitness(allActivities || [])
  const latest = getLatestFitness(snapshots)
  const trend = getTrend(snapshots, 13)
  const weeklyTSS = days.reduce((sum, d) => sum + d.tss, 0)

  // Leaderboard: weekly TSS per member
  const leaderboardEntries = (members || [])
    .map(m => {
      const acts = (allWeekActivities || []).filter(a => a.user_id === m.id)
      const tss = Math.round(acts.reduce((sum, a) => sum + estimateTSS(a), 0))
      const name = m.full_name || m.email?.split('@')[0] || 'Athlete'
      return { name, tss, isMe: m.id === user!.id }
    })
    .sort((a, b) => b.tss - a.tss)

  return (
    <div>
      <RaceBanner race={nextRace ?? null} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '16px',
        alignItems: 'start',
      }}>
        <div>
          <TodaysPlan workouts={todayWorkouts || []} />
          <WeeklyOverview days={days} />
          <FitnessStats
            ctl={latest.ctl}
            atl={latest.atl}
            tsb={latest.tsb}
            weeklyTSS={weeklyTSS}
            weeklyTSSGoal={400}
            trend={trend}
          />
        </div>
        <div>
          <RecentActivities activities={recentActivities || []} />
          <Leaderboard entries={leaderboardEntries} />
        </div>
      </div>
    </div>
  )
}
