import { createClient } from '@/lib/supabase/server'
import { RacesClient } from './races-client'

export default async function RacesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: races } = await supabase
    .from('races')
    .select('*, race_participants(user_id)')
    .or(`created_by.eq.${user!.id},is_group_race.eq.true`)
    .order('race_date', { ascending: true })

  return <RacesClient races={races || []} userId={user!.id} />
}
