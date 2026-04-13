import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TopNav } from '@/components/nav/top-nav'
import { StravaReconnectBanner } from '@/components/strava-reconnect-banner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, strava_access_token, onboarding_complete')
    .eq('id', user.id)
    .single()

  // Fallback guard — proxy.ts handles this first, but catch it here too
  if (!profile?.onboarding_complete) redirect('/onboarding')

  const isAdmin = profile?.role === 'admin'
  const stravaConnected = !!profile?.strava_access_token

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <TopNav userEmail={profile?.email || user.email} isAdmin={isAdmin} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
        {!stravaConnected && <StravaReconnectBanner />}
        {children}
      </main>
    </div>
  )
}
