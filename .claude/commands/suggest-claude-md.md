---
description: CLAUDE.mdファイルの更新を提案する
---

# CLAUDE.md更新提案

プロジェクトの現在の状態を分析し、CLAUDE.mdファイルを更新してください。

## 分析対象

1. **プロジェクト構造**
   - 新しく作成されたファイル
   - 重要なディレクトリ
   - 設定ファイル

2. **スクリプト・ツール**
   - 追加された自動化スクリプト
   - 便利なコマンド
   - 使用方法

3. **開発フロー**
   - 記事生成プロセス
   - WordPress投稿手順
   - 品質チェック方法

4. **重要な決定事項**
   - アーキテクチャの選択
   - 命名規則
   - ベストプラクティス

## 更新内容

CLAUDE.mdに以下の情報を含めてください：

### 1. プロジェクト概要
- 目的と目標
- 主な機能
- 技術スタック

### 2. ディレクトリ構造
```
powerspot-content-generator/
├── .claude/
│   ├── settings.json          # Claude Code設定
│   └── commands/              # カスタムコマンド
├── instructions/              # 記事生成インストラクション
│   ├── ARTICLE_GENERATION_MASTER.md
│   └── ...
├── articles/                  # 生成された記事
├── bin/                       # ユーティリティスクリプト
├── scripts/                   # 自動化スクリプト
└── ...
```

### 3. クイックスタート
- セットアップ手順
- 最初の記事生成方法
- WordPress投稿方法

### 4. 使用可能なスクリプト

**記事生成**
- `node generate-from-db.js` - データベースから記事情報を取得
- 記事を手動で作成

**プレビュー**
- `node generate-html-preview.js articles/記事名.md` - HTMLプレビュー生成

**WordPress投稿**
- `node post-from-markdown-styled.js articles/記事名.md` - WordPress下書き投稿

**確認**
- `node check-post.js [投稿ID]` - 投稿の確認

### 5. ワークフロー

1. パワースポットデータベースを確認
2. `node generate-from-db.js` でトップのパワースポットを確認
3. 記事を生成（Claude Codeで）
4. HTMLプレビューで確認
5. WordPressに投稿
6. 管理画面で最終確認・公開

### 6. 重要な設計判断

- 五行理論を記事に含めない理由
- セクション順序の変更
- CTAの最小化戦略

### 7. トラブルシューティング

- WordPress接続エラー
- エンコーディング問題
- 記事生成のベストプラクティス

### 8. 今後の改善点

- 画像自動生成
- SEO最適化の自動化
- バッチ記事生成

## 実行方法

既存のCLAUDE.mdがある場合は、それを読み込んで更新してください。
ない場合は、新規作成してください。

CLAUDE.mdは、将来このプロジェクトに参加する開発者（または別のClaude Codeセッション）が
すぐにプロジェクトを理解し、作業を継続できるように書いてください。
