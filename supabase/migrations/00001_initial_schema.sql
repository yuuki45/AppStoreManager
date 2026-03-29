-- Apple API 接続情報
CREATE TABLE public.apple_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_name TEXT NOT NULL DEFAULT '',
  issuer_id     TEXT NOT NULL,
  key_id        TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_apple_connections_user_id ON public.apple_connections(user_id);

-- アプリ情報キャッシュ
CREATE TABLE public.apps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  apple_connection_id UUID NOT NULL REFERENCES public.apple_connections(id) ON DELETE CASCADE,
  apple_app_id        TEXT NOT NULL,
  bundle_id           TEXT NOT NULL,
  app_name            TEXT NOT NULL,
  platform            TEXT NOT NULL DEFAULT 'IOS',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_apps_user_id ON public.apps(user_id);
CREATE UNIQUE INDEX idx_apps_user_apple ON public.apps(user_id, apple_app_id);

-- プロジェクトステータス
CREATE TYPE project_status AS ENUM (
  'draft',
  'source_set',
  'generated',
  'edited',
  'pushed',
  'failed'
);

-- ローカライズプロジェクト
CREATE TABLE public.projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id            UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  source_locale     TEXT NOT NULL DEFAULT 'ja',
  target_locale     TEXT NOT NULL DEFAULT 'en-US',
  source_version_id TEXT,
  app_info_id       TEXT,
  status            project_status NOT NULL DEFAULT 'draft',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_app_id ON public.projects(app_id);

-- フィールドキー
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

-- プロジェクトフィールド
CREATE TABLE public.project_fields (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  field_key            field_key NOT NULL,
  source_value         TEXT,
  current_remote_value TEXT,
  proposed_value       TEXT,
  final_value          TEXT,
  is_selected          BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_fields_project_id ON public.project_fields(project_id);
CREATE UNIQUE INDEX idx_project_fields_unique ON public.project_fields(project_id, field_key);

-- 同期アクション
CREATE TYPE sync_action AS ENUM ('push', 'fetch');
CREATE TYPE sync_status AS ENUM ('success', 'failed');

-- 同期ログ
CREATE TABLE public.sync_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  field_key         field_key,
  action_type       sync_action NOT NULL,
  request_payload   JSONB,
  response_payload  JSONB,
  status            sync_status NOT NULL,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_logs_project_id ON public.sync_logs(project_id);
CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at DESC);

-- updated_at 自動更新トリガー
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

-- Row Level Security
ALTER TABLE public.apple_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own connections"
  ON public.apple_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own apps"
  ON public.apps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.project_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own project fields"
  ON public.project_fields FOR ALL
  USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sync logs"
  ON public.sync_logs FOR SELECT
  USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own sync logs"
  ON public.sync_logs FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );
