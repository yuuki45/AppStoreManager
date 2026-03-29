import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { batchProjectIdsSchema } from "@/lib/validations"
import { generateText } from "@/lib/ai/client"
import { buildPrompt } from "@/lib/ai/prompts"
import { FIELD_KEYS, isUrlField } from "@/types/field-keys"
import { getUserOpenaiApiKey } from "@/app/api/settings/route"

// POST: 複数プロジェクトの一括 AI 生成
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
    const parsed = batchProjectIdsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { projectIds } = parsed.data

    // 全プロジェクトを取得（所有確認込み）
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*, project_fields(*)")
      .in("id", projectIds)
      .eq("user_id", user.id)

    if (error || !projects || projects.length === 0) {
      return NextResponse.json({ error: "Projects not found" }, { status: 404 })
    }

    const userApiKey = await getUserOpenaiApiKey(user.id)
    if (!userApiKey) {
      return NextResponse.json(
        { error: "OpenAI API キーが設定されていません。設定ページから登録してください。" },
        { status: 400 }
      )
    }

    // 元文共有: source_value が入力済みのプロジェクトから元文を取得し、他にコピー
    const sourceProject = projects.find((p) =>
      p.project_fields.some((f: { source_value: string | null }) => f.source_value && f.source_value.trim().length > 0)
    )

    if (sourceProject) {
      const sourceFields = new Map<string, string>()
      for (const f of sourceProject.project_fields) {
        if (f.source_value) {
          sourceFields.set(f.field_key, f.source_value)
        }
      }

      // 他のプロジェクトに元文をコピー
      for (const project of projects) {
        if (project.id === sourceProject.id) continue
        for (const [fieldKey, sourceValue] of sourceFields) {
          const existingField = project.project_fields.find(
            (f: { field_key: string; source_value: string | null }) => f.field_key === fieldKey
          )
          if (existingField && !existingField.source_value) {
            await supabase
              .from("project_fields")
              .update({ source_value: sourceValue })
              .eq("project_id", project.id)
              .eq("field_key", fieldKey)
            existingField.source_value = sourceValue
          }
        }
      }
    }

    // 各プロジェクトごとに並列で AI 生成
    let successCount = 0
    const results = await Promise.all(
      projects.map(async (project) => {
        const fieldMap = new Map<string, string>()
        for (const f of project.project_fields) {
          if (f.source_value && f.source_value.trim().length > 0) {
            fieldMap.set(f.field_key, f.source_value)
          }
        }

        const generationTasks = FIELD_KEYS.filter((key) => {
          if (isUrlField(key)) return false
          return fieldMap.has(key)
        }).map(async (key) => {
          const source = fieldMap.get(key)!
          const prompt = buildPrompt(key, source, project.source_locale, project.target_locale)
          try {
            const result = await generateText({ ...prompt, apiKey: userApiKey ?? undefined })
            return { field_key: key, proposed_value: result }
          } catch {
            return { field_key: key, proposed_value: null }
          }
        })

        const fieldResults = await Promise.all(generationTasks)

        // DB 保存
        await Promise.all(
          fieldResults
            .filter((r) => r.proposed_value)
            .map((r) =>
              supabase
                .from("project_fields")
                .update({ proposed_value: r.proposed_value })
                .eq("project_id", project.id)
                .eq("field_key", r.field_key)
            )
        )

        await supabase
          .from("projects")
          .update({ status: "generated" })
          .eq("id", project.id)

        const generated = fieldResults.filter((r) => r.proposed_value).length
        if (generated > 0) successCount++

        return {
          projectId: project.id,
          targetLocale: project.target_locale,
          generatedFields: generated,
        }
      })
    )

    return NextResponse.json({
      data: {
        results,
        successCount,
        totalCount: projects.length,
      },
    })
  } catch (error) {
    console.error("POST /api/projects/batch-generate", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
