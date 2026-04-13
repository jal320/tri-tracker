import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      let redirectPath = next
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

      const response = NextResponse.redirect(`${siteUrl}${redirectPath}`)

      // Explicitly copy all cookies (including the new session) onto the redirect response
      cookieStore.getAll().forEach(({ name, value }) => {
        response.cookies.set(name, value, { path: '/', sameSite: 'lax' })
      })

      return response
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth`)
}
