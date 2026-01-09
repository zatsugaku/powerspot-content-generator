/**
 * パワースポット相性診断ウィジェット デプロイスクリプト
 * WordPress Code Snippetsプラグインにアップロード
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// 読み込むファイル
const JS_FILE = path.join(__dirname, 'wordpress-assets', 'powerspot-diagnosis-widget.js');
const CSS_FILE = path.join(__dirname, 'wordpress-assets', 'powerspot-diagnosis-widget.css');
const PHP_FILE = path.join(__dirname, 'wordpress-assets', 'powerspot-diagnosis-loader.php');

/**
 * Code Snippetを作成または更新
 */
async function deployToCodeSnippets() {
  console.log('パワースポット相性診断ウィジェットをデプロイ中...\n');

  // PHPファイルを読み込み
  const phpContent = fs.readFileSync(PHP_FILE, 'utf-8');

  // CSS/JSを埋め込んだPHPを生成
  const jsContent = fs.readFileSync(JS_FILE, 'utf-8');
  const cssContent = fs.readFileSync(CSS_FILE, 'utf-8');

  // インラインでアセットを読み込むPHPコードを生成
  const fullPhpCode = `<?php
/**
 * パワースポット相性診断ウィジェット
 * k005.net専用 - 自動生成コード
 * 生成日時: ${new Date().toISOString()}
 */

// 直接アクセス禁止
if (!defined('ABSPATH')) {
    exit;
}

/**
 * アセットをインラインで出力
 */
function powerspot_diagnosis_inline_assets() {
    if (!is_singular('powerspot') && !has_shortcode(get_post()->post_content ?? '', 'powerspot_diagnosis')) {
        return;
    }
    ?>
    <style id="powerspot-diagnosis-css">
${cssContent}
    </style>
    <script id="powerspot-diagnosis-js">
${jsContent}
    </script>
    <?php
}
add_action('wp_footer', 'powerspot_diagnosis_inline_assets', 20);

/**
 * ショートコード: [powerspot_diagnosis]
 */
function powerspot_diagnosis_shortcode($atts) {
    $atts = shortcode_atts(array(
        'name' => 'このパワースポット',
        'wood' => '0.85',
        'fire' => '0.85',
        'earth' => '0.85',
        'metal' => '0.85',
        'water' => '0.85',
        'energy' => '0.85'
    ), $atts, 'powerspot_diagnosis');

    $attributes = json_encode(array(
        '木' => floatval($atts['wood']),
        '火' => floatval($atts['fire']),
        '土' => floatval($atts['earth']),
        '金' => floatval($atts['metal']),
        '水' => floatval($atts['water']),
        'ベースエネルギー' => floatval($atts['energy'])
    ), JSON_UNESCAPED_UNICODE);

    $name = esc_attr($atts['name']);
    $attributes_escaped = esc_attr($attributes);

    ob_start();
    ?>
    <div class="powerspot-diagnosis-widget"
         data-powerspot-name="<?php echo $name; ?>"
         data-powerspot-attributes="<?php echo $attributes_escaped; ?>">

        <h3>このパワースポットとの相性を診断</h3>
        <p><?php echo $name; ?>との相性をチェック！あなたの縁タイプを診断します。</p>

        <form class="diagnosis-form" aria-label="パワースポット相性診断フォーム">
            <div class="form-group">
                <label for="diagnosis-birthday-<?php echo esc_attr(uniqid()); ?>">生年月日</label>
                <input type="date"
                       name="birthday"
                       required
                       aria-required="true">
            </div>

            <div class="form-group">
                <label for="diagnosis-name-<?php echo esc_attr(uniqid()); ?>">お名前（ひらがな）</label>
                <input type="text"
                       name="name"
                       placeholder="例: やまだ たろう"
                       pattern="[ぁ-んー\\s]+"
                       aria-describedby="name-hint">
                <p class="form-hint">※ひらがなで入力してください（任意）</p>
            </div>

            <button type="submit" class="diagnosis-submit">
                無料診断する
            </button>
        </form>

        <div class="diagnosis-result-container" aria-live="polite">
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('powerspot_diagnosis', 'powerspot_diagnosis_shortcode');
`;

  // 既存のスニペットを検索
  const SNIPPET_NAME = 'パワースポット相性診断ウィジェット';

  try {
    // Code Snippets REST API
    const snippetsUrl = `${WP_SITE_URL}/wp-json/code-snippets/v1/snippets`;

    // 既存スニペットを検索
    let existingSnippet = null;
    try {
      const response = await axios.get(snippetsUrl, {
        headers: { Authorization: `Basic ${auth}` }
      });

      existingSnippet = response.data.find(s => s.name === SNIPPET_NAME);
    } catch (e) {
      console.log('既存スニペット検索中にエラー（新規作成します）');
    }

    if (existingSnippet) {
      // 更新
      console.log(`既存スニペット (ID: ${existingSnippet.id}) を更新中...`);

      await axios.put(
        `${snippetsUrl}/${existingSnippet.id}`,
        {
          name: SNIPPET_NAME,
          code: fullPhpCode.replace('<?php\n', ''),
          active: true,
          scope: 'global'
        },
        { headers: { Authorization: `Basic ${auth}` } }
      );

      console.log('スニペットを更新しました！');
    } else {
      // 新規作成
      console.log('新規スニペットを作成中...');

      const result = await axios.post(
        snippetsUrl,
        {
          name: SNIPPET_NAME,
          code: fullPhpCode.replace('<?php\n', ''),
          active: true,
          scope: 'global',
          description: 'パワースポット相性診断ウィジェット（自動生成）'
        },
        { headers: { Authorization: `Basic ${auth}` } }
      );

      console.log(`スニペットを作成しました！ ID: ${result.data.id}`);
    }

    console.log('\n--------------------');
    console.log('デプロイ完了！');
    console.log('--------------------\n');
    console.log('使用方法:');
    console.log('記事内に以下のショートコードを追加してください:\n');
    console.log('[powerspot_diagnosis name="伊勢神宮" wood="0.9" fire="0.95" earth="0.95" metal="0.85" water="0.9" energy="0.98"]');
    console.log('\n各パラメータ:');
    console.log('  name   : パワースポット名');
    console.log('  wood   : 木の属性値 (0.0-1.0)');
    console.log('  fire   : 火の属性値 (0.0-1.0)');
    console.log('  earth  : 土の属性値 (0.0-1.0)');
    console.log('  metal  : 金の属性値 (0.0-1.0)');
    console.log('  water  : 水の属性値 (0.0-1.0)');
    console.log('  energy : ベースエネルギー (0.0-1.0)');

  } catch (error) {
    console.error('デプロイエラー:', error.response?.data || error.message);
    process.exit(1);
  }
}

// 実行
deployToCodeSnippets();
