import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Sparkles,
  Upload,
  Languages,
  Image,
  Columns3,
  Globe,
} from "lucide-react"

export default async function LandingPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cta = user
    ? { href: "/projects", label: "ダッシュボードへ" }
    : { href: "/signup", label: "無料で始める" }

  return (
    <div className="flex min-h-full flex-col bg-background">
      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-background/80 backdrop-blur-md animate-fade-in">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <span className="text-sm font-semibold tracking-tight">
            App Store Manager
          </span>
          <nav className="flex items-center gap-2">
            {user ? (
              <Link href="/projects">
                <Button variant="ghost" size="sm">ダッシュボード</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">ログイン</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">始める</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 pt-32 pb-24">
        <div className="mx-auto max-w-xl text-center space-y-8">
          <p className="animate-fade-up text-xs font-medium uppercase tracking-widest text-muted-foreground">
            App Store Localization Tool
          </p>

          <h1 className="animate-fade-up delay-100 text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl">
            ローカライズを、
            <br />
            もっとシンプルに。
          </h1>

          <p className="animate-fade-up delay-200 mx-auto max-w-md text-base text-muted-foreground leading-relaxed">
            AI がメタデータとスクリーンショットを翻訳。
            <br className="hidden sm:block" />
            比較・編集して、そのまま App Store Connect へ。
          </p>

          <div className="animate-fade-up delay-300 flex items-center justify-center gap-3">
            <Link href={cta.href}>
              <Button size="lg" className="rounded-full px-6 transition-transform hover:scale-105">
                {cta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <p className="animate-fade-up text-center text-xs font-medium uppercase tracking-widest text-muted-foreground mb-12">
            How it works
          </p>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border hidden sm:block" />

            <div className="space-y-10">
              {[
                { num: "01", title: "元文を入力", desc: "日本語のアプリ名・説明文・キーワードなどを入力。ストアから既存の登録値を取得することもできます。" },
                { num: "02", title: "AI が翻訳", desc: "GPT-4o が App Store に最適化された自然な翻訳を一括生成。スクリーンショットも Gemini で多言語化。" },
                { num: "03", title: "比較して編集", desc: "元文・現在の登録値・AI 提案の 3 カラムで比較。納得いくまで手動で微調整できます。" },
                { num: "04", title: "ストアに反映", desc: "反映したい項目を選んでワンクリック。App Store Connect に直接書き込みます。" },
              ].map((step, i) => (
                <div
                  key={step.num}
                  className={`animate-fade-up delay-${(i + 1) * 100} flex gap-6 items-start`}
                >
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-bold tabular-nums transition-colors hover:bg-primary hover:text-primary-foreground">
                    {step.num}
                  </div>
                  <div className="pt-1.5 space-y-1">
                    <h3 className="text-sm font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <p className="animate-fade-up text-center text-xs font-medium uppercase tracking-widest text-muted-foreground mb-12">
            Features
          </p>

          <div className="grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Languages,
                title: "40+ 言語",
                desc: "任意の言語ペアで翻訳。英語・中国語・韓国語・ヨーロッパ言語など幅広くカバー。",
              },
              {
                icon: Sparkles,
                title: "AI 一括生成",
                desc: "9 項目のメタデータを一度に翻訳。フィールド単位の個別生成にも対応。",
              },
              {
                icon: Image,
                title: "スクショ翻訳",
                desc: "画像内のテキストを AI が翻訳・再描画。デバイスタイプは自動判定。",
              },
              {
                icon: Columns3,
                title: "3 カラム比較",
                desc: "元文・現在値・提案値を並べて確認。差分をひと目で把握できる。",
              },
              {
                icon: Upload,
                title: "直接反映",
                desc: "App Store Connect API 経由でワンクリック反映。コピペ不要。",
              },
              {
                icon: Globe,
                title: "マルチプロジェクト",
                desc: "アプリ x 言語ペアでプロジェクト管理。一括操作で全言語まとめて処理。",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className={`animate-fade-up delay-${(i + 1) * 100} space-y-2 rounded-lg p-4 transition-colors hover:bg-muted/50`}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="border-t px-6 py-24">
        <div className="animate-fade-up mx-auto max-w-md text-center space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Pricing
          </p>
          <h2 className="text-3xl font-bold">Free</h2>
          <p className="text-sm text-muted-foreground leading-relaxed text-balance">
            サービス利用は無料。AI の利用料金のみ各プロバイダに直接お支払いいただきます。
          </p>
          <div className="flex justify-center gap-8 pt-2 text-xs text-muted-foreground">
            <div>
              <span className="block text-foreground font-medium">~$0.01–0.05</span>
              テキスト翻訳 / 回
            </div>
            <div>
              <span className="block text-foreground font-medium">~$0.10–0.15</span>
              スクショ生成 / 枚
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t px-6 py-24">
        <div className="animate-fade-up mx-auto max-w-md text-center space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">
            今すぐ始めましょう
          </h2>
          <p className="text-sm text-muted-foreground">
            個人開発者・小規模チームのためのローカライズツール
          </p>
          <Link href={cta.href}>
            <Button size="lg" className="rounded-full px-6 transition-transform hover:scale-105">
              {cta.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t px-6 py-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between text-xs text-muted-foreground">
          <span>App Store Manager</span>
          <div className="flex items-center gap-4">
            <a
              href="https://buymeacoffee.com/yuuki.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Buy me a coffee
            </a>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
