import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "プライバシーポリシー - App Store Manager",
}

export default function PrivacyPolicyPage() {
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
        <h1 className="text-2xl font-bold tracking-tight">プライバシーポリシー</h1>
        <p className="mt-2 text-sm text-muted-foreground">最終更新日: 2026年4月13日</p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. はじめに</h2>
            <p>
              App Store Manager（以下「本サービス」）は、個人が運営する Web アプリケーションです。
              本ポリシーでは、本サービスがどのような情報を収集し、どのように利用・保護するかを説明します。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. 収集する情報</h2>
            <p>本サービスでは、以下の情報を収集・保存します。</p>
            <h3 className="text-sm font-medium text-foreground">2.1 アカウント情報</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>メールアドレス（メール認証の場合）</li>
              <li>Google アカウント情報（Google OAuth ログインの場合: メールアドレス、表示名、プロフィール画像）</li>
            </ul>
            <h3 className="text-sm font-medium text-foreground">2.2 API キー</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>OpenAI API キー（テキスト翻訳に使用）</li>
              <li>Google Gemini API キー（スクリーンショット翻訳に使用）</li>
              <li>Apple App Store Connect API キー（Issuer ID、Key ID、秘密鍵）</li>
            </ul>
            <p>
              これらの API キーおよび秘密鍵は<strong className="text-foreground">サーバー側で暗号化</strong>して保存されます。
              平文での保存は一切行いません。また、クライアント（ブラウザ）側に返すことはありません。
            </p>
            <h3 className="text-sm font-medium text-foreground">2.3 アプリケーションデータ</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>プロジェクト情報（ソース言語、ターゲット言語、翻訳テキスト）</li>
              <li>スクリーンショット画像（アップロードされたソース画像および AI 生成画像）</li>
              <li>App Store Connect から取得したメタデータ</li>
            </ul>
            <h3 className="text-sm font-medium text-foreground">2.4 アクセスログ・分析データ</h3>
            <p>
              本サービスでは Google Analytics を使用してアクセス状況を分析しています。
              Google Analytics は Cookie を使用して匿名のトラフィックデータ（ページビュー、滞在時間、参照元など）を収集します。
              個人を特定する情報は収集しません。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. 情報の利用目的</h2>
            <p>収集した情報は、以下の目的のみに利用します。</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>ユーザー認証およびアカウント管理</li>
              <li>AI による翻訳機能の提供（API キーを使用して各プロバイダーにリクエスト）</li>
              <li>App Store Connect へのメタデータ読み取り・書き込み</li>
              <li>サービスの改善およびアクセス分析</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. 第三者への情報提供</h2>
            <p>
              本サービスは、ユーザーの情報を第三者に販売・提供することはありません。
              ただし、サービスの提供にあたり、以下の外部サービスにデータが送信されます。
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong className="text-foreground">OpenAI</strong> — テキスト翻訳のため、ユーザーが入力したメタデータを送信します</li>
              <li><strong className="text-foreground">Google（Gemini）</strong> — スクリーンショット翻訳のため、アップロードされた画像を送信します</li>
              <li><strong className="text-foreground">Apple（App Store Connect API）</strong> — メタデータの取得・反映のため通信します</li>
              <li><strong className="text-foreground">Supabase</strong> — データベースおよびファイルストレージとして使用します</li>
              <li><strong className="text-foreground">Google Analytics</strong> — アクセス解析のため匿名データを送信します</li>
            </ul>
            <p>各サービスのプライバシーポリシーもあわせてご確認ください。</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. データの保護</h2>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>API キーおよび秘密鍵はサーバー側で暗号化して保存します</li>
              <li>通信はすべて HTTPS で暗号化されます</li>
              <li>データベースへのアクセスは行レベルセキュリティ（RLS）で保護されています</li>
              <li>ユーザーは自身のデータにのみアクセスできます</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. データの削除</h2>
            <p>
              ユーザーはいつでもアカウントの削除を依頼できます。
              アカウントを削除すると、保存されているすべてのデータ（プロジェクト、API キー、スクリーンショット等）が削除されます。
              削除のご依頼は、ログイン中のメールアドレスからご連絡ください。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">7. Cookie の使用</h2>
            <p>本サービスでは以下の目的で Cookie を使用します。</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>ログインセッションの維持（Supabase Auth）</li>
              <li>アクセス解析（Google Analytics）</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">8. ポリシーの変更</h2>
            <p>
              本ポリシーは必要に応じて改定されることがあります。
              重要な変更がある場合は、本ページで通知します。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">9. お問い合わせ</h2>
            <p>
              プライバシーに関するご質問やデータ削除のご依頼は、以下までご連絡ください。
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
