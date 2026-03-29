import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getUserGeminiApiKey } from "@/app/api/settings/route"
import { editImageWithGemini } from "@/lib/ai/gemini-client"
import { buildScreenshotTranslationPrompt } from "@/lib/ai/screenshot-prompts"
import sharp from "sharp"

// POST: 個別スクリーンショット再生成
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; screenshotId: string }> }
) {
  try {
    const { id, screenshotId } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const geminiApiKey = await getUserGeminiApiKey(user.id)
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API キーが設定されていません" },
        { status: 400 }
      )
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, source_locale, target_locale")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // ソース画像を特定（再生成対象の generated 画像から元のソースを探す）
    const { data: targetSS } = await supabase
      .from("screenshots")
      .select("*, screenshot_sets(id, project_id)")
      .eq("id", screenshotId)
      .single()

    if (!targetSS) {
      return NextResponse.json({ error: "Screenshot not found" }, { status: 404 })
    }

    // 同じセット・同じ position のソース画像を取得
    const { data: sourceSS } = await supabase
      .from("screenshots")
      .select("*")
      .eq("screenshot_set_id", targetSS.screenshot_set_id)
      .eq("position", targetSS.position)
      .eq("is_source", true)
      .single()

    if (!sourceSS) {
      return NextResponse.json({ error: "ソース画像が見つかりません" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const customInstructions = (body as { customInstructions?: string }).customInstructions

    // ソース画像をダウンロード
    const { data: fileData } = await supabase.storage
      .from("screenshots")
      .download(sourceSS.storage_path)

    if (!fileData) {
      return NextResponse.json({ error: "ソース画像のダウンロードに失敗しました" }, { status: 500 })
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    const prompt = buildScreenshotTranslationPrompt(
      project.source_locale,
      project.target_locale,
      sourceSS.width,
      sourceSS.height,
      customInstructions
    )

    const result = await editImageWithGemini({
      apiKey: geminiApiKey,
      sourceImageBase64: base64,
      mimeType: sourceSS.mime_type,
      prompt,
    })

    // アップロード
    const targetPath = targetSS.storage_path || `${user.id}/${id}/${targetSS.screenshot_set_id}/${project.target_locale}_${targetSS.position}.png`
    const rawBuffer = Buffer.from(result.imageBase64, "base64")
    const imageBuffer = await sharp(rawBuffer)
      .resize(sourceSS.width, sourceSS.height, { fit: "fill" })
      .png()
      .toBuffer()

    await supabase.storage
      .from("screenshots")
      .upload(targetPath, imageBuffer, {
        contentType: result.mimeType,
        upsert: true,
      })

    await supabase
      .from("screenshots")
      .update({
        storage_path: targetPath,
        file_size: imageBuffer.length,
        generation_status: "done",
        generation_error: null,
      })
      .eq("id", screenshotId)

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("POST /api/projects/[id]/screenshots/[screenshotId]/regenerate", error)
    const message = error instanceof Error ? error.message : "再生成に失敗しました"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
