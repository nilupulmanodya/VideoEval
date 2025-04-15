import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")

    if (!code) {
      console.error("No code found in callback URL")
      return NextResponse.redirect(new URL("/login?error=no_code", request.url))
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Error exchanging code for session:", error.message)
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
    }

    // URL to redirect to after sign in process completes
    console.log("Auth callback successful, redirecting to dashboard")

    // Create a response with a redirect
    const response = NextResponse.redirect(new URL("/dashboard", request.url))

    // Set a bypass cookie to temporarily skip middleware checks
    // This helps prevent redirect loops right after authentication
    response.cookies.set("auth_bypass", "true", {
      maxAge: 5, // 5 seconds
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Unexpected error in auth callback:", error)
    return NextResponse.redirect(new URL("/login?error=unexpected", request.url))
  }
}
