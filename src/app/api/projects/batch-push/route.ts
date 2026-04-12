import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { batchProjectIdsSchema } from "@/lib/validations"
import { decrypt } from "@/lib/encryption"
import { generateAppleJwt } from "@/lib/apple/jwt"
import { appleApi } from "@/lib/apple/client"
import { FIELD_TO_APPLE_INFO, FIELD_TO_APPLE_VERSION, isUnpushableField } from "@/types/field-keys"
import type { FieldKey } from "@/types/field-keys"
import type {
  AppInfosResponse,
  AppInfoLocalizationsResponse,
  AppStoreVersionsResponse,
  AppStoreVersionLocalizationsResponse,
} from "@/lib/apple/types"

// POST: 複数プロジェクトの一括反映
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = batchProjectIdsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { projectIds } = parsed.data

    // 全プロジェクトを取得
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*, apps(*, apple_connections(*)), project_fields(*)")
      .in("id", projectIds)
      .eq("user_id", user.id)

    if (error || !projects || projects.length === 0) {
      return NextResponse.json({ error: "Projects not found" }, { status: 404 })
    }

    let successCount = 0
    let totalPushCount = 0

    const results = await Promise.all(
      projects.map(async (project) => {
        const connection = project.apps.apple_connections
        const privateKey = decrypt(connection.private_key_encrypted)
        const jwt = await generateAppleJwt({
          issuerId: connection.issuer_id,
          keyId: connection.key_id,
          privateKey,
        })

        const selectedFields = project.project_fields.filter(
          (f: { is_selected: boolean }) => f.is_selected
        )

        if (selectedFields.length === 0) {
          return {
            projectId: project.id,
            targetLocale: project.target_locale,
            pushed: 0,
            failed: 0,
            skipped: true,
          }
        }

        const appleAppId = project.apps.apple_app_id
        const targetLocale = project.target_locale
        const sourceLocale = project.source_locale

        // ローカライゼーション ID 取得
        const [appInfosRes, versionsRes] = await Promise.all([
          appleApi<AppInfosResponse>({ jwt, path: `/apps/${appleAppId}/appInfos` }),
          appleApi<AppStoreVersionsResponse>({
            jwt,
            path: `/apps/${appleAppId}/appStoreVersions?filter[platform]=IOS&limit=1`,
          }),
        ])

        const appInfoId = appInfosRes.data[0]?.id
        const versionId = versionsRes.data[0]?.id

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

        let pushed = 0
        let failed = 0

        for (const field of selectedFields) {
          const key = field.field_key as FieldKey

          // app_name / subtitle は API 経由で更新不可 → スキップ
          if (isUnpushableField(key)) continue

          const targetValue = field.proposed_value ?? field.final_value
          const sourceValue = field.source_value

          const appleInfoField = FIELD_TO_APPLE_INFO[key]
          const appleVersionField = FIELD_TO_APPLE_VERSION[key]

          // ターゲットロケール反映
          if (targetValue) {
            try {
              if (appleInfoField && targetLoc.infoLocId) {
                await appleApi({
                  jwt,
                  path: `/appInfoLocalizations/${targetLoc.infoLocId}`,
                  method: "PATCH",
                  body: { data: { type: "appInfoLocalizations", id: targetLoc.infoLocId, attributes: { [appleInfoField]: targetValue } } },
                })
              } else if (appleVersionField && targetLoc.versionLocId) {
                await appleApi({
                  jwt,
                  path: `/appStoreVersionLocalizations/${targetLoc.versionLocId}`,
                  method: "PATCH",
                  body: { data: { type: "appStoreVersionLocalizations", id: targetLoc.versionLocId, attributes: { [appleVersionField]: targetValue } } },
                })
              }
              pushed++
            } catch {
              failed++
            }
          }

          // ソースロケール反映
          if (sourceValue) {
            try {
              if (appleInfoField && sourceLoc.infoLocId) {
                await appleApi({
                  jwt,
                  path: `/appInfoLocalizations/${sourceLoc.infoLocId}`,
                  method: "PATCH",
                  body: { data: { type: "appInfoLocalizations", id: sourceLoc.infoLocId, attributes: { [appleInfoField]: sourceValue } } },
                })
              } else if (appleVersionField && sourceLoc.versionLocId) {
                await appleApi({
                  jwt,
                  path: `/appStoreVersionLocalizations/${sourceLoc.versionLocId}`,
                  method: "PATCH",
                  body: { data: { type: "appStoreVersionLocalizations", id: sourceLoc.versionLocId, attributes: { [appleVersionField]: sourceValue } } },
                })
              }
            } catch {
              // ソースロケールの反映失敗は無視
            }
          }
        }

        totalPushCount += pushed
        if (pushed > 0) successCount++

        await supabase
          .from("projects")
          .update({ status: failed === 0 ? "pushed" : "failed" })
          .eq("id", project.id)

        return {
          projectId: project.id,
          targetLocale: project.target_locale,
          pushed,
          failed,
          skipped: false,
        }
      })
    )

    return NextResponse.json({
      data: {
        results,
        successCount,
        totalCount: projects.length,
        totalPushCount,
      },
    })
  } catch (error) {
    console.error("POST /api/projects/batch-push", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
