# App Store Localization Manager

App Store Connect メタデータを AI で一括ローカライズし、比較・編集・反映まで行う Web アプリ。

## Current Status

- **Phase**: MVP 完了（Phase 1-3 実装・動作確認済み）
- **実装済み**: 認証(login/signup)、ダッシュボードレイアウト、Apple接続管理(CRUD+テスト)、App一覧取得、プロジェクト作成・一覧・編集、3カラム比較UI、AI一括/個別生成、確認ダイアログ付きASC反映、反映結果表示、sync_log記録
- **次のステップ**: Phase 4（UI改善、エラー改善、多言語対応）、デプロイ

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: Tailwind CSS + shadcn/ui
- **DB**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email login)
- **AI**: OpenAI API (GPT-4o)
- **Billing**: Stripe
- **外部API**: App Store Connect API (JWT 認証)
- **Package Manager**: npm

## Directory Structure

```
aso/
├── CLAUDE.md
├── docs/                    # 設計ドキュメント
├── src/
│   ├── app/                 # App Router pages & API routes
│   │   ├── (auth)/          # 認証不要ページ (login, signup)
│   │   ├── (dashboard)/     # 認証必須ページ
│   │   │   ├── connections/ # Apple APIキー管理
│   │   │   ├── apps/        # App選択
│   │   │   ├── projects/    # プロジェクト一覧・編集
│   │   │   └── settings/    # ユーザー設定
│   │   └── api/             # Route Handlers
│   │       ├── auth/
│   │       ├── apple/
│   │       ├── projects/
│   │       └── generate/
│   ├── components/          # 共通UIコンポーネント
│   │   ├── ui/              # shadcn/ui コンポーネント
│   │   └── ...              # アプリ固有コンポーネント
│   ├── lib/                 # ユーティリティ・クライアント
│   │   ├── supabase/        # Supabase client (server / browser)
│   │   ├── apple/           # Apple API ラッパー
│   │   ├── ai/              # OpenAI API ラッパー
│   │   └── utils.ts
│   ├── types/               # 型定義
│   └── hooks/               # カスタムフック
├── supabase/                # Supabase マイグレーション
│   └── migrations/
├── public/
├── .env.local               # 環境変数（git管理外）
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Key Commands

```bash
npm run dev          # 開発サーバー起動 (localhost:3000)
npm run build        # プロダクションビルド
npm run lint         # ESLint 実行
npm run type-check   # TypeScript 型チェック (tsc --noEmit)
npx supabase db push # マイグレーション適用
npx supabase gen types typescript --local > src/types/database.ts  # DB型生成
```

## Critical Conventions

- **Server Components をデフォルトで使用**。`"use client"` はインタラクションが必要な場合のみ
- **API Route Handlers** は `src/app/api/` 配下に配置。Server Actions は使わない（API経由で統一）
- **Supabase クライアント**: Server 用 (`createServerClient`) と Browser 用 (`createBrowserClient`) を明確に分離
- **Apple 秘密鍵はサーバー側のみで扱う**。クライアントに絶対に返さない
- **エラーは `{ error: string; details?: unknown }` 形式**で統一レスポンス
- **コンポーネントは機能単位でディレクトリ分割**。index.ts で re-export
- 詳細は [docs/CONVENTIONS.md](docs/CONVENTIONS.md) 参照

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Apple API 暗号化用
ENCRYPTION_KEY=
```

## Documentation Index

| ドキュメント | 内容 |
|---|---|
| [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md) | プロダクト要件・機能仕様（正式仕様書） |
| [docs/README.md](docs/README.md) | プロジェクト概要・想定ユーザー |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | システム構成・データフロー・API設計パターン |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Supabase スキーマ (SQL・RLS・Index) |
| [docs/FRONTEND.md](docs/FRONTEND.md) | ページ構成・コンポーネント設計・状態管理 |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | コーディング規約・命名・パターン |
