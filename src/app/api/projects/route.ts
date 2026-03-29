import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createProjectSchema } from "@/lib/validations"
import { FIELD_KEYS } from "@/types/field-keys"

// GET: プロジェクト一覧
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
      .from("projects")
      .select("*, apps(app_name, bundle_id, apple_app_id)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("GET /api/projects", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: プロジェクト作成（複数ターゲットロケール対応）
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
    const parsed = createProjectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { appId, sourceLocale, targetLocales } = parsed.data

    // アプリの所有確認
    const { data: app, error: appError } = await supabase
      .from("apps")
      .select("id")
      .eq("id", appId)
      .eq("user_id", user.id)
      .single()

    if (appError || !app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    // ロケールごとにプロジェクト + フィールドを作成
    const projects = []

    for (const targetLocale of targetLocales) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          app_id: appId,
          source_locale: sourceLocale,
          target_locale: targetLocale,
        })
        .select()
        .single()

      if (projectError) {
        console.error(`Failed to create project for ${targetLocale}`, projectError)
        continue
      }

      const fieldRows = FIELD_KEYS.map((key) => ({
        project_id: project.id,
        field_key: key,
      }))

      await supabase.from("project_fields").insert(fieldRows)
      projects.push(project)
    }

    if (projects.length === 0) {
      return NextResponse.json({ error: "プロジェクトの作成に失敗しました" }, { status: 500 })
    }

    return NextResponse.json({ data: projects }, { status: 201 })
  } catch (error) {
    console.error("POST /api/projects", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
