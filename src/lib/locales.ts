export interface LocaleOption {
  code: string
  label: string
  language: string
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: "ar-SA", label: "アラビア語", language: "Arabic" },
  { code: "ca", label: "カタルーニャ語", language: "Catalan" },
  { code: "cs", label: "チェコ語", language: "Czech" },
  { code: "da", label: "デンマーク語", language: "Danish" },
  { code: "de-DE", label: "ドイツ語", language: "German" },
  { code: "el", label: "ギリシャ語", language: "Greek" },
  { code: "en-AU", label: "英語 (オーストラリア)", language: "Australian English" },
  { code: "en-CA", label: "英語 (カナダ)", language: "Canadian English" },
  { code: "en-GB", label: "英語 (イギリス)", language: "British English" },
  { code: "en-US", label: "英語 (アメリカ)", language: "American English" },
  { code: "es-ES", label: "スペイン語 (スペイン)", language: "European Spanish" },
  { code: "es-MX", label: "スペイン語 (メキシコ)", language: "Latin American Spanish" },
  { code: "fi", label: "フィンランド語", language: "Finnish" },
  { code: "fr-CA", label: "フランス語 (カナダ)", language: "Canadian French" },
  { code: "fr-FR", label: "フランス語 (フランス)", language: "French" },
  { code: "he", label: "ヘブライ語", language: "Hebrew" },
  { code: "hi", label: "ヒンディー語", language: "Hindi" },
  { code: "hr", label: "クロアチア語", language: "Croatian" },
  { code: "hu", label: "ハンガリー語", language: "Hungarian" },
  { code: "id", label: "インドネシア語", language: "Indonesian" },
  { code: "it", label: "イタリア語", language: "Italian" },
  { code: "ja", label: "日本語", language: "Japanese" },
  { code: "ko", label: "韓国語", language: "Korean" },
  { code: "ms", label: "マレー語", language: "Malay" },
  { code: "nl-NL", label: "オランダ語", language: "Dutch" },
  { code: "no", label: "ノルウェー語", language: "Norwegian" },
  { code: "pl", label: "ポーランド語", language: "Polish" },
  { code: "pt-BR", label: "ポルトガル語 (ブラジル)", language: "Brazilian Portuguese" },
  { code: "pt-PT", label: "ポルトガル語 (ポルトガル)", language: "European Portuguese" },
  { code: "ro", label: "ルーマニア語", language: "Romanian" },
  { code: "ru", label: "ロシア語", language: "Russian" },
  { code: "sk", label: "スロバキア語", language: "Slovak" },
  { code: "sv", label: "スウェーデン語", language: "Swedish" },
  { code: "th", label: "タイ語", language: "Thai" },
  { code: "tr", label: "トルコ語", language: "Turkish" },
  { code: "uk", label: "ウクライナ語", language: "Ukrainian" },
  { code: "vi", label: "ベトナム語", language: "Vietnamese" },
  { code: "zh-Hans", label: "中国語 (簡体字)", language: "Simplified Chinese" },
  { code: "zh-Hant", label: "中国語 (繁体字)", language: "Traditional Chinese" },
]

export const SUPPORTED_LOCALE_CODES = LOCALE_OPTIONS.map((l) => l.code)

export function getLocaleByCode(code: string): LocaleOption | undefined {
  return LOCALE_OPTIONS.find((l) => l.code === code)
}

export function getLanguageName(code: string): string {
  return getLocaleByCode(code)?.language ?? code
}

export function getLocaleLabel(code: string): string {
  return getLocaleByCode(code)?.label ?? code
}
