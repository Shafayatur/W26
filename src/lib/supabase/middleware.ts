import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(
          cookiesToSet: {
            name: string
            value: string
            options?: CookieOptions
          }[]
        ) {
          // apply cookies to request
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          // recreate response
          supabaseResponse = NextResponse.next({ request })

          // apply cookies to response
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  const isAuthPage = url.pathname === '/auth'
  const isApiRoute = url.pathname.startsWith('/api')

  // redirect unauthenticated users
  if (!user && !isAuthPage && !isApiRoute) {
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // redirect logged-in users away from auth page
  if (user && isAuthPage) {
    url.pathname = '/fixtures'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}