import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_MODEL = "gemini-3-pro-image-preview"

interface GeminiImageEditOptions {
  apiKey: string
  sourceImageBase64: string
  mimeType: string
  prompt: string
}

interface GeminiImageEditResult {
  imageBase64: string
  mimeType: string
}

export async function editImageWithGemini({
  apiKey,
  sourceImageBase64,
  mimeType,
  prompt,
}: GeminiImageEditOptions): Promise<GeminiImageEditResult> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    } as Record<string, unknown>,
  })

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: sourceImageBase64,
      },
    },
  ])

  const response = result.response
  const parts = response.candidates?.[0]?.content?.parts

  if (!parts) {
    throw new Error("Gemini returned no content")
  }

  for (const part of parts) {
    if (part.inlineData) {
      return {
        imageBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "image/png",
      }
    }
  }

  throw new Error("Gemini returned no image in response")
}
