import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 })
    }

    // Use the admin client to update the user's email confirmation status
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })

    if (error) {
      console.error("Error confirming user email:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in confirm-user API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
