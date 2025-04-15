import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // First, get the user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers()

    if (userError) {
      console.error("Error listing users:", userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Find the user with the matching email
    const user = userData.users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update the user to confirm their email
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    })

    if (error) {
      console.error("Error confirming user email:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in confirm-email API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
