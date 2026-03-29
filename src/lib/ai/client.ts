import OpenAI from "openai"

interface GenerateOptions {
  system: string
  user: string
  temperature?: number
  apiKey?: string
}

export async function generateText({
  system,
  user,
  temperature = 0.7,
  apiKey,
}: GenerateOptions): Promise<string> {
  const key = apiKey
  if (!key) {
    throw new Error("OpenAI API キーが設定されていません。設定ページから登録してください。")
  }

  const openai = new OpenAI({ apiKey: key })

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error("AI generation returned empty response")
  }

  return content.trim()
}
