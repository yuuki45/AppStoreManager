import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// DELETE: スクリーンショット削除
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; screenshotId: string }> }
) {
  try {
    const { id, screenshotId } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // プロジェクト所有確認
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // スクリーンショット取得
    const { data: screenshot } = await supabase
      .from("screenshots")
      .select("id, storage_path")
      .eq("id", screenshotId)
      .single()

    if (!screenshot) {
      return NextResponse.json({ error: "Screenshot not found" }, { status: 404 })
    }

    // Storage から削除
    await supabase.storage.from("screenshots").remove([screenshot.storage_path])

    // DB から削除
    await supabase.from("screenshots").delete().eq("id", screenshotId)

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("DELETE /api/projects/[id]/screenshots/[screenshotId]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
