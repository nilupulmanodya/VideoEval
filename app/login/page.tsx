"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [configError, setConfigError] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for Supabase configuration
  useEffect(() => {
    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Supabase environment variables are not properly configured")
      setConfigError(true)
      setError("Authentication service is not properly configured. Please contact support.")
    }
  }, [])

  // Check for error parameter in URL
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      if (errorParam === "no_code") {
        setError("Authentication failed. Please try again.")
      } else if (errorParam === "unexpected") {
        setError("An unexpected error occurred. Please try again.")
      } else {
        setError(`Authentication error: ${errorParam}`)
      }
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Don't proceed if there's a configuration error
    if (configError) {
      setLoading(false)
      return
    }

    try {
      console.log("Attempting to log in with:", { email })

      // Sign in with email and password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("Sign in response:", { data, error: signInError })

      if (signInError) {
        // Special handling for "Email not confirmed" error
        if (signInError.message.includes("Email not confirmed")) {
          // Try to auto-confirm the email
          const confirmResult = await confirmUserEmail(email)

          if (confirmResult.success) {
            // If confirmation was successful, try logging in again
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password,
            })

            if (retryError) {
              throw retryError
            }

            if (retryData?.user) {
              console.log("User logged in after auto-confirmation:", retryData.user)

              // Wait a moment for the session to be established
              setTimeout(() => {
                router.push("/dashboard")
              }, 500)

              return
            }
          } else {
            throw new Error("Your email is not confirmed. Please check your inbox for a confirmation email.")
          }
        } else {
          throw signInError
        }
      }

      // If login successful, redirect to dashboard
      if (data?.user) {
        console.log("User logged in:", data.user)

        // Wait a moment for the session to be established
        setTimeout(() => {
          router.push("/dashboard")
        }, 500)
      }
    } catch (error: any) {
      console.error("Error logging in:", error)
      setError(error.message || "Invalid login credentials")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to confirm user email
  const confirmUserEmail = async (email: string) => {
    try {
      const response = await fetch("/api/confirm-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      return await response.json()
    } catch (error) {
      console.error("Error confirming email:", error)
      return { error: "Failed to confirm email" }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Log In</CardTitle>
          <CardDescription>Log in to your account to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={configError}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={configError}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading || configError}>
              {loading ? "Logging in..." : "Log In"}
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
