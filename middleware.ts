import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Create a cookie to bypass middleware temporarily after login
const BYPASS_COOKIE_NAME = "auth_bypass"
const BYPASS_COOKIE_VALUE = "true"
const BYPASS_COOKIE_EXPIRY = 5 // seconds

export async function middleware(req: NextRequest) {
  // Skip middleware for static files and API routes
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/api/") ||
    req.nextUrl.pathname.startsWith("/static") ||
    req.nextUrl.pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // Check for bypass cookie - this allows a brief window after login where middleware checks are skipped
  const bypassCookie = req.cookies.get(BYPASS_COOKIE_NAME)
  if (bypassCookie?.value === BYPASS_COOKIE_VALUE && req.nextUrl.pathname === "/dashboard") {
    console.log("[Middleware] Bypass cookie found, skipping session check for dashboard")
    const response = NextResponse.next()
    // Clear the bypass cookie
    response.cookies.delete(BYPASS_COOKIE_NAME)
    return response
  }

  // Create a response object that we can modify
  const res = NextResponse.next()

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired
    const { data } = await supabase.auth.getSession()
    const session = data?.session

    // Log for debugging
    console.log(`[Middleware] Session check for ${req.nextUrl.pathname}:`, session ? "Found session" : "No session")

    // Public routes that don't require authentication
    const publicRoutes = ["/", "/login", "/signup", "/auth/callback"]
    const isPublicRoute = publicRoutes.some(
      (route) => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route),
    )

    // If user is not signed in and trying to access a protected route
    if (!session && !isPublicRoute) {
      console.log(`[Middleware] No session, redirecting to login from ${req.nextUrl.pathname}`)

      // Set a bypass cookie when redirecting to login
      // This will help prevent redirect loops
      const redirectUrl = new URL("/login", req.url)
      const response = NextResponse.redirect(redirectUrl)

      return response
    }

    // If user is signed in and trying to access login/signup
    if (session && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup")) {
      console.log(`[Middleware] User already signed in, redirecting to dashboard`)
      const redirectUrl = new URL("/dashboard", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error("[Middleware] Error:", error)
    return res
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
