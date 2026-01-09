# パワースポット記事自動生成システム

## プロジェクト概要

SEO最適化されたパワースポット記事を生成し、WordPressに自動投稿するシステム。

**ビジネスモデル**: SEO集客 → 無料診断アプリ → 有料レポート（¥2,980）

**技術スタック**: Node.js, WordPress REST API, Claude Code

---

## 指示別の参照ファイル

| 指示 | 読むべきファイル |
|------|-----------------|
| 「次の記事を作成して」 | `instructions/ARTICLE_GENERATION_MASTER.md` |
| スクリプトの使い方 | `README.md` |

**重要**: 「次の記事を作成して」には記事作成・画像検索・WordPress投稿の全手順が含まれます。

---

## 主要コマンド

```bash
# 次のスポット確認
node generate-from-db.js 1 [開始位置]

# WordPress投稿
node post-from-markdown-styled.js articles/記事名.md

# 投稿確認
node check-post.js [投稿ID]
```

---

## 重要ルール（常に守ること）

1. **五行理論には一切触れない** - 読者の目的とズレる、診断アプリの価値を下げる
2. **画像は投稿前にReadツールで必ず検証** - 検証なしでの投稿は禁止
3. **英語記事のスラッグ**: `{日本語スラッグ}-en` 形式に修正すること
4. **英語記事の言語設定**: WordPress管理画面で手動で「English」を選択

---

## ディレクトリ構成

```
powerspot-content-generator/
├── articles/           # 生成された記事（日本語・英語）
├── instructions/       # 記事生成インストラクション
│   └── ARTICLE_GENERATION_MASTER.md  # メインインストラクション
├── images/             # ダウンロードした画像（一時保存）
├── 04_powerspot_database.json  # パワースポットDB（142件）
└── post-from-markdown-styled.js  # WordPress投稿スクリプト
```

---

## 環境変数

`.env` に以下が設定済み:
- WordPress認証情報
- Pexels API Key
- Anthropic API Key
