import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateText } from "@/lib/ai/client"
import { buildPrompt } from "@/lib/ai/prompts"
import { FIELD_KEYS, isUrlField } from "@/types/field-keys"
import { getUserOpenaiApiKey } from "@/app/api/settings/route"

// POST: 全フィールド一括 AI 生成
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

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, project_fields(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // ユーザーの OpenAI API キーを取得
    const userApiKey = await getUserOpenaiApiKey(user.id)
    if (!userApiKey) {
      return NextResponse.json(
        { error: "OpenAI API キーが設定されていません。設定ページから登録してください。" },
        { status: 400 }
      )
    }

    const fieldMap = new Map<string, { source_value: string | null }>()
    for (const f of project.project_fields) {
      fieldMap.set(f.field_key, { source_value: f.source_value })
    }

    const generationTasks = FIELD_KEYS.filter((key) => {
      if (isUrlField(key)) return false
      const field = fieldMap.get(key)
      return field?.source_value && field.source_value.trim().length > 0
    }).map(async (key) => {
      const source = fieldMap.get(key)!.source_value!
      const prompt = buildPrompt(key, source, project.source_locale, project.target_locale)
      try {
        const result = await generateText({ ...prompt, apiKey: userApiKey ?? undefined })
        return { field_key: key, proposed_value: result, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed"
        return { field_key: key, proposed_value: null, error: message }
      }
    })

    const results = await Promise.all(generationTasks)

    await Promise.all(
      results
        .filter((r) => r.proposed_value)
        .map((r) =>
          supabase
            .from("project_fields")
            .update({ proposed_value: r.proposed_value })
            .eq("project_id", id)
            .eq("field_key", r.field_key)
        )
    )

    await supabase
      .from("projects")
      .update({ status: "generated" })
      .eq("id", id)

    return NextResponse.json({
      data: {
        fields: results,
      },
    })
  } catch (error) {
    console.error("POST /api/projects/[id]/generate", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
