import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null
  return user
}

export async function PATCH(request: Request) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, role } = await request.json()

  const adminSupabase = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminSupabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await adminSupabase.from('admin_audit_log').insert({
    admin_id: admin.id,
    action: 'change_role',
    target_user_id: userId,
    details: { role },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await request.json()

  const adminSupabase = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await adminSupabase.from('admin_audit_log').insert({
    admin_id: admin.id,
    action: 'remove_user',
    target_user_id: userId,
  })

  const { error } = await adminSupabase.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
