import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// POST: 同じアプリ・同じソースロケールの他プロジェクトに元文をコピー
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
    const { projectId, sourceLocale, fields } = body as {
      projectId: string
      appId: string
      sourceLocale: string
      fields: Array<{ field_key: string; source_value: string }>
    }

    // 同じアプリ・同じソースロケールの他プロジェクトを取得
    const { data: currentProject } = await supabase
      .from("projects")
      .select("app_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single()

    if (!currentProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const { data: siblingProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("app_id", currentProject.app_id)
      .eq("source_locale", sourceLocale)
      .eq("user_id", user.id)
      .neq("id", projectId)

    if (!siblingProjects || siblingProjects.length === 0) {
      return NextResponse.json({ data: { synced: 0 } })
    }

    // 各プロジェクトの元文を更新
    let synced = 0
    for (const sibling of siblingProjects) {
      for (const field of fields) {
        await supabase
          .from("project_fields")
          .update({ source_value: field.source_value })
          .eq("project_id", sibling.id)
          .eq("field_key", field.field_key)
      }
      synced++
    }

    return NextResponse.json({ data: { synced } })
  } catch (error) {
    console.error("POST /api/projects/sync-source", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
