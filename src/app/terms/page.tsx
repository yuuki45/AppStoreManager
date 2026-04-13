import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "利用規約 - App Store Manager",
}

export default function TermsPage() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity">
            App Store Manager
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 pt-28 pb-16">
        <h1 className="text-2xl font-bold tracking-tight">利用規約</h1>
        <p className="mt-2 text-sm text-muted-foreground">最終更新日: 2026年4月13日</p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">第1条（適用）</h2>
            <p>
              本規約は、App Store Manager（以下「本サービス」）の利用に関する条件を定めるものです。
              ユーザーは本サービスを利用することにより、本規約に同意したものとみなします。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">第2条（サービスの内容）</h2>
            <p>本サービスは、以下の機能を提供します。</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>App Store Connect に登録されたアプリのメタデータの取得・表示</li>
              <li>AI（OpenAI、Google Gemini）を利用したメタデータおよびスクリーンショットの翻訳</li>
              <li>翻訳結果の App Store Connect への反映</li>
              <li>スクリーンショットのアップロード・AI 翻訳・ダウンロード</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">第3条（アカウント）</h2>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>ユーザーは、メールアドレスまたは Google アカウントで登録できます。</li>
              <li>アカウント情報の管理はユーザー自身の責任で行ってください。</li>
              <li>アカウントの第三者への譲渡・共有は禁止します。</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">第4条（API キーの取り扱い）</h2>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>本サービスの利用にあたり、ユーザー自身の API キー（OpenAI、Gemini、Apple）を登録していただきます。</li>
              <li>API キーは暗号化してサーバーに保存されますが、キーの管理責任はユーザーにあります。</li>
              <li>API の利用料金は各プロバイダーからユーザーに直接請求されます。本サービスは料金を一切徴収しません。</li>
              <li>API キーの漏洩・不正利用について、本サービスは故意または重大な過失がない限り責任を負いません。</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">第5条（禁止事項）</h2>
            <p>ユーザーは以下の行為を行ってはなりません。</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>他人の API キーやアカウントを無断で使用する行為</li>
              <li>本サービスのサーバーに過度な負荷をかける行為</li>
              <li>本サービスの脆弱性を悪用する行為</li>
              <li>本サービスを利用して法令に違反する行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">第6条（免責事項）</h2>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>本サービスは「現状有姿（as-is）」で提供されます。内容の正確性、完全性、特定目的への適合性を保証しません。</li>
              <li>AI による翻訳結果の品質・正確性について保証しません。反映前にユーザー自身で内容をご確認ください。</li>
              <li>App Store Connect への反映により生じた意図しない変更・データ損失について、本サービスは責任を負いません。</li>
              <li>外部サービス（OpenAI、Google、Apple）の障害・仕様変更に起因する問題について、本サービスは責任を負いません。</li>
              <li>本サービスの利用により生じた損害（アプリの審査却下、売上への影響等を含む）について、本サービスは一切の責任を負いません。</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">第7条（サービスの変更・終了）</h2>
            <p>
              運営者は、事前の通知なく本サービスの内容を変更、または提供を終了できるものとします。
              サービスの変更・終了によりユーザーに生じた損害について、運営者は責任を負いません。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">第8条（利用停止）</h2>
            <p>
              運営者は、ユーザーが本規約に違反した場合、事前の通知なくアカウントを停止または削除できるものとします。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">第9条（規約の変更）</h2>
            <p>
              運営者は必要に応じて本規約を改定できるものとします。
              重要な変更がある場合は、本ページで通知します。
              改定後も本サービスの利用を継続した場合、ユーザーは改定後の規約に同意したものとみなします。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">第10条（準拠法・管轄）</h2>
            <p>
              本規約は日本法に準拠するものとします。
              本サービスに関する紛争が生じた場合、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">第11条（お問い合わせ）</h2>
            <p>
              本規約に関するご質問は、以下までご連絡ください。
            </p>
            <p className="text-foreground">
              メール:{" "}
              <a
                href="mailto:web-studio@ymail.ne.jp"
                className="underline underline-offset-2 hover:text-primary"
              >
                web-studio@ymail.ne.jp
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-6 mt-auto">
        <div className="mx-auto max-w-3xl flex items-center justify-between text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            App Store Manager
          </Link>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}
