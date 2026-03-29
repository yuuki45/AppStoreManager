import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import OpenAI from "openai"

// POST: OpenAI API キーの有効性テスト
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
    const { openaiApiKey } = body as { openaiApiKey: string }

    if (!openaiApiKey || !openaiApiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "無効な API キーです。sk- で始まるキーを入力してください。" },
        { status: 400 }
      )
    }

    const openai = new OpenAI({ apiKey: openaiApiKey })

    // 最小限のリクエストでキーの有効性をテスト
    await openai.models.list()

    return NextResponse.json({ data: { valid: true } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "API キーの検証に失敗しました"
    if (message.includes("Incorrect API key") || message.includes("invalid_api_key")) {
      return NextResponse.json(
        { error: "API キーが無効です。正しいキーを入力してください。" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: `API キーの検証に失敗しました: ${message}` },
      { status: 400 }
    )
  }
}
