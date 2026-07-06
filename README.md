# 受注取り込みAI Agent デモ

商品販売会社向け「受注取り込みAI Agent」の**営業デモ**アプリです。
FAX・PDF・メール・Slack/Teams・EDI などバラバラのチャネルで届く受注を、
AIが「読み取り → 構造化 → 分類 → 自動入力／担当者振り分け」する一連の業務体験を、クリック操作で見せられます。

> ⚠️ 本番システムではありません。OCR・メール送信・基幹システム連携はすべて**モック**です（要件定義書 §1.2）。

## 本番URL（公開済み・パスワード保護）

- **URL:** <https://order-intake-ai-demo.vercel.app>
- **共有パスワード:** Vercel の環境変数 `APP_PASSWORD` に設定（商談相手に URL とセットで伝える。この README には書かない）

Vercel（`y-aida-3534`）にデプロイ済み。共有パスワードでログインした人だけ閲覧できます（署名Cookie方式）。

## 起動方法（ローカル）

```bash
npm install      # 初回のみ（導入済み）
npm run dev      # → http://localhost:3300
```

ローカルは `.env.local` の `APP_PASSWORD` でログインします。ブラウザで <http://localhost:3300> を開きます。

## 再デプロイ・パスワード変更

**mainブランチにpushすると自動で本番デプロイされる**（GitHub連携済み、2026-07-06〜）。
main以外のブランチをpushするとプレビューデプロイ（お試し用URL）が作られる。
コードを修正する人は、動作確認をブランチのプレビューで行い、問題なければmainへ反映すればよい。

環境変数（`APP_PASSWORD` / `AUTH_SECRET` など、一覧は `.env.example`）は **Vercel ダッシュボードの
Project → Settings → Environment Variables に登録済み**（Production・Preview 両方）。

CLIから手動で本番デプロイしたい場合はこれでもOK：

```bash
npx vercel deploy --prod --yes
```

> 補足: `vercel env add` / `vercel env pull` はこの環境ではCLI経由だと値が空になる不具合があるため、
> 環境変数の**登録・変更はダッシュボードで行う**運用にしている（デプロイ自体はCLIでOK）。

パスワードを変えたいときは、ダッシュボードで `APP_PASSWORD` の値を書き換えるだけ。
再デプロイ不要で次のアクセスから新しいパスワードが有効になる。

## 実チャネル取り込み（Chatwork / Slack / メール）

受注一覧の「取り込み:」ボタン群から、**本物のチャネル**の直近メッセージをAI（claude-opus-4-8）で
受注抽出→分類して一覧に追加できる。分類・返信ドラフト生成は既存デモと同じルール。
同じメッセージの二重取り込みは自動スキップ。共通エンジンは `lib/ingest-server.ts`。

必要な環境変数（ローカル=.env.local、本番=Vercelダッシュボード。共通で `ANTHROPIC_API_KEY` も必須）:

| チャネル | 環境変数 | 取得方法 |
|---|---|---|
| Chatwork | `CHATWORK_API_TOKEN` / `CHATWORK_ROOM_ID` | Chatwork設定→API。ルームIDはルームURLの `#!rid` 以降 |
| Slack | `SLACK_BOT_TOKEN` / `SLACK_CHANNEL_ID` | api.slack.com/apps でApp作成→Bot Token Scopes に `channels:history`+`users:read`→Install→xoxb-トークン。Botを対象チャンネルに `/invite`。チャンネルIDはチャンネル詳細の最下部 |
| メール(Gmail) | `GMAIL_ADDRESS` / `GMAIL_APP_PASSWORD` | Google 2段階認証を有効化→ myaccount.google.com/apppasswords で16桁のアプリパスワードを発行（IMAP接続に使用） |

未設定のチャネルはボタンを押すと「環境変数◯◯が未設定です」と案内が出るだけで、他チャネルには影響しない。

## 画面（要件定義書の5画面）

| 画面 | URL | 内容 |
|---|---|---|
| SCR-001 受注一覧 | `/orders` | KPI・フィルター・AI一括読み取り演出・全案件一覧 |
| SCR-002 AI読み取り | `/orders/:id/read` | 元データと抽出結果を左右で比較・信頼度・不足項目 |
| SCR-003 基幹システム自動入力 | `/orders/:id/core-system-input` | ERP風フォームへAIが順番に自動入力→受注番号採番 |
| SCR-004 例外案件・返信ドラフト | `/orders/:id/exception` | A/B/C/D別の対応・相手先への確認文面の編集/送信 |
| SCR-005 月次ダッシュボード | `/dashboard` | KPI・グラフ・自社/相手先対応待ちリスト |

## おすすめのデモ手順（約3〜4分）

1. **受注一覧**（`/orders`）で「🤖 AIで一括読み取り」を押す
   → 8件の受注がAI読み取り中→分類され、KPI・受注金額が反映される
2. **正常案件**（株式会社東京ストア）の行を開く → 抽出結果を確認 → 「基幹システムへ入力」
   → 自動入力アニメーション → **受注番号が採番**される
3. **相手先不備（C）**（西日本小売）を開く → AIが作った確認依頼文面を編集 → 「送信する」
   → ステータスが「相手先返信待ち」に変わる
4. **一部虫食い（B）／バリデーションエラー（D）** は自社で補完・修正すると自動処理を再開できる
5. **月次ダッシュボード**（`/dashboard`）で受注金額・自動処理率・対応待ちを確認
6. 左下「↺ デモをリセット」でいつでも最初の状態に戻せます

## 分類ロジック（要件定義書 §5）

| 分類 | 例 | 対応 |
|---|---|---|
| 正常 | 必須項目が揃い信頼度≥0.85 | AIが基幹システムへ自動入力 |
| A 読み取り失敗 | FAX不鮮明で判読不可 | 自社担当が手入力 |
| B 一部虫食い | 一部項目のみ不明 | 自社担当が補完 |
| C 相手先不備 | 受注書に必須情報が無い | AIが相手先へ確認依頼を生成・送信 |
| D バリデーションエラー | 商品コードがマスタに無い等 | 自社担当が修正 |

## 技術構成

- Next.js 14（App Router）/ React 18 / TypeScript
- Tailwind CSS
- Zustand（デモ状態のクライアント管理）
- チャート・アニメーションは外部ライブラリ非依存の自前実装

## ディレクトリ

```
app/            画面（各ルート）
components/      共通UI（サイドバー・バッジ・KPI・元データプレビュー）
lib/            types / data(サンプル8件) / store / 表示ヘルパ / 基幹入力ヘルパ
```

サンプルデータは `lib/data.ts` に集約。取引先名・商品・金額などを差し替えれば、
商談相手に合わせたデモにカスタマイズできます。
