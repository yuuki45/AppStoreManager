# App Store Localization Manager

App Store Connect に提出するメタデータを、AIで一括ローカライズし、そのまま App Store Connect に反映できるWebアプリ。

## 目的

個人開発者や小規模チームが App Store Connect に登録する以下の提出テキストを、  
**翻訳 + App Store向け最適化 + 反映** まで一気通貫で行えるようにする。

- App Name
- Subtitle
- Description
- Keywords
- Promotional Text
- Support URL
- Marketing URL
- What’s New
- Privacy Policy URL

App Store Connect API の構造に合わせて、以下2系統で管理する。

- `appInfoLocalizations`
- `appStoreVersionLocalizations`

---

## 想定ユーザー

- iOSアプリを公開している個人開発者
- 少人数の開発チーム
- App Store向け英語対応を手早く行いたい人
- ChatGPTやClaudeに毎回コピペする作業を面倒に感じている人
- App Store Connect の項目別管理をまとめて効率化したい人

---

## MVPで提供する価値

1. 日本語の元原稿を入力するだけで、英語版テキストを一括生成できる
2. App Store向け文体に整えられる
3. App Store Connect から既存文面を読み込める
4. 編集後、そのまま App Store Connect へ反映できる
5. 現在の登録内容と新しい候補文面を比較できる

---

## MVPスコープ

### 対応するApple連携範囲

- App Store Connect API キー登録
- JWT生成による認証
- App一覧取得
- App選択
- 対象ロケール選択
- `appInfoLocalizations`
  - name
  - subtitle
  - privacyPolicyUrl
- `appStoreVersionLocalizations`
  - description
  - keywords
  - promotionalText
  - supportUrl
  - marketingUrl
  - whatsNew

### MVPではやらないこと

- スクリーンショット画像そのものの翻訳
- App Preview動画アップロード
- review submission の自動送信
- Custom Product Pages の作成
- 価格変更
- 配信地域変更
- TestFlight 管理
- レビュー返信
- 複数人コラボ編集

---

## 推奨技術スタック

- Frontend: Next.js
- UI: Tailwind CSS + shadcn/ui
- Backend: Next.js Route Handlers or Server Actions
- DB: Supabase
- Auth: Supabase Auth
- AI: OpenAI API
- Billing: Stripe
- Secret management: サーバー環境変数 or 安全な暗号化ストレージ
- Apple integration: App Store Connect API

---

## 主要画面

1. ログイン画面
2. APIキー登録画面
3. App選択画面
4. プロジェクト一覧画面
5. ローカライズ編集画面
6. App Store Connect比較・反映画面

---

## 開発の考え方

このサービスは「翻訳ツール」ではなく、  
**App Store提出実務を時短する運用ツール** として設計する。

### 差別化ポイント

- App Store の項目ごとに生成できる
- 元文とローカライズ文を横並び比較できる
- 既存の App Store Connect 登録内容を読み込める
- 手修正後にそのまま反映できる

---

## 将来拡張

- 複数ロケール対応
- スクショ文言生成
- スクリーンショットセット作成
- App Preview セット作成
- review submissions 対応
- Custom Product Pages 作成支援
- ASO向けキーワード改善提案
- 各国別トーン調整
- 変更履歴管理
- チーム共有

---

## 開発開始時の優先順位

### Phase 1
- ログイン
- Apple APIキー登録
- App一覧取得
- App選択
- 既存ローカライズ取得

### Phase 2
- 元文入力
- AI生成
- 比較UI
- 手動編集
- 保存

### Phase 3
- App Store Connect反映
- 更新ログ
- エラー表示改善

### Phase 4
- 多言語化
- UI改善
- 拡張機能追加

---

## 一言で言うと

**App Store提出文面の英語化・ローカライズを、生成から反映まで一括で行うツール**
