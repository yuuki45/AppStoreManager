import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getUserGeminiApiKey } from "@/app/api/settings/route"
import { editImageWithGemini } from "@/lib/ai/gemini-client"
import { buildScreenshotTranslationPrompt } from "@/lib/ai/screenshot-prompts"
import sharp from "sharp"

// POST: スクリーンショットの AI 翻訳生成
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

    const geminiApiKey = await getUserGeminiApiKey(user.id)
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API キーが設定されていません。設定ページから登録してください。" },
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

    const body = await request.json().catch(() => ({}))
    const customInstructions = (body as { customInstructions?: string }).customInstructions

    // ソース画像を取得
    const { data: sets } = await supabase
      .from("screenshot_sets")
      .select("*, screenshots(*)")
      .eq("project_id", id)

    if (!sets || sets.length === 0) {
      return NextResponse.json({ error: "スクリーンショットがありません" }, { status: 400 })
    }

    const results: Array<{
      screenshotId: string
      locale: string
      success: boolean
      error?: string
    }> = []

    for (const set of sets) {
      const sourceScreenshots = set.screenshots.filter(
        (s: { is_source: boolean }) => s.is_source
      )

      for (const source of sourceScreenshots) {
        // ステータスを generating に更新
        await supabase
          .from("screenshots")
          .update({ generation_status: "generating" })
          .eq("screenshot_set_id", set.id)
          .eq("locale", project.target_locale)
          .eq("position", source.position)

        try {
          // Storage から画像をダウンロード
          const { data: fileData, error: downloadError } = await supabase.storage
            .from("screenshots")
            .download(source.storage_path)

          if (downloadError || !fileData) {
            throw new Error(`画像のダウンロードに失敗: ${downloadError?.message}`)
          }

          const arrayBuffer = await fileData.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString("base64")

          // Gemini で画像編集
          const prompt = buildScreenshotTranslationPrompt(
            project.source_locale,
            project.target_locale,
            source.width,
            source.height,
            customInstructions
          )

          const result = await editImageWithGemini({
            apiKey: geminiApiKey,
            sourceImageBase64: base64,
            mimeType: source.mime_type,
            prompt,
          })

          // 生成画像を元サイズにリサイズ（Gemini は異なるサイズで出力する場合がある）
          const rawBuffer = Buffer.from(result.imageBase64, "base64")
          const imageBuffer = await sharp(rawBuffer)
            .resize(source.width, source.height, { fit: "fill" })
            .png()
            .toBuffer()

          // Storage にアップロード
          const targetPath = `${user.id}/${id}/${set.id}/${project.target_locale}_${source.position}.png`

          await supabase.storage
            .from("screenshots")
            .upload(targetPath, imageBuffer, {
              contentType: result.mimeType,
              upsert: true,
            })

          // DB レコード作成/更新
          await supabase
            .from("screenshots")
            .upsert({
              screenshot_set_id: set.id,
              locale: project.target_locale,
              position: source.position,
              storage_path: targetPath,
              file_name: `${project.target_locale}_${source.position}.png`,
              file_size: imageBuffer.length,
              width: source.width,
              height: source.height,
              mime_type: result.mimeType,
              is_source: false,
              generation_status: "done",
              generation_error: null,
            }, {
              onConflict: "screenshot_set_id,locale,position",
            })

          results.push({
            screenshotId: source.id,
            locale: project.target_locale,
            success: true,
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : "生成に失敗しました"

          await supabase
            .from("screenshots")
            .upsert({
              screenshot_set_id: set.id,
              locale: project.target_locale,
              position: source.position,
              storage_path: "",
              file_name: "",
              file_size: 0,
              width: source.width,
              height: source.height,
              is_source: false,
              generation_status: "failed",
              generation_error: message,
            }, {
              onConflict: "screenshot_set_id,locale,position",
            })

          results.push({
            screenshotId: source.id,
            locale: project.target_locale,
            success: false,
            error: message,
          })
        }
      }
    }

    const successCount = results.filter((r) => r.success).length
    return NextResponse.json({
      data: {
        results,
        successCount,
        totalCount: results.length,
      },
    })
  } catch (error) {
    console.error("POST /api/projects/[id]/screenshots/generate", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
