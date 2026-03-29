-- user_settings に Gemini API キーカラム追加
ALTER TABLE public.user_settings
  ADD COLUMN gemini_api_key_encrypted TEXT;

-- スクリーンショットセット（プロジェクト × デバイスタイプ）
CREATE TABLE public.screenshot_sets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  device_type   TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_screenshot_sets_project_id ON public.screenshot_sets(project_id);
CREATE UNIQUE INDEX idx_screenshot_sets_unique ON public.screenshot_sets(project_id, device_type);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.screenshot_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- スクリーンショット（個別画像）
CREATE TABLE public.screenshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screenshot_set_id   UUID NOT NULL REFERENCES public.screenshot_sets(id) ON DELETE CASCADE,
  locale              TEXT NOT NULL,
  position            INT NOT NULL DEFAULT 0,
  storage_path        TEXT NOT NULL,
  file_name           TEXT NOT NULL,
  file_size           INT NOT NULL,
  width               INT NOT NULL,
  height              INT NOT NULL,
  mime_type           TEXT NOT NULL DEFAULT 'image/png',
  is_source           BOOLEAN NOT NULL DEFAULT false,
  generation_status   TEXT DEFAULT 'pending',
  generation_error    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_screenshots_set_id ON public.screenshots(screenshot_set_id);
CREATE UNIQUE INDEX idx_screenshots_unique ON public.screenshots(screenshot_set_id, locale, position);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.screenshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.screenshot_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own screenshot sets"
  ON public.screenshot_sets FOR ALL
  USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own screenshots"
  ON public.screenshots FOR ALL
  USING (
    screenshot_set_id IN (
      SELECT ss.id FROM public.screenshot_sets ss
      JOIN public.projects p ON ss.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    screenshot_set_id IN (
      SELECT ss.id FROM public.screenshot_sets ss
      JOIN public.projects p ON ss.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Supabase Storage バケット
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can manage own screenshot files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
