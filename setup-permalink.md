# パーマリンク設定変更ガイド

## 手順

### ステップ1: パーマリンク設定を変更

1. WordPress管理画面（https://k005.net/wp-admin）にログイン
2. 左メニュー「設定」→「パーマリンク」をクリック
3. 「投稿名」を選択
   - または、カスタム構造に `/%postname%/` と入力
4. 「変更を保存」をクリック

**変更後のURL例：**
- 変更前: `https://k005.net/?p=2423`
- 変更後: `https://k005.net/日光東照宮-栃木県のパワースポット完全ガイド...`

### ステップ2: 各記事のスラッグを英語に変更（重要！）

日本語URLは避けるべきなので、各記事のスラッグを手動で英語に変更します。

**手順：**
1. 投稿 → 投稿一覧
2. 記事をクリックして編集画面を開く
3. 右側の「パーマリンク」セクションで「URLスラッグ」を変更

**推奨スラッグ：**
- 日光東照宮 → `nikko-toshogu`
- 出雲大社 → `izumo-taisha`
- 阿蘇山 → `mount-aso`
- 金刀比羅宮 → `kotohira-gu`
- 斎場御嶽 → `sefa-utaki`
- 伏見稲荷大社 → `fushimi-inari-taisha`
- 伊勢神宮 → `ise-jingu`

4. 「更新」をクリック

**変更後のURL例：**
- `https://k005.net/nikko-toshogu/`
- `https://k005.net/izumo-taisha/`

### ステップ3: リダイレクト設定（必須）

古いURL（`?p=2423`）から新しいURLへ自動転送する設定を行います。

**方法1: Redirectionプラグイン（推奨）**

1. プラグイン → 新規追加
2. 「**Redirection**」を検索してインストール・有効化
3. ツール → Redirection
4. セットアップウィザードに従って設定
5. 「WordPress投稿とページのパーマリンク変更を監視」にチェック
6. 完了

→ これで自動的に古いURLから新しいURLにリダイレクトされます

**方法2: 手動で.htaccessに追加（上級者向け）**

サーバーの.htaccessファイルに以下を追加：

```apache
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
```

### ステップ4: Google Search Consoleで変更を通知

1. Search Console（https://search.google.com/search-console）を開く
2. 左メニュー「設定」→「アドレス変更」
   - ただし、ドメインは変わっていないのでこの手順はスキップ
3. 左メニュー「サイトマップ」
4. 一度サイトマップを削除して再送信
   - `wp-sitemap.xml` を削除
   - 再度 `wp-sitemap.xml` を送信

### ステップ5: 確認

1. 新しいURLにアクセスして表示されるか確認
   - 例: `https://k005.net/nikko-toshogu/`
2. 古いURLにアクセスして新しいURLにリダイレクトされるか確認
   - 例: `https://k005.net/?p=2423` → `https://k005.net/nikko-toshogu/`

---

## まとめ

1. ✅ 設定 → パーマリンク → 投稿名
2. ✅ 各記事のスラッグを英語に変更
3. ✅ Redirectionプラグインをインストール
4. ✅ Search Consoleでサイトマップ再送信
5. ✅ 動作確認

---

## 注意事項

- パーマリンク変更後、必ずリダイレクト設定を行ってください
- 設定しないと、古いURLが404エラーになります
- Search Consoleのインデックス登録も再度リクエストすると良いです

何か問題があれば教えてください！
