"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Search, FolderPlus, X } from "lucide-react"
import { LOCALE_OPTIONS, getLocaleLabel } from "@/lib/locales"

interface Connection {
  id: string
  connection_name: string
}

interface AppleApp {
  id: string
  attributes: {
    name: string
    bundleId: string
  }
}

export default function AppsPage() {
  const router = useRouter()
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedConnection, setSelectedConnection] = useState("")
  const [apps, setApps] = useState<AppleApp[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [connectionsLoading, setConnectionsLoading] = useState(true)

  // ロケール選択ダイアログ
  const [dialogApp, setDialogApp] = useState<AppleApp | null>(null)
  const [sourceLocale, setSourceLocale] = useState("ja")
  const [targetLocales, setTargetLocales] = useState<string[]>(["en-US"])
  const [addingLocale, setAddingLocale] = useState("")

  useEffect(() => {
    fetchConnections()
  }, [])

  async function fetchConnections() {
    try {
      const res = await fetch("/api/apple/connections")
      const { data } = await res.json()
      setConnections(data ?? [])
      if (data?.length === 1) {
        setSelectedConnection(data[0].id)
      }
    } catch {
      toast.error("接続一覧の取得に失敗しました")
    } finally {
      setConnectionsLoading(false)
    }
  }

  async function fetchApps() {
    if (!selectedConnection) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/apple/apps?connectionId=${selectedConnection}`
      )
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || "App一覧の取得に失敗しました")
        return
      }
      const { data } = await res.json()
      setApps(data ?? [])
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedConnection) {
      fetchApps()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConnection])

  function handleAddLocale(code: string) {
    if (code && !targetLocales.includes(code) && code !== sourceLocale) {
      setTargetLocales([...targetLocales, code])
    }
    setAddingLocale("")
  }

  function handleRemoveLocale(code: string) {
    setTargetLocales(targetLocales.filter((l) => l !== code))
  }

  async function handleCreateProject() {
    if (!dialogApp || targetLocales.length === 0) return

    const invalidLocales = targetLocales.filter((l) => l === sourceLocale)
    if (invalidLocales.length > 0) {
      toast.error("ソース言語と同じ言語はターゲットに指定できません")
      return
    }

    setCreating(true)
    try {
      const saveRes = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appleConnectionId: selectedConnection,
          appleAppId: dialogApp.id,
          bundleId: dialogApp.attributes.bundleId,
          appName: dialogApp.attributes.name,
        }),
      })

      if (!saveRes.ok) {
        const { error } = await saveRes.json()
        toast.error(error || "アプリの保存に失敗しました")
        return
      }

      const { data: savedApp } = await saveRes.json()

      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: savedApp.id,
          sourceLocale,
          targetLocales,
        }),
      })

      if (!projectRes.ok) {
        const { error } = await projectRes.json()
        toast.error(error || "プロジェクトの作成に失敗しました")
        return
      }

      const { data: projects } = await projectRes.json()
      toast.success(`${projects.length} 件のプロジェクトを作成しました`)
      setDialogApp(null)

      if (projects.length === 1) {
        router.push(`/projects/${projects[0].id}`)
      } else {
        router.push("/projects")
      }
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setCreating(false)
    }
  }

  const filteredApps = apps.filter(
    (app) =>
      app.attributes.name.toLowerCase().includes(search.toLowerCase()) ||
      app.attributes.bundleId.toLowerCase().includes(search.toLowerCase())
  )

  // ダイアログで選択可能なロケール（既に選択済み & ソースと同じものを除外）
  const availableLocales = LOCALE_OPTIONS.filter(
    (l) => !targetLocales.includes(l.code) && l.code !== sourceLocale
  )

  if (connectionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">App 選択</h1>
        <p className="text-sm text-muted-foreground">
          ローカライズ対象のアプリを選択してプロジェクトを作成します
        </p>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Apple 接続が登録されていません。先に「Apple 接続」ページで API キーを登録してください。
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-3">
            <Select
              value={selectedConnection}
              onValueChange={(val: string | null) => setSelectedConnection(val ?? "")}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="接続を選択" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((conn) => (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.connection_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {apps.length > 0 && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="アプリ名またはBundle IDで検索"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : apps.length === 0 && selectedConnection ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                アプリが見つかりませんでした
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredApps.map((app) => (
                <Card key={app.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{app.attributes.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.attributes.bundleId}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSourceLocale("ja")
                        setTargetLocales(["en-US"])
                        setAddingLocale("")
                        setDialogApp(app)
                      }}
                    >
                      <FolderPlus className="mr-1 h-3 w-3" />
                      プロジェクト作成
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ロケール選択ダイアログ */}
      <Dialog open={!!dialogApp} onOpenChange={(open) => { if (!open) setDialogApp(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>プロジェクト作成</DialogTitle>
            <DialogDescription>
              {dialogApp?.attributes.name} のローカライズ言語を選択してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>ソース言語（元文）</Label>
              <Select
                value={sourceLocale}
                onValueChange={(val: string | null) => {
                  const newVal = val ?? "ja"
                  setSourceLocale(newVal)
                  setTargetLocales(targetLocales.filter((l) => l !== newVal))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[280px]">
                  {LOCALE_OPTIONS.map((loc) => (
                    <SelectItem key={loc.code} value={loc.code}>
                      {loc.label} ({loc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ターゲット言語（翻訳先）— 複数選択可</Label>

              {/* 選択済みロケール */}
              <div className="flex flex-wrap gap-1.5">
                {targetLocales.map((code) => (
                  <Badge key={code} variant="secondary" className="gap-1 pr-1">
                    {getLocaleLabel(code)} ({code})
                    <button
                      onClick={() => handleRemoveLocale(code)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* ロケール追加 */}
              {availableLocales.length > 0 && (
                <Select
                  value={addingLocale}
                  onValueChange={(val: string | null) => handleAddLocale(val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="+ 言語を追加" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[280px]">
                    {availableLocales.map((loc) => (
                      <SelectItem key={loc.code} value={loc.code}>
                        {loc.label} ({loc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {targetLocales.length === 0 && (
                <p className="text-sm text-destructive">ターゲット言語を1つ以上選択してください</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogApp(null)}>
              キャンセル
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={creating || targetLocales.length === 0}
            >
              {creating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              {targetLocales.length}言語で作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
