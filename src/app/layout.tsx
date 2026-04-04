import type { Metadata } from "next"
import Script from "next/script"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const GA_ID = "G-000LF5WYZS"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadataBase = new URL("https://app-store-manager-dun.vercel.app")

export const metadata: Metadata = {
  title: "App Store Manager - App Store ローカライズを AI で一括完了",
  description:
    "App Store Connect のメタデータとスクリーンショットを AI で一括翻訳。比較・編集して、そのまま App Store Connect に反映できるツール。",
  verification: {
    google: "LxEwWkTBF_dRmuRAnj8ostArpTH8OceQjfA-RSnnN1g",
  },
  openGraph: {
    title: "App Store Manager",
    description:
      "App Store のローカライズを AI で一括完了。メタデータの翻訳、スクショの多言語化、ワンクリック反映。",
    siteName: "App Store Manager",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "App Store Manager",
    description:
      "App Store のローカライズを AI で一括完了。メタデータの翻訳、スクショの多言語化、ワンクリック反映。",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
