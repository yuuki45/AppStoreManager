import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET: プロジェクト詳細 (フィールド含む)
export async function GET(
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

    const { data: project, error } = await supabase
      .from("projects")
      .select("*, apps(*, apple_connections(id, connection_name, issuer_id, key_id)), project_fields(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ data: project })
  } catch (error) {
    console.error("GET /api/projects/[id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH: プロジェクト更新 (フィールド値の一括更新)
export async function PATCH(
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

    // プロジェクト所有確認
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const body = await request.json()
    const { fields, status } = body as {
      fields?: Array<{
        field_key: string
        source_value?: string
        proposed_value?: string
        final_value?: string
        is_selected?: boolean
      }>
      status?: string
    }

    // フィールド更新
    if (fields && fields.length > 0) {
      for (const field of fields) {
        const updateData: Record<string, unknown> = {}
        if (field.source_value !== undefined) updateData.source_value = field.source_value
        if (field.proposed_value !== undefined) updateData.proposed_value = field.proposed_value
        if (field.final_value !== undefined) updateData.final_value = field.final_value
        if (field.is_selected !== undefined) updateData.is_selected = field.is_selected

        await supabase
          .from("project_fields")
          .update(updateData)
          .eq("project_id", id)
          .eq("field_key", field.field_key)
      }
    }

    // ステータス更新
    if (status) {
      await supabase
        .from("projects")
        .update({ status })
        .eq("id", id)
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("PATCH /api/projects/[id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: プロジェクト削除
export async function DELETE(
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

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("DELETE /api/projects/[id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
