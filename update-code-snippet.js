/**
 * Code Snippetsの更新スクリプト
 *
 * フィルターUI改善版をWordPressに適用
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');
const headers = { Authorization: 'Basic ' + auth };

// アセットファイル
const ASSETS_DIR = path.join(__dirname, 'wordpress-assets');
const JS_FILE = path.join(ASSETS_DIR, 'powerspot-filter.js');
const CSS_FILE = path.join(ASSETS_DIR, 'powerspot-filter.css');

async function main() {
  console.log('=== フィルターUI v1.1 更新 ===\n');

  // ファイル読み込み
  const jsContent = fs.readFileSync(JS_FILE, 'utf8');
  const cssContent = fs.readFileSync(CSS_FILE, 'utf8');

  console.log(`JavaScript: ${jsContent.length} bytes`);
  console.log(`CSS: ${cssContent.length} bytes`);

  // PHPコード生成
  const phpCode = `
// パワースポットフィルターUI v1.1
// 改善: ARIA属性、構造化データ、コントラスト改善、iPad対応
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

  try {
    // Code Snippets REST APIにアクセス
    console.log('\nCode Snippets APIに接続中...');

    // まずスニペット一覧を取得
    const listResponse = await axios.get(
      `${WP_SITE_URL}/wp-json/code-snippets/v1/snippets`,
      {
        headers,
        validateStatus: () => true
      }
    );

    if (listResponse.status === 401 || listResponse.status === 403) {
      console.log('\n⚠️ Code Snippets REST APIへのアクセス権限がありません。');
      console.log('以下の方法で手動更新してください:\n');
      console.log('1. WordPress管理画面にログイン');
      console.log('2. スニペット → すべてのスニペット');
      console.log('3. 「パワースポットフィルターUI」を編集');
      console.log('4. code-snippet.php の内容で置き換え');
      console.log('5. 保存して有効化\n');

      // 更新用PHPファイルを生成
      const snippetFile = path.join(ASSETS_DIR, 'code-snippet-v1.1.php');
      fs.writeFileSync(snippetFile, `<?php\n${phpCode}`);
      console.log(`更新用ファイル: ${snippetFile}`);

      return;
    }

    const snippets = listResponse.data;
    const filterSnippet = snippets.find(s => s.name && s.name.includes('フィルター'));

    if (filterSnippet) {
      console.log(`\n既存のスニペットを更新: ID ${filterSnippet.id}`);

      // スニペットを更新
      const updateResponse = await axios.put(
        `${WP_SITE_URL}/wp-json/code-snippets/v1/snippets/${filterSnippet.id}`,
        {
          code: phpCode,
          active: true
        },
        { headers }
      );

      console.log('✅ スニペットを更新しました');
    } else {
      console.log('\n新規スニペットを作成...');

      // 新規作成
      const createResponse = await axios.post(
        `${WP_SITE_URL}/wp-json/code-snippets/v1/snippets`,
        {
          name: 'パワースポットフィルターUI v1.1',
          desc: 'ARIA対応、構造化データ、レスポンシブ改善版',
          code: phpCode,
          scope: 'front-end',
          priority: 10,
          active: true
        },
        { headers }
      );

      console.log('✅ スニペットを作成しました');
    }

  } catch (error) {
    console.error('エラー:', error.response?.data?.message || error.message);

    // フォールバック: ファイルを生成
    const snippetFile = path.join(ASSETS_DIR, 'code-snippet-v1.1.php');
    fs.writeFileSync(snippetFile, `<?php\n${phpCode}`);
    console.log(`\n⚠️ 手動更新用ファイルを生成: ${snippetFile}`);
  }

  console.log('\n=== 完了 ===');
}

main().catch(console.error);
