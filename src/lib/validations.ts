import { z } from "zod/v4"
import { SUPPORTED_LOCALE_CODES } from "@/lib/locales"

export const appleConnectionSchema = z.object({
  connectionName: z.string().min(1, "接続名を入力してください"),
  issuerId: z.string().min(1, "Issuer ID を入力してください"),
  keyId: z.string().min(1, "Key ID を入力してください"),
  privateKey: z
    .string()
    .min(1, "秘密鍵を入力してください")
    .refine(
      (val) => val.includes("BEGIN PRIVATE KEY"),
      "有効な .p8 秘密鍵を入力してください"
    ),
})

export type AppleConnectionInput = z.infer<typeof appleConnectionSchema>

export const createProjectSchema = z.object({
  appId: z.string().uuid(),
  sourceLocale: z.string().default("ja").check(
    z.refine((val) => SUPPORTED_LOCALE_CODES.includes(val), "サポートされていないロケールです")
  ),
  targetLocales: z.array(z.string().check(
    z.refine((val) => SUPPORTED_LOCALE_CODES.includes(val), "サポートされていないロケールです")
  )).min(1, "ターゲット言語を1つ以上選択してください"),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const batchProjectIdsSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1, "プロジェクトを1つ以上選択してください"),
})

export const updateFieldSchema = z.object({
  fieldKey: z.string(),
  sourceValue: z.string().optional(),
  proposedValue: z.string().optional(),
  finalValue: z.string().optional(),
  isSelected: z.boolean().optional(),
})

export const generateFieldSchema = z.object({
  fieldKey: z.string(),
})

export const pushFieldsSchema = z.object({
  fieldKeys: z.array(z.string()).min(1, "反映する項目を選択してください"),
})
