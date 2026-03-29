# PROJECT_SPEC.md

## 1. プロジェクト概要

### 1.1 サービス名
仮称: App Store Localization Manager

### 1.2 コンセプト
App Store Connect に提出するメタデータを、AIで一括ローカライズし、既存内容との比較・編集・反映まで行える管理ツール。

### 1.3 解決したい課題

App Store向けローカライズ作業では、以下の非効率が起きやすい。

- 各項目を個別に翻訳する必要がある
- 英訳しても App Store向けとして自然か分かりにくい
- 文字数や訴求がずれる
- App Store Connect へ毎回コピペが必要
- 既存文面との差分管理がしづらい

本サービスはこの作業を、**入力 → 生成 → 比較 → 編集 → 反映** の1フローに統合する。

---

## 2. 対象ユーザー

### 2.1 メインターゲット
- 日本の個人開発者
- iOSアプリ運営者
- 小規模チーム

### 2.2 初期ユースケース
- 日本語で登録しているアプリを英語化したい
- 新バージョンの What’s New を英語にしたい
- 英語説明文をもっと自然なASO寄り文面に整えたい
- 現在の登録文面を壊さず差し替えたい

---

## 3. スコープ

### 3.1 MVP対象

#### Apple連携
- App Store Connect API キー登録
- JWT生成
- App一覧取得
- `appInfoLocalizations` 取得
- `appStoreVersionLocalizations` 取得
- `appInfoLocalizations` 更新
- `appStoreVersionLocalizations` 更新

#### ローカライズ
- 元言語テキスト入力
- AIによる英語文面生成
- 項目別生成
- 一括再生成
- 手動編集
- 保存

#### UI/運用
- 元文 / 現在値 / 新候補 の比較表示
- 更新対象項目の選択
- 反映実行
- 成功 / 失敗ログ表示

### 3.2 MVP対象外
- 画像アップロード
- review submission 実行
- Custom Product Page 作成
- 多人数コラボ
- Android対応
- キーワード検索ボリューム分析
- ASO順位トラッキング

---

## 4. Apple API前提

### 4.1 認証
- App Store Connect API キーをユーザーが登録
- サーバー側で JWT を生成して Apple API を呼び出す

### 4.2 ローカライズ管理対象

#### `appInfoLocalizations`
- name
- subtitle
- privacyPolicyUrl

#### `appStoreVersionLocalizations`
- description
- keywords
- promotionalText
- supportUrl
- marketingUrl
- whatsNew

### 4.3 将来拡張可能な対象
- `appScreenshotSets`
- `appScreenshots`
- `appPreviewSets`
- `appPreviews`
- `reviewSubmissions`
- `customProductPages`

---

## 5. 機能要件

### 5.1 認証・ユーザー管理

#### 要件
- メールアドレスでログインできる
- ログイン済みユーザーのみ Apple 連携機能を使える

#### 補足
- Supabase Auth を利用
- MVPでは1ユーザー = 1ワークスペース

---

### 5.2 Apple APIキー管理

#### 入力項目
- Issuer ID
- Key ID
- Private Key (.p8 の内容)
- 任意の接続名

#### 要件
- APIキーを登録できる
- 登録時に接続テストできる
- 秘密鍵は暗号化して保存する
- UI上では再表示しない
- 接続失敗時は理由を表示する

#### 成功条件
- Apple API への疎通確認が通ること
- App一覧取得が可能であること

---

### 5.3 App選択

#### 要件
- Apple APIからアプリ一覧を取得
- ユーザーが対象アプリを選択
- アプリごとにローカライズプロジェクトを作成

#### 保存項目
- Apple App ID
- Bundle ID
- App Name
- 選択ロケール
- 対象バージョンID

---

### 5.4 既存メタデータ取得

#### 要件
- 対象アプリの `appInfoLocalizations` を取得
- 対象バージョンの `appStoreVersionLocalizations` を取得
- 現在の登録値を一覧表示
- localeごとに既存値を保持

#### UI表示
- 現在の英語登録内容
- 日本語元文
- 新規提案文

---

### 5.5 元文入力

#### 入力対象
- app_name
- subtitle
- description
- keywords
- promotional_text
- support_url
- marketing_url
- whats_new
- privacy_policy_url

#### 要件
- 項目ごとに個別入力できる
- 一括保存できる
- 未入力項目があっても保存できる

---

### 5.6 AI生成

#### 要件
- 日本語元文から英語文面を生成
- App Store向けの自然な訴求文に整える
- 項目ごとに生成ルールを変える
- 個別再生成できる
- 一括再生成できる

#### 項目別生成方針
- app_name: ブランド感重視、短く
- subtitle: 価値が一目で伝わるように
- description: 読みやすく構造化
- keywords: カンマ区切りで簡潔に
- promotional_text: 新規性や訴求点を短く強く
- whats_new: アップデート内容が自然に伝わるように

#### AIプロンプト方針
- 直訳しない
- App Store掲載文として自然な英語にする
- 誇大表現を避ける
- アプリのカテゴリと想定ユーザーを踏まえる
- 既存ブランド名がある場合は維持する

---

### 5.7 比較・編集

#### 要件
- 3カラムで比較表示する

#### 表示カラム
1. 元文
2. 現在の App Store Connect 登録値
3. 新規提案値

#### 操作
- 提案値を直接編集できる
- 現在値を複製できる
- 差分を視覚表示する
- 項目単位で採用・非採用を切り替えられる

---

### 5.8 App Store Connect反映

#### 要件
- 採用した項目のみ更新できる
- appInfo系とversion系を適切に分けて更新する
- 更新前に確認ダイアログを出す
- 更新結果を項目別に表示する

#### 成功時
- 更新成功メッセージ
- Appleの最新値を再取得して再表示

#### 失敗時
- 項目名
- ステータスコード
- エラーメッセージ
- 再試行導線

---

### 5.9 プロジェクト保存

#### 要件
- アプリごとに複数の作業履歴を保存できる
- 最新版と前回案を比較できる
- 生成日時を保持する

---

## 6. 非機能要件

### 6.1 セキュリティ
- Apple秘密鍵は暗号化保存
- サーバー側のみで JWT生成
- クライアントに秘密鍵を返さない
- 更新系処理は認証必須
- API呼び出しログを保持

### 6.2 パフォーマンス
- App一覧取得: 5秒以内目標
- ローカライズ生成: 15秒以内目標
- 更新反映: 10秒以内目標

### 6.3 可用性
- Apple APIエラー時も再試行しやすいUIにする
- AI生成失敗時は編集画面を維持する

---

## 7. データ設計

### 7.1 users
- id
- email
- created_at

### 7.2 apple_connections
- id
- user_id
- connection_name
- issuer_id
- key_id
- private_key_encrypted
- created_at
- updated_at

### 7.3 apps
- id
- user_id
- apple_connection_id
- apple_app_id
- bundle_id
- app_name
- platform
- created_at

### 7.4 projects
- id
- user_id
- app_id
- source_locale
- target_locale
- source_version_id
- status
- created_at
- updated_at

### 7.5 project_fields
- id
- project_id
- field_key
- source_value
- current_remote_value
- proposed_value
- final_value
- created_at
- updated_at

### 7.6 sync_logs
- id
- project_id
- field_key
- action_type
- request_payload
- response_payload
- status
- created_at

---

## 8. field_key 定義

使用する `field_key` は以下。

- app_name
- subtitle
- privacy_policy_url
- description
- keywords
- promotional_text
- support_url
- marketing_url
- whats_new

---

## 9. 画面仕様

### 9.1 ログイン画面
- メールログイン
- サインアップ

### 9.2 Apple接続画面
- APIキー登録フォーム
- 接続テストボタン
- 接続一覧

### 9.3 App選択画面
- Appleアプリ一覧
- 検索
- 選択してプロジェクト作成

### 9.4 プロジェクト一覧
- 対象アプリ名
- 対象ロケール
- 更新日時
- ステータス

### 9.5 編集画面
- 左: 元文
- 中: 現在の登録値
- 右: AI提案値
- 上部: 一括生成 / 一括保存 / 一括反映
- 各項目: 個別生成 / 編集 / 採用

### 9.6 反映結果画面
- 更新成功件数
- 失敗件数
- 項目別結果
- 再試行ボタン

---

## 10. API設計（自サービス側）

### 10.1 認証系
- `POST /api/auth/login`
- `POST /api/auth/logout`

### 10.2 Apple接続系
- `POST /api/apple/connections`
- `GET /api/apple/connections`
- `POST /api/apple/connections/:id/test`

### 10.3 App取得系
- `GET /api/apple/apps`
- `GET /api/apple/apps/:id/localizations`

### 10.4 プロジェクト系
- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`

### 10.5 生成系
- `POST /api/projects/:id/generate`
- `POST /api/projects/:id/generate-field`

### 10.6 反映系
- `POST /api/projects/:id/push`

---

## 11. Apple連携実装メモ

### 11.1 `appInfoLocalizations` で扱う項目
- name
- subtitle
- privacyPolicyUrl

### 11.2 `appStoreVersionLocalizations` で扱う項目
- description
- keywords
- promotionalText
- supportUrl
- marketingUrl
- whatsNew

### 11.3 locale 管理
- 内部では locale を厳密管理する
- 初期MVPでは `ja` を元言語、`en-US` を対象ロケールとする

---

## 12. エラーハンドリング

### 12.1 想定エラー
- APIキー不正
- JWT生成失敗
- Apple権限不足
- 対象ローカライズ未作成
- バージョン未取得
- Apple側バリデーションエラー
- AI応答失敗

### 12.2 表示方針
- ユーザー向けにわかりやすいメッセージ
- 開発用には詳細ログ保存
- どの項目で失敗したか明示

---

## 13. 開発フェーズ

### Phase 1
- ログイン
- Apple APIキー登録
- App一覧取得
- プロジェクト作成
- 現在値取得

### Phase 2
- 元文入力
- AI生成
- 編集UI
- 保存

### Phase 3
- App Store Connect反映
- 更新ログ
- 差分表示

### Phase 4
- UI改善
- エラー改善
- 英語以外のロケール追加

---

## 14. 受け入れ条件

以下を満たしたらMVP完成とみなす。

1. ユーザーが Apple APIキーを登録できる
2. App一覧を取得できる
3. 対象アプリの既存ローカライズを取得できる
4. 日本語元文から英語提案文を生成できる
5. 提案文を編集できる
6. 編集後の値を App Store Connect に反映できる
7. 成功 / 失敗ログを確認できる

---

## 15. 将来拡張メモ

将来は以下を追加可能。

- 複数言語同時生成
- `appScreenshotSets` 作成
- `appScreenshots` アップロード
- `appPreviewSets` 作成
- `reviewSubmissions` 実行
- `Custom Product Pages` 対応
- ASO向け改善提案
- 変更履歴の詳細比較
- チーム共有
