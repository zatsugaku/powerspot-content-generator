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
        '1.0.0'
    );

    // JavaScript読み込み
    wp_enqueue_script(
        'powerspot-filter',
        $base_url . '/powerspot-filter.js',
        [],
        '1.0.0',
        true // フッターで読み込み
    );
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
