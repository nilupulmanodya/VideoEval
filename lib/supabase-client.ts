import { createClient } from "@supabase/supabase-js"

// Use environment variables with fallbacks
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gpixptypgmezjktnylde.supabase.co"
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwaXhwdHlwZ21lemprdG55bGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjA1NjcsImV4cCI6MjA2MDIzNjU2N30.37mc_nUUM2IweOd2kT32kKNOelZFwA5q7uIplmME1o0"
// Note: Service role key should be used server-side only
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwaXhwdHlwZ21lemprdG55bGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY2MDU2NywiZXhwIjoyMDYwMjM2NTY3fQ.MmihjzgfcGEZPaM39G3ToPJMowiHNDqxSDx-nzOOduc"

// Validate that we have the required keys
if (!SUPABASE_URL) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not defined")
}

if (!SUPABASE_ANON_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined")
}

// Create a single supabase client for interacting with your database (client-side)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Create a service role client for admin operations (use with caution, server-side only)
// This should only be used in server-side contexts (API routes, Server Actions)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// For debugging purposes
if (typeof window !== "undefined") {
  console.log("Supabase URL:", SUPABASE_URL)
  console.log("Anon Key available:", !!SUPABASE_ANON_KEY)
}
