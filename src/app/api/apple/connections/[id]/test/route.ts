import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { decrypt } from "@/lib/encryption"
import { generateAppleJwt } from "@/lib/apple/jwt"
import { appleApi } from "@/lib/apple/client"
import type { AppleAppsResponse } from "@/lib/apple/types"

// POST: 接続テスト
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: connection, error } = await supabase
      .from("apple_connections")
      .select("*")
      .eq("id", id)
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
      path: "/apps?limit=1",
    })

    return NextResponse.json({
      data: {
        success: true,
        appCount: appsResponse.data.length,
        message: "Apple API への接続に成功しました",
      },
    })
  } catch (error) {
    console.error("POST /api/apple/connections/[id]/test", error)
    const message = error instanceof Error ? error.message : "接続テストに失敗しました"
    return NextResponse.json(
      {
        data: {
          success: false,
          message,
        },
      },
      { status: 200 }
    )
  }
}
