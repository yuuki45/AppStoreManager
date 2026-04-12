import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Link2,
  AppWindow,
  Sparkles,
  Upload,
  RefreshCw,
  Settings,
  CheckCircle2,
  ArrowRight,
  Key,
  PenLine,
  Image,
} from "lucide-react"

function Step({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: number
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {number}
          </span>
          <Icon className="h-5 w-5 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-14 text-sm leading-relaxed text-muted-foreground space-y-3">
        {children}
      </CardContent>
    </Card>
  )
}

export default function TutorialPage() {
  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">チュートリアル</h1>
        <p className="mt-1 text-muted-foreground">
          App Store Manager の使い方を順を追って説明します。
          初めての方はステップ 1 から順番に進めてください。
        </p>
      </div>

      {/* 概要 */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <p className="text-sm">
            <strong>App Store Manager</strong> は、App Store Connect に登録しているアプリのメタデータ
            （アプリ名、説明文、キーワードなど）とスクリーンショットを AI で<strong>40以上の言語</strong>に一括翻訳し、
            そのまま App Store Connect に反映できる無料ツールです。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>元文入力</span>
            <ArrowRight className="h-3 w-3" />
            <span>複数言語を選択</span>
            <ArrowRight className="h-3 w-3" />
            <span>AI で一括翻訳</span>
            <ArrowRight className="h-3 w-3" />
            <span>比較・編集</span>
            <ArrowRight className="h-3 w-3" />
            <span>App Store Connect に一括反映</span>
          </div>
        </CardContent>
      </Card>

      {/* ステップ */}
      <div className="space-y-4">
        <Step number={1} title="API キーを登録する" icon={Key}>
          <p>
            App Store Manager では2種類の AI を使用します。それぞれの API キーを設定ページから登録してください。
          </p>
          <div className="rounded-md bg-muted p-3 space-y-2">
            <p className="font-medium text-foreground">OpenAI API キー（テキスト翻訳用）</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  OpenAI ダッシュボード
                </a>
                {" "}にログイン
              </li>
              <li>「Create new secret key」をクリック</li>
              <li>生成されたキー（sk-...）をコピー</li>
            </ol>
            <p className="text-xs mt-1">翻訳1回あたり約 $0.01〜0.05</p>
          </div>
          <div className="rounded-md bg-muted p-3 space-y-2">
            <p className="font-medium text-foreground">Gemini API キー（スクリーンショット翻訳用）</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Google AI Studio
                </a>
                {" "}にログイン
              </li>
              <li>「Create API key」をクリック</li>
              <li>生成されたキーをコピー</li>
            </ol>
            <p className="text-xs mt-1">スクリーンショット翻訳1枚あたり約 $0.10〜0.15</p>
          </div>
          <p>
            サイドバーの「<strong>設定</strong>」を開き、それぞれのキーを貼り付けて保存します。
            保存時にキーの有効性が自動検証されます。キーは暗号化して安全に保存されます。
          </p>
        </Step>

        <Step number={2} title="Apple API キーを登録する" icon={Link2}>
          <p>
            App Store Connect API を使うために、Apple の API キーを登録します。
          </p>
          <div className="rounded-md bg-muted p-3 space-y-2">
            <p className="font-medium text-foreground">API キーの取得方法:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <a href="https://appstoreconnect.apple.com/access/integrations/api" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  App Store Connect
                </a>
                {" "}にログイン
              </li>
              <li>「ユーザーとアクセス」→「インテグレーション」→「App Store Connect API」</li>
              <li>「+」ボタンでキーを生成（アクセス権限: Admin または App Manager）</li>
              <li>以下の3つをメモ:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li><strong>Issuer ID</strong> — ページ上部に表示される UUID</li>
                  <li><strong>Key ID</strong> — 生成したキーの ID</li>
                  <li><strong>.p8 ファイル</strong> — ダウンロードした秘密鍵（1回しかダウンロードできません）</li>
                </ul>
              </li>
            </ol>
          </div>
          <p>
            サイドバーの「<strong>Apple 接続</strong>」から「新規接続」をクリックし、
            上記の3つの情報を入力して登録します。
            登録後「<strong>テスト</strong>」ボタンで接続を確認できます。
          </p>
        </Step>

        <Step number={3} title="アプリを選んでプロジェクトを作成する" icon={AppWindow}>
          <p>
            サイドバーの「<strong>App 選択</strong>」をクリックします。
            登録した接続を選択すると、App Store Connect に登録されているアプリの一覧が表示されます。
          </p>
          <p>
            ローカライズしたいアプリの「<strong>プロジェクト作成</strong>」ボタンを押すと、
            言語選択ダイアログが表示されます。
          </p>
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="font-medium text-foreground">言語選択:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>ソース言語</strong> — 元文の言語（例: 日本語）</li>
              <li><strong>ターゲット言語</strong> — 翻訳先の言語を<strong>複数選択</strong>できます</li>
            </ul>
            <p className="mt-1">
              例: 日本語 → 英語 (US)、フランス語、ドイツ語を選んで「3言語で作成」を押すと、
              3つのプロジェクトが一括で作成されます。
            </p>
          </div>
        </Step>

        <Step number={4} title="ストアから現在値を取得する" icon={RefreshCw}>
          <p>
            プロジェクト一覧から編集したいプロジェクトをクリックすると、
            「<strong>テキスト</strong>」と「<strong>スクリーンショット</strong>」の2つのタブが表示されます。
          </p>
          <p>
            テキストタブの「<strong>ストアから取得</strong>」ボタンを押すと、
            App Store Connect に現在登録されているメタデータが読み込まれます。
          </p>
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="font-medium text-foreground">取得される内容:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>中央カラム</strong> — ターゲット言語の現在の登録値</li>
              <li><strong>左カラム</strong> — ソース言語の現在の登録値（元文が空のフィールドのみ自動入力）</li>
            </ul>
          </div>
        </Step>

        <Step number={5} title="元文を入力する" icon={PenLine}>
          <p>
            左カラム（元文）に、各項目のテキストを入力します。
          </p>
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="font-medium text-foreground">主な項目:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>名前</strong> — アプリ名（30文字以内）<span className="text-gray-500 text-xs ml-1">API反映不可</span></li>
              <li><strong>サブタイトル</strong> — サブタイトル（30文字以内）<span className="text-gray-500 text-xs ml-1">API反映不可</span></li>
              <li><strong>このバージョンの最新情報</strong> — アップデート内容（毎バージョン更新）</li>
              <li><strong>説明</strong> — 説明文（4000文字以内）</li>
              <li><strong>キーワード</strong> — 検索キーワード（100文字以内、カンマ区切り）</li>
              <li><strong>プロモーション用テキスト</strong> — プロモーション（170文字以内）<span className="text-green-600 text-xs ml-1">いつでも変更可</span></li>
            </ul>
          </div>
          <p>
            各フィールドの右下に<strong>文字数カウンター</strong>が表示されます。
            80%で黄色、上限超過で赤字になります。
          </p>
          <p>
            各フィールドには変更可能タイミングのバッジが表示されます:
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700">いつでも変更可</span>
            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700">バージョン準備中のみ</span>
            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-700">審査対象</span>
            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500">API反映不可</span>
          </div>
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="font-medium text-foreground">元文の自動共有:</p>
            <p>
              同じアプリで複数言語のプロジェクトを作成している場合、
              保存時に「<strong>他言語にも元文を共有</strong>」チェック（デフォルト ON）で
              他のプロジェクトにも元文が自動コピーされます。
            </p>
          </div>
        </Step>

        <Step number={6} title="AI でテキスト翻訳を生成する" icon={Sparkles}>
          <p>
            「<strong>翻訳を一括生成</strong>」ボタンを押すと、入力済みの全項目をまとめて
            AI（GPT-4o）がターゲット言語に翻訳します。
            <strong>保存を押さなくても、生成時に自動保存されます。</strong>
          </p>
          <p>
            各項目の右にある <Sparkles className="inline h-3 w-3" /> ボタンで、
            個別に再生成することもできます。
          </p>
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="font-medium text-foreground">AI 翻訳の特徴:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>直訳ではなく、App Store に適した自然な表現にローカライズ</li>
              <li>40以上の言語に対応</li>
              <li>項目ごとに最適化されたプロンプトを使用</li>
              <li>ブランド名はそのまま維持</li>
              <li>URL フィールドはそのままコピー（翻訳しない）</li>
            </ul>
          </div>
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="font-medium text-foreground">一括操作（複数言語）:</p>
            <p>
              プロジェクト一覧のアプリグループにある「<strong>一括AI生成</strong>」ボタンで、
              そのアプリの全言語プロジェクトの翻訳を一度に生成できます。
            </p>
          </div>
        </Step>

        <Step number={7} title="スクリーンショットを翻訳する" icon={Image}>
          <p>
            「<strong>スクリーンショット</strong>」タブに切り替えると、スクショのローカライズができます。
          </p>
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="font-medium text-foreground">使い方:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>ソース言語のスクリーンショット（PNG/JPEG）をアップロード</li>
              <li>デバイスタイプは画像サイズから自動検出</li>
              <li>必要に応じて「翻訳指示」に追加の指示を入力</li>
              <li>「<strong>スクショを一括生成</strong>」ボタンで AI がテキスト部分のみを翻訳</li>
            </ol>
          </div>
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="font-medium text-foreground">AI スクショ翻訳の特徴:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Gemini Image Pro でテキスト部分のみを置換</li>
              <li>レイアウト、色、アイコン、背景は一切変更しない</li>
              <li>出力画像は元画像と同じピクセルサイズに自動リサイズ</li>
              <li>ソースと生成画像を並べて比較可能</li>
              <li>個別の再生成やカスタム翻訳指示に対応</li>
            </ul>
          </div>
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="font-medium text-foreground">対応デバイスサイズ:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>iPhone 6.7&quot; (1290×2796)</li>
              <li>iPhone 6.5&quot; (1242×2688)</li>
              <li>iPhone 5.5&quot; (1242×2208)</li>
              <li>iPad Pro 12.9&quot; (2048×2732)</li>
              <li>iPad Pro 11&quot; (1668×2388)</li>
            </ul>
          </div>
          <p>
            生成画像は個別または「<strong>一括ダウンロード</strong>」ボタンでまとめてダウンロードできます。
          </p>
        </Step>

        <Step number={8} title="App Store Connect に反映する" icon={Upload}>
          <p>
            テキストタブで反映したい項目の「<strong>反映対象</strong>」チェックボックスをオンにします。
            「<strong>反映対象を全選択</strong>」ボタンで全項目をまとめて選択・解除できます。
          </p>
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 space-y-1">
            <p className="font-medium text-amber-700">名前・サブタイトルについて</p>
            <p className="text-amber-700">
              アプリ名とサブタイトルは App Store Connect API の制限により、API 経由での反映ができません。
              AI で翻訳した結果をコピーして、App Store Connect から直接設定してください。
            </p>
          </div>
          <p>
            現在値と提案値が異なる項目には
            <span className="inline-block mx-1 h-2 w-2 rounded-full bg-amber-500" />
            オレンジのドットが表示されるので、変更箇所が一目で分かります。
          </p>
          <p>
            「<strong>ストアに反映</strong>」ボタンを押すと確認ダイアログが表示されます。
            審査対象やバージョン準備中の項目が含まれる場合は警告が表示されます。
            反映中はローディングアニメーションが表示され、完了後にダイアログが自動で閉じます。
          </p>
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="font-medium text-foreground">反映の仕組み:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>ターゲット言語</strong> — 右カラムの提案値を反映</li>
              <li><strong>ソース言語</strong> — 左カラムの元文も同時に反映</li>
              <li>反映後、最新の登録値を自動で再取得します</li>
            </ul>
          </div>
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="font-medium text-foreground">変更可能なタイミング:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>いつでも</strong> — プロモーション用テキスト</li>
              <li><strong>バージョン準備中</strong> — 説明、キーワード、最新情報、URL 系</li>
              <li><strong>審査対象</strong> — プライバシーポリシーURL（バージョン提出準備中かつ審査通過が必要）</li>
              <li><strong>API反映不可</strong> — 名前、サブタイトル（App Store Connect から直接変更してください）</li>
            </ul>
            <p className="text-xs mt-1">
              「バージョン準備中」とは、App Store Connect で新しいバージョンを作成しビルドを追加した状態（提出準備中）のことです。
            </p>
          </div>
        </Step>

        <Step number={9} title="反映結果を確認する" icon={CheckCircle2}>
          <p>
            反映が完了すると、結果カードが表示されます（自動スクロール）。
          </p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>成功した項目は緑のチェックマーク</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="text-xs">en-US</Badge>
              <Badge variant="secondary" className="text-xs">ja</Badge>
              <span>どのロケールに反映したかバッジで表示</span>
            </div>
          </div>
          <p>
            エラーが発生した場合は詳細メッセージが表示されます。
            多くの場合、バージョンが提出準備中でないことが原因です。
          </p>
        </Step>
      </div>

      {/* 設定について */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">設定について</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            サイドバーの「<strong>設定</strong>」から以下の API キーを管理できます:
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            <li><strong>OpenAI API キー</strong> — テキストの翻訳に使用（GPT-4o）</li>
            <li><strong>Gemini API キー</strong> — スクリーンショットの翻訳に使用（Gemini Image Pro）</li>
          </ul>
          <p>
            API キーは暗号化して保存されます。保存時に自動で有効性が検証されます。
            利用料は各プロバイダーに直接課金され、App Store Manager には一切費用はかかりません。
          </p>
        </CardContent>
      </Card>

      {/* よくある質問 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">よくある質問</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-foreground">Q. このツールは無料ですか？</p>
            <p className="mt-1 text-muted-foreground">
              はい、完全無料です。AI の利用料のみ各プロバイダーに直接課金されます。
              テキスト翻訳は OpenAI（1回あたり約 $0.01〜0.05）、
              スクリーンショット翻訳は Gemini（1枚あたり約 $0.10〜0.15）です。
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Q. 対応言語は？</p>
            <p className="mt-1 text-muted-foreground">
              Apple App Store Connect がサポートする<strong>40以上のロケール</strong>に対応しています。
              英語（US/UK/AU/CA）、フランス語、ドイツ語、スペイン語、中国語（簡体字/繁体字）、韓国語、
              ポルトガル語、アラビア語、タイ語、ベトナム語など。
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Q. スクリーンショットの翻訳精度は？</p>
            <p className="mt-1 text-muted-foreground">
              Gemini Image Pro がテキスト部分のみを検出・置換します。
              レイアウトやデザインは維持されますが、完璧でない場合もあります。
              その場合は「翻訳指示」に具体的な指示（例: 「設定 → Settings」）を入力して再生成できます。
              生成画像は元画像と同じピクセルサイズに自動リサイズされます。
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Q. 反映できる項目とタイミングは？</p>
            <p className="mt-1 text-muted-foreground">
              <strong>プロモーション用テキスト</strong>はいつでも変更可能です（審査不要）。
              説明、キーワード、URL 系などは App Store Connect で新バージョンを作成し、ビルドを追加した状態（提出準備中）が必要です。
              <strong>名前とサブタイトル</strong>は API の制限により本ツールからの直接反映はできません。
              翻訳結果をコピーして App Store Connect から手動で設定してください。
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Q. 既存の内容を壊してしまわないか心配です</p>
            <p className="mt-1 text-muted-foreground">
              反映前に必ず確認ダイアログが表示されます。審査対象の項目には警告も出ます。
              「ストアから取得」で現在の登録内容を確認してから反映することをおすすめします。
              反映は選択した項目のみ更新されるため、未選択の項目には影響しません。
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Q. 複数のアプリ・複数の言語をまとめて管理できますか？</p>
            <p className="mt-1 text-muted-foreground">
              はい。アプリごとにプロジェクトを作成でき、1つのアプリに対して複数の言語を同時に設定できます。
              プロジェクト一覧ではアプリ別にグループ表示され、
              「一括AI生成」「一括反映」で全言語をまとめて処理できます。
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Q. Apple API キーの権限は何が必要ですか？</p>
            <p className="mt-1 text-muted-foreground">
              <strong>Admin</strong> または <strong>App Manager</strong> のアクセス権限が必要です。
              読み取り専用の権限では反映機能が使えません。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
