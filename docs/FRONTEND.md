# Frontend Architecture

## ページ構成 (App Router)

```
src/app/
├── layout.tsx                     # ルートレイアウト (フォント、Providers)
├── page.tsx                       # "/" → /login にリダイレクト
│
├── (auth)/                        # 認証不要グループ
│   ├── layout.tsx                 # 認証レイアウト (中央配置)
│   ├── login/page.tsx             # ログイン
│   └── signup/page.tsx            # サインアップ
│
├── (dashboard)/                   # 認証必須グループ
│   ├── layout.tsx                 # ダッシュボードレイアウト (サイドバー + ヘッダー)
│   ├── page.tsx                   # ダッシュボードホーム → プロジェクト一覧
│   │
│   ├── connections/
│   │   └── page.tsx               # Apple APIキー管理
│   │
│   ├── apps/
│   │   └── page.tsx               # App選択 (Apple API一覧)
│   │
│   ├── projects/
│   │   ├── page.tsx               # プロジェクト一覧
│   │   ├── new/page.tsx           # プロジェクト作成
│   │   └── [id]/
│   │       ├── page.tsx           # ローカライズ編集 (メイン画面)
│   │       └── results/page.tsx   # 反映結果
│   │
│   └── settings/
│       └── page.tsx               # ユーザー設定
│
└── api/                           # Route Handlers (ARCHITECTURE.md 参照)
```

## レイアウト構成

### ルートレイアウト (`layout.tsx`)
- フォント設定 (Inter)
- `<ThemeProvider>` (shadcn/ui dark mode 対応)
- `<Toaster>` (通知)
- Supabase Session Provider

### 認証レイアウト (`(auth)/layout.tsx`)
- 中央揃え、ロゴ + フォームのみ
- すでにログイン済みなら dashboard にリダイレクト

### ダッシュボードレイアウト (`(dashboard)/layout.tsx`)
- 左サイドバー: ナビゲーション (接続, App, プロジェクト, 設定)
- 上部ヘッダー: ユーザーメニュー、ログアウト
- メインコンテンツエリア

## 主要画面のコンポーネント構成

### ローカライズ編集画面 (メイン画面)

最も複雑な画面。3カラム比較 UI。

```
ProjectEditPage (Server Component)
├── ProjectHeader
│   ├── AppInfo (アプリ名、バンドルID)
│   ├── StatusBadge
│   └── ActionBar
│       ├── GenerateAllButton     # 一括AI生成
│       ├── SaveButton            # 一括保存
│       └── PushButton            # 一括反映
│
└── FieldComparisonList (Client Component)
    └── FieldComparisonRow × 9 (各field_key)
        ├── SourceColumn          # 元文 (日本語)
        │   └── Textarea (editable)
        ├── CurrentColumn         # 現在のASC登録値 (read-only)
        │   └── TextDisplay
        ├── ProposedColumn        # AI提案値 / 編集値
        │   └── Textarea (editable)
        ├── FieldActions
        │   ├── RegenerateButton  # 個別再生成
        │   ├── CopyCurrentButton # 現在値を複製
        │   └── SelectToggle     # 採用/非採用トグル
        └── DiffIndicator        # 差分表示
```

## コンポーネント分類

### Server Components (デフォルト)
- ページコンポーネント (`page.tsx`)
- レイアウトコンポーネント (`layout.tsx`)
- データ表示のみのコンポーネント

### Client Components (`"use client"`)
- フォーム入力を含むコンポーネント
- イベントハンドラが必要なコンポーネント
- `useState`, `useEffect` を使うコンポーネント
- shadcn/ui のインタラクティブコンポーネント (Dialog, Dropdown 等)

## データフェッチパターン

### Server Component でのフェッチ

```typescript
// ページレベルで直接 Supabase クエリ
export default async function ProjectsPage() {
  const supabase = await createServerClient()
  const { data: projects } = await supabase
    .from("projects")
    .select("*, apps(*)")
    .order("updated_at", { ascending: false })

  return <ProjectList projects={projects} />
}
```

### Client Component でのフェッチ

```typescript
// API Route 経由でフェッチ (SWR 不使用、シンプルに fetch)
"use client"

export function GenerateButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Generation failed")
      const { data } = await res.json()
      // 結果を反映
    } finally {
      setLoading(false)
    }
  }
  // ...
}
```

### ミューテーション後のデータ更新

- `router.refresh()` で Server Component を再取得
- または親から渡された `setState` でローカルステートを更新

## 状態管理

### 方針: 極力シンプルに

- **グローバル状態**: なし（Context / Zustand 等は使わない）
- **サーバー状態**: Server Component で直接 Supabase クエリ
- **フォーム状態**: `useState` のみ（React Hook Form は必要に応じて導入）
- **UI状態**: `useState` (loading, modal open 等)
- **URL状態**: searchParams でフィルタ・ソート

### 編集画面の状態管理

編集画面は例外的に Client Component メインで構成:

```typescript
// fields の状態を一元管理
const [fields, setFields] = useState<ProjectField[]>(initialFields)
const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
```

## フォーム・バリデーション

- **バリデーション**: Zod スキーマを API Route と共有
- **エラー表示**: フィールド直下にインラインエラー
- **送信**: `fetch` で API Route に POST、`toast` で結果通知

## 通知

- **成功**: `toast.success()` (shadcn/ui Sonner)
- **エラー**: `toast.error()` + 詳細メッセージ
- **確認**: `AlertDialog` (shadcn/ui) — 反映前の確認ダイアログ

## レスポンシブ

- **MVP ではデスクトップ優先**
- 3カラム比較は最小幅 1024px を想定
- モバイルは将来対応
