/**
 * フィルターUI デプロイスクリプト
 *
 * WordPress REST APIを使用してフィルターUIをデプロイ
 *
 * 使い方:
 *   node deploy-filter-ui.js           # デプロイ実行
 *   node deploy-filter-ui.js --dry-run # 確認のみ
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');
const headers = { Authorization: 'Basic ' + auth };

const DRY_RUN = process.argv.includes('--dry-run');

// アセットファイル
const ASSETS_DIR = path.join(__dirname, 'wordpress-assets');
const JS_FILE = path.join(ASSETS_DIR, 'powerspot-filter.js');
const CSS_FILE = path.join(ASSETS_DIR, 'powerspot-filter.css');

/**
 * カスタムHTMLウィジェットを使用してスクリプトを挿入
 */
async function deployViaCustomHTML() {
  console.log('=== フィルターUI デプロイ ===\n');

  // ファイル読み込み
  const jsContent = fs.readFileSync(JS_FILE, 'utf8');
  const cssContent = fs.readFileSync(CSS_FILE, 'utf8');

  console.log(`JavaScript: ${jsContent.length} bytes`);
  console.log(`CSS: ${cssContent.length} bytes`);

  if (DRY_RUN) {
    console.log('\n[DRY-RUN] 実際のデプロイは行いません\n');
  }

  // 方法: Code Snippetsプラグインがあれば使用
  // なければ、カスタムHTMLを生成してWordPress管理画面で設置

  console.log('\n=== デプロイ方法 ===\n');

  console.log('【方法1】Code Snippetsプラグイン（推奨）\n');
  console.log('1. WordPress管理画面 → スニペット → 新規追加');
  console.log('2. 以下のPHPコードを追加:\n');

  const snippetCode = `
// パワースポットフィルターUI
add_action('wp_enqueue_scripts', function() {
    if (!is_post_type_archive('powerspot')) return;

    // インラインCSS
    wp_register_style('powerspot-filter', false);
    wp_enqueue_style('powerspot-filter');
    wp_add_inline_style('powerspot-filter', <<<'CSS'
${cssContent}
CSS
    );

    // インラインJS
    wp_register_script('powerspot-filter', '', [], '', true);
    wp_enqueue_script('powerspot-filter');
    wp_add_inline_script('powerspot-filter', <<<'JS'
${jsContent}
JS
    );
});
`;

  // スニペットコードをファイルに保存
  const snippetFile = path.join(ASSETS_DIR, 'code-snippet.php');
  fs.writeFileSync(snippetFile, `<?php\n${snippetCode}`);
  console.log(`スニペットコードを保存: ${snippetFile}\n`);

  console.log('---\n');
  console.log('【方法2】Astraテーマのカスタムコード\n');
  console.log('1. WordPress管理画面 → 外観 → カスタマイズ');
  console.log('2. 追加CSS にCSSを追加');
  console.log('3. Astra設定 → Custom Code → ヘッダー/フッター にJSを追加\n');

  console.log('---\n');
  console.log('【方法3】直接REST API経由で設定\n');

  // Jetpack カスタムCSSがあれば使用可能かチェック
  try {
    const response = await axios.get(`${WP_SITE_URL}/wp-json/`, { headers });
    const routes = Object.keys(response.data.routes);

    if (routes.some(r => r.includes('jetpack') && r.includes('css'))) {
      console.log('Jetpack Custom CSSが利用可能です');
    }

    // カスタマイザー設定をチェック
    if (routes.includes('/wp/v2/settings')) {
      console.log('WordPress Settings APIが利用可能です');
    }
  } catch (e) {
    console.log('API確認エラー:', e.message);
  }

  console.log('\n=== 推奨手順 ===\n');
  console.log('1. Code Snippetsプラグインをインストール（まだの場合）');
  console.log('2. 新規スニペットを作成');
  console.log('3. code-snippet.php の内容をコピー＆ペースト');
  console.log('4. 「フロントエンドのみ」を選択');
  console.log('5. 有効化');
  console.log('6. /powerspot/ ページでフィルターが表示されることを確認\n');

  return snippetFile;
}

/**
 * Code Snippetsプラグインがインストールされているか確認
 */
async function checkCodeSnippets() {
  try {
    const plugins = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/plugins`, { headers });
    const codeSnippets = plugins.data.find(p => p.plugin.includes('code-snippets'));

    if (codeSnippets) {
      console.log(`\n✅ Code Snippets: ${codeSnippets.status}`);
      return codeSnippets.status === 'active';
    } else {
      console.log('\n⚠️ Code Snippetsプラグインが見つかりません');

      if (!DRY_RUN) {
        console.log('インストールを試みます...');
        try {
          await axios.post(`${WP_SITE_URL}/wp-json/wp/v2/plugins`, {
            slug: 'code-snippets',
            status: 'active'
          }, { headers });
          console.log('✅ Code Snippetsをインストール・有効化しました');
          return true;
        } catch (e) {
          console.log('インストールエラー:', e.response?.data?.message || e.message);
          return false;
        }
      }
      return false;
    }
  } catch (e) {
    console.log('プラグイン確認エラー:', e.message);
    return false;
  }
}

/**
 * メイン
 */
async function main() {
  console.log('パワースポット フィルターUI デプロイ');
  console.log('====================================');
  console.log(`モード: ${DRY_RUN ? 'DRY-RUN' : '実行'}`);
  console.log(`対象: ${WP_SITE_URL}\n`);

  // Code Snippetsプラグイン確認
  await checkCodeSnippets();

  // デプロイ
  const snippetFile = await deployViaCustomHTML();

  console.log('====================================');
  console.log('完了');
  console.log(`\n生成ファイル: ${snippetFile}`);
}

main().catch(console.error);
