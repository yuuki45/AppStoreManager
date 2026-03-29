"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Loader2,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Upload,
  Trash2,
  BookOpen,
} from "lucide-react"
import { getLocaleLabel } from "@/lib/locales"

interface Project {
  id: string
  app_id: string
  source_locale: string
  target_locale: string
  status: string
  created_at: string
  updated_at: string
  apps: {
    app_name: string
    bundle_id: string
    apple_app_id: string
  }
}

interface AppGroup {
  appName: string
  bundleId: string
  projects: Project[]
}

interface BatchResult {
  targetLocale: string
  success: boolean
  detail?: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "下書き", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  source_set: { label: "元文入力済み", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  generated: { label: "AI生成済み", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  edited: { label: "編集済み", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  pushed: { label: "反映済み", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  failed: { label: "失敗", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [batchGenerating, setBatchGenerating] = useState<string | null>(null)
  const [batchPushing, setBatchPushing] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects")
      const { data } = await res.json()
      setProjects(data ?? [])
    } catch {
      toast.error("プロジェクト一覧の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const groups: AppGroup[] = []
  const groupMap = new Map<string, AppGroup>()
  for (const p of projects) {
    const key = p.app_id
    if (!groupMap.has(key)) {
      const group: AppGroup = {
        appName: p.apps?.app_name ?? "不明なアプリ",
        bundleId: p.apps?.bundle_id ?? "",
        projects: [],
      }
      groupMap.set(key, group)
      groups.push(group)
    }
    groupMap.get(key)!.projects.push(p)
  }

  async function handleBatchGenerate(group: AppGroup) {
    const ids = group.projects.map((p) => p.id)
    setBatchGenerating(group.projects[0].app_id)
    setBatchResults(null)
    try {
      const res = await fetch("/api/projects/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: ids }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || "一括生成に失敗しました")
        return
      }
      const { data } = await res.json()
      const results: BatchResult[] = data.results.map((r: { targetLocale: string; generatedFields: number }) => ({
        targetLocale: r.targetLocale,
        success: r.generatedFields > 0,
        detail: `${r.generatedFields} フィールド生成`,
      }))
      setBatchResults(results)
      toast.success(`${data.successCount} / ${data.totalCount} プロジェクトの生成が完了しました`)
      fetchProjects()
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setBatchGenerating(null)
    }
  }

  async function handleBatchPush(group: AppGroup) {
    const ids = group.projects.map((p) => p.id)
    setBatchPushing(group.projects[0].app_id)
    setBatchResults(null)
    try {
      const res = await fetch("/api/projects/batch-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: ids }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || "一括反映に失敗しました")
        return
      }
      const { data } = await res.json()
      const results: BatchResult[] = data.results.map((r: { targetLocale: string; pushed: number; failed: number; skipped: boolean }) => ({
        targetLocale: r.targetLocale,
        success: r.pushed > 0 && r.failed === 0,
        detail: r.skipped ? "スキップ（未選択）" : `成功: ${r.pushed}, 失敗: ${r.failed}`,
      }))
      setBatchResults(results)
      toast.success(`${data.successCount} / ${data.totalCount} の反映が完了しました`)
      fetchProjects()
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setBatchPushing(null)
    }
  }

  async function handleDelete(projectId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("削除に失敗しました")
        return
      }
      toast.success("プロジェクトを削除しました")
      setDeletingId(null)
      fetchProjects()
    } catch {
      toast.error("通信エラーが発生しました")
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
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">プロジェクト</h1>
          <p className="text-sm text-muted-foreground">
            ローカライズプロジェクトの一覧
          </p>
        </div>
        <Link href="/apps">
          <Button>
            <FolderOpen className="mr-2 h-4 w-4" />
            新規作成
          </Button>
        </Link>
      </div>

      {/* 一括操作結果 */}
      {batchResults && (
        <Card>
          <CardContent className="py-3 space-y-2">
            <p className="text-sm font-medium">操作結果</p>
            <div className="space-y-1">
              {batchResults.map((r) => (
                <div key={r.targetLocale} className="flex items-center gap-2 text-sm">
                  <span className={`inline-block h-2 w-2 rounded-full ${r.success ? "bg-green-500" : "bg-red-500"}`} />
                  <Badge variant="outline">{getLocaleLabel(r.targetLocale)}</Badge>
                  <span className="text-muted-foreground text-xs">{r.detail}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setBatchResults(null)} className="text-xs">
              閉じる
            </Button>
          </CardContent>
        </Card>
      )}

      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-4">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium">プロジェクトがまだありません</p>
              <p className="text-sm text-muted-foreground mt-1">
                「App 選択」からアプリを選んでプロジェクトを作成してください
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Link href="/apps">
                <Button>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  App 選択へ
                </Button>
              </Link>
              <Link href="/tutorial">
                <Button variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  チュートリアル
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const appId = group.projects[0].app_id
            const isBatchGenerating = batchGenerating === appId
            const isBatchPushing = batchPushing === appId

            return (
              <div key={appId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium">{group.appName}</h2>
                    <p className="text-xs text-muted-foreground">{group.bundleId}</p>
                  </div>
                  {group.projects.length > 1 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBatchGenerate(group)}
                        disabled={isBatchGenerating}
                      >
                        {isBatchGenerating ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        一括AI生成
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBatchPush(group)}
                        disabled={isBatchPushing}
                      >
                        {isBatchPushing ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        一括反映
                      </Button>
                    </div>
                  )}
                </div>

                {group.projects.map((project) => {
                  const statusInfo = STATUS_CONFIG[project.status] ?? {
                    label: project.status,
                    className: "bg-gray-100 text-gray-600",
                  }
                  return (
                    <div key={project.id} className="flex items-center gap-2">
                      <Link href={`/projects/${project.id}`} className="flex-1">
                        <Card className="transition-colors hover:bg-muted/50">
                          <CardContent className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-sm">
                                <Badge variant="outline">{getLocaleLabel(project.source_locale)}</Badge>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <Badge variant="outline">{getLocaleLabel(project.target_locale)}</Badge>
                              </div>
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(project.updated_at).toLocaleDateString("ja-JP")}
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                      <button
                        onClick={() => setDeletingId(project.id)}
                        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>プロジェクトを削除</AlertDialogTitle>
            <AlertDialogDescription>
              このプロジェクトを削除しますか？元文やAI生成結果も削除されます。この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)}>
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
