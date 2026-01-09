<?php
/**
 * パワースポット相性診断ウィジェット WordPress組み込み
 * k005.net専用
 *
 * 使用方法:
 * 1. このファイルの内容をCode Snippetsプラグインに追加
 * 2. 記事内で [powerspot_diagnosis] ショートコードを使用
 *
 * ショートコード例:
 * [powerspot_diagnosis name="伊勢神宮" wood="0.9" fire="0.95" earth="0.95" metal="0.85" water="0.9" energy="0.98"]
 */

// 直接アクセス禁止
if (!defined('ABSPATH')) {
    exit;
}

/**
 * アセットを読み込み
 */
function powerspot_diagnosis_enqueue_assets() {
    // CSS
    wp_enqueue_style(
        'powerspot-diagnosis-widget',
        get_template_directory_uri() . '/assets/powerspot-diagnosis-widget.css',
        array(),
        '1.0.0'
    );

    // JavaScript
    wp_enqueue_script(
        'powerspot-diagnosis-widget',
        get_template_directory_uri() . '/assets/powerspot-diagnosis-widget.js',
        array(),
        '1.0.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'powerspot_diagnosis_enqueue_assets');

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

    // 五行属性をJSON形式で準備
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
                <label for="diagnosis-birthday">生年月日</label>
                <input type="date"
                       id="diagnosis-birthday"
                       name="birthday"
                       required
                       aria-required="true">
            </div>

            <div class="form-group">
                <label for="diagnosis-name">お名前（ひらがな）</label>
                <input type="text"
                       id="diagnosis-name"
                       name="name"
                       placeholder="例: やまだ たろう"
                       pattern="[ぁ-んー\s]+"
                       aria-describedby="name-hint">
                <p id="name-hint" class="form-hint">※ひらがなで入力してください（任意）</p>
            </div>

            <button type="submit" class="diagnosis-submit">
                無料診断する
            </button>
        </form>

        <div class="diagnosis-result-container" aria-live="polite">
            <!-- 診断結果がここに表示されます -->
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('powerspot_diagnosis', 'powerspot_diagnosis_shortcode');

/**
 * パワースポット記事に自動挿入（オプション）
 * powerspot カスタム投稿タイプの場合に自動で診断ウィジェットを挿入
 */
function powerspot_diagnosis_auto_insert($content) {
    // powerspot投稿タイプのみ
    if (!is_singular('powerspot')) {
        return $content;
    }

    // 既にショートコードがある場合はスキップ
    if (has_shortcode($content, 'powerspot_diagnosis')) {
        return $content;
    }

    // 投稿のカスタムフィールドから五行属性を取得（ACFなど使用時）
    $post_id = get_the_ID();
    $name = get_the_title();

    // タクソノミーから五行属性を取得（設定されている場合）
    $gogyo_terms = wp_get_post_terms($post_id, 'gogyo', array('fields' => 'slugs'));

    // デフォルト値
    $wood = 0.85;
    $fire = 0.85;
    $earth = 0.85;
    $metal = 0.85;
    $water = 0.85;
    $energy = 0.85;

    // カスタムフィールドがあれば使用（将来的な拡張用）
    if (function_exists('get_field')) {
        $wood = get_field('gogyo_wood', $post_id) ?: $wood;
        $fire = get_field('gogyo_fire', $post_id) ?: $fire;
        $earth = get_field('gogyo_earth', $post_id) ?: $earth;
        $metal = get_field('gogyo_metal', $post_id) ?: $metal;
        $water = get_field('gogyo_water', $post_id) ?: $water;
        $energy = get_field('base_energy', $post_id) ?: $energy;
    }

    // ショートコードを生成
    $shortcode = sprintf(
        '[powerspot_diagnosis name="%s" wood="%s" fire="%s" earth="%s" metal="%s" water="%s" energy="%s"]',
        esc_attr($name),
        $wood,
        $fire,
        $earth,
        $metal,
        $water,
        $energy
    );

    // 記事の後半に挿入（FAQ セクションの前あたり）
    // ここでは記事末尾に追加
    return $content . "\n\n" . do_shortcode($shortcode);
}
// 自動挿入を有効にする場合はコメントを外す
// add_filter('the_content', 'powerspot_diagnosis_auto_insert', 20);

/**
 * パワースポットデータベースから属性を取得するヘルパー関数
 */
function get_powerspot_attributes_from_db($powerspot_name) {
    // JSONデータベースのパス（実際の環境に合わせて調整）
    $db_path = get_template_directory() . '/data/powerspot-database.json';

    if (!file_exists($db_path)) {
        return null;
    }

    $json = file_get_contents($db_path);
    $data = json_decode($json, true);

    if (!$data) {
        return null;
    }

    foreach ($data as $spot) {
        if (isset($spot['パワースポット名']) && $spot['パワースポット名'] === $powerspot_name) {
            return array(
                'name' => $spot['パワースポット名'],
                'region' => $spot['地域'] ?? '',
                'energy' => $spot['ベースエネルギー'] ?? 0.85,
                'gogyo' => $spot['五行属性'] ?? array()
            );
        }
    }

    return null;
}
