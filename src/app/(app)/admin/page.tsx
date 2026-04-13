import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClient } from './admin-client'
import { createClient as createAdmin } from '@supabase/supabase-js'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const adminSupabase = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: members } = await adminSupabase
    .from('profiles')
    .select('id, full_name, email, role, created_at, strava_connected_at, strava_last_synced_at, onboarding_complete')
    .order('created_at', { ascending: true })

  // Get auth users for last sign in
  const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers()

  const membersWithAuth = (members || []).map(m => {
    const authUser = authUsers?.find(u => u.id === m.id)
    return {
      ...m,
      last_sign_in: authUser?.last_sign_in_at || null,
    }
  })

  return <AdminClient members={membersWithAuth} currentUserId={user.id} />
}
