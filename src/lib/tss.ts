/**
 * Estimate TSS from a Strava activity
 * Uses suffer score as proxy when HR data is available
 * Falls back to duration-based estimate
 */
export function estimateTSS(activity: {
  moving_time_s: number | null
  avg_hr: number | null
  max_hr: number | null
  suffer_score: number | null
  avg_power_w: number | null
  normalized_power_w: number | null
  sport: string
}): number {
  // If we have power data (cycling) use power-based TSS
  if (activity.normalized_power_w && activity.avg_power_w && activity.moving_time_s) {
    // TSS = (duration_s * NP * IF) / (FTP * 3600) * 100
    // Without FTP we estimate IF from NP assuming ~250w FTP
    const estimatedFTP = 250
    const intensityFactor = activity.normalized_power_w / estimatedFTP
    const tss = (activity.moving_time_s * activity.normalized_power_w * intensityFactor) / (estimatedFTP * 3600) * 100
    return Math.round(Math.min(tss, 400))
  }

  // If we have suffer score use it as a TSS proxy (Strava's suffer score correlates well)
  if (activity.suffer_score) {
    return Math.round(Math.min(activity.suffer_score * 1.2, 400))
  }

  // Fall back to duration-based estimate by sport
  if (!activity.moving_time_s) return 0
  const hours = activity.moving_time_s / 3600
  const rateBySSport: Record<string, number> = {
    swim: 60,
    bike: 55,
    run: 65,
    other: 50,
  }
  const rate = rateBySSport[activity.sport] || 50
  return Math.round(Math.min(hours * rate, 400))
}
