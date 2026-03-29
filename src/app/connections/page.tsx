"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { toast } from "sonner"
import { Plus, Trash2, Plug, Loader2 } from "lucide-react"

interface Connection {
  id: string
  connection_name: string
  issuer_id: string
  key_id: string
  is_active: boolean
  created_at: string
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    connectionName: "",
    issuerId: "",
    keyId: "",
    privateKey: "",
  })

  useEffect(() => {
    fetchConnections()
  }, [])

  async function fetchConnections() {
    try {
      const res = await fetch("/api/apple/connections")
      const { data } = await res.json()
      setConnections(data ?? [])
    } catch {
      toast.error("接続一覧の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/apple/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || "登録に失敗しました")
        return
      }

      toast.success("接続を登録しました")
      setForm({ connectionName: "", issuerId: "", keyId: "", privateKey: "" })
      setShowForm(false)
      fetchConnections()
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  async function handleTest(id: string) {
    setTestingId(id)
    try {
      const res = await fetch(`/api/apple/connections/${id}/test`, {
        method: "POST",
      })
      const { data } = await res.json()
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error("接続テスト失敗", { description: data.message })
      }
    } catch {
      toast.error("通信エラーが発生しました")
    } finally {
      setTestingId(null)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/apple/connections/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        toast.error("削除に失敗しました")
        return
      }
      toast.success("接続を削除しました")
      fetchConnections()
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
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Apple 接続管理</h1>
          <p className="text-sm text-muted-foreground">
            App Store Connect API キーを登録・管理します
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          新規接続
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>新しい接続を登録</CardTitle>
            <CardDescription>
              App Store Connect &gt; ユーザーとアクセス &gt; キー から取得できます
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connectionName">接続名</Label>
                <Input
                  id="connectionName"
                  placeholder="例: My App Key"
                  value={form.connectionName}
                  onChange={(e) =>
                    setForm({ ...form, connectionName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuerId">Issuer ID</Label>
                <Input
                  id="issuerId"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={form.issuerId}
                  onChange={(e) =>
                    setForm({ ...form, issuerId: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyId">Key ID</Label>
                <Input
                  id="keyId"
                  placeholder="XXXXXXXXXX"
                  value={form.keyId}
                  onChange={(e) => setForm({ ...form, keyId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privateKey">秘密鍵 (.p8 の内容)</Label>
                <Textarea
                  id="privateKey"
                  placeholder={"-----BEGIN PRIVATE KEY-----\n..."}
                  rows={6}
                  className="font-mono text-xs"
                  value={form.privateKey}
                  onChange={(e) =>
                    setForm({ ...form, privateKey: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "登録中..." : "登録"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  キャンセル
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      <Separator />

      {connections.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Plug className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium">接続がまだありません</p>
              <p className="text-sm text-muted-foreground mt-1">
                「新規接続」から Apple API キーを登録してください
              </p>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新規接続
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <Card key={conn.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{conn.connection_name}</span>
                    <Badge variant={conn.is_active ? "default" : "secondary"}>
                      {conn.is_active ? "有効" : "無効"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Key ID: {conn.key_id} / Issuer: {conn.issuer_id.slice(0, 8)}...
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(conn.id)}
                    disabled={testingId === conn.id}
                  >
                    {testingId === conn.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Plug className="mr-1 h-3 w-3" />
                    )}
                    テスト
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Trash2 className="h-3.5 w-3.5" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>接続を削除</AlertDialogTitle>
                        <AlertDialogDescription>
                          「{conn.connection_name}」を削除しますか？この操作は元に戻せません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(conn.id)}>
                          削除する
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
