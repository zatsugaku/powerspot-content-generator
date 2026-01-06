# 緊急対応: サイト構造問題の修正

作成日: 2025-01-06
最終更新: 2026-01-07
ステータス: **✅ 全タスク完了**

---

## 問題の概要

Googleにクロール済みだがインデックスされないページが多数存在。
原因は **空の固定ページが80件以上** 存在し、サイト全体の品質評価を下げていること。

### 具体例
- `https://k005.net/%E4%B8%AD%E5%B0%8A%E5%AF%BA%E9%87%91%E8%89%B2%E5%A0%82/` (中尊寺金色堂)
  - → コンテンツほぼなし
  - → 正規URL `/powerspot/chusonji-konjikido/` は充実したコンテンツあり

---

## 発見した問題

### 1. 二重コンテンツ構造（最重大）

| 種別 | URL例 | 件数 | 状態 |
|------|-------|------|------|
| カスタム投稿（正） | `/powerspot/chusonji-konjikido/` | 39件 | コンテンツ充実 |
| 固定ページ（負） | `/%E4%B8%AD%E5%B0%8A%E5%AF%BA%E9%87%91%E8%89%B2%E5%A0%82/` | 80件以上 | **ほぼ空** |

### 2. 一覧ページの問題
- `/powerspot/` に画像が1枚もない
- テキストのみで視覚的魅力ゼロ

### 3. サイト構造の混乱
- 内部リンクが機能していない
- パンくずリストがない
- 地域別ページもコンテンツが薄い

---

## 対応タスク

### Phase 1: 緊急対応（空ページの処理）

#### Task 1-1: 空の固定ページを特定

```bash
# 固定ページ一覧を取得して確認
cd /c/Main/work/enpower/powerspot-content-generator
node -e "
const axios = require('axios');
const auth = Buffer.from('power:Ml5H 2psf K1CK 3BLl fIcV ulQn').toString('base64');

async function getPages() {
  const res = await axios.get('https://k005.net/wp-json/wp/v2/pages?per_page=100', {
    headers: { Authorization: 'Basic ' + auth }
  });
  res.data.forEach(p => {
    const contentLength = p.content.rendered.replace(/<[^>]*>/g, '').trim().length;
    console.log(p.id + ' | ' + decodeURIComponent(p.slug) + ' | 文字数:' + contentLength);
  });
}
getPages();
"
```

#### Task 1-2: 空ページを削除またはリダイレクト設定

**方針決定が必要**:
- A案: 空ページを完全削除 → 404になる
- B案: 正規URLへ301リダイレクト設定 → SEO的にベスト
- C案: 空ページにコンテンツを追加 → 工数大

**推奨: B案（リダイレクト）**

リダイレクトプラグイン（Redirection等）で以下を設定:
```
/%E4%B8%AD%E5%B0%8A%E5%AF%BA%E9%87%91%E8%89%B2%E5%A0%82/ → /powerspot/chusonji-konjikido/
/%E4%BC%8A%E5%8B%A2%E7%A5%9E%E5%AE%AE/ → /powerspot/ise-jingu/
... (全パワースポット分)
```

#### Task 1-3: Search Consoleで対応
- 削除した場合: URL削除リクエスト
- リダイレクトの場合: インデックス再登録リクエスト

---

### Phase 2: 一覧ページ改善

#### Task 2-1: `/powerspot/` ページの調査

現在の状態:
- Astraテーマのアーカイブテンプレート使用
- 画像表示なし
- テキストのみ

#### Task 2-2: 改善方法の選択

**方針決定が必要**:
- A案: テーマカスタマイズ（子テーマで `archive-powerspot.php` 作成）
- B案: Elementor等でカスタムアーカイブページ作成
- C案: カスタムフィールド + 既存テーマ設定で対応

#### Task 2-3: 実装
- アイキャッチ画像をカード形式で表示
- 地域・ご利益でフィルター可能に
- ページネーションを改善（または無限スクロール）

---

### Phase 3: サイト構造改善

#### Task 3-1: パンくずリスト実装
- Yoast SEO または専用プラグインで対応

#### Task 3-2: 地域別ピラーページ強化
- 現在の薄いページにコンテンツ追加
- 該当地域のパワースポットへの内部リンク

#### Task 3-3: 関連記事の表示
- 各記事に同地域・同ご利益のスポットをリンク

---

## 日本語URL → 正規URLのマッピング（作成中）

| 日本語スラッグ | 正規スラッグ |
|---------------|-------------|
| 中尊寺金色堂 | chusonji-konjikido |
| 伊勢神宮 | ise-jingu |
| 出雲大社 | izumo-taisha |
| 伏見稲荷大社 | fushimi-inari-taisha |
| ... | ... |

**TODO**: 全マッピングを作成するスクリプトを実行

---

## 作業環境

- WordPress: https://k005.net/wp-admin/
- ユーザー: power
- REST API認証: アプリケーションパスワード使用

---

## 参考コマンド

### 固定ページ一覧取得
```bash
curl -s -u "power:Ml5H 2psf K1CK 3BLl fIcV ulQn" \
  "https://k005.net/wp-json/wp/v2/pages?per_page=100" | \
  node -e "JSON.parse(require('fs').readFileSync(0)).forEach(p=>console.log(p.id+'|'+decodeURIComponent(p.slug)))"
```

### カスタム投稿一覧取得
```bash
curl -s -u "power:Ml5H 2psf K1CK 3BLl fIcV ulQn" \
  "https://k005.net/wp-json/wp/v2/powerspot?per_page=100" | \
  node -e "JSON.parse(require('fs').readFileSync(0)).forEach(p=>console.log(p.id+'|'+p.slug))"
```

### 固定ページ削除（例: ID 2064）
```bash
curl -X DELETE -u "power:Ml5H 2psf K1CK 3BLl fIcV ulQn" \
  "https://k005.net/wp-json/wp/v2/pages/2064?force=true"
```

---

## 注意事項

- 削除前に必ずバックアップを取ること
- リダイレクト設定は慎重に（間違うと404大量発生）
- Search Consoleの変化を監視すること

---

## 完了条件

- [x] 空の固定ページが0件になっている ✅ **2026-01-06 完了**
- [x] 日本語URLが正規URLにリダイレクトされている ✅ **2026-01-07 完了（39件）**
- [x] `/powerspot/` 一覧ページに画像が表示されている ✅ **2026-01-06 完了**
- [ ] Search Consoleで「クロール済み - インデックス未登録」が減少（経過観察）

---

## 🎉 完了した作業（2026-01-06）

### Phase 1: 空ページの処理
| 作業 | 件数 | 状態 |
|------|------|------|
| 空の固定ページ特定 | 150件 | ✅ 完了 |
| 空ページ削除 | 150件 | ✅ 完了 |
| リダイレクト設定ファイル作成 | 39件分 | ✅ 完了 |

### Phase 2: 一覧ページ改善
| 作業 | 件数 | 状態 |
|------|------|------|
| アイキャッチ画像追加 | 60件 | ✅ 完了 |
| 一覧ページ画像表示確認 | - | ✅ 動作確認済み |

**残りの固定ページ**: 3件（コンテンツあり、削除不要）
- 2427: japan-power-spots-guide
- 2158: パワースポット開運ナビ
- 1961: 日光東照宮

**カスタム投稿（powerspot）**: 80件全てにアイキャッチ画像設定済み

---

## ⚠️ 残りの作業（別PCで実施）

### 1. Redirectionプラグインのインストールと設定

**目的**: 削除した日本語URLページへのアクセスを正規URLにリダイレクト

**手順**:
1. WordPress管理画面にログイン: https://k005.net/wp-admin/
2. プラグイン → 新規追加
3. 「Redirection」を検索
4. インストール → 有効化
5. ツール → Redirection を開く
6. 初期設定を完了

**リダイレクト設定の追加**:

`redirect-rules.htaccess` ファイルの内容を参照して、以下の39件のリダイレクトを設定：

| 日本語URL | 正規URL |
|-----------|---------|
| /伊勢神宮/ | /powerspot/ise-jingu/ |
| /伏見稲荷大社/ | /powerspot/fushimi-inari-taisha/ |
| /斎場御嶽/ | /powerspot/sefa-utaki/ |
| /金刀比羅宮/ | /powerspot/kotohira-gu/ |
| /出雲大社/ | /powerspot/izumo-taisha/ |
| /阿蘇山/ | /powerspot/mount-aso/ |
| ...（全39件は redirect-rules.htaccess を参照）|

**CSVインポート**: `redirect-mapping.json` を使用可能

### 2. Search Console対応（任意）

- URL削除リクエスト（削除したページ用）
- サイトマップの再送信

---

## 作成されたファイル

| ファイル | 説明 |
|----------|------|
| `redirect-mapping.json` | リダイレクトマッピングデータ（JSON） |
| `redirect-rules.htaccess` | .htaccess用リダイレクトルール |
| `add-featured-images.js` | アイキャッチ画像一括追加スクリプト |
