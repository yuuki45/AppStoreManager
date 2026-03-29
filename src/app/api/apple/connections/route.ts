import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { appleConnectionSchema } from "@/lib/validations"
import { encrypt } from "@/lib/encryption"

// GET: 接続一覧取得
export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("apple_connections")
      .select("id, connection_name, issuer_id, key_id, is_active, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("GET /api/apple/connections", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: 接続作成
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = appleConnectionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { connectionName, issuerId, keyId, privateKey } = parsed.data
    const privateKeyEncrypted = encrypt(privateKey)

    const { data, error } = await supabase
      .from("apple_connections")
      .insert({
        user_id: user.id,
        connection_name: connectionName,
        issuer_id: issuerId,
        key_id: keyId,
        private_key_encrypted: privateKeyEncrypted,
      })
      .select("id, connection_name, issuer_id, key_id, is_active, created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("POST /api/apple/connections", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
