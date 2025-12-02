#!/usr/bin/env node

/**
 * CLAUDE.md自動更新提案フック
 * Writeツール使用後に実行され、CLAUDE.mdの更新を提案する
 */

const fs = require('fs');
const path = require('path');

// プロジェクトルートディレクトリ
const PROJECT_ROOT = path.resolve(__dirname, '..');

// CLAUDE.mdファイルのパス
const CLAUDE_MD = path.join(PROJECT_ROOT, 'CLAUDE.md');

// 最終更新チェックファイル
const LAST_UPDATE_FILE = path.join(PROJECT_ROOT, '.claude', 'last-claude-md-update');

// 現在時刻を取得（秒）
const CURRENT_TIME = Math.floor(Date.now() / 1000);

// 最終更新時刻を取得（ファイルがない場合は0）
let LAST_UPDATE = 0;
if (fs.existsSync(LAST_UPDATE_FILE)) {
  try {
    LAST_UPDATE = parseInt(fs.readFileSync(LAST_UPDATE_FILE, 'utf8').trim());
  } catch (e) {
    LAST_UPDATE = 0;
  }
}

// 経過時間を計算（秒）
const ELAPSED = CURRENT_TIME - LAST_UPDATE;

// 30分 = 1800秒以上経過している場合のみ提案
if (ELAPSED < 1800) {
  process.exit(0);
}

/**
 * 指定した時間（分）以内に更新されたファイルを検索
 */
function findRecentFiles(dir, extensions, minutesAgo = 30) {
  if (!fs.existsSync(dir)) return [];

  const cutoffTime = Date.now() - (minutesAgo * 60 * 1000);
  const files = [];

  function search(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        // node_modules, .git, tempなどは除外
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'temp') {
          continue;
        }

        if (entry.isDirectory()) {
          search(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            const stats = fs.statSync(fullPath);
            if (stats.mtimeMs > cutoffTime) {
              files.push(fullPath);
            }
          }
        }
      }
    } catch (e) {
      // アクセスできないディレクトリはスキップ
    }
  }

  search(dir);
  return files;
}

/**
 * 新規ディレクトリをカウント
 */
function countRecentDirectories(minutesAgo = 30) {
  const cutoffTime = Date.now() - (minutesAgo * 60 * 1000);
  let count = 0;

  try {
    const entries = fs.readdirSync(PROJECT_ROOT, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        const fullPath = path.join(PROJECT_ROOT, entry.name);
        const stats = fs.statSync(fullPath);
        if (stats.mtimeMs > cutoffTime) {
          count++;
        }
      }
    }
  } catch (e) {
    // エラーは無視
  }

  return count;
}

// 新しいスクリプトファイルが追加された可能性をチェック
const newScripts = findRecentFiles(PROJECT_ROOT, ['.js', '.sh', '.py'], 30);

// 新しいMarkdownファイル（記事など）が追加された可能性をチェック
const articlesDir = path.join(PROJECT_ROOT, 'articles');
const newArticles = findRecentFiles(articlesDir, ['.md'], 30);

// 重要なディレクトリが新規作成された可能性をチェック
const newDirs = countRecentDirectories(30);

// 変更がある場合
const TOTAL_CHANGES = newScripts.length + newArticles.length + newDirs;

if (TOTAL_CHANGES > 0) {
  // 提案メッセージを出力
  console.log('');
  console.log('📝 CLAUDE.md更新の提案');
  console.log('');
  console.log('プロジェクトに変更がありました：');
  console.log(`  - 新規/更新スクリプト: ${newScripts.length} 件`);
  console.log(`  - 新規記事: ${newArticles.length} 件`);
  console.log(`  - 新規ディレクトリ: ${newDirs} 件`);
  console.log('');
  console.log('💡 CLAUDE.mdを更新することをおすすめします。');
  console.log('   以下のコマンドを実行してください：');
  console.log('');
  console.log('   /suggest-claude-md');
  console.log('');

  // 最終更新時刻を記録
  try {
    fs.writeFileSync(LAST_UPDATE_FILE, CURRENT_TIME.toString(), 'utf8');
  } catch (e) {
    // 書き込みエラーは無視
  }
}

process.exit(0);
