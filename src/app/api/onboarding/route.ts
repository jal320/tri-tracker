import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const adminSupabase = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Update profile
  await adminSupabase
    .from('profiles')
    .update({
      full_name: body.name,
      max_hr: body.maxHR,
      ftp_watts: body.ftp,
      weight_kg: body.weight ? body.weight * 0.453592 : null,
      height_cm: body.height ? body.height * 2.54 : null,
      onboarding_complete: true,
    })
    .eq('id', user.id)

  // Create race if provided
  if (body.race) {
    const goalTimeS = body.race.goal_finish_time_s

    await adminSupabase
      .from('races')
      .insert({
        created_by: user.id,
        name: body.race.name,
        location: body.race.location,
        race_date: body.race.race_date,
        distance_type: body.race.distance_type,
        goal_type: body.race.goal_type,
        goal_finish_time_s: goalTimeS,
        is_group_race: body.race.is_group_race,
      })
  }

  return NextResponse.json({ success: true })
}
