<p align="center">
  <img src="./assets/logo.svg" alt="Token Usage Logo" width="88" height="88" />
</p>

<h1 align="center">Token Usage</h1>

<p align="center">
  <strong><a href="https://antigravity.google">Antigravity</a> 向けのリアルタイム Token・コンテキスト使用率・コスト試算・セッション健全性アナリティクス — 100% ローカル、依存関係ゼロ、プライバシー最優先。</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> ·
  <a href="./README.zh-CN.md">简体中文</a> ·
  <strong>日本語</strong> ·
  <a href="./README.ko.md">한국어</a> ·
  <a href="./README.es.md">Español</a>
</p>

<p align="center">
  <a href="./plugin.json"><img src="https://img.shields.io/badge/version-1.1.0-blue.svg" alt="Version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="MIT License" /></a>
  <a href="./sidecars/token_panel/package.json"><img src="https://img.shields.io/badge/dependencies-zero-brightgreen.svg" alt="Zero Dependencies" /></a>
  <a href="#-プライバシーとセキュリティ"><img src="https://img.shields.io/badge/privacy-100%25%20local-emerald.svg" alt="100% Local" /></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg" alt="Cross-Platform" />
</p>

---

## ⚡ クイックインストール（推奨：Agent に一言で完了）

ターミナルを開いたり、手動でクローン・コピーしたりする必要はありません。**以下の一文を Antigravity のチャットにそのまま貼り付けて送信するだけ**で、Agent がインストールから検証、有効化の案内まで自動で行います：

> ```text
> https://github.com/RanFeng/token-usage の Antigravity プラグインを ~/.gemini/config/plugins/token-usage にインストールしてください（sync.sh があれば使用）。インストール内容を検証し、Token Usage パネルを有効化して開くためのリンクを教えてください。
> ```

**Agent が自動で実行すること：**
1. `https://github.com/RanFeng/token-usage` をローカルにクローンします。
2. プラグイン構成ファイル（`plugin.json`、`assets/`、`sidecars/`、`skills/`）を `~/.gemini/config/plugins/token-usage` に同期します。
3. 配置を検証し、**Customizations / Plugins** 画面への直接リンクを提示します。ワンクリックで **Token Usage** を有効化できます。

### 🔄 一言で最新版へアップデート

新しいバージョンが公開されたら、次のように伝えるだけです：

> ```text
> token-usage プラグインを https://github.com/RanFeng/token-usage の最新版に更新し、~/.gemini/config/plugins/token-usage へ同期してください。
> ```

<details>
<summary><strong>🛠️ 手動インストール（CLI）を行う場合はクリックして展開</strong></summary>

#### 前提環境
- **Antigravity** インストール済み
- **Node.js 18+**（ゼロ依存 Sidecar Web パネルの起動に使用）
- **Python 3.8+**（チャット Skill および CLI スクリプトの実行に使用）

#### macOS / Linux（`sync.sh` の利用を推奨）
```bash
git clone https://github.com/RanFeng/token-usage.git
cd token-usage
./sync.sh
```
またはプラグインディレクトリへ直接クローン：
```bash
git clone https://github.com/RanFeng/token-usage.git ~/.gemini/config/plugins/token-usage
```

#### Windows (PowerShell)
```powershell
git clone https://github.com/RanFeng/token-usage.git "$env:USERPROFILE\.gemini\config\plugins\token-usage"
```

#### プラグインの有効化
1. **Antigravity** → **Customizations / Plugins** を開きます。
2. **Token Usage** をオンにします（再起動不要で即時反映）。
3. サイドバーの補助パネル（**Aux Pane**）から **Token Usage** を開きます。

</details>

---

## 📖 詳しい使い方

Token Usage は **3 つの方法** で利用できます。

### 1. リアルタイム Sidecar パネル（Aux Pane）

Antigravity の補助サイドバーで **Token Usage** パネルを開くと、リアルタイムな可視化分析を確認できます。

#### 📊 Current タブ — 現在のセッションを詳細分析
- **コンテキストウィンドウ・ゲージ**：使用済み / 残り / 上限トークン数、累計 `input`・`cache_read`・`output` トークン、API 換算コスト、キャッシュ節約額をリアルタイム表示。
- **コンテキスト推移グラフ**：ターンごとのコンテキスト増加を可視化し、**Compact（圧縮）ポイント**を自動でハイライト表示。
- **リアルタイム健全性診断**：次の 4 つの異常を自動検出し警告表示（個別非表示可）：
  - Compact 接近（`≥80%` 警告 / `≥90%` 危険）
  - 連続エラーによる空回りループ
  - 単一ターンでのトークン急増
  - プロンプトキャッシュヒット率の低下
- **100% ローカル Lite DLP 機密情報検出**：7 種類の高信頼な認証情報パターン（`API Key`、`AWS Key`、`GitHub Token`、`Google Key`、`JWT`、秘密鍵、`DB URI`）をローカルでスキャン。**生の秘密情報は一切保存・表示せず**、マスク済みスニペットのみ表示し、該当ターンへワンクリックで移動できます。
- **ターン別内訳 & JSON ツリービューア**：
  - 各ターンを **モデル思考時間 vs ツール実行時間** に分解し、モデル・ツール別の内訳を表示。
  - キーワード検索やフィルタ（すべて / 高消費 / エラーあり / メディアあり）に対応。
  - 検索・折りたたみ・コピー可能な **JSON ツリービューア**でツールの引数と出力を確認可能。
- **匿名化セッション診断カード（PNG）**：2× 高解像度の診断画像（コンテキスト曲線、トークン、キャッシュ率、モデル/ツール統計）をコピーまたは保存。**プロンプト本文、ファイルパス、プロジェクト名、機密情報は一切含まれません**。

#### 📈 Overview タブ — 12 項目以上の全体・トレンド分析
- **サブスクリプション ROI ダッシュボード**：プラン（`$20 Pro` / `$100 Ultra` / `$200 Ultra` またはカスタム料金・月次/週次サイクル・リセット日）を設定し、ROI 倍率、月末消費予測、キャッシュ節約額を確認。
- **アクティビティ & コーディング傾向**：90 日間 GitHub 風ヒートマップ、直近 14 日間棒グラフ、24 時間コーディングタイプ診断、平日/週末比較、全体 Top 10 モデル & ツール、コンテキスト健全性スコア、ローカル実績バッジ、殿堂入りセッション。
- **プロジェクト別コスト帰属**：ツール操作パスからアクティブなワークスペース Top 10 を自動推定。
- **ローカル Multi-Tool レーダー**：**Claude Code**、**Codex**、**Cursor**、**Gemini CLI** のローカルセッション数を読み取り専用で軽量検出。
- **2× Retina レポート共有カード（PNG）**：ダーク/ライトテーマや表示モジュールをカスタマイズして、クリップボードへコピーまたは `~/Downloads` へ保存可能。

#### 🕒 History タブ & ツールバー機能
- **History タブ**：過去の Antigravity セッションを一覧表示し、素早く切り替え。
- **言語切替（`EN / 中`）**：ワンクリックでパネル UI の言語を切り替え。
- **設定モーダル**：
  - 通貨切替（`USD ($)` / `CNY (¥)`、為替レート編集可）。
  - `Pro`・`Flash`・`Claude`・`GPT/Codex` 各モデル系統の 100 万トークン単価をカスタマイズ。
  - GitHub Releases からのアップデート確認。
- **エクスポートモーダル**：
  - 期間別（今月 / 直近 30 日 / 全期間）の明細を UTF-8 BOM 付き **CSV** または **JSON** で書き出し。
  - 現在のセッションの Markdown レポートまたは匿名化サマリーを `~/Downloads` へ直接保存。

---

### 2. チャット内 Skill（`/token-usage` または自然言語）

プラグイン有効化後、内蔵の `token-usage` Skill が自動ロードされます。`/token-usage` と入力するか、自然な言葉で質問してください：

- *「直近 10 セッションのトークン消費サマリーを出して」*
- *「現在のセッションのターン別トークン内訳を見せて」*
- *「モデル別の合計トークン消費量を集計して」*
- *「トークン消費が多い上位 5 セッションを教えて」*

---

### 3. スタンドアロン CLI スクリプト（`token_stats.py`）

任意のターミナルから直接ローカルログを集計できます（Python 3 標準ライブラリのみで動作）：

```bash
# 1. 最近のセッション一覧サマリー（--sort: recent | tokens, --limit: 既定 15）
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py summary --limit 15 --sort recent

# 2. 単一セッションのターン別内訳（"latest"、8 文字 ID プレフィックス、または完全な UUID を指定）
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py session latest

# 3. 全体およびモデル別の合計トークン数
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py models
```

> **トークン定義**：`input` = キャッシュ外の入力トークン、`cache_read` = プロンプトキャッシュヒット分、`output` = モデル出力トークン（既定の `total` は `input + output`）。

---

## 🔒 プライバシーとセキュリティ

- **100% ローカル & 読み取り専用**：ローカルのログファイル（`~/.gemini/antigravity/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`）を直接読み取るのみで、アプリ本体の改変や外部送信は一切行いません。
- **外部依存ゼロ**：Node.js ESM 標準機能、バニラ HTML/CSS/Canvas/JS、Python 標準ライブラリのみで構築。
- **安全な共有設計**：セッション診断 PNG からはプロンプト内容、パス、プロジェクト名、認証情報が完全に除外されます。
- **ネットワークの透明性**：テレメトリ送信ゼロ。任意の更新確認機能のみ GitHub Releases 公開 API を参照します（7 日間ローカルキャッシュ）。

---

## ❓ よくある質問（FAQ）

<details>
<summary><strong>インストール後に Token Usage サイドパネルが表示されません</strong></summary>

1. `~/.gemini/config/plugins/token-usage/plugin.json` が存在することを確認してください。
2. Antigravity → **Customizations / Plugins** で **Token Usage** が有効になっているか確認してください。
3. Sidecar サーバー起動のため、システム `PATH` で `node`（Node.js 18+）が利用可能か確認してください。
</details>

<details>
<summary><strong>推定コストが実際の請求額と異なるのはなぜですか？</strong></summary>

パネル内のコストは各モデル系統の既定 100 万トークン単価に基づく API 換算値です。**設定**モーダルからモデル単価、通貨・為替レート、サブスクリプション料金と請求サイクルをいつでも調整できます。
</details>

<details>
<summary><strong>アンインストール方法は？</strong></summary>

Antigravity に *「token-usage プラグインをアンインストールして」* と伝えるか、**Customizations / Plugins** から無効化/削除、または `~/.gemini/config/plugins/token-usage` フォルダを削除してください。
</details>

---

## 📚 ドキュメント・リンク

- [プロジェクト構成マップ (`.ai_map.md`)](./.ai_map.md)
- [GitHub リポジトリ](https://github.com/RanFeng/token-usage)
- [Discussions & ロードマップ](https://github.com/RanFeng/token-usage/discussions)
