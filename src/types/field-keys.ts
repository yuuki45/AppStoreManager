export const FIELD_KEYS = [
  "app_name",
  "subtitle",
  "whats_new",
  "description",
  "keywords",
  "promotional_text",
  "support_url",
  "marketing_url",
  "privacy_policy_url",
] as const

export type FieldKey = (typeof FIELD_KEYS)[number]

// field_key → Apple API フィールド名のマッピング
export const FIELD_TO_APPLE_INFO: Partial<Record<FieldKey, string>> = {
  app_name: "name",
  subtitle: "subtitle",
  privacy_policy_url: "privacyPolicyUrl",
}

export const FIELD_TO_APPLE_VERSION: Partial<Record<FieldKey, string>> = {
  description: "description",
  keywords: "keywords",
  promotional_text: "promotionalText",
  support_url: "supportUrl",
  marketing_url: "marketingUrl",
  whats_new: "whatsNew",
}

// 表示用ラベル
export const FIELD_LABELS: Record<FieldKey, string> = {
  app_name: "名前",
  subtitle: "サブタイトル",
  privacy_policy_url: "プライバシーポリシーURL",
  description: "説明",
  keywords: "キーワード",
  promotional_text: "プロモーション用テキスト",
  support_url: "サポートURL",
  marketing_url: "マーケティングURL",
  whats_new: "このバージョンの最新情報",
}

// App Store Connect フィールド文字数上限
export const FIELD_MAX_LENGTH: Record<FieldKey, number | null> = {
  app_name: 30,
  subtitle: 30,
  privacy_policy_url: null,
  description: 4000,
  keywords: 100,
  promotional_text: 170,
  support_url: null,
  marketing_url: null,
  whats_new: 4000,
}

// フィールドの変更可能タイミング
export type FieldAvailability = "anytime" | "version_ready" | "review_required"

export const FIELD_AVAILABILITY: Record<FieldKey, FieldAvailability> = {
  app_name: "review_required",
  subtitle: "review_required",
  privacy_policy_url: "review_required",
  description: "version_ready",
  keywords: "version_ready",
  promotional_text: "anytime",
  support_url: "version_ready",
  marketing_url: "version_ready",
  whats_new: "version_ready",
}

export const AVAILABILITY_LABELS: Record<FieldAvailability, { label: string; className: string }> = {
  anytime: {
    label: "いつでも変更可",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  version_ready: {
    label: "バージョン準備中のみ",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  review_required: {
    label: "審査対象",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
}

// URL フィールド（AI生成しない）
export const URL_FIELDS: FieldKey[] = [
  "support_url",
  "marketing_url",
  "privacy_policy_url",
]

export function isUrlField(key: FieldKey): boolean {
  return URL_FIELDS.includes(key)
}
