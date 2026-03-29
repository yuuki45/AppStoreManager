import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateText } from "@/lib/ai/client"
import { buildPrompt } from "@/lib/ai/prompts"
import { generateFieldSchema } from "@/lib/validations"
import { getUserOpenaiApiKey } from "@/app/api/settings/route"
import type { FieldKey } from "@/types/field-keys"

// POST: 個別フィールド AI 生成
export async function POST(
  request: Request,
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

    const body = await request.json()
    const parsed = generateFieldSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { fieldKey } = parsed.data

    // フィールドの source_value 取得
    const { data: field, error } = await supabase
      .from("project_fields")
      .select("source_value")
      .eq("project_id", id)
      .eq("field_key", fieldKey)
      .single()

    if (error || !field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 })
    }

    if (!field.source_value || field.source_value.trim().length === 0) {
      return NextResponse.json(
        { error: "元文が入力されていません" },
        { status: 400 }
      )
    }

    // プロジェクト所有確認
    const { data: project } = await supabase
      .from("projects")
      .select("id, source_locale, target_locale")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const userApiKey = await getUserOpenaiApiKey(user.id)
    if (!userApiKey) {
      return NextResponse.json(
        { error: "OpenAI API キーが設定されていません。設定ページから登録してください。" },
        { status: 400 }
      )
    }

    const prompt = buildPrompt(fieldKey as FieldKey, field.source_value, project.source_locale, project.target_locale)
    const result = await generateText({ ...prompt, apiKey: userApiKey ?? undefined })

    // DB 更新
    await supabase
      .from("project_fields")
      .update({ proposed_value: result })
      .eq("project_id", id)
      .eq("field_key", fieldKey)

    return NextResponse.json({
      data: { field_key: fieldKey, proposed_value: result },
    })
  } catch (error) {
    console.error("POST /api/projects/[id]/generate-field", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
