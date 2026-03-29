import type { FieldKey } from "@/types/field-keys"
import { getLanguageName } from "@/lib/locales"

function buildSystemBase(sourceLocale: string, targetLocale: string): string {
  const sourceLang = getLanguageName(sourceLocale)
  const targetLang = getLanguageName(targetLocale)

  return `You are an expert App Store optimization (ASO) copywriter.
Your task is to translate ${sourceLang} app metadata into natural, compelling ${targetLang} for the App Store.

Rules:
- Do NOT translate literally. Adapt for the App Store audience.
- Use natural, professional ${targetLang} that sounds native.
- Avoid exaggerated claims or superlatives.
- Preserve brand names as-is.
- Match the tone appropriate for the app's category.
- You MUST write all output in ${targetLang}. Do not output in any other language.`
}

function buildFieldInstructions(targetLocale: string): Record<FieldKey, string> {
  const targetLang = getLanguageName(targetLocale)

  return {
    app_name: `Generate a concise, memorable app name in ${targetLang}.
- Keep it short (ideally under 30 characters)
- Maintain brand identity
- Make it easy to remember and search for`,

    subtitle: `Generate a compelling subtitle in ${targetLang} for the App Store.
- Maximum 30 characters
- Communicate the core value proposition at a glance
- Use action-oriented or benefit-driven language`,

    description: `Generate a well-structured App Store description in ${targetLang}.
- Start with a strong opening hook
- Use short paragraphs and bullet points for readability
- Highlight key features and benefits
- Include a clear call-to-action
- Maximum 4000 characters`,

    keywords: `Generate optimized keywords in ${targetLang} for App Store search.
- Comma-separated, no spaces after commas
- Maximum 100 characters total
- Focus on high-relevance search terms
- Avoid duplicating words from the app name
- Use singular forms`,

    promotional_text: `Generate promotional text in ${targetLang} for the App Store.
- Maximum 170 characters
- Highlight what's new or most compelling
- Create urgency or excitement
- Can be updated without a new app version`,

    whats_new: `Generate release notes in ${targetLang} for the App Store.
- Keep it concise and scannable
- Use bullet points for multiple changes
- Lead with the most impactful change
- Be specific about improvements`,

    support_url: `Return the URL as-is. Do not translate or modify URLs.`,

    marketing_url: `Return the URL as-is. Do not translate or modify URLs.`,

    privacy_policy_url: `Return the URL as-is. Do not translate or modify URLs.`,
  }
}

export function buildPrompt(
  fieldKey: FieldKey,
  sourceText: string,
  sourceLocale: string = "ja",
  targetLocale: string = "en-US"
): {
  system: string
  user: string
} {
  const sourceLang = getLanguageName(sourceLocale)
  const instructions = buildFieldInstructions(targetLocale)

  return {
    system: `${buildSystemBase(sourceLocale, targetLocale)}\n\n${instructions[fieldKey]}`,
    user: `Translate and optimize the following ${sourceLang} text for the App Store "${fieldKey}" field:\n\n${sourceText}`,
  }
}
