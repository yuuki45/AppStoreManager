import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// POST: アプリ保存 (Apple API から取得した情報をローカルに保存)
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
    const { appleConnectionId, appleAppId, bundleId, appName } = body as {
      appleConnectionId: string
      appleAppId: string
      bundleId: string
      appName: string
    }

    if (!appleConnectionId || !appleAppId || !bundleId || !appName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 既存チェック (同じユーザー・同じ Apple App ID)
    const { data: existing } = await supabase
      .from("apps")
      .select("id")
      .eq("user_id", user.id)
      .eq("apple_app_id", appleAppId)
      .single()

    if (existing) {
      return NextResponse.json({ data: existing })
    }

    const { data, error } = await supabase
      .from("apps")
      .insert({
        user_id: user.id,
        apple_connection_id: appleConnectionId,
        apple_app_id: appleAppId,
        bundle_id: bundleId,
        app_name: appName,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("POST /api/apps", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
