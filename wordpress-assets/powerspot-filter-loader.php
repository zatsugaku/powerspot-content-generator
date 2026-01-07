<?php
/**
 * パワースポット フィルターUI ローダー
 *
 * このコードを以下のいずれかの方法で追加してください:
 * 1. Code Snippetsプラグインにスニペットとして追加
 * 2. 子テーマのfunctions.phpに追加
 * 3. mu-pluginsフォルダに配置
 *
 * 使用方法:
 * - powerspot-filter.js と powerspot-filter.css を
 *   wp-content/themes/[テーマ名]/assets/ にアップロード
 * - または、このコードのパスを適宜変更
 */

// パワースポットアーカイブページでのみ読み込み
add_action('wp_enqueue_scripts', function() {
    // powerspot アーカイブページかどうかチェック
    if (!is_post_type_archive('powerspot') && !is_tax(['powerspot_area', 'powerspot_benefit', 'powerspot_type'])) {
        return;
    }

    // アセットのベースURL（テーマディレクトリまたはカスタムパス）
    // 方法1: テーマ内に配置した場合
    $base_url = get_template_directory_uri() . '/assets';

    // 方法2: アップロードフォルダに配置した場合
    // $upload_dir = wp_upload_dir();
    // $base_url = $upload_dir['baseurl'] . '/powerspot-filter';

    // 方法3: プラグインとして配置した場合
    // $base_url = plugin_dir_url(__FILE__);

    // CSS読み込み
    wp_enqueue_style(
        'powerspot-filter',
        $base_url . '/powerspot-filter.css',
        [],
        '1.1.0'
    );

    // JavaScript読み込み
    wp_enqueue_script(
        'powerspot-filter',
        $base_url . '/powerspot-filter.js',
        [],
        '1.1.0',
        true // フッターで読み込み
    );
});

/**
 * noscriptフォールバック: JavaScript無効時の基本フィルター
 */
add_action('wp_footer', function() {
    if (!is_post_type_archive('powerspot') && !is_tax(['powerspot_area', 'powerspot_benefit', 'powerspot_type'])) {
        return;
    }

    // タクソノミーを取得
    $areas = get_terms(['taxonomy' => 'powerspot_area', 'hide_empty' => true]);
    $benefits = get_terms(['taxonomy' => 'powerspot_benefit', 'hide_empty' => true]);
    $types = get_terms(['taxonomy' => 'powerspot_type', 'hide_empty' => true]);

    ?>
    <noscript>
        <style>
            .powerspot-filter-noscript {
                background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 30px;
            }
            .powerspot-filter-noscript h3 {
                font-size: 1.25rem;
                margin-bottom: 16px;
            }
            .powerspot-filter-noscript select {
                padding: 10px;
                margin-right: 10px;
                margin-bottom: 10px;
                border-radius: 8px;
                border: 1px solid #ddd;
            }
            .powerspot-filter-noscript button {
                padding: 10px 20px;
                background: #4a90a4;
                color: #fff;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }
        </style>
        <div class="powerspot-filter-noscript">
            <h3>パワースポットを絞り込む</h3>
            <form method="get" action="<?php echo esc_url(get_post_type_archive_link('powerspot')); ?>">
                <select name="powerspot_area">
                    <option value="">すべてのエリア</option>
                    <?php foreach ($areas as $area): ?>
                        <option value="<?php echo esc_attr($area->term_id); ?>"><?php echo esc_html($area->name); ?> (<?php echo $area->count; ?>)</option>
                    <?php endforeach; ?>
                </select>
                <select name="powerspot_benefit">
                    <option value="">すべてのご利益</option>
                    <?php foreach ($benefits as $benefit): ?>
                        <option value="<?php echo esc_attr($benefit->term_id); ?>"><?php echo esc_html($benefit->name); ?> (<?php echo $benefit->count; ?>)</option>
                    <?php endforeach; ?>
                </select>
                <select name="powerspot_type">
                    <option value="">すべてのタイプ</option>
                    <?php foreach ($types as $type): ?>
                        <option value="<?php echo esc_attr($type->term_id); ?>"><?php echo esc_html($type->name); ?> (<?php echo $type->count; ?>)</option>
                    <?php endforeach; ?>
                </select>
                <button type="submit">絞り込む</button>
            </form>
        </div>
    </noscript>
    <?php
});

/**
 * オプション: REST APIレスポンスにアイキャッチ画像を追加
 * （_embedパラメータが使えない場合のフォールバック）
 */
add_action('rest_api_init', function() {
    register_rest_field('powerspot', 'featured_image_url', [
        'get_callback' => function($post) {
            $image_id = get_post_thumbnail_id($post['id']);
            if (!$image_id) {
                return null;
            }
            $image = wp_get_attachment_image_src($image_id, 'medium');
            return $image ? $image[0] : null;
        }
    ]);
});
