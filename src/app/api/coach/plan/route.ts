import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ZONE_RATES: Record<number, number> = { 1: 35, 2: 55, 3: 70, 4: 85, 5: 100 }

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workouts } = await request.json()
  if (!Array.isArray(workouts) || workouts.length === 0) {
    return NextResponse.json({ error: 'No workouts provided' }, { status: 400 })
  }

  const rows = workouts.map((w: {
    date: string
    sport: string
    title: string
    duration_s?: number
    zone?: number
    description?: string
    distance_m?: number
  }) => {
    const durationHours = (w.duration_s || 0) / 3600
    const zone = w.zone || 2
    const tssEstimate = Math.round(durationHours * (ZONE_RATES[zone] || 55) * 10) / 10
    return {
      user_id: user.id,
      sport: w.sport,
      title: w.title,
      planned_date: w.date,
      duration_s: w.duration_s || null,
      zone,
      description: w.description || null,
      tss_estimate: tssEstimate,
      swim_distance_m: w.sport === 'swim' ? (w.distance_m || null) : null,
      bike_distance_m: w.sport === 'bike' ? (w.distance_m || null) : null,
      run_distance_m: w.sport === 'run' ? (w.distance_m || null) : null,
    }
  })

  const { error } = await supabase.from('planned_workouts').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ saved: rows.length })
}
