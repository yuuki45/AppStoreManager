import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET: プロジェクトのスクリーンショット一覧
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { data: sets } = await supabase
      .from("screenshot_sets")
      .select("*, screenshots(*)")
      .eq("project_id", id)
      .order("display_order")

    // 署名付き URL を生成
    if (sets) {
      for (const set of sets) {
        for (const ss of set.screenshots) {
          const { data: urlData } = await supabase.storage
            .from("screenshots")
            .createSignedUrl(ss.storage_path, 3600)
          ss.url = urlData?.signedUrl ?? null
        }
      }
    }

    return NextResponse.json({ data: sets ?? [] })
  } catch (error) {
    console.error("GET /api/projects/[id]/screenshots", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: スクリーンショットアップロード
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, source_locale")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const deviceType = formData.get("deviceType") as string
    const position = parseInt(formData.get("position") as string || "0", 10)

    if (!file || !deviceType) {
      return NextResponse.json({ error: "file と deviceType は必須です" }, { status: 400 })
    }

    // screenshot_set を upsert
    let { data: set } = await supabase
      .from("screenshot_sets")
      .select("id")
      .eq("project_id", id)
      .eq("device_type", deviceType)
      .single()

    if (!set) {
      const { data: newSet, error: setError } = await supabase
        .from("screenshot_sets")
        .insert({ project_id: id, device_type: deviceType })
        .select("id")
        .single()
      if (setError || !newSet) {
        return NextResponse.json({ error: "スクリーンショットセットの作成に失敗しました" }, { status: 500 })
      }
      set = newSet
    }

    // Storage にアップロード
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const storagePath = `${user.id}/${id}/${set.id}/${project.source_locale}_${position}.png`

    const { error: uploadError } = await supabase.storage
      .from("screenshots")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: `アップロード失敗: ${uploadError.message}` }, { status: 500 })
    }

    // 画像サイズを取得（formData から渡す）
    const width = parseInt(formData.get("width") as string || "0", 10)
    const height = parseInt(formData.get("height") as string || "0", 10)

    // DB レコード作成
    const { data: screenshot, error: ssError } = await supabase
      .from("screenshots")
      .upsert({
        screenshot_set_id: set.id,
        locale: project.source_locale,
        position,
        storage_path: storagePath,
        file_name: file.name,
        file_size: buffer.length,
        width,
        height,
        mime_type: file.type,
        is_source: true,
        generation_status: "pending",
      }, {
        onConflict: "screenshot_set_id,locale,position",
      })
      .select()
      .single()

    if (ssError) {
      return NextResponse.json({ error: ssError.message }, { status: 500 })
    }

    return NextResponse.json({ data: screenshot }, { status: 201 })
  } catch (error) {
    console.error("POST /api/projects/[id]/screenshots", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
