import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { encrypt, decrypt } from "@/lib/encryption"

// GET: ユーザー設定取得（APIキーは有無のみ返す）
export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: settings } = await supabase
      .from("user_settings")
      .select("openai_api_key_encrypted, gemini_api_key_encrypted, updated_at")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({
      data: {
        hasOpenaiApiKey: !!settings?.openai_api_key_encrypted,
        hasGeminiApiKey: !!settings?.gemini_api_key_encrypted,
        updatedAt: settings?.updated_at ?? null,
      },
    })
  } catch (error) {
    console.error("GET /api/settings", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT: ユーザー設定更新
export async function PUT(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { openaiApiKey, geminiApiKey } = body as {
      openaiApiKey?: string
      geminiApiKey?: string
    }

    const updateData: Record<string, unknown> = {}

    if (openaiApiKey !== undefined) {
      if (openaiApiKey.trim() === "") {
        updateData.openai_api_key_encrypted = null
      } else {
        if (!openaiApiKey.startsWith("sk-")) {
          return NextResponse.json(
            { error: "無効な OpenAI API キーです。sk- で始まる必要があります。" },
            { status: 400 }
          )
        }
        updateData.openai_api_key_encrypted = encrypt(openaiApiKey)
      }
    }

    if (geminiApiKey !== undefined) {
      if (geminiApiKey.trim() === "") {
        updateData.gemini_api_key_encrypted = null
      } else {
        updateData.gemini_api_key_encrypted = encrypt(geminiApiKey)
      }
    }

    // upsert
    const { data: existing } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (existing) {
      await supabase
        .from("user_settings")
        .update(updateData)
        .eq("user_id", user.id)
    } else {
      await supabase
        .from("user_settings")
        .insert({ user_id: user.id, ...updateData })
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("PUT /api/settings", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// 内部用: ユーザーの OpenAI API キーを復号して取得
export async function getUserOpenaiApiKey(userId: string): Promise<string | null> {
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from("user_settings")
    .select("openai_api_key_encrypted")
    .eq("user_id", userId)
    .single()

  if (!data?.openai_api_key_encrypted) return null
  return decrypt(data.openai_api_key_encrypted)
}

// 内部用: ユーザーの Gemini API キーを復号して取得
export async function getUserGeminiApiKey(userId: string): Promise<string | null> {
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from("user_settings")
    .select("gemini_api_key_encrypted")
    .eq("user_id", userId)
    .single()

  if (!data?.gemini_api_key_encrypted) return null
  return decrypt(data.gemini_api_key_encrypted)
}
