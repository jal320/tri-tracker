import { createClient } from '@/lib/supabase/server'
import { FitnessClient } from './fitness-client'
import { calculateFitness } from '@/lib/fitness'
import { estimateTSS } from '@/lib/tss'

export default async function FitnessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: activities } = await supabase
    .from('strava_activities')
    .select('sport, start_time, moving_time_s, avg_hr, suffer_score, avg_power_w, normalized_power_w, max_hr, distance_m')
    .eq('user_id', user!.id)
    .order('start_time', { ascending: true })

  const snapshots = calculateFitness(activities || [])

  // Weekly TSS for last 12 weeks
  const weeks: { label: string; swim: number; bike: number; run: number; total: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() - i * 7)
    weekEnd.setHours(23, 59, 59, 999)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)

    const weekActivities = (activities || []).filter(a => {
      const d = new Date(a.start_time)
      return d >= weekStart && d <= weekEnd
    })

    const swim = weekActivities.filter(a => a.sport === 'swim').reduce((s, a) => s + estimateTSS(a), 0)
    const bike = weekActivities.filter(a => a.sport === 'bike').reduce((s, a) => s + estimateTSS(a), 0)
    const run = weekActivities.filter(a => a.sport === 'run').reduce((s, a) => s + estimateTSS(a), 0)

    weeks.push({
      label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      swim: Math.round(swim),
      bike: Math.round(bike),
      run: Math.round(run),
      total: Math.round(swim + bike + run),
    })
  }

  // HR zone distribution from all activities
  const zoneCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let totalWithHR = 0
  ;(activities || []).forEach(a => {
    if (!a.avg_hr || !a.max_hr) return
    const pct = a.avg_hr / a.max_hr
    totalWithHR++
    if (pct < 0.6) zoneCounts[1]++
    else if (pct < 0.7) zoneCounts[2]++
    else if (pct < 0.8) zoneCounts[3]++
    else if (pct < 0.9) zoneCounts[4]++
    else zoneCounts[5]++
  })

  const zoneData = Object.entries(zoneCounts).map(([z, count]) => ({
    zone: parseInt(z),
    count,
    pct: totalWithHR > 0 ? Math.round((count / totalWithHR) * 100) : 0,
  }))

  return (
    <FitnessClient
      snapshots={snapshots.slice(-90)}
      weeks={weeks}
      zoneData={zoneData}
    />
  )
}
