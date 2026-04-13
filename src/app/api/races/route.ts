import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('races')
    .insert({
      created_by:         user.id,
      name:               body.name,
      location:           body.location || null,
      race_date:          body.race_date,
      distance_type:      body.distance_type,
      goal_type:          body.goal_type || null,
      goal_finish_time_s: body.goal_finish_time_s || null,
      is_group_race:      body.is_group_race ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
