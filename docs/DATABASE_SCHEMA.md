# Database Schema

Supabase (PostgreSQL) のスキーマ定義。
`auth.users` は Supabase Auth が管理するため、ここでは `public` スキーマのテーブルのみ定義する。

## ER図

```
auth.users (Supabase管理)
    │
    ├── 1:N ── apple_connections
    │               │
    │               └── 1:N ── apps
    │                           │
    ├── 1:N ────────────────── projects
    │                           │
    │                           ├── 1:N ── project_fields
    │                           │
    │                           └── 1:N ── sync_logs
    │
    └── 1:1 ── user_profiles (将来拡張用)
```

## テーブル定義

### apple_connections

Apple API キーの接続情報。秘密鍵は暗号化して保存。

```sql
CREATE TABLE public.apple_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_name TEXT NOT NULL DEFAULT '',
  issuer_id     TEXT NOT NULL,
  key_id        TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,  -- AES-256-GCM 暗号化済み
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_apple_connections_user_id ON public.apple_connections(user_id);
```

### apps

Apple API から取得したアプリ情報のローカルキャッシュ。

```sql
CREATE TABLE public.apps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  apple_connection_id UUID NOT NULL REFERENCES public.apple_connections(id) ON DELETE CASCADE,
  apple_app_id        TEXT NOT NULL,       -- Apple の App ID
  bundle_id           TEXT NOT NULL,
  app_name            TEXT NOT NULL,
  platform            TEXT NOT NULL DEFAULT 'IOS',  -- IOS / MAC_OS
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_apps_user_id ON public.apps(user_id);
CREATE UNIQUE INDEX idx_apps_user_apple ON public.apps(user_id, apple_app_id);
```

### projects

ローカライズ作業単位。1 App × 1 ターゲットロケールにつき複数作成可能。

```sql
CREATE TYPE project_status AS ENUM (
  'draft',       -- 作成直後
  'source_set',  -- 元文入力済み
  'generated',   -- AI生成済み
  'edited',      -- 手動編集済み
  'pushed',      -- ASC反映済み
  'failed'       -- 反映失敗
);

CREATE TABLE public.projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id            UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  source_locale     TEXT NOT NULL DEFAULT 'ja',
  target_locale     TEXT NOT NULL DEFAULT 'en-US',
  source_version_id TEXT,            -- Apple の appStoreVersion ID
  app_info_id       TEXT,            -- Apple の appInfo ID
  status            project_status NOT NULL DEFAULT 'draft',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_app_id ON public.projects(app_id);
```

### project_fields

プロジェクトごとのフィールド値。元文・現在値・AI提案値・最終値を保持。

```sql
CREATE TYPE field_key AS ENUM (
  'app_name',
  'subtitle',
  'privacy_policy_url',
  'description',
  'keywords',
  'promotional_text',
  'support_url',
  'marketing_url',
  'whats_new'
);

CREATE TABLE public.project_fields (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  field_key            field_key NOT NULL,
  source_value         TEXT,      -- 日本語元文
  current_remote_value TEXT,      -- Apple に現在登録されている値
  proposed_value       TEXT,      -- AI 生成値
  final_value          TEXT,      -- ユーザー編集後の最終値
  is_selected          BOOLEAN NOT NULL DEFAULT false,  -- 反映対象に選択されているか
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_fields_project_id ON public.project_fields(project_id);
CREATE UNIQUE INDEX idx_project_fields_unique ON public.project_fields(project_id, field_key);
```

### sync_logs

App Store Connect への更新ログ。

```sql
CREATE TYPE sync_action AS ENUM (
  'push',      -- ASC への反映
  'fetch'      -- ASC からの取得
);

CREATE TYPE sync_status AS ENUM (
  'success',
  'failed'
);

CREATE TABLE public.sync_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  field_key         field_key,               -- NULL の場合は一括操作
  action_type       sync_action NOT NULL,
  request_payload   JSONB,
  response_payload  JSONB,
  status            sync_status NOT NULL,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_logs_project_id ON public.sync_logs(project_id);
CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at DESC);
```

## updated_at 自動更新トリガー

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.apple_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.project_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

## Row Level Security (RLS)

全テーブルで RLS を有効化し、ユーザーは自分のデータのみアクセス可能にする。

```sql
-- apple_connections
ALTER TABLE public.apple_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connections"
  ON public.apple_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- apps
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own apps"
  ON public.apps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- project_fields
ALTER TABLE public.project_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own project fields"
  ON public.project_fields FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- sync_logs
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs"
  ON public.sync_logs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert sync logs"
  ON public.sync_logs FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );
```

## 型生成

Supabase CLI で TypeScript 型を自動生成する:

```bash
npx supabase gen types typescript --local > src/types/database.ts
```

生成された型は `Database["public"]["Tables"]["table_name"]["Row"]` で参照する。
