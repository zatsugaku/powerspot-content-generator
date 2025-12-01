#!/bin/bash

# CLAUDE.md自動更新提案フック
# Writeツール使用後に実行され、CLAUDE.mdの更新を提案する

# プロジェクトルートディレクトリ
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# CLAUDE.mdファイルのパス
CLAUDE_MD="$PROJECT_ROOT/CLAUDE.md"

# 最終更新チェックファイル
LAST_UPDATE_FILE="$PROJECT_ROOT/.claude/last-claude-md-update"

# 現在時刻を取得
CURRENT_TIME=$(date +%s)

# 最終更新時刻を取得（ファイルがない場合は0）
if [ -f "$LAST_UPDATE_FILE" ]; then
    LAST_UPDATE=$(cat "$LAST_UPDATE_FILE")
else
    LAST_UPDATE=0
fi

# 経過時間を計算（秒）
ELAPSED=$((CURRENT_TIME - LAST_UPDATE))

# 30分 = 1800秒以上経過している場合のみ提案
if [ $ELAPSED -lt 1800 ]; then
    exit 0
fi

# 重要なファイルが作成/更新されたかチェック
# Writeツールで作成されたファイルパスは環境変数から取得できる可能性がある
# ここでは簡易的に、重要なファイルの存在チェックを行う

# 新しいスクリプトファイルが追加された可能性をチェック
NEW_SCRIPTS=$(find "$PROJECT_ROOT" -type f \( -name "*.js" -o -name "*.sh" -o -name "*.py" \) -mmin -30 | wc -l)

# 新しいMarkdownファイル（記事など）が追加された可能性をチェック
NEW_ARTICLES=$(find "$PROJECT_ROOT/articles" -type f -name "*.md" -mmin -30 2>/dev/null | wc -l)

# 重要なディレクトリが新規作成された可能性をチェック
NEW_DIRS=$(find "$PROJECT_ROOT" -maxdepth 2 -type d -mmin -30 | wc -l)

# 変更がある場合
TOTAL_CHANGES=$((NEW_SCRIPTS + NEW_ARTICLES + NEW_DIRS))

if [ $TOTAL_CHANGES -gt 0 ]; then
    # 提案メッセージを出力
    echo ""
    echo "📝 CLAUDE.md更新の提案"
    echo ""
    echo "プロジェクトに変更がありました："
    echo "  - 新規/更新スクリプト: $NEW_SCRIPTS 件"
    echo "  - 新規記事: $NEW_ARTICLES 件"
    echo "  - 新規ディレクトリ: $NEW_DIRS 件"
    echo ""
    echo "💡 CLAUDE.mdを更新することをおすすめします。"
    echo "   以下のコマンドを実行してください："
    echo ""
    echo "   /suggest-claude-md"
    echo ""

    # 最終更新時刻を記録
    echo "$CURRENT_TIME" > "$LAST_UPDATE_FILE"
fi

exit 0
