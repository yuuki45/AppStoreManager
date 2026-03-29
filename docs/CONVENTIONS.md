# Coding Conventions

## 言語・フォーマット

- **TypeScript strict mode** を有効化
- **ESLint**: Next.js デフォルト設定 + `@typescript-eslint/recommended`
- **Prettier**: 使用しない（ESLint のみで統一）
- **セミコロン**: なし
- **クォート**: ダブルクォート
- **インデント**: スペース2つ

## 命名規則

| 対象 | ルール | 例 |
|---|---|---|
| ファイル (コンポーネント) | kebab-case | `field-comparison-row.tsx` |
| ファイル (ユーティリティ) | kebab-case | `apple-jwt.ts` |
| コンポーネント | PascalCase | `FieldComparisonRow` |
| 関数 | camelCase | `generateLocalization` |
| 変数 | camelCase | `projectFields` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 型 / Interface | PascalCase | `ProjectField`, `AppleConnection` |
| DB カラム名 | snake_case | `created_at`, `field_key` |
| API パス | kebab-case | `/api/apple/connections` |
| field_key | snake_case | `app_name`, `whats_new` |

## ディレクトリ・ファイル構成

### コンポーネント

```
src/components/
├── ui/                          # shadcn/ui (自動生成、編集しない)
├── field-comparison-row.tsx     # 単ファイルで完結する場合
├── project-header/              # 複数ファイルで構成する場合
│   ├── index.tsx                # re-export
│   ├── project-header.tsx
│   └── action-bar.tsx
└── ...
```

- **1コンポーネント = 1ファイル** が基本
- 関連コンポーネントが 3 つ以上ならディレクトリ化して `index.tsx` で re-export

### lib

```
src/lib/
├── supabase/
│   ├── server.ts        # createServerClient (Route Handler / Server Component 用)
│   ├── browser.ts       # createBrowserClient (Client Component 用)
│   └── middleware.ts     # Middleware 用クライアント
├── apple/
│   ├── jwt.ts           # JWT 生成
│   ├── client.ts        # Apple API リクエストラッパー
│   └── types.ts         # Apple API レスポンス型
├── ai/
│   ├── client.ts        # OpenAI クライアント
│   └── prompts.ts       # field_key 別プロンプトテンプレート
├── encryption.ts        # AES-256-GCM 暗号化/復号
├── validations.ts       # Zod スキーマ (API と共有)
└── utils.ts             # 汎用ユーティリティ
```

## TypeScript パターン

### DB 行の型

```typescript
import { Database } from "@/types/database"

// Supabase 自動生成型から取得
type AppleConnection = Database["public"]["Tables"]["apple_connections"]["Row"]
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"]
```

### API レスポンス型

```typescript
// 成功レスポンス
type ApiResponse<T> = {
  data: T
}

// エラーレスポンス
type ApiError = {
  error: string
  details?: unknown
}
```

### field_key 型

```typescript
const FIELD_KEYS = [
  "app_name",
  "subtitle",
  "privacy_policy_url",
  "description",
  "keywords",
  "promotional_text",
  "support_url",
  "marketing_url",
  "whats_new",
] as const

type FieldKey = (typeof FIELD_KEYS)[number]
```

## import ルール

### 順序

```typescript
// 1. React / Next.js
import { useState } from "react"
import { useRouter } from "next/navigation"

// 2. 外部ライブラリ
import { z } from "zod"

// 3. 内部 lib
import { createServerClient } from "@/lib/supabase/server"

// 4. コンポーネント
import { Button } from "@/components/ui/button"
import { FieldComparisonRow } from "@/components/field-comparison-row"

// 5. 型 (type-only import)
import type { ProjectField } from "@/types/database"
```

### パスエイリアス

- `@/` → `src/` (tsconfig.json で設定)
- 相対パスは同一ディレクトリ内のみ許可

## エラーハンドリング

### API Route

```typescript
export async function POST(request: Request) {
  try {
    // 認証チェック
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // バリデーション
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // 処理
    const result = await doSomething(parsed.data)
    return NextResponse.json({ data: result })

  } catch (error) {
    console.error("POST /api/...", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### Client Component

```typescript
try {
  const res = await fetch("/api/...")
  if (!res.ok) {
    const { error } = await res.json()
    toast.error(error || "エラーが発生しました")
    return
  }
  const { data } = await res.json()
  // 成功処理
} catch {
  toast.error("通信エラーが発生しました")
}
```

## Supabase クライアント使い分け

| 場所 | クライアント | 理由 |
|---|---|---|
| Server Component | `createServerClient()` | Cookie からセッション取得 |
| Route Handler | `createServerClient()` | 同上 |
| Middleware | 専用 middleware client | リクエスト/レスポンス書き換え |
| Client Component | `createBrowserClient()` | ブラウザ Cookie 使用 |
| サービス処理 (バッチ等) | `createClient(serviceRoleKey)` | RLS バイパス |

## AI プロンプト規約

- プロンプトテンプレートは `src/lib/ai/prompts.ts` に集約
- field_key ごとにシステムプロンプトを定義
- ユーザー入力はテンプレートリテラルで埋め込み（インジェクション対策として入力サニタイズ）
- モデル: `gpt-4o` を使用
- temperature: 0.7 (創造的すぎず、固すぎない)
