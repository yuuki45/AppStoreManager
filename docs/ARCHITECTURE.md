# Architecture

## システム構成

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
│  Next.js App Router (React Server Components + CSR) │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│               Next.js Server (Vercel)                │
│  ┌─────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Route        │  │ Supabase │  │ Apple API     │  │
│  │ Handlers     │  │ Server   │  │ Client        │  │
│  │ (API)        │  │ Client   │  │ (JWT生成)     │  │
│  └──────┬──────┘  └────┬─────┘  └───────┬───────┘  │
│         │              │                │           │
│  ┌──────▼──────┐       │         ┌──────▼───────┐  │
│  │ OpenAI API  │       │         │ App Store    │  │
│  │ Client      │       │         │ Connect API  │  │
│  └─────────────┘       │         └──────────────┘  │
└────────────────────────┼────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Supabase          │
              │  ┌────────────────┐ │
              │  │ PostgreSQL     │ │
              │  │ (データ + RLS) │ │
              │  ├────────────────┤ │
              │  │ Auth           │ │
              │  └────────────────┘ │
              └─────────────────────┘
```

## 主要データフロー

### 1. 認証フロー

```
User → Login Page → Supabase Auth (email/password)
     → Session Cookie 設定
     → Dashboard リダイレクト
```

- Supabase Auth の PKCE フローを使用
- Middleware (`src/middleware.ts`) でセッション検証
- 未認証ユーザーは `/login` にリダイレクト

### 2. Apple API 接続フロー

```
User → APIキー登録フォーム (Issuer ID, Key ID, .p8)
     → POST /api/apple/connections
     → 秘密鍵を AES-256-GCM で暗号化 → Supabase 保存
     → 接続テスト: JWT 生成 → Apple API /v1/apps 呼び出し
     → 成功/失敗を返却
```

- **JWT 生成**: ES256 アルゴリズム、有効期限 20 分
- **秘密鍵**: `ENCRYPTION_KEY` 環境変数で AES-256-GCM 暗号化保存
- **JWT はリクエストごとに生成**（キャッシュしない）

### 3. メタデータ取得フロー

```
User → App 選択
     → GET /api/apple/apps/:id/localizations
     → Apple API: GET /v1/apps/{id}/appInfos → appInfoLocalizations
     → Apple API: GET /v1/appStoreVersions/{id}/appStoreVersionLocalizations
     → 現在の登録値を返却・保存
```

### 4. AI 生成フロー

```
User → 日本語元文入力 → 保存
     → POST /api/projects/:id/generate
     → 各 field_key ごとにプロンプト構築
     → OpenAI API (GPT-4o) で英語文面生成
     → 生成結果を project_fields.proposed_value に保存
     → レスポンスで全フィールド返却
```

- **項目別プロンプト**: field_key ごとに最適化されたシステムプロンプトを使用
- **一括生成**: 全項目を並列リクエスト
- **個別再生成**: 特定 field_key のみ再生成

### 5. App Store Connect 反映フロー

```
User → 反映対象フィールド選択 → 確認ダイアログ
     → POST /api/projects/:id/push
     → appInfo 系: PATCH /v1/appInfoLocalizations/{locId}
     → appStoreVersion 系: PATCH /v1/appStoreVersionLocalizations/{locId}
     → 結果を sync_logs に記録
     → 項目別の成功/失敗を返却
```

- **appInfo 系** と **appStoreVersion 系** は別 API エンドポイントなので分けて更新
- 更新後に最新値を再取得して表示を更新

## API Route 設計パターン

### ディレクトリ規則

```
src/app/api/
├── auth/
│   ├── login/route.ts
│   └── logout/route.ts
├── apple/
│   ├── connections/
│   │   ├── route.ts              # GET (一覧), POST (作成)
│   │   └── [id]/
│   │       ├── route.ts          # DELETE
│   │       └── test/route.ts     # POST (接続テスト)
│   └── apps/
│       ├── route.ts              # GET (一覧)
│       └── [id]/
│           └── localizations/route.ts  # GET
├── projects/
│   ├── route.ts                  # GET (一覧), POST (作成)
│   └── [id]/
│       ├── route.ts              # GET, PATCH
│       ├── generate/route.ts     # POST (一括生成)
│       ├── generate-field/route.ts  # POST (個別生成)
│       └── push/route.ts         # POST (反映)
└── stripe/
    └── webhook/route.ts          # POST
```

### Route Handler 共通パターン

```typescript
// 標準レスポンス形式
// 成功時
NextResponse.json({ data: T })

// エラー時
NextResponse.json({ error: string, details?: unknown }, { status: number })
```

```typescript
// 認証チェックパターン
export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // ... 処理
}
```

### エラーステータス運用

| Status | 用途 |
|---|---|
| 400 | バリデーションエラー、不正リクエスト |
| 401 | 未認証 |
| 403 | 権限不足（他ユーザーのリソースアクセス） |
| 404 | リソース未存在 |
| 422 | Apple API バリデーションエラー |
| 500 | サーバーエラー |

## Apple API 統合

### JWT 生成

```
Header: { alg: "ES256", kid: KEY_ID, typ: "JWT" }
Payload: {
  iss: ISSUER_ID,
  iat: now,
  exp: now + 20min,
  aud: "appstoreconnect-v1"
}
署名: ES256 (秘密鍵)
```

### API エンドポイント

- Base URL: `https://api.appstoreconnect.apple.com/v1`
- 認証: `Authorization: Bearer {jwt}`
- Rate limit: 注意が必要（エラー時はリトライヘッダーを確認）

### field_key と Apple API の対応

| field_key | Apple API Resource | Apple Field Name |
|---|---|---|
| app_name | appInfoLocalizations | name |
| subtitle | appInfoLocalizations | subtitle |
| privacy_policy_url | appInfoLocalizations | privacyPolicyUrl |
| description | appStoreVersionLocalizations | description |
| keywords | appStoreVersionLocalizations | keywords |
| promotional_text | appStoreVersionLocalizations | promotionalText |
| support_url | appStoreVersionLocalizations | supportUrl |
| marketing_url | appStoreVersionLocalizations | marketingUrl |
| whats_new | appStoreVersionLocalizations | whatsNew |

## 暗号化

### Apple 秘密鍵の保存

- **アルゴリズム**: AES-256-GCM
- **キー**: `ENCRYPTION_KEY` 環境変数 (32 bytes, hex encoded)
- **保存形式**: `{iv}:{authTag}:{encrypted}` (all base64)
- **復号**: サーバーサイドのみ。API レスポンスには含めない

## デプロイ

- **ホスティング**: Vercel
- **DB**: Supabase (クラウド)
- **環境変数**: Vercel Environment Variables で管理
- **ブランチ戦略**: main → production, dev → preview
