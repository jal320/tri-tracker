import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('full_name, height_cm, weight_kg, max_hr, ftp_watts')
    .eq('id', user.id)
    .single()

  return NextResponse.json(data || {})
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { full_name, height, weight, max_hr, ftp_watts } = await request.json()

  const adminSupabase = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminSupabase
    .from('profiles')
    .update({
      full_name: full_name || null,
      height_cm: height    ? parseFloat(height) * 2.54     : null,
      weight_kg: weight    ? parseFloat(weight) * 0.453592 : null,
      max_hr:    max_hr    ? parseInt(max_hr)               : null,
      ftp_watts: ftp_watts ? parseInt(ftp_watts)            : null,
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
