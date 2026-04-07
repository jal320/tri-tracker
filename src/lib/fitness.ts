import { estimateTSS } from './tss'

interface Activity {
  start_time: string
  moving_time_s: number | null
  avg_hr: number | null
  suffer_score: number | null
  avg_power_w: number | null
  normalized_power_w: number | null
  sport: string
}

interface DailyTSS {
  date: string
  tss: number
}

interface FitnessSnapshot {
  date: string
  ctl: number
  atl: number
  tsb: number
  dailyTSS: number
}

export function calculateFitness(activities: Activity[]): FitnessSnapshot[] {
  if (!activities.length) return []

  // Build a map of date -> total TSS
  const tssByDate: Record<string, number> = {}
  activities.forEach(a => {
    const date = a.start_time.split('T')[0]
    const tss = estimateTSS(a)
    tssByDate[date] = (tssByDate[date] || 0) + tss
  })

  // Get date range
  const dates = Object.keys(tssByDate).sort()
  const start = new Date(dates[0])
  const end = new Date()

  // CTL decay: 42 day time constant, ATL: 7 day
  const CTL_TC = 42
  const ATL_TC = 7
  const ctlDecay = 1 - 1 / CTL_TC
  const atlDecay = 1 - 1 / ATL_TC

  let ctl = 0
  let atl = 0
  const snapshots: FitnessSnapshot[] = []

  const current = new Date(start)
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    const dailyTSS = tssByDate[dateStr] || 0

    ctl = ctl * ctlDecay + dailyTSS * (1 / CTL_TC)
    atl = atl * atlDecay + dailyTSS * (1 / ATL_TC)

    snapshots.push({
      date: dateStr,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round((ctl - atl) * 10) / 10,
      dailyTSS,
    })

    current.setDate(current.getDate() + 1)
  }

  return snapshots
}

export function getLatestFitness(snapshots: FitnessSnapshot[]) {
  if (!snapshots.length) return { ctl: 0, atl: 0, tsb: 0, dailyTSS: 0 }
  return snapshots[snapshots.length - 1]
}

export function getTrend(snapshots: FitnessSnapshot[], days = 13) {
  const recent = snapshots.slice(-days)
  return recent.map(s => s.ctl)
}
