import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

function parseRequestCookies(cookieHeader: string): Array<{ name: string; value: string }> {
  return cookieHeader
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const idx = s.indexOf('=')
      return idx === -1 ? null : { name: s.slice(0, idx).trim(), value: decodeURIComponent(s.slice(idx + 1).trim()) }
    })
    .filter((c): c is { name: string; value: string } => c !== null)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=no_code`)
  }

  // Accumulate cookies that supabase wants to set
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseRequestCookies(request.headers.get('cookie') || '')
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options: options as Record<string, unknown> })
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${siteUrl}/login?error=exchange_failed`)
  }

  // Determine redirect destination
  let redirectPath = next
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_complete) {
      redirectPath = next && next !== '/'
        ? `/onboarding?next=${encodeURIComponent(next)}`
        : '/onboarding'
    }
  }

  // Build response and apply all pending cookies directly to it
  const response = NextResponse.redirect(`${siteUrl}${redirectPath}`)
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })

  return response
}
