import { ImageResponse } from "next/og"

export const alt = "App Store Manager - App Store ローカライズを AI で一括完了"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#18181b",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "#27272a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M17.05 11.97c-.02-2.15 1.76-3.18 1.84-3.23-1-1.47-2.56-1.67-3.12-1.7-1.32-.14-2.59.78-3.27.78-.68 0-1.72-.76-2.83-.74-1.46.02-2.8.85-3.55 2.15-1.52 2.63-.39 6.52 1.09 8.66.72 1.05 1.58 2.22 2.72 2.18 1.09-.04 1.5-.7 2.82-.7 1.32 0 1.69.7 2.83.68 1.17-.02 1.91-1.06 2.63-2.11.83-1.21 1.17-2.39 1.19-2.45-.03-.01-2.28-.87-2.3-3.47l-.05-.05z"
              fill="white"
            />
            <path
              d="M14.96 5.1c.6-.73 1-1.74.89-2.75-.86.04-1.9.58-2.52 1.3-.55.64-1.04 1.66-.91 2.64.96.07 1.94-.48 2.54-1.19z"
              fill="white"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.02em",
            }}
          >
            App Store Manager
          </span>
          <span
            style={{
              fontSize: 24,
              color: "#a1a1aa",
              letterSpacing: "-0.01em",
            }}
          >
            ローカライズを、もっとシンプルに。
          </span>
        </div>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 8,
          }}
        >
          {["AI 翻訳", "スクショ生成", "ワンクリック反映"].map(
            (tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 16,
                  color: "#d4d4d8",
                  background: "#27272a",
                  padding: "8px 20px",
                  borderRadius: 100,
                }}
              >
                {tag}
              </span>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  )
}
