import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = new Date(parseInt(year!), parseInt(month!), 0).toISOString().split('T')[0]

  const { data } = await supabase
    .from('planned_workouts')
    .select('*')
    .eq('user_id', user.id)
    .gte('planned_date', monthStart)
    .lte('planned_date', monthEnd)
    .order('planned_date', { ascending: true })

  return NextResponse.json(data || [])
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('planned_workouts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Estimate TSS from duration and zone
  const durationHours = (body.duration_s || 0) / 3600
  const zoneRates: Record<number, number> = { 1: 35, 2: 55, 3: 70, 4: 85, 5: 100 }
  const tssEstimate = durationHours * (zoneRates[body.zone] || 55)

  const { data, error } = await supabase
    .from('planned_workouts')
    .insert({
      ...body,
      user_id: user.id,
      tss_estimate: Math.round(tssEstimate * 10) / 10,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
