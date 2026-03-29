import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { decrypt } from "@/lib/encryption"
import { generateAppleJwt } from "@/lib/apple/jwt"
import { appleApi } from "@/lib/apple/client"
import type {
  AppInfosResponse,
  AppInfoLocalizationsResponse,
  AppStoreVersionsResponse,
  AppStoreVersionLocalizationsResponse,
} from "@/lib/apple/types"

// GET: アプリのローカライズ情報取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appleAppId } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get("connectionId")
    const locale = searchParams.get("locale") ?? "en-US"

    if (!connectionId) {
      return NextResponse.json(
        { error: "connectionId is required" },
        { status: 400 }
      )
    }

    const { data: connection, error } = await supabase
      .from("apple_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .single()

    if (error || !connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    const privateKey = decrypt(connection.private_key_encrypted)
    const jwt = await generateAppleJwt({
      issuerId: connection.issuer_id,
      keyId: connection.key_id,
      privateKey,
    })

    // appInfos 取得
    const appInfosRes = await appleApi<AppInfosResponse>({
      jwt,
      path: `/apps/${appleAppId}/appInfos`,
    })
    const appInfoId = appInfosRes.data[0]?.id

    // appStoreVersions 取得 (最新)
    const versionsRes = await appleApi<AppStoreVersionsResponse>({
      jwt,
      path: `/apps/${appleAppId}/appStoreVersions?filter[platform]=IOS&limit=1`,
    })
    const versionId = versionsRes.data[0]?.id
    const versionInfo = versionsRes.data[0]?.attributes

    // ローカライズ取得 (並列)
    const [appInfoLocalizations, versionLocalizations] = await Promise.all([
      appInfoId
        ? appleApi<AppInfoLocalizationsResponse>({
            jwt,
            path: `/appInfos/${appInfoId}/appInfoLocalizations?filter[locale]=${locale}`,
          })
        : null,
      versionId
        ? appleApi<AppStoreVersionLocalizationsResponse>({
            jwt,
            path: `/appStoreVersions/${versionId}/appStoreVersionLocalizations?filter[locale]=${locale}`,
          })
        : null,
    ])

    return NextResponse.json({
      data: {
        appInfoId,
        versionId,
        versionString: versionInfo?.versionString ?? null,
        appStoreState: versionInfo?.appStoreState ?? null,
        appInfoLocalizations: appInfoLocalizations?.data ?? [],
        versionLocalizations: versionLocalizations?.data ?? [],
      },
    })
  } catch (error) {
    console.error("GET /api/apple/apps/[id]/localizations", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
