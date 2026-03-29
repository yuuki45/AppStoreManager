import { getLanguageName } from "@/lib/locales"

export function buildScreenshotTranslationPrompt(
  sourceLocale: string,
  targetLocale: string,
  width: number,
  height: number,
  customInstructions?: string
): string {
  const sourceLang = getLanguageName(sourceLocale)
  const targetLang = getLanguageName(targetLocale)

  let prompt = `Edit this app screenshot image.

TASK: Replace ALL visible text from ${sourceLang} to ${targetLang}.

CRITICAL RULES:
- Replace ONLY the text content. Translate all visible text into natural ${targetLang}.
- Do NOT change anything else: keep the exact same layout, colors, icons, backgrounds, gradients, UI elements, and visual design.
- Maintain the exact pixel dimensions: ${width}x${height}.
- Preserve all font styling (bold, size hierarchy, alignment, color) - just change the language of the text.
- The text must look natural and professionally typeset in ${targetLang}.
- Do NOT add, remove, or move any UI elements.
- Output the image in PNG format.`

  if (customInstructions) {
    prompt += `\n\nAdditional translation instructions:\n${customInstructions}`
  }

  return prompt
}
