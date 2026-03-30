"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Loader2,
  Sparkles,
  Save,
  RefreshCw,
  Upload,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react"
import {
  FIELD_KEYS,
  FIELD_LABELS,
  FIELD_MAX_LENGTH,
  FIELD_AVAILABILITY,
  AVAILABILITY_LABELS,
  isUrlField,
} from "@/types/field-keys"
import type { FieldKey } from "@/types/field-keys"
import { ScreenshotTab } from "@/components/screenshot-tab"

interface ProjectField {
  id: string
  field_key: FieldKey
  source_value: string | null
  current_remote_value: string | null
  proposed_value: string | null
  final_value: string | null
  is_selected: boolean
}

interface ProjectData {
  id: string
  status: string
  source_locale: string
  target_locale: string
  apps: {
    app_name: string
    bundle_id: string
    apple_app_id: string
    apple_connections: {
      id: string
      connection_name: string
    }
  }
  project_fields: ProjectField[]
}

function CharCount({ value, maxLength }: { value: string; maxLength: number | null }) {
  if (!maxLength) return null
  const len = value.length
  const ratio = len / maxLength
  let colorClass = "text-muted-foreground"
  if (ratio > 1) {
    colorClass = "text-red-500 font-medium"
  } else if (ratio >= 0.8) {
    colorClass = "text-yellow-600 dark:text-yellow-400"
  }
  return (
    <span className={`text-xs tabular-nums ${colorClass}`}>
      {len}/{maxLength}
    </span>
  )
}

function DiffDot({ current, proposed }: { current: string | null; proposed: string | null }) {
  if (!current && !proposed) return null
  if (current === proposed) return null
  return (
    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" title="現在値と異なります" />
  )
}

export default function ProjectEditPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<ProjectData | null>(null)
  const [fields, setFields] = useState<Map<FieldKey, ProjectField>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingField, setGeneratingField] = useState<FieldKey | null>(null)
  const [fetchingRemote, setFetchingRemote] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [syncSourceToOthers, setSyncSourceToOthers] = useState(true)
  const [pushDialogOpen, setPushDialogOpen] = useState(false)
  const [pushResults, setPushResults] = useState<{
    results: Array<{ field_key: string; locale?: string; success: boolean; error?: string }>
    successCount: number
    failCount: number
  } | null>(null)

  const resultsRef = useRef<HTMLDivElement>(null)

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (!res.ok) {
        toast.error("プロジェクトの取得に失敗しました")
        return
      }
      const { data } = await res.json()
      setProject(data)
      const fieldMap = new Map<FieldKey, ProjectField>()
      for (const f of data.project_fields) {
        fieldMap.set(f.field_key as FieldKey, f)
      }
      setFields(fieldMap)
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  function updateField(key: FieldKey, updates: Partial<ProjectField>) {
    setFields((prev) => {
      const next = new Map(prev)
      const current = next.get(key)
      if (current) {
        next.set(key, { ...current, ...updates })
      }
      return next
    })
  }

  // 保存処理（内部用。showToast=false で静かに保存）
  async function saveFields(showToast = true): Promise<boolean> {
    const fieldUpdates = Array.from(fields.values()).map((f) => ({
      field_key: f.field_key,
      source_value: f.source_value,
      proposed_value: f.proposed_value,
      final_value: f.final_value,
      is_selected: f.is_selected,
    }))
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: fieldUpdates, status: "source_set" }),
    })
    if (!res.ok) {
      toast.error("保存に失敗しました")
      return false
    }

    // 元文を同じアプリの他プロジェクトにも共有
    if (syncSourceToOthers && project) {
      const sourceFields = Array.from(fields.values())
        .filter((f) => f.source_value && f.source_value.trim().length > 0)
        .map((f) => ({ field_key: f.field_key, source_value: f.source_value }))

      if (sourceFields.length > 0) {
        await fetch(`/api/projects/sync-source`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: id,
            appId: project.apps.apple_app_id,
            sourceLocale: project.source_locale,
            fields: sourceFields,
          }),
        })
      }
    }

    if (showToast) toast.success("保存しました")
    return true
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveFields(true)
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateAll() {
    setGenerating(true)
    try {
      // 生成前に自動保存
      const saved = await saveFields(false)
      if (!saved) {
        setGenerating(false)
        return
      }

      const res = await fetch(`/api/projects/${id}/generate`, { method: "POST" })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || "生成に失敗しました")
        return
      }
      const { data } = await res.json()
      for (const field of data.fields) {
        updateField(field.field_key as FieldKey, { proposed_value: field.proposed_value })
      }
      toast.success("AI 生成が完了しました")
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateField(key: FieldKey) {
    setGeneratingField(key)
    try {
      // 生成前に自動保存
      const saved = await saveFields(false)
      if (!saved) {
        setGeneratingField(null)
        return
      }

      const res = await fetch(`/api/projects/${id}/generate-field`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldKey: key }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || "生成に失敗しました")
        return
      }
      const { data } = await res.json()
      updateField(key, { proposed_value: data.proposed_value })
      toast.success(`${FIELD_LABELS[key]} を生成しました`)
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setGeneratingField(null)
    }
  }

  function applyLocalization(
    locData: { appInfoLocalizations?: Array<{ attributes: Record<string, string | null> }>; versionLocalizations?: Array<{ attributes: Record<string, string | null> }> },
    updateKey: "current_remote_value" | "source_value"
  ) {
    const infoLoc = locData.appInfoLocalizations?.[0]?.attributes
    if (infoLoc) {
      if (infoLoc.name != null) updateField("app_name", { [updateKey]: infoLoc.name })
      if (infoLoc.subtitle != null) updateField("subtitle", { [updateKey]: infoLoc.subtitle })
      if (infoLoc.privacyPolicyUrl != null) updateField("privacy_policy_url", { [updateKey]: infoLoc.privacyPolicyUrl })
    }
    const verLoc = locData.versionLocalizations?.[0]?.attributes
    if (verLoc) {
      if (verLoc.description != null) updateField("description", { [updateKey]: verLoc.description })
      if (verLoc.keywords != null) updateField("keywords", { [updateKey]: verLoc.keywords })
      if (verLoc.promotionalText != null) updateField("promotional_text", { [updateKey]: verLoc.promotionalText })
      if (verLoc.supportUrl != null) updateField("support_url", { [updateKey]: verLoc.supportUrl })
      if (verLoc.marketingUrl != null) updateField("marketing_url", { [updateKey]: verLoc.marketingUrl })
      if (verLoc.whatsNew != null) updateField("whats_new", { [updateKey]: verLoc.whatsNew })
    }
  }

  async function handleFetchRemote() {
    if (!project) return
    setFetchingRemote(true)
    try {
      const connectionId = project.apps.apple_connections.id
      const appleAppId = project.apps.apple_app_id

      // ターゲット言語とソース言語を並列取得
      const [targetRes, sourceRes] = await Promise.all([
        fetch(`/api/apple/apps/${appleAppId}/localizations?connectionId=${connectionId}&locale=${project.target_locale}`),
        fetch(`/api/apple/apps/${appleAppId}/localizations?connectionId=${connectionId}&locale=${project.source_locale}`),
      ])

      if (!targetRes.ok) {
        const { error } = await targetRes.json()
        toast.error(error || "ターゲット言語の取得に失敗しました")
        return
      }

      const { data: targetData } = await targetRes.json()
      applyLocalization(targetData, "current_remote_value")

      if (sourceRes.ok) {
        const { data: sourceData } = await sourceRes.json()
        // 元文が未入力のフィールドのみ上書き
        const sourceInfo = sourceData.appInfoLocalizations?.[0]?.attributes
        const sourceVer = sourceData.versionLocalizations?.[0]?.attributes
        const sourceMap: Record<string, string | null> = {}
        if (sourceInfo) {
          sourceMap.app_name = sourceInfo.name
          sourceMap.subtitle = sourceInfo.subtitle
          sourceMap.privacy_policy_url = sourceInfo.privacyPolicyUrl
        }
        if (sourceVer) {
          sourceMap.description = sourceVer.description
          sourceMap.keywords = sourceVer.keywords
          sourceMap.promotional_text = sourceVer.promotionalText
          sourceMap.support_url = sourceVer.supportUrl
          sourceMap.marketing_url = sourceVer.marketingUrl
          sourceMap.whats_new = sourceVer.whatsNew
        }
        for (const [key, value] of Object.entries(sourceMap)) {
          if (value != null) {
            const current = fields.get(key as FieldKey)
            if (!current?.source_value || current.source_value.trim() === "") {
              updateField(key as FieldKey, { source_value: value })
            }
          }
        }
      }

      const saveFields = Array.from(fields.values()).map((f) => ({
        field_key: f.field_key,
        current_remote_value: f.current_remote_value,
        source_value: f.source_value,
      }))
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: saveFields }),
      })
      toast.success("ストアから取得しました（元文 + 現在値）")
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setFetchingRemote(false)
    }
  }

  const selectedCount = Array.from(fields.values()).filter((f) => f.is_selected).length
  const totalFieldCount = fields.size
  const allSelected = selectedCount === totalFieldCount && totalFieldCount > 0

  function handleToggleAll() {
    const newValue = !allSelected
    setFields((prev) => {
      const next = new Map(prev)
      for (const [key, field] of next) {
        next.set(key, { ...field, is_selected: newValue })
      }
      return next
    })
  }

  async function handlePush() {
    setPushing(true)
    setPushResults(null)
    try {
      const fieldUpdates = Array.from(fields.values()).map((f) => ({
        field_key: f.field_key,
        source_value: f.source_value,
        proposed_value: f.proposed_value,
        final_value: f.final_value,
        is_selected: f.is_selected,
      }))
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: fieldUpdates }),
      })

      const res = await fetch(`/api/projects/${id}/push`, { method: "POST" })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || "反映に失敗しました")
        return
      }
      const { data } = await res.json()
      setPushResults(data)

      if (data.failCount === 0) {
        toast.success(`${data.successCount} 件の反映が完了しました`)
      } else {
        toast.error(`${data.failCount} 件の反映に失敗しました`)
      }

      setPushDialogOpen(false)

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)

      handleFetchRemote()
    } catch {
      toast.error("通信エラーが発生しました")
      setPushDialogOpen(false)
    } finally {
      setPushing(false)
    }
  }

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* パンくず */}
      <div className="px-6 pt-6 space-y-4">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/projects" className="hover:text-foreground transition-colors">
            プロジェクト
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{project.apps.app_name}</span>
        </nav>
        <div>
          <h1 className="text-2xl font-semibold">{project.apps.app_name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.source_locale} → {project.target_locale} / {project.apps.bundle_id}
          </p>
        </div>
      </div>

      <div className="px-6">
      <Tabs defaultValue="text" className="space-y-6">
        <TabsList>
          <TabsTrigger value="text">テキスト</TabsTrigger>
          <TabsTrigger value="screenshots">スクリーンショット</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-6">
      {/* アクションバー (sticky) */}
      <div className="sticky top-0 z-10 -mx-6 bg-background/95 backdrop-blur border-b px-6 py-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" size="sm" onClick={handleFetchRemote} disabled={fetchingRemote}>
            {fetchingRemote ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
            ストアから取得
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateAll} disabled={generating}>
            {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            翻訳を一括生成
          </Button>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
              下書き保存
            </Button>
            <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={syncSourceToOthers}
                onChange={(e) => setSyncSourceToOthers(e.target.checked)}
                className="rounded border-input"
              />
              他言語にも元文を共有
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAll}
          >
            {allSelected ? "反映対象を全解除" : "反映対象を全選択"}
          </Button>
          <AlertDialog open={pushDialogOpen} onOpenChange={setPushDialogOpen}>
            <AlertDialogTrigger
              disabled={selectedCount === 0 || pushing}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20 px-2.5 h-7 text-sm font-medium disabled:pointer-events-none disabled:opacity-50"
            >
              {pushing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
              ストアに反映 ({selectedCount})
            </AlertDialogTrigger>
            <AlertDialogContent>
              {pushing ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">App Store Connect に反映中...</p>
                </div>
              ) : (
                <>
                  <AlertDialogHeader>
                    <AlertDialogTitle>App Store Connect に反映</AlertDialogTitle>
                    <AlertDialogDescription>
                      {selectedCount} 件の項目を反映します。登録内容が直接変更されます。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {(() => {
                    const selectedFields = Array.from(fields.values()).filter((f) => f.is_selected)
                    const hasReviewRequired = selectedFields.some(
                      (f) => FIELD_AVAILABILITY[f.field_key] === "review_required"
                    )
                    const hasVersionReady = selectedFields.some(
                      (f) => FIELD_AVAILABILITY[f.field_key] === "version_ready"
                    )
                    return (
                      <>
                        {hasReviewRequired && (
                          <div className="rounded-md bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-2.5 text-xs text-orange-700 dark:text-orange-400">
                            審査対象の項目（名前、サブタイトル等）が含まれています。App Store Connect で新しいバージョンを作成し、ビルドを追加した状態（提出準備中）にしてから反映してください。
                          </div>
                        )}
                        {hasVersionReady && !hasReviewRequired && (
                          <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2.5 text-xs text-blue-700 dark:text-blue-400">
                            バージョン準備中のみ変更可能な項目が含まれています。App Store Connect で新しいバージョンを作成し、ビルドを追加した状態（提出準備中）にしてから反映してください。
                          </div>
                        )}
                      </>
                    )
                  })()}
                  <ul className="text-sm space-y-1.5 px-1">
                    {Array.from(fields.values())
                      .filter((f) => f.is_selected)
                      .map((f) => (
                        <li key={f.field_key} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{FIELD_LABELS[f.field_key]}</span>
                            <span className={`inline-flex rounded px-1 py-0.5 text-[9px] font-medium ${AVAILABILITY_LABELS[FIELD_AVAILABILITY[f.field_key]].className}`}>
                              {AVAILABILITY_LABELS[FIELD_AVAILABILITY[f.field_key]].label}
                            </span>
                          </div>
                          <span className="text-muted-foreground truncate max-w-[180px] text-xs">
                            {(f.proposed_value ?? f.final_value ?? "").slice(0, 40)}
                          </span>
                        </li>
                      ))}
                  </ul>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePush}>反映する</AlertDialogAction>
                  </AlertDialogFooter>
                </>
              )}
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {/* 反映結果 */}
      {pushResults && (
        <div ref={resultsRef}>
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="font-medium">反映結果</h3>
                <Badge variant="default">成功: {pushResults.successCount}</Badge>
                {pushResults.failCount > 0 && (
                  <Badge variant="destructive">失敗: {pushResults.failCount}</Badge>
                )}
              </div>
              <div className="space-y-1">
                {pushResults.results.map((r) => (
                  <div key={`${r.field_key}-${r.locale ?? ""}`} className="flex items-center gap-2 text-sm">
                    {r.success ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                    )}
                    <span className="font-medium">{FIELD_LABELS[r.field_key as FieldKey]}</span>
                    {r.locale && <Badge variant="secondary" className="text-xs">{r.locale}</Badge>}
                    {r.error && <span className="text-muted-foreground text-xs">— {r.error}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3カラムヘッダー */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-4 text-sm font-medium text-muted-foreground">
        <div>元文 ({project.source_locale})</div>
        <div>現在の登録値 ({project.target_locale})</div>
        <div>AI 提案 / 編集</div>
      </div>

      {/* フィールド一覧 */}
      <div className="space-y-8">
        {FIELD_KEYS.map((key) => {
          const field = fields.get(key)
          if (!field) return null
          const maxLen = FIELD_MAX_LENGTH[key]

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{FIELD_LABELS[key]}</span>
                  {isUrlField(key) && <Badge variant="secondary" className="text-xs">URL</Badge>}
                  <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${AVAILABILITY_LABELS[FIELD_AVAILABILITY[key]].className}`}>
                    {AVAILABILITY_LABELS[FIELD_AVAILABILITY[key]].label}
                  </span>
                  <DiffDot current={field.current_remote_value} proposed={field.proposed_value} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.is_selected}
                      onChange={(e) => updateField(key, { is_selected: e.target.checked })}
                      className="rounded border-input"
                    />
                    反映対象
                  </label>
                  {!isUrlField(key) && (
                    <Button variant="ghost" size="sm" onClick={() => handleGenerateField(key)} disabled={generatingField === key}>
                      {generatingField === key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
                {/* 元文 */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground lg:hidden">元文 ({project.source_locale})</span>
                  <Textarea
                    placeholder={`元文を入力 (${project.source_locale})`}
                    rows={4}
                    value={field.source_value ?? ""}
                    onChange={(e) => updateField(key, { source_value: e.target.value })}
                  />
                  <div className="flex justify-end">
                    <CharCount value={field.source_value ?? ""} maxLength={maxLen} />
                  </div>
                </div>

                {/* 現在の登録値 */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground lg:hidden">現在の登録値 ({project.target_locale})</span>
                  <Textarea
                    placeholder="未取得"
                    rows={4}
                    value={field.current_remote_value ?? ""}
                    readOnly
                    className="bg-muted/50"
                  />
                  <div className="flex justify-end">
                    <CharCount value={field.current_remote_value ?? ""} maxLength={maxLen} />
                  </div>
                </div>

                {/* AI提案 / 編集 */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground lg:hidden">AI 提案 / 編集</span>
                  <Textarea
                    placeholder="AI 生成結果がここに表示されます"
                    rows={4}
                    value={field.proposed_value ?? ""}
                    onChange={(e) => updateField(key, { proposed_value: e.target.value })}
                  />
                  <div className="flex justify-end">
                    <CharCount value={field.proposed_value ?? ""} maxLength={maxLen} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
        </TabsContent>

        <TabsContent value="screenshots">
          <ScreenshotTab
            projectId={id}
            sourceLocale={project.source_locale}
            targetLocale={project.target_locale}
          />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
