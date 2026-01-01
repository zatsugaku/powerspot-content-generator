# パワースポット記事自動生成システム - プロジェクトガイド

最終更新: 2025年12月8日

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
- ✅ 4,500-5,000文字の高品質記事作成（日本語・英語）
- ✅ HTMLプレビュー生成
- ✅ WordPress自動投稿（カスタム投稿タイプ `powerspot`）
- ✅ 全タクソノミー自動設定（地域・エリア・タイプ・ご利益・五行属性）
- ✅ Pexels APIによる画像自動取得・アップロード
- ✅ アイキャッチ画像・スラッグ自動設定
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
│   ├── 伊勢神宮.md                      # 日本語記事
│   ├── ise-jingu-en.md                  # 英語記事
│   ├── 伊勢神宮-preview.html            # HTMLプレビュー
│   └── ...
│
├── images/                              # ダウンロードした画像（一時保存）
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
├── add-related-links.js                 # 既存記事に関連リンクを追加
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

#### `add-related-links.js`
既存のWordPress記事に関連リンクセクションを追加

```bash
# 全記事に関連リンクを追加
node add-related-links.js

# 特定の記事のみ更新
node add-related-links.js --single=ise-jingu

# 実行前確認（dry-run）
node add-related-links.js --dry-run
```

**機能**:
- ピラーページへのリンク追加
- 同じ地域のパワースポット記事をリンク（最大3件）
- 同じご利益のパワースポット記事をリンク（最大3件）
- 既にリンクがある記事はスキップ

**使用タイミング**:
- 新規記事を複数投稿した後
- ピラーページを作成・更新した後

### データ処理

#### `fix_json_encoding.py`
JSON文字化け問題を修正（Python）

```bash
python fix_json_encoding.py
```

---

## 🔄 記事作成ワークフロー（Claude Code用）

### ユーザーからの指示例
「次の記事を作成してください」「松島の記事を作って」

### Claude Codeが実行する完全フロー

ユーザーから記事作成を依頼された場合、以下の手順を**すべて自動で**実行してください：

#### Step 1: 対象パワースポットの特定
```bash
node generate-from-db.js 1 [開始位置]
```
- データベースからエネルギー値順で次のパワースポットを特定
- 既存の `articles/` フォルダを確認し、未作成のスポットを選択

#### Step 2: 日本語記事の作成
- `instructions/ARTICLE_GENERATION_MASTER.md` を読み込み、指示に従う
- **必須要件**:
  - 4,500-5,000文字
  - 11セクション構成
  - 五行理論は一切触れない
- 保存先: `articles/パワースポット名.md`

#### Step 3: 英語記事の作成
- 日本語記事を翻訳（直訳ではなく、英語圏読者向けに適応）
- 日本文化の説明を追加
- 保存先: `articles/slug-en.md`（例: `haguro-san-en.md`）

#### Step 4: 画像の検索・検証・アップロード（並列エージェント必須）

**🚨 絶対ルール: 検証なしでの投稿は禁止**

画像の問題は記事の信頼性を大きく損ないます。以下のワークフローを厳守してください。

##### 4-1. 画像検索（並列エージェントで実行）

**⚠️ 複数エージェントを使って真剣に適切な画像を探すこと**

**使用API**: Pexels API または Pixabay API（どちらでも可）

```bash
# Pexels API
curl -H "Authorization: $PEXELS_API_KEY" \
  "https://api.pexels.com/v1/search?query=キーワード&per_page=15"

# Pixabay API
curl "https://pixabay.com/api/?key=$PIXABAY_API_KEY&q=キーワード&per_page=15&image_type=photo"
```

**検索キーワード戦略（優先順位順）**

| 優先度 | キーワード例 | 説明 |
|--------|-------------|------|
| 1️⃣ 最優先 | "Tosa Shrine Kochi", "土佐神社" | スポット固有名（英語・日本語両方試す） |
| 2️⃣ 高 | "Kochi shrine torii", "高知 神社 鳥居" | 地域名 + 施設タイプ |
| 3️⃣ 中 | "Shikoku shrine", "四国 神社" | エリア名 + 施設タイプ |
| 4️⃣ 低 | "torii gate japan", "shrine entrance japan" | 汎用キーワード |

**施設タイプ別キーワード**

| タイプ | 推奨キーワード |
|--------|--------------|
| 神社 | torii gate, shrine entrance, ema wooden plaques, shimenawa rope, stone lantern shrine |
| 寺院 | temple garden japan, buddhist temple, zen garden, temple gate |
| 山・自然 | sacred mountain japan, forest path shrine, nature worship japan |
| 海・湖 | lake shrine japan, ocean torii, waterside shrine |

**並列検索の実行方法**
```
Task tool で複数エージェントを同時に起動:
- Agent 1: スポット固有名で検索
- Agent 2: 地域+タイプで検索
- Agent 3: 汎用キーワードで検索
→ 各エージェントが候補画像を収集・検証
```

##### 4-2. 画像の適切性基準

**✅ 使用OK（神社記事の場合）**
| 画像タイプ | 具体例 |
|-----------|--------|
| 鳥居 | 赤い鳥居、石の鳥居、海上鳥居 |
| 参道 | 石畳の参道、木々に囲まれた参道 |
| 神社建築 | 拝殿、本殿、神門、楼門 |
| 神社要素 | 手水舎、石灯籠、狛犬、絵馬、おみくじ |
| 注連縄 | しめ縄、紙垂（しで） |
| 自然（文字なし） | 神社の森、境内の木々 |

**❌ 使用NG**
| NGパターン | 具体例 | 理由 |
|-----------|--------|------|
| 場所特定できる文字・看板 | 「伏見稲荷」「春日大社」の額 | 別スポットと判明 |
| 有名ランドマーク | 富士山、大阪城、金閣寺 | 場所が特定される |
| 寺と神社の混同 | 五重塔、仏像、仏教彫刻 | 宗教施設の混同 |
| 地域と植生の不一致 | 北海道記事に竹林 | 不自然 |
| 無関係な画像 | 桜のみ、山岳風景のみ、猫、料理 | 神社と無関係 |
| 海外の風景 | パリ、バリ島など | 完全に無関係 |

##### 4-3. 画像のダウンロードと検証（投稿前必須）

**🚨 このステップを省略して投稿することは禁止**

```bash
# ダウンロード
curl -sL "画像URL" -o images/spot-name-1.jpg
curl -sL "画像URL" -o images/spot-name-2.jpg
curl -sL "画像URL" -o images/spot-name-3.jpg
```

**検証手順: 1枚ずつReadツールで目視確認**
```
Read(file_path="images/spot-name-1.jpg")
→ 画像内容を確認
→ 適切性基準に照らして判定
→ ✅ OK / ❌ 差替 を記録
```

**検証記録（必ず作成）**
```
## 画像検証: [パワースポット名]

| # | ファイル名 | 画像内容 | 判定 |
|---|-----------|---------|------|
| 1 | tosa-1.jpg | 赤い鳥居と参道 | ✅ OK |
| 2 | tosa-2.jpg | 神社入口、提灯あり | ✅ OK |
| 3 | tosa-3.jpg | 平等院鳳凰堂（寺院） | ❌ 差替 |

差し替え: tosa-3.jpg → 絵馬の画像に変更
```

##### 4-4. 画像枚数

| 用途 | 枚数 | 備考 |
|------|------|------|
| 本文画像 | 3-5枚 | 記事の長さに応じて調整 |
| アイキャッチ | 1枚 | 最も印象的な画像を選択 |

**挿入位置**
1. 導入文の後
2. 「魅力」セクション内または後
3. 「参拝ガイド」セクション付近
4. （5枚の場合）「口コミ」セクション付近
5. （5枚の場合）「周辺情報」セクション付近

##### 4-5. WordPressへのアップロードと挿入

**アップロード後、画像IDとURLを記録**

```javascript
// Node.jsでアップロード
const media = await uploadImageToWP(imageUrl, 'spot-name-1.jpg');
console.log('URL:', media.source_url);
console.log('ID:', media.id);
```

##### 4-6. 適切な画像が見つからない場合のフォールバック

**検索で適切な画像が見つからない場合の対処法**

1. **検索キーワードを変更して再検索**
   - 英語↔日本語を切り替え
   - より汎用的なキーワードに変更

2. **検証済み汎用画像を使用**

**神社向け汎用画像（検証済み）**
| 検索キーワード | 取得できる画像 |
|--------------|---------------|
| "torii gate sunset" | 海上鳥居（夕景） |
| "shrine entrance japan" | 神社入口・鳥居 |
| "ema wooden plaques" | 絵馬 |
| "stone lantern shrine" | 石灯籠 |
| "shimenawa rope" | 注連縄 |

3. **それでも見つからない場合**
   - ユーザーに報告し、手動での画像選定を依頼

##### 4-7. 投稿後の最終確認

投稿完了後、WordPressから画像URLを取得し再度Readツールで確認：

```javascript
// 投稿から画像URLを抽出して確認
const post = await getPost(postId);
const imageUrls = post.content.match(/src="([^"]+\.jpg)"/g);
// 各URLをダウンロードしてReadツールで最終確認
```

**問題発見時は即座に差し替え→再投稿**

#### Step 5: POWERSPOT_MAPPING更新
`post-from-markdown-styled.js` の `POWERSPOT_MAPPING` に以下を追加:
```javascript
'パワースポット名': {
  rank: 順位,
  region: '都道府県',
  slug: 'url-slug',
  type: 'スポットタイプ',
  benefits: ['ご利益1', 'ご利益2', 'ご利益3'],
  featuredImage: 画像ID
},
```

#### Step 6: WordPress投稿
```bash
# 日本語記事を投稿
node post-from-markdown-styled.js articles/パワースポット名.md

# 英語記事を投稿
node post-from-markdown-styled.js articles/slug-en.md
```

**自動設定される項目**:
- カスタム投稿タイプ: `powerspot`
- スラッグ（URL）※日本語記事のみ
- アイキャッチ画像
- 地域（都道府県）
- エリア（北海道/東北/関東/...）
- スポットタイプ（神社/寺院/山・自然/...）
- ご利益（複数選択可）
- 五行属性（上位2つ）

#### Step 7: 英語記事のスラッグ修正（必須）

英語記事は投稿時にタイトル全体がスラッグになるため、投稿後に短いスラッグに修正する：

```javascript
// WordPress REST APIでスラッグを更新
axios.post(WP_SITE_URL + '/wp-json/wp/v2/powerspot/' + postId,
  { slug: 'spot-name-en' },  // 例: 'hokkaido-jingu-en'
  { headers: { Authorization: 'Basic ' + auth } }
);
```

**スラッグ命名規則**:
- 形式: `{日本語記事のスラッグ}-en`
- 例: `hokkaido-jingu` → `hokkaido-jingu-en`
- 例: `atsuta-jingu` → `atsuta-jingu-en`

#### Step 7.5: 英語記事の言語設定（手動・必須）

**⚠️ Polylang無料版の制限により、REST APIでの言語設定は不可**

英語記事投稿後、WordPress管理画面で手動で言語を設定する必要があります：

1. WordPress管理画面にログイン
2. 該当の英語記事を編集画面で開く
3. 右サイドバーの「言語」セクションで「English」を選択
4. 「更新」をクリック

**確認方法**: 投稿一覧で国旗アイコンが🇬🇧/🇺🇸になっていればOK

**注意**: この設定を忘れると、英語記事が日本語🇯🇵として扱われ、サイトの多言語構造が崩れます

#### Step 8: 投稿確認
```bash
node check-post.js [投稿ID]
```

#### Step 9: 検証・修正

投稿後、以下の項目を検証し、問題があれば修正する：

**A. 記事品質チェック**
| チェック項目 | 基準 | 確認方法 |
|-------------|------|---------|
| 文字数 | 4,500-5,000文字 | 記事ファイルの文字数をカウント |
| 必須セクション | 11セクション全て存在 | 見出し（##）を確認 |
| 具体的な数字 | 15箇所以上 | 数字の出現回数 |
| 五感描写 | 3箇所以上 | 視覚・聴覚・触覚等の描写 |
| 五行理論の言及 | なし（厳禁） | 「木火土金水」「五行」で検索 |
| 周辺グルメ | 3-5店舗 | 店舗名の記載確認 |
| FAQ | 3-5個 | Q&A形式の確認 |

**B. 画像チェック（最重要・省略厳禁）**

**⚠️ 画像の問題は記事の信頼性を損ないます。必ず全画像を目視確認すること。**

| チェック項目 | NGパターン | 確認方法 |
|-------------|-----------|---------|
| 本文画像5枚 | 5枚未満 | 記事内の`![`を検索 |
| 場所特定不可 | 看板・文字・有名建物 | **Readツールで1枚ずつ目視** |
| 地域との整合性 | 北海道に竹林など | 植生・気候を確認 |
| 寺社の区別 | 神社記事に五重塔・仏像 | 宗教施設の種類を確認 |
| 日本の風景か | 海外の風景 | 建築様式・植生を確認 |
| 記事との関連性 | 猫・花火など無関係 | 内容を確認 |
| 画像表示 | リンク切れ | WordPressプレビューで確認 |

**画像検証の必須手順**:
```
1. WordPress投稿から画像URLを取得
2. 各URLに対してReadツールを実行
3. 画像内容を目視確認
4. NGパターンに該当しないか判定
5. 問題があれば差し替え→再投稿
```

**C. WordPress投稿チェック**
| チェック項目 | 確認方法 |
|-------------|---------|
| カスタム投稿タイプ | `powerspot`になっているか |
| 日本語スラッグ | 短い英語スラッグか（例: `hokkaido-jingu`） |
| 英語スラッグ | `{slug}-en`形式か（例: `hokkaido-jingu-en`） |
| アイキャッチ画像 | 設定されているか |
| 地域（都道府県） | 正しい都道府県か |
| エリア | 地域に対応したエリアか |
| スポットタイプ | 神社/寺院/山・自然等、正しいか |
| ご利益 | 適切なものが選択されているか |
| 五行属性 | 上位2つが設定されているか |

**D. 問題発見時の対応**
1. **記事内容の問題** → Markdownファイルを修正し、再投稿
2. **タクソノミーの問題** → WordPress管理画面で修正、または`POWERSPOT_MAPPING`を修正して再投稿
3. **画像の問題** → 新しい画像を検索・アップロードし、投稿を更新
4. **英語スラッグが長い** → Step 7の手順でスラッグを修正

**E. 検証完了の報告**
検証が完了したら、以下の形式で報告：
```
## 検証結果: [パワースポット名]

### 記事品質
- 文字数: ○○文字 ✅/❌
- セクション数: ○○ ✅/❌
- 具体的数字: ○○箇所 ✅/❌
- 五行理論言及: なし ✅ / あり ❌

### 画像検証
- 本文画像: 5枚 ✅/❌
- 場所特定: 不可 ✅ / 可能 ❌
- 内容確認: 全て目視確認済み ✅/❌

### WordPress設定
- 投稿タイプ: powerspot ✅/❌
- スラッグ: xxx ✅/❌
- アイキャッチ: あり ✅/❌
- タクソノミー: 全て設定済み ✅/❌

### 修正事項
- （修正があれば記載）

### 結果: 合格 / 要修正
```

### 重要な注意事項

1. **画像について（最重要・品質の要）**

   **🚨 検証なしでの投稿は絶対禁止**

   **ワークフロー概要**:
   1. 並列エージェントで複数キーワードを真剣に検索
   2. 候補画像をダウンロード
   3. **投稿前に**1枚ずつReadツールで目視確認
   4. 適切な画像のみを使用して投稿
   5. 投稿後も最終確認

   **検索キーワード優先順位**:
   1. スポット固有名（"Tosa Shrine Kochi"）
   2. 地域+タイプ（"Kochi shrine torii"）
   3. エリア+タイプ（"Shikoku shrine"）
   4. 汎用（"torii gate japan"）

   **使用API**: Pexels API または Pixabay API

   **画像枚数**: 本文3-5枚 + アイキャッチ1枚

   **詳細はStep 4を参照**

2. **英語記事について**
   - ファイル名: `{slug}-en.md`（例: `matsushima-en.md`）
   - タイトル: `{Spot Name} | Complete Guide to {Prefecture}'s {特徴} Power Spot【{キーワード}】`
   - 日本文化の背景説明を追加

3. **タクソノミーID**
   - 固定IDを使用（`TAXONOMY_IDS`参照）
   - 新規作成しない（重複防止）

### 作成済み記事一覧

| 順位 | パワースポット | 日本語 | 英語 | 投稿ID(JP) | 投稿ID(EN) |
|------|--------------|--------|------|-----------|-----------|
| 1 | 伊勢神宮 | ✅ | ✅ | 2367 | - |
| 2 | 伏見稲荷大社 | ✅ | ✅ | 2378 | - |
| 3 | 斎場御嶽 | ✅ | ✅ | 2393 | - |
| 4 | 金刀比羅宮 | ✅ | ✅ | 2399 | - |
| 5 | 出雲大社 | ✅ | ✅ | 2405 | - |
| 6 | 阿蘇山 | ✅ | ✅ | 2411 | - |
| 7 | 日光東照宮 | ✅ | ✅ | 2419 | - |
| 8 | 羽黒山神社 | ✅ | ✅ | 2463 | 2467 |
| 9 | 中尊寺金色堂 | ✅ | ✅ | 2464 | 2468 |
| 10 | 松島 | ✅ | ✅ | 2469 | 2471 |
| 11 | 大崎八幡宮 | ✅ | ✅ | 2539 | 2540 |
| 12 | 熱田神宮 | ✅ | ✅ | 2537 | 2538 |
| 13 | 北海道神宮 | ✅ | ✅ | 2535 | 2536 |
| 14 | 樽前山神社 | ✅ | ✅ | 2533 | 2534 |
| 15 | 阿寒湖 | ✅ | ✅ | 2524 | 2525 |
| 16 | 定山渓神社 | ✅ | ✅ | 2548 | 2549 |
| 17 | 金剱宮 | ✅ | ✅ | 2550 | 2551 |
| 18 | 住吉大社 | ✅ | ✅ | 2554 | 2555 |

---

## 📜 使用可能なスクリプト（詳細）

### 旧ワークフロー（手動）

```bash
# 1. データベース確認
node generate-from-db.js 1 0

# 2. 記事作成（手動でClaude Codeに依頼）

# 3. HTMLプレビュー生成
node generate-html-preview.js articles/パワースポット名.md

# 4. ブラウザでプレビュー確認
start articles/パワースポット名-preview.html

# 5. WordPress投稿
node post-from-markdown-styled.js articles/パワースポット名.md

# 6. 投稿確認
node check-post.js [投稿ID]
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

# Pexels API (画像検索)
PEXELS_API_KEY=uILLDNjt6qvSf2jDR4Flg0ifPnEXrTwpaRxxie28JVS7IvbiqnwhsCpr

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

### 実装済み ✅
- [x] アイキャッチ画像の自動選定（Pexels API）
- [x] 画像のWordPress自動アップロード
- [x] カテゴリ・タクソノミーの自動設定
- [x] 英語記事の作成・投稿
- [x] スラッグの自動設定

### 短期
- [ ] メタディスクリプション自動生成
- [ ] 内部リンク自動挿入
- [ ] 日英記事のPolylang連携

### 中期
- [ ] バッチ記事生成（一度に10件）
- [ ] 記事の自動公開（下書き→公開）
- [ ] SEOスコア自動チェック
- [ ] 競合記事の分析・比較

### 長期
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

**最終更新**: 2026年1月1日
**管理者**: powerspot-content-generator プロジェクトチーム
**Claude Code自動更新システム**: 有効
