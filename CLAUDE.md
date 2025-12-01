# パワースポット記事自動生成システム - プロジェクトガイド

最終更新: 2024年11月25日

## 📋 プロジェクト概要

このプロジェクトは、SEO最適化されたパワースポット記事を生成し、WordPressに自動投稿するための統合システムです。

### ビジネスモデル
```
SEO集客（パワースポット記事）
  ↓
無料診断アプリ（縁プロファイル診断）
  ↓
有料詳細レポート（¥2,980）
```

### 主な機能
- ✅ 142件のパワースポットデータベース管理
- ✅ エネルギー値順での記事生成
- ✅ 4,500-5,000文字の高品質記事作成
- ✅ HTMLプレビュー生成
- ✅ WordPress自動投稿（スタイル付き）
- ✅ 投稿確認システム

### 技術スタック
- **言語**: JavaScript (Node.js), Python, Bash
- **CMS**: WordPress REST API
- **記事生成**: Claude Code + カスタムインストラクション
- **データ**: JSON形式のパワースポットデータベース

---

## 🗂️ ディレクトリ構造

```
powerspot-content-generator/
├── .claude/
│   ├── settings.json                    # Claude Code設定（フック設定）
│   ├── commands/
│   │   └── suggest-claude-md.md         # CLAUDE.md更新提案コマンド
│   └── last-claude-md-update            # 最終更新チェック用
│
├── instructions/                         # 記事生成インストラクション
│   ├── ARTICLE_GENERATION_MASTER.md     # ★メインインストラクション
│   ├── DECISIONS.md                     # 設計判断の記録
│   ├── writing-guidelines.md            # 文章スタイルガイド
│   ├── quality-checklist.md             # 品質チェックリスト
│   └── example-high-quality.md          # 高品質記事の例
│
├── articles/                            # 生成された記事
│   ├── 伊勢神宮.md                      # サンプル記事
│   ├── 伊勢神宮-preview.html            # HTMLプレビュー
│   └── ...
│
├── bin/                                 # ユーティリティスクリプト
│   └── suggest-claude-md-hook.sh        # CLAUDE.md更新提案フック
│
├── 04_powerspot_database.json           # パワースポットデータベース（142件）
│
├── generate-from-db.js                  # データベースから記事情報取得
├── generate-html-preview.js             # HTMLプレビュー生成
├── post-from-markdown-styled.js         # WordPress投稿（スタイル付き）
├── check-post.js                        # 投稿確認スクリプト
│
├── read-powerspot-db.js                 # データベース読み込み
├── fix_json_encoding.py                 # JSON文字化け修正（Python）
│
├── .env                                 # 環境変数（WordPress認証情報）
├── .env.example                         # 環境変数テンプレート
├── package.json                         # Node.js依存関係
├── README.md                            # プロジェクト説明
├── CHANGELOG.md                         # 変更履歴
└── CLAUDE.md                            # このファイル
```

---

## 🚀 クイックスタート

### 1. 環境セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してWordPress認証情報を設定
```

### 2. 最初の記事生成

```bash
# データベースからトップのパワースポットを確認
node generate-from-db.js 1 0

# 出力されたプロンプトをClaude Codeに貼り付けて記事を生成
# または、instructionsを読み込んで記事を作成
```

### 3. プレビュー＆投稿

```bash
# HTMLプレビュー生成
node generate-html-preview.js articles/伊勢神宮.md

# ブラウザでプレビューを確認
start articles/伊勢神宮-preview.html  # Windows
# open articles/伊勢神宮-preview.html  # Mac

# WordPress下書き投稿
node post-from-markdown-styled.js articles/伊勢神宮.md

# 投稿を確認
node check-post.js 2358
```

---

## 📜 使用可能なスクリプト

### 記事生成関連

#### `generate-from-db.js`
データベースからパワースポット情報を取得し、記事生成プロンプトを表示

```bash
node generate-from-db.js [件数] [開始位置]

# 例：1番目（最もエネルギー値が高い）のパワースポットを確認
node generate-from-db.js 1 0

# 例：2番目から5件を確認
node generate-from-db.js 5 1
```

**出力**:
- パワースポット名、地域、エネルギー値
- 記事生成用プロンプト（Claude Codeに貼り付け）

#### `read-powerspot-db.js`
データベース全体を分析・表示

```bash
node read-powerspot-db.js
```

**出力**:
- 総パワースポット数
- 最初の10件
- 地域別の件数
- クリーンなJSONファイル生成

### プレビュー＆公開

#### `generate-html-preview.js`
Markdown記事からスタイル付きHTMLプレビューを生成

```bash
node generate-html-preview.js articles/記事名.md
```

**生成ファイル**: `articles/記事名-preview.html`

#### `post-from-markdown-styled.js`
記事をWordPressに下書きとして投稿

```bash
node post-from-markdown-styled.js articles/記事名.md
```

**機能**:
- Markdown → スタイル付きHTML変換
- セクションごとの色分け・装飾
- WordPress REST API経由で投稿
- 下書き（draft）として保存

#### `check-post.js`
WordPress投稿の詳細情報を確認

```bash
node check-post.js [投稿ID]

# 例
node check-post.js 2358
```

**出力**:
- 投稿ID、タイトル、ステータス
- プレビューURL、管理画面URL
- 文字数、作成日時

### データ処理

#### `fix_json_encoding.py`
JSON文字化け問題を修正（Python）

```bash
python fix_json_encoding.py
```

---

## 🔄 標準ワークフロー

### 記事生成→投稿の完全フロー

```bash
# 1. データベース確認
node generate-from-db.js 1 0

# 2. Claude Codeで記事生成
#    - instructions/ARTICLE_GENERATION_MASTER.md の指示に従う
#    - 4,500-5,000文字
#    - すべての必須セクションを含む
#    - 五行理論は一切触れない

# 3. HTMLプレビュー生成
node generate-html-preview.js articles/パワースポット名.md

# 4. ブラウザでプレビュー確認
start articles/パワースポット名-preview.html

# 5. WordPress投稿
node post-from-markdown-styled.js articles/パワースポット名.md

# 6. 投稿確認
node check-post.js [投稿ID]

# 7. WordPress管理画面で最終確認
# https://k005.net/wp-admin/

# 8. 公開
```

---

## 📊 データベース情報

### パワースポットデータベース構造

ファイル: `04_powerspot_database.json`

```json
[
  {
    "地域": "三重県",
    "パワースポット名": "伊勢神宮",
    "ベースエネルギー": 0.98,
    "五行属性": {
      "木": 0.9,
      "火": 0.95,
      "土": 0.95,
      "金": 0.85,
      "水": 0.9
    }
  },
  ...
]
```

### トップ10パワースポット（エネルギー値順）

1. 伊勢神宮（三重県）- 0.98
2. 伏見稲荷大社（京都府）- 0.97
3. 斎場御嶽（沖縄県）- 0.97
4. 金刀比羅宮（香川県）- 0.96
5. 出雲大社（島根県）- 0.96
6. 阿蘇山（熊本県）- 0.96
7. 日光東照宮（栃木県）- 0.95
8. 羽黒山神社（山形県）- 0.95
9. 中尊寺金色堂（岩手県）- 0.95
10. 松島（宮城県）- 0.95

**総数**: 142件
**地域別**: 北海道17件、沖縄県13件、京都府7件...

---

## 📝 記事生成ガイド

### 必須インストラクション

記事生成時は必ず `instructions/ARTICLE_GENERATION_MASTER.md` を参照してください。

### 記事の基本仕様

- **文字数**: 4,500-5,000文字（厳守）
- **文体**: 丁寧語（です・ます調）、親しみやすく、具体的
- **構成**: 11セクション（導入→魅力→ご利益→訪問時期→参拝ガイド→基本情報→周辺情報→口コミ→FAQ→まとめ）

### ❌ 絶対に書いてはいけないこと

1. 五行理論の説明（木火土金水）
2. 12位置システムの言及
3. 60分類・縁タイプの詳細
4. 「○○タイプの人におすすめ」
5. 生年月日や名前との相性分析

**理由**:
- 診断アプリの価値を下げる
- 読者の目的（スポット情報）とズレる
- 怪しいサイトと思われるリスク

### 品質基準

- ✅ 具体的な数字: 15箇所以上
- ✅ 五感描写: 3箇所以上
- ✅ 体験談・エピソード: 2-3箇所
- ✅ 周辺グルメ: 3-5店舗
- ✅ モデルコース: 半日＋1日
- ✅ FAQ: 3-5個

詳細は `instructions/quality-checklist.md` を参照

---

## 🎨 HTMLスタイリング仕様

### セクション別スタイル

**通常セクション**:
- グラデーション背景（#f8f9fa → #ffffff）
- 左ボーダー（5px solid #4a90e2）
- シャドウ効果

**基本情報セクション**:
- 青系グラデーション背景（#e3f2fd → #ffffff）
- 青ボーダー（#2196f3）
- 📍アイコン付き見出し

**口コミセクション**:
- グレー背景（#f5f5f5）
- 紫ボーダー（#9c27b0）
- 引用スタイル

**CTAセクション**:
- パープルグラデーション（#667eea → #764ba2）
- 大きなボタン（白背景、影付き）

### 絵文字アイコン

- 📍 アクセス・基本情報
- 🍽️ グルメ・カフェ
- ✨ ご利益
- ❓ よくある質問
- 💡 回答

---

## ⚙️ 環境変数（.env）

```env
# WordPress REST API 認証情報
WP_SITE_URL=https://k005.net
WP_USERNAME=power
WP_APP_PASSWORD=Ml5H 2psf K1CK 3BLl fIcV ulQn

# 縁診断アプリ連携
EN_SHINDAN_URL=https://enguide.info

# Claude API (記事生成用)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**重要**: `.env`ファイルはGitにコミットしないこと（`.gitignore`に含まれています）

---

## 🔧 重要な設計判断

### 1. セクション順序の変更（2024年11月17日）

**変更前**: 導入 → 基本情報（アクセス）→ 魅力 → ...
**変更後**: 導入 → 魅力 → ご利益 → 訪問時期 → 参拝ガイド → **基本情報** → ...

**理由**: 読者は興味を持ってから実用情報を見る。基本情報を前に出すと離脱率が高まる。

### 2. CTAの最小化（2024年11月17日）

**変更前**: 記事末尾に大きなCTAボックス、診断ボタン
**変更後**: 控えめなテキストリンクのみ

**理由**: パワースポット記事から突然診断・有料商品に誘導するのは不自然。記事の役割は「価値提供＋SEO集客」に専念。

### 3. 文字数範囲の変更

**変更前**: 3,500-5,000字
**変更後**: 4,500-5,000字

**理由**: SEO観点から、より詳細なコンテンツが有利。競合サイトとの差別化。

詳細は `instructions/DECISIONS.md` を参照

---

## 🐛 トラブルシューティング

### WordPress接続エラー

**症状**: `socket hang up` または接続タイムアウト

**解決策**:
1. `.env`ファイルの認証情報を確認
2. WordPress REST APIが有効か確認
3. アプリケーションパスワードを再発行

```bash
# 接続テスト
node test-connection.js
```

### 投稿が見つからない（404）

**症状**: `https://k005.net/?p=2358` が存在しない

**原因**: 下書き状態のため、認証なしではアクセス不可

**解決策**:
```bash
# 認証付きで確認
node check-post.js 2358

# プレビューURLを使用
# https://k005.net/?p=2358&preview=true（ログイン必要）

# または管理画面からアクセス
# https://k005.net/wp-admin/post.php?post=2358&action=edit
```

### JSON文字化け

**症状**: パワースポット名が文字化けする

**原因**: JSONファイルのエンコーディング問題（2重エンコーディング）

**解決策**:
```bash
# Pythonで修正
python fix_json_encoding.py

# または、JavaScriptでインデックスアクセス
node read-powerspot-db.js
```

**回避策**: `read-powerspot-db.js`はキーインデックスでアクセスするため、文字化けがあっても動作します。

### 記事が短すぎる/長すぎる

**対策**:
- 各セクションの文字数ガイドを厳守
- `quality-checklist.md`で確認
- 生成後に文字数カウント

---

## 🔮 今後の改善点

### 短期（1-2週間）
- [ ] アイキャッチ画像の自動生成/選定
- [ ] カテゴリ・タグの自動設定
- [ ] メタディスクリプション自動生成
- [ ] 内部リンク自動挿入

### 中期（1-2ヶ月）
- [ ] バッチ記事生成（一度に10件）
- [ ] 記事の自動公開（下書き→公開）
- [ ] SEOスコア自動チェック
- [ ] 競合記事の分析・比較

### 長期（3-6ヶ月）
- [ ] AI画像生成統合（DALL-E, Midjourney）
- [ ] 記事の自動更新（情報の鮮度維持）
- [ ] A/Bテスト機能
- [ ] アクセス解析統合（GA4）

---

## 📚 参考資料

### プロジェクト内ドキュメント

- `README.md` - プロジェクト概要、使い方
- `CHANGELOG.md` - バージョン履歴
- `instructions/ARTICLE_GENERATION_MASTER.md` - 記事生成の完全ガイド
- `instructions/DECISIONS.md` - 設計判断の記録と理由
- `isejingu_article_v2_revised.md` - 高品質記事のサンプル

### 外部リソース

- [WordPress REST API Documentation](https://developer.wordpress.org/rest-api/)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)

---

## 🤝 貢献ガイドライン

### コーディング規約

- **JavaScript**: ES6+、セミコロンあり
- **ファイル名**: kebab-case（例: `generate-from-db.js`）
- **変数名**: camelCase（例: `powerspotDatabase`）

### コミットメッセージ

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル変更（機能変更なし）
refactor: リファクタリング
test: テスト追加
chore: その他（ビルド、設定など）
```

### 新しいスクリプトを追加する場合

1. スクリプトを作成
2. 実行権限を付与（`chmod +x`）
3. README.mdに使用方法を追記
4. **CLAUDE.mdを更新** (`/suggest-claude-md`コマンド使用)

---

## 📞 サポート・質問

プロジェクトに関する質問や問題は、GitHubリポジトリのIssuesで受け付けています。

---

**最終更新**: 2024年11月25日
**管理者**: powerspot-content-generator プロジェクトチーム
**Claude Code自動更新システム**: 有効
