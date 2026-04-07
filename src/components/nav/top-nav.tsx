'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from '@/components/providers/theme-provider'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Training', href: '/training' },
  { label: 'Activities', href: '/activities' },
  { label: 'Fitness', href: '/fitness' },
  { label: 'Races', href: '/races' },
  { label: 'Community', href: '/community' },
]

export function TopNav({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  const initials = userEmail
    ? userEmail.split('@')[0].slice(0, 2).toUpperCase()
    : 'ME'

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const cycleTheme = () => {
    const next: Record<string, 'light' | 'dark' | 'system'> = {
      light: 'dark', dark: 'system', system: 'light'
    }
    setTheme(next[theme])
  }

  const themeIcon = theme === 'dark' ? '☾' : theme === 'light' ? '☀' : '◑'

  return (
    <>
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 'var(--nav-height)',
        background: 'var(--color-surface)',
        borderBottom: '0.5px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '24px',
      }}>
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-barlow-condensed)',
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: 'var(--color-text-1)',
          }}>
            BRICK<span style={{ color: 'var(--color-brand)' }}>HAUS</span>
          </span>
        </Link>

        <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                fontSize: '13px',
                fontWeight: 500,
                padding: '6px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: active ? 'var(--color-text-1)' : 'var(--color-text-2)',
                background: active ? 'var(--color-surface-2)' : 'transparent',
              }}>
                {item.label}
              </Link>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={cycleTheme} style={{
            width: '30px',
            height: '30px',
            borderRadius: '6px',
            border: '0.5px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-2)',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {themeIcon}
          </button>

          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--color-text-3)',
            padding: '2px 6px',
            background: 'var(--color-surface-2)',
            borderRadius: '4px',
            border: '0.5px solid var(--color-border)',
          }}>
            mi
          </span>

          <button onClick={() => router.push('/settings')} title="Settings" style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'var(--color-brand)',
            border: 'none',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {initials}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 'var(--nav-height)',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--color-surface)',
          zIndex: 99,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: '18px',
                fontWeight: 500,
                padding: '12px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'var(--color-text-1)',
                background: pathname === item.href ? 'var(--color-surface-2)' : 'transparent',
              }}>
              {item.label}
            </Link>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '0.5px solid var(--color-border)' }}>
            <button onClick={signOut} style={{
              width: '100%',
              padding: '12px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text-2)',
              fontSize: '14px',
              cursor: 'pointer',
            }}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  )
}
