import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// POST: Gemini API キーの有効性テスト
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
    const { geminiApiKey } = body as { geminiApiKey: string }

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "API キーを入力してください" },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" })

    // 最小限のリクエストでキーの有効性をテスト
    await model.generateContent("Say OK")

    return NextResponse.json({ data: { valid: true } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "API キーの検証に失敗しました"
    if (message.includes("API_KEY_INVALID") || message.includes("PERMISSION_DENIED")) {
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
