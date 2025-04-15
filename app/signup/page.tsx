"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  // Validate email format
  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  // Validate password (at least 6 characters)
  const isValidPassword = (password: string) => {
    return password.length >= 6
  }

  // This function handles the user signup process
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    // Validate inputs
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address")
      setLoading(false)
      return
    }

    if (!isValidPassword(password)) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      console.log("Attempting to sign up with:", { email })

      // This is where we create the user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log("Sign up response:", { data, error: signUpError })

      if (signUpError) {
        throw signUpError
      }

      // Check if user was created successfully
      if (data?.user) {
        console.log("User created successfully:", data.user)

        // Auto-confirm the user's email using the server action
        const confirmResult = await confirmUserEmail(data.user.id, email)

        if (confirmResult.error) {
          console.warn("Could not auto-confirm email, but user was created:", confirmResult.error)
          setMessage("Account created! Please check your email to confirm your account before logging in.")
        } else {
          setMessage("Account created and confirmed successfully! You can now log in.")

          // Automatically redirect to login page after a delay
          setTimeout(() => {
            router.push("/login")
          }, 2000)
        }
      } else {
        setMessage("Please check your email to confirm your account.")
      }
    } catch (error: any) {
      console.error("Error creating user:", error)
      setError(error.message || "An error occurred during sign up. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Server action to confirm user email
  const confirmUserEmail = async (userId: string, email: string) => {
    try {
      const response = await fetch("/api/confirm-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, email }),
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
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>Create an account to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            {message && <div className="p-3 rounded-md bg-green-50 text-green-800 text-sm">{message}</div>}
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
