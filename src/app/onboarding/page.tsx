import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { OnboardingClient } from './onboarding-client'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_complete) redirect('/')

  return (
    <Suspense>
      <OnboardingClient userId={user.id} email={user.email || ''} />
    </Suspense>
  )
}
