"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Upload, Sparkles, ImagePlus, Download } from "lucide-react"
import { ScreenshotPreview } from "@/components/screenshot-preview"
import { getImageDimensions, validateScreenshotDimensions } from "@/lib/image-utils"
import { getDeviceTypeByCode } from "@/types/screenshot-types"

interface Screenshot {
  id: string
  locale: string
  position: number
  width: number
  height: number
  is_source: boolean
  generation_status: string
  generation_error: string | null
  url: string | null
}

interface ScreenshotSet {
  id: string
  device_type: string
  screenshots: Screenshot[]
}

interface ScreenshotTabProps {
  projectId: string
  sourceLocale: string
  targetLocale: string
}

export function ScreenshotTab({ projectId, sourceLocale, targetLocale }: ScreenshotTabProps) {
  const [sets, setSets] = useState<ScreenshotSet[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [customInstructions, setCustomInstructions] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchScreenshots = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/screenshots`)
      if (!res.ok) return
      const { data } = await res.json()
      setSets(data ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchScreenshots()
  }, [fetchScreenshots])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    let uploaded = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const dims = await getImageDimensions(file)
        const validation = validateScreenshotDimensions(dims.width, dims.height)

        if (!validation.valid || !validation.deviceType) {
          toast.error(`${file.name}: ${validation.error}`)
          continue
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("deviceType", validation.deviceType.code)
        formData.append("width", dims.width.toString())
        formData.append("height", dims.height.toString())
        formData.append("position", i.toString())

        const res = await fetch(`/api/projects/${projectId}/screenshots`, {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const { error } = await res.json()
          toast.error(`${file.name}: ${error}`)
          continue
        }

        uploaded++
      } catch {
        toast.error(`${file.name}: アップロードに失敗しました`)
      }
    }

    if (uploaded > 0) {
      toast.success(`${uploaded} 枚のスクリーンショットをアップロードしました`)
      fetchScreenshots()
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/screenshots/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customInstructions: customInstructions.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || "生成に失敗しました")
        return
      }
      const { data } = await res.json()
      toast.success(`${data.successCount} / ${data.totalCount} 枚の生成が完了しました`)
      fetchScreenshots()
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setGenerating(false)
    }
  }

  async function handleRegenerate(screenshotId: string) {
    setRegeneratingId(screenshotId)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/screenshots/${screenshotId}/regenerate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customInstructions: customInstructions.trim() || undefined,
          }),
        }
      )
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || "再生成に失敗しました")
        return
      }
      toast.success("再生成が完了しました")
      fetchScreenshots()
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setRegeneratingId(null)
    }
  }

  async function handleDelete(screenshotId: string) {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/screenshots/${screenshotId}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        toast.error("削除に失敗しました")
        return
      }
      toast.success("削除しました")
      fetchScreenshots()
    } catch {
      toast.error("通信エラーが発生しました")
    }
  }

  async function handleDownloadAll() {
    setDownloading(true)
    try {
      // 生成済み画像を収集
      const generatedScreenshots: { url: string; fileName: string }[] = []
      for (const set of sets) {
        const device = getDeviceTypeByCode(set.device_type)
        const deviceLabel = device?.label ?? set.device_type
        for (const ss of set.screenshots) {
          if (!ss.is_source && ss.locale === targetLocale && ss.url && ss.generation_status === "done") {
            generatedScreenshots.push({
              url: ss.url,
              fileName: `${deviceLabel}_${targetLocale}_${ss.position}.png`,
            })
          }
        }
      }

      if (generatedScreenshots.length === 0) {
        toast.error("ダウンロード可能なスクリーンショットがありません")
        return
      }

      // 1枚だけなら直接ダウンロード
      if (generatedScreenshots.length === 1) {
        const a = document.createElement("a")
        a.href = generatedScreenshots[0].url
        a.download = generatedScreenshots[0].fileName
        a.click()
        return
      }

      // 複数枚: 個別にダウンロード（ブラウザ制限で ZIP は追加ライブラリが必要なため）
      for (const ss of generatedScreenshots) {
        const res = await fetch(ss.url)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = ss.fileName
        a.click()
        URL.revokeObjectURL(url)
        // ブラウザが複数ダウンロードをブロックしないよう少し待つ
        await new Promise((r) => setTimeout(r, 300))
      }

      toast.success(`${generatedScreenshots.length} 枚をダウンロードしました`)
    } catch {
      toast.error("ダウンロードに失敗しました")
    } finally {
      setDownloading(false)
    }
  }

  const sourceCount = sets.reduce(
    (acc, s) => acc + s.screenshots.filter((ss) => ss.is_source).length,
    0
  )

  const generatedCount = sets.reduce(
    (acc, s) => acc + s.screenshots.filter(
      (ss) => !ss.is_source && ss.locale === targetLocale && ss.generation_status === "done"
    ).length,
    0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* アクションバー */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
          )}
          スクショをアップロード
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          multiple
          className="hidden"
          onChange={handleUpload}
        />

        {sourceCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            スクショを一括生成
          </Button>
        )}

        {generatedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            一括ダウンロード ({generatedCount})
          </Button>
        )}
      </div>

      {/* カスタム翻訳指示 */}
      {sourceCount > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            翻訳指示（オプション）
          </Label>
          <Textarea
            placeholder="例: 「設定」は「Settings」に翻訳してください"
            rows={2}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            className="text-sm"
          />
        </div>
      )}

      {/* アップロード案内 */}
      {sets.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-4">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium">スクリーンショットをアップロード</p>
              <p className="text-sm text-muted-foreground mt-1">
                App Store の標準サイズ（iPhone 6.7&quot; / 6.5&quot; / 5.5&quot;、iPad Pro 等）の<br />
                PNG または JPEG 画像をアップロードしてください
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                デバイスタイプは画像サイズから自動検出されます
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              画像を選択
            </Button>
          </CardContent>
        </Card>
      )}

      {/* デバイスタイプ別表示 */}
      {sets.map((set) => {
        const device = getDeviceTypeByCode(set.device_type)
        const sources = set.screenshots
          .filter((s) => s.is_source)
          .sort((a, b) => a.position - b.position)
        const generated = set.screenshots
          .filter((s) => !s.is_source && s.locale === targetLocale)
          .sort((a, b) => a.position - b.position)

        return (
          <div key={set.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">
                {device?.label ?? set.device_type}
              </h3>
              <Badge variant="outline" className="text-xs">
                {sources.length} 枚
              </Badge>
            </div>

            {/* 2カラム比較: ソース | 生成 */}
            <div className="space-y-4">
              {sources.map((source) => {
                const target = generated.find((g) => g.position === source.position)

                return (
                  <div key={source.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ScreenshotPreview
                      src={source.url}
                      alt={`${sourceLocale}_${source.position}`}
                      width={source.width}
                      height={source.height}
                      locale={sourceLocale}
                      isSource={true}
                      onDelete={() => handleDelete(source.id)}
                    />
                    <ScreenshotPreview
                      src={target?.url ?? null}
                      alt={`${targetLocale}_${source.position}`}
                      width={source.width}
                      height={source.height}
                      locale={targetLocale}
                      isSource={false}
                      status={target?.generation_status ?? "pending"}
                      error={target?.generation_error ?? undefined}
                      onRegenerate={target ? () => handleRegenerate(target.id) : undefined}
                      regenerating={regeneratingId === target?.id}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
