import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { decrypt } from "@/lib/encryption"
import { generateAppleJwt } from "@/lib/apple/jwt"
import { appleApi } from "@/lib/apple/client"
import type { AppleAppsResponse } from "@/lib/apple/types"

// GET: Apple アプリ一覧取得
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get("connectionId")
    if (!connectionId) {
      return NextResponse.json(
        { error: "connectionId is required" },
        { status: 400 }
      )
    }

    const { data: connection, error } = await supabase
      .from("apple_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .single()

    if (error || !connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    const privateKey = decrypt(connection.private_key_encrypted)
    const jwt = await generateAppleJwt({
      issuerId: connection.issuer_id,
      keyId: connection.key_id,
      privateKey,
    })

    const appsResponse = await appleApi<AppleAppsResponse>({
      jwt,
      path: "/apps?limit=200",
    })

    return NextResponse.json({ data: appsResponse.data })
  } catch (error) {
    console.error("GET /api/apple/apps", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
