"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Trash2, Download, Sparkles } from "lucide-react"

interface ScreenshotPreviewProps {
  src: string | null
  alt: string
  width: number
  height: number
  locale: string
  isSource: boolean
  status?: string
  error?: string
  onRegenerate?: () => void
  onGenerate?: () => void
  onDelete?: () => void
  regenerating?: boolean
  generating?: boolean
}

export function ScreenshotPreview({
  src,
  alt,
  width,
  height,
  locale,
  isSource,
  status,
  error,
  onRegenerate,
  onGenerate,
  onDelete,
  regenerating,
  generating,
}: ScreenshotPreviewProps) {
  const aspectRatio = height / width
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!src) return
    setDownloading(true)
    try {
      const res = await fetch(src)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${alt}.png`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-xs">{locale}</Badge>
          {isSource && <Badge variant="secondary" className="text-xs">ソース</Badge>}
          {status === "generating" && (
            <Badge className="text-xs bg-blue-100 text-blue-700">生成中...</Badge>
          )}
          {status === "done" && !isSource && (
            <Badge className="text-xs bg-green-100 text-green-700">生成済み</Badge>
          )}
          {status === "failed" && (
            <Badge className="text-xs bg-red-100 text-red-700">失敗</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {src && (
            <Button variant="ghost" size="sm" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            </Button>
          )}
          {onRegenerate && !isSource && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={regenerating}
            >
              {regenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          )}
          {onGenerate && !isSource && !onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerate}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
            </Button>
          )}
          {onDelete && isSource && (
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div
        className="relative rounded-lg border bg-muted/30 overflow-hidden"
        style={{ paddingBottom: `${aspectRatio * 100}%` }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : status === "generating" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : status === "failed" ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <p className="text-xs text-red-500 text-center">{error || "生成に失敗しました"}</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">未生成</p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        {width}×{height}
      </p>
    </div>
  )
}
