import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { decrypt } from "@/lib/encryption"
import { generateAppleJwt } from "@/lib/apple/jwt"
import { appleApi } from "@/lib/apple/client"
import { FIELD_TO_APPLE_INFO, FIELD_TO_APPLE_VERSION } from "@/types/field-keys"
import type { FieldKey } from "@/types/field-keys"
import type {
  AppInfosResponse,
  AppInfoLocalizationsResponse,
  AppStoreVersionsResponse,
  AppStoreVersionLocalizationsResponse,
} from "@/lib/apple/types"

interface PushResult {
  field_key: string
  locale: string
  success: boolean
  error?: string
}

// POST: 選択したフィールドを App Store Connect に反映
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // プロジェクト + アプリ + 接続情報取得
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, apps(*, apple_connections(*)), project_fields(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const connection = project.apps.apple_connections
    const privateKey = decrypt(connection.private_key_encrypted)
    const jwt = await generateAppleJwt({
      issuerId: connection.issuer_id,
      keyId: connection.key_id,
      privateKey,
    })

    // 選択されたフィールドのみ
    const selectedFields = project.project_fields.filter(
      (f: { is_selected: boolean }) => f.is_selected
    )

    if (selectedFields.length === 0) {
      return NextResponse.json(
        { error: "反映対象の項目が選択されていません" },
        { status: 400 }
      )
    }

    const appleAppId = project.apps.apple_app_id
    const sourceLocale = project.source_locale
    const targetLocale = project.target_locale

    // appInfo / version の ID を取得
    const [appInfosRes, versionsRes] = await Promise.all([
      appleApi<AppInfosResponse>({ jwt, path: `/apps/${appleAppId}/appInfos` }),
      appleApi<AppStoreVersionsResponse>({
        jwt,
        path: `/apps/${appleAppId}/appStoreVersions?filter[platform]=IOS&limit=1`,
      }),
    ])

    const appInfoId = appInfosRes.data[0]?.id
    const versionId = versionsRes.data[0]?.id

    // 両ロケールのローカライゼーション ID を並列取得
    async function getLocIds(locale: string) {
      let infoLocId: string | null = null
      let versionLocId: string | null = null

      if (appInfoId) {
        const res = await appleApi<AppInfoLocalizationsResponse>({
          jwt,
          path: `/appInfos/${appInfoId}/appInfoLocalizations?filter[locale]=${locale}`,
        })
        infoLocId = res.data[0]?.id ?? null
      }
      if (versionId) {
        const res = await appleApi<AppStoreVersionLocalizationsResponse>({
          jwt,
          path: `/appStoreVersions/${versionId}/appStoreVersionLocalizations?filter[locale]=${locale}`,
        })
        versionLocId = res.data[0]?.id ?? null
      }
      return { infoLocId, versionLocId }
    }

    const [targetLoc, sourceLoc] = await Promise.all([
      getLocIds(targetLocale),
      getLocIds(sourceLocale),
    ])

    const results: PushResult[] = []

    // 1つのフィールドを指定ロケールに反映するヘルパー
    async function pushField(
      key: FieldKey,
      value: string,
      locale: string,
      infoLocId: string | null,
      versionLocId: string | null,
    ) {
      const appleInfoField = FIELD_TO_APPLE_INFO[key]
      const appleVersionField = FIELD_TO_APPLE_VERSION[key]

      if (appleInfoField && infoLocId) {
        await appleApi({
          jwt,
          path: `/appInfoLocalizations/${infoLocId}`,
          method: "PATCH",
          body: {
            data: {
              type: "appInfoLocalizations",
              id: infoLocId,
              attributes: { [appleInfoField]: value },
            },
          },
        })
      } else if (appleVersionField && versionLocId) {
        await appleApi({
          jwt,
          path: `/appStoreVersionLocalizations/${versionLocId}`,
          method: "PATCH",
          body: {
            data: {
              type: "appStoreVersionLocalizations",
              id: versionLocId,
              attributes: { [appleVersionField]: value },
            },
          },
        })
      } else {
        throw new Error("対応するローカライゼーションが見つかりません")
      }
    }

    for (const field of selectedFields) {
      const key = field.field_key as FieldKey
      const targetValue = field.proposed_value ?? field.final_value
      const sourceValue = field.source_value

      // ターゲット言語 (en-US) を反映
      if (targetValue) {
        try {
          await pushField(key, targetValue, targetLocale, targetLoc.infoLocId, targetLoc.versionLocId)
          results.push({ field_key: key, locale: targetLocale, success: true })

          await supabase.from("sync_logs").insert({
            project_id: id,
            field_key: key,
            action_type: "push",
            request_payload: { locale: targetLocale, value: targetValue },
            response_payload: { success: true },
            status: "success",
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error"
          results.push({ field_key: key, locale: targetLocale, success: false, error: message })

          await supabase.from("sync_logs").insert({
            project_id: id,
            field_key: key,
            action_type: "push",
            request_payload: { locale: targetLocale, value: targetValue },
            response_payload: { error: message },
            status: "failed",
            error_message: message,
          })
        }
      }

      // ソース言語 (ja) も反映
      if (sourceValue) {
        try {
          await pushField(key, sourceValue, sourceLocale, sourceLoc.infoLocId, sourceLoc.versionLocId)
          results.push({ field_key: key, locale: sourceLocale, success: true })

          await supabase.from("sync_logs").insert({
            project_id: id,
            field_key: key,
            action_type: "push",
            request_payload: { locale: sourceLocale, value: sourceValue },
            response_payload: { success: true },
            status: "success",
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error"
          results.push({ field_key: key, locale: sourceLocale, success: false, error: message })

          await supabase.from("sync_logs").insert({
            project_id: id,
            field_key: key,
            action_type: "push",
            request_payload: { locale: sourceLocale, value: sourceValue },
            response_payload: { error: message },
            status: "failed",
            error_message: message,
          })
        }
      }

      if (!targetValue && !sourceValue) {
        results.push({ field_key: key, locale: targetLocale, success: false, error: "値が空です" })
      }
    }

    const allSuccess = results.every((r) => r.success)
    await supabase
      .from("projects")
      .update({ status: allSuccess ? "pushed" : "failed" })
      .eq("id", id)

    return NextResponse.json({
      data: {
        results,
        successCount: results.filter((r) => r.success).length,
        failCount: results.filter((r) => !r.success).length,
      },
    })
  } catch (error) {
    console.error("POST /api/projects/[id]/push", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
