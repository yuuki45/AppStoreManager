"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Key, CheckCircle2, ExternalLink } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const [savingGemini, setSavingGemini] = useState(false)
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [geminiKey, setGeminiKey] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings")
      const { data } = await res.json()
      setHasApiKey(data.hasOpenaiApiKey)
      setHasGeminiKey(data.hasGeminiApiKey)
      setUpdatedAt(data.updatedAt)
    } catch {
      toast.error("設定の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      // まず API キーの有効性をテスト
      toast.info("API キーを検証中...")
      const testRes = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: apiKey }),
      })

      if (!testRes.ok) {
        const { error } = await testRes.json()
        toast.error(error || "API キーが無効です")
        setSaving(false)
        return
      }

      // 有効なら保存
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: apiKey }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || "保存に失敗しました")
        return
      }

      setHasApiKey(true)
      setApiKey("")
      toast.success("API キーを検証・保存しました")
      fetchSettings()
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: "" }),
      })

      if (!res.ok) {
        toast.error("削除に失敗しました")
        return
      }

      setHasApiKey(false)
      toast.success("API キーを削除しました")
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveGemini() {
    if (!geminiKey.trim()) return
    setSavingGemini(true)
    try {
      toast.info("Gemini API キーを検証中...")
      const testRes = await fetch("/api/settings/test-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey: geminiKey }),
      })
      if (!testRes.ok) {
        const { error } = await testRes.json()
        toast.error(error || "API キーが無効です")
        setSavingGemini(false)
        return
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey: geminiKey }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || "保存に失敗しました")
        return
      }
      setHasGeminiKey(true)
      setGeminiKey("")
      toast.success("Gemini API キーを検証・保存しました")
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setSavingGemini(false)
    }
  }

  async function handleDeleteGemini() {
    setSavingGemini(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey: "" }),
      })
      if (!res.ok) {
        toast.error("削除に失敗しました")
        return
      }
      setHasGeminiKey(false)
      toast.success("Gemini API キーを削除しました")
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setSavingGemini(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">設定</h1>
        <p className="text-sm text-muted-foreground">
          AI 翻訳に必要な API キーを管理します
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-muted-foreground" />
              <CardTitle>OpenAI API キー</CardTitle>
            </div>
            {hasApiKey && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                登録済み
              </Badge>
            )}
          </div>
          <CardDescription>
            AI 翻訳に使用する OpenAI API キーを登録してください。
            キーは暗号化して安全に保存されます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasApiKey ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                API キーは登録済みです。
                {updatedAt && (
                  <span className="ml-1">
                    (最終更新: {new Date(updatedAt).toLocaleDateString("ja-JP")})
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="新しいキーで上書き (sk-...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button onClick={handleSave} disabled={saving || !apiKey.trim()}>
                  {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  更新
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleDelete} disabled={saving}>
                キーを削除
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md bg-muted p-3 space-y-2 text-sm">
                <p className="font-medium text-foreground">API キーの取得方法:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline inline-flex items-center gap-1"
                    >
                      OpenAI ダッシュボード
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    にログイン
                  </li>
                  <li>「Create new secret key」をクリック</li>
                  <li>生成されたキー (sk-...) をコピー</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  利用料は OpenAI への直接課金です。翻訳1回あたり約 $0.01〜0.05 程度です。
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button onClick={handleSave} disabled={saving || !apiKey.trim()}>
                  {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  保存
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Gemini API キー</CardTitle>
            </div>
            {hasGeminiKey && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                登録済み
              </Badge>
            )}
          </div>
          <CardDescription>
            スクリーンショットのローカライズに使用する Gemini API キーを登録してください。
            キーは暗号化して安全に保存されます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasGeminiKey ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Gemini API キーは登録済みです。
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="新しいキーで上書き"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
                <Button onClick={handleSaveGemini} disabled={savingGemini || !geminiKey.trim()}>
                  {savingGemini ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  更新
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleDeleteGemini} disabled={savingGemini}>
                キーを削除
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md bg-muted p-3 space-y-2 text-sm">
                <p className="font-medium text-foreground">API キーの取得方法:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline inline-flex items-center gap-1"
                    >
                      Google AI Studio
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    にログイン
                  </li>
                  <li>「Create API key」をクリック</li>
                  <li>生成されたキーをコピー</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  スクリーンショット翻訳1枚あたり約 $0.10〜0.15 程度です。
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Gemini API キーを入力"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
                <Button onClick={handleSaveGemini} disabled={savingGemini || !geminiKey.trim()}>
                  {savingGemini ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  保存
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>プラン</CardTitle>
          <CardDescription>現在のプラン: Free</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          すべての機能を無料で利用できます。AI の利用料は各プロバイダーに直接課金されます。
        </CardContent>
      </Card>
    </div>
  )
}
