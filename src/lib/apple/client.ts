const BASE_URL = "https://api.appstoreconnect.apple.com/v1"

interface AppleApiOptions {
  jwt: string
  path: string
  method?: "GET" | "PATCH" | "POST" | "DELETE"
  body?: Record<string, unknown>
}

export interface AppleApiError {
  status: string
  code: string
  title: string
  detail: string
}

interface AppleErrorResponse {
  errors: AppleApiError[]
}

export async function appleApi<T>({
  jwt,
  path,
  method = "GET",
  body,
}: AppleApiOptions): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as AppleErrorResponse | null
    const detail = errorBody?.errors?.[0]?.detail ?? `Apple API error: ${res.status}`
    throw new Error(detail)
  }

  return res.json() as Promise<T>
}
