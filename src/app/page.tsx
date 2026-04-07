'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const supabase = createClient()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ padding: '2rem', background: '#ffffff', minHeight: '100vh' }}>
      <h1 style={{ color: '#000000' }}>Dashboard — coming soon</h1>
      <button 
        onClick={signOut} 
        style={{ 
          marginTop: '1rem', 
          padding: '8px 16px', 
          cursor: 'pointer',
          background: '#1D9E75',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
        Sign out
      </button>
    </div>
  )
}
