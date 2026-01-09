<?php
/**
 * パワースポット相性診断 - サーバーサイドAPI版
 * k005.net専用
 *
 * 機能:
 * - REST APIエンドポイント（診断ロジックはサーバーサイド）
 * - レート制限（IP単位）
 * - 簡略化された結果のみ返す（詳細は有料版で）
 */

// 直接アクセス禁止
if (!defined('ABSPATH')) {
    exit;
}

// ==================== 定数定義 ====================

// 12自然現象
define('PS_PHENOMENA_MAP', [
    0 => "春霞", 1 => "夏雨", 2 => "彩雲", 3 => "朝日",
    4 => "夕陽", 5 => "秋風", 6 => "冬陽", 7 => "朧月",
    8 => "霜夜", 9 => "氷刃", 10 => "春雷", 11 => "豊穣"
]);

// 12自然現象の説明（簡略版）
define('PS_PHENOMENA_BRIEF', [
    "春霞" => "柔軟で適応力が高い",
    "夏雨" => "情熱的で人との関わりを大切にする",
    "彩雲" => "多彩な才能を持ち創造性に富む",
    "朝日" => "希望に満ち前向きなエネルギーを持つ",
    "夕陽" => "穏やかで周囲に安心感を与える",
    "秋風" => "変化を恐れず新しいことに挑戦する",
    "冬陽" => "内に秘めた温かさで人を癒す",
    "朧月" => "直感力に優れ神秘的な魅力を持つ",
    "霜夜" => "冷静沈着で物事を深く見通す",
    "氷刃" => "決断力があり明確な意志を持つ",
    "春雷" => "行動力があり周囲を動かす力がある",
    "豊穣" => "包容力があり多くの人を支える"
]);

// 五行
define('PS_GOGYOU_MAP', ["木", "火", "土", "金", "水"]);

// 五行の説明（簡略版）
define('PS_GOGYOU_BRIEF', [
    "木" => "成長と発展",
    "火" => "情熱と活力",
    "土" => "安定と調和",
    "金" => "決断と浄化",
    "水" => "知恵と柔軟"
]);

// 五行相生関係
define('PS_SOGYO', [
    '木' => '火', '火' => '土', '土' => '金', '金' => '水', '水' => '木'
]);

// 五行相剋関係
define('PS_SOKOKU', [
    '木' => '土', '火' => '金', '土' => '水', '金' => '木', '水' => '火'
]);

// ==================== レート制限 ====================

class PS_Rate_Limiter {
    const LIMIT = 10;      // リクエスト数
    const WINDOW = 3600;   // 1時間（秒）

    public static function check($ip) {
        $transient_key = 'ps_rate_' . md5($ip);
        $count = get_transient($transient_key) ?: 0;

        if ($count >= self::LIMIT) {
            return false;
        }

        set_transient($transient_key, $count + 1, self::WINDOW);
        return true;
    }

    public static function get_remaining($ip) {
        $transient_key = 'ps_rate_' . md5($ip);
        $count = get_transient($transient_key) ?: 0;
        return max(0, self::LIMIT - $count);
    }
}

// ==================== 診断ロジック ====================

class PS_Diagnosis_Logic {

    /**
     * 60分類計算（縁診断ロジック）
     */
    public static function calculate_natural_type($birthdate) {
        $date = new DateTime($birthdate);
        $base_date = new DateTime('1900-01-01');

        $interval = $base_date->diff($date);
        $days_since_base = (int)$interval->format('%r%a');

        // 自然現象（12種類）
        $phenomena_index = (($days_since_base % 12) + 12) % 12;
        $phenomena = PS_PHENOMENA_MAP[$phenomena_index];

        // 五行（5種類）
        $gogyou_index = ((intdiv($days_since_base, 60) % 5) + 5) % 5;
        $element = PS_GOGYOU_MAP[$gogyou_index];

        return [
            'natural_type' => $element . 'の' . $phenomena,
            'element' => $element,
            'phenomena' => $phenomena,
            'element_brief' => PS_GOGYOU_BRIEF[$element],
            'phenomena_brief' => PS_PHENOMENA_BRIEF[$phenomena]
        ];
    }

    /**
     * パワースポットとの相性計算
     */
    public static function calculate_compatibility($user_element, $spot_attributes) {
        $elements = ['木', '火', '土', '金', '水'];

        // パワースポットの主要五行を特定
        $max_element = '土';
        $max_value = 0;
        foreach ($elements as $elem) {
            $value = isset($spot_attributes[$elem]) ? floatval($spot_attributes[$elem]) : 0;
            if ($value > $max_value) {
                $max_value = $value;
                $max_element = $elem;
            }
        }

        // 相性スコア計算
        $score = 3.0;

        // 同じ五行: +1.0
        if ($user_element === $max_element) {
            $score += 1.0;
        }

        // 相生関係（自分が生む）: +0.8
        if (PS_SOGYO[$user_element] === $max_element) {
            $score += 0.8;
        }

        // 相生関係（自分が生まれる）: +0.5
        if (PS_SOGYO[$max_element] === $user_element) {
            $score += 0.5;
        }

        // 相剋関係（自分が剋す）: -0.3
        if (PS_SOKOKU[$user_element] === $max_element) {
            $score -= 0.3;
        }

        // 相剋関係（自分が剋される）: -0.5
        if (PS_SOKOKU[$max_element] === $user_element) {
            $score -= 0.5;
        }

        // ベースエネルギーで調整
        $base_energy = isset($spot_attributes['energy']) ? floatval($spot_attributes['energy']) : 0.85;
        $score += ($base_energy - 0.85) * 2;

        // スコアを1-5に正規化
        $score = max(1, min(5, $score));

        // パーセンテージに変換（表示用）
        $percentage = round(($score / 5) * 100);

        // レベル判定
        if ($score >= 4.5) {
            $level = '最高';
        } elseif ($score >= 4.0) {
            $level = 'とても良い';
        } elseif ($score >= 3.5) {
            $level = '良い';
        } elseif ($score >= 3.0) {
            $level = '普通';
        } else {
            $level = 'やや注意';
        }

        return [
            'score' => round($score, 1),
            'percentage' => $percentage,
            'level' => $level,
            'spot_element' => $max_element
        ];
    }
}

// ==================== REST API ====================

add_action('rest_api_init', function() {
    register_rest_route('powerspot/v1', '/diagnosis', [
        'methods'  => 'POST',
        'callback' => 'ps_handle_diagnosis',
        'permission_callback' => '__return_true',
        'args' => [
            'birthdate' => [
                'required' => true,
                'validate_callback' => function($param) {
                    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $param);
                }
            ],
            'spot_name' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ],
            'spot_attributes' => [
                'required' => false,
                'sanitize_callback' => function($param) {
                    if (is_string($param)) {
                        return json_decode($param, true);
                    }
                    return $param;
                }
            ]
        ]
    ]);
});

function ps_handle_diagnosis($request) {
    // レート制限チェック
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    if (!PS_Rate_Limiter::check($ip)) {
        return new WP_Error(
            'rate_limit',
            '診断回数の上限に達しました。1時間後に再度お試しください。',
            ['status' => 429]
        );
    }

    $birthdate = $request->get_param('birthdate');
    $spot_name = $request->get_param('spot_name') ?: 'このパワースポット';
    $spot_attributes = $request->get_param('spot_attributes') ?: [];

    // 生年月日のバリデーション
    $date = DateTime::createFromFormat('Y-m-d', $birthdate);
    if (!$date || $date->format('Y-m-d') !== $birthdate) {
        return new WP_Error('invalid_date', '無効な日付形式です', ['status' => 400]);
    }

    // 未来の日付チェック
    if ($date > new DateTime()) {
        return new WP_Error('future_date', '未来の日付は指定できません', ['status' => 400]);
    }

    // 診断計算
    $type = PS_Diagnosis_Logic::calculate_natural_type($birthdate);

    $response = [
        'success' => true,
        'type_name' => $type['natural_type'],
        'element' => $type['element'],
        'element_brief' => $type['element_brief'],
        'phenomena_brief' => $type['phenomena_brief'],
        'remaining_requests' => PS_Rate_Limiter::get_remaining($ip)
    ];

    // パワースポット属性があれば相性計算
    if (!empty($spot_attributes)) {
        $compatibility = PS_Diagnosis_Logic::calculate_compatibility($type['element'], $spot_attributes);
        $response['compatibility'] = [
            'percentage' => $compatibility['percentage'],
            'level' => $compatibility['level']
        ];
        $response['spot_name'] = $spot_name;
    }

    return rest_ensure_response($response);
}

// ==================== ショートコード ====================

function ps_diagnosis_shortcode($atts) {
    $atts = shortcode_atts([
        'name' => 'このパワースポット',
        'wood' => '0.85',
        'fire' => '0.85',
        'earth' => '0.85',
        'metal' => '0.85',
        'water' => '0.85',
        'energy' => '0.85'
    ], $atts, 'powerspot_diagnosis');

    $attributes = json_encode([
        '木' => floatval($atts['wood']),
        '火' => floatval($atts['fire']),
        '土' => floatval($atts['earth']),
        '金' => floatval($atts['metal']),
        '水' => floatval($atts['water']),
        'energy' => floatval($atts['energy'])
    ], JSON_UNESCAPED_UNICODE);

    $name = esc_attr($atts['name']);
    $attributes_escaped = esc_attr($attributes);
    $api_url = esc_url(rest_url('powerspot/v1/diagnosis'));
    $nonce = wp_create_nonce('wp_rest');

    ob_start();
    ?>
    <div class="ps-diagnosis-widget"
         data-spot-name="<?php echo $name; ?>"
         data-spot-attributes="<?php echo $attributes_escaped; ?>"
         data-api-url="<?php echo $api_url; ?>"
         data-nonce="<?php echo $nonce; ?>">

        <h3>このパワースポットとの相性を診断</h3>
        <p><?php echo esc_html($name); ?>との相性をチェック！</p>

        <form class="ps-diagnosis-form">
            <div class="ps-form-group">
                <label for="ps-birthday">生年月日</label>
                <input type="date" id="ps-birthday" name="birthday" required>
            </div>

            <button type="submit" class="ps-submit-btn">
                無料で診断する
            </button>
        </form>

        <div class="ps-result-container" style="display: none;">
            <!-- 結果がここに表示されます -->
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('powerspot_diagnosis', 'ps_diagnosis_shortcode');

// ==================== フロントエンドアセット ====================

function ps_diagnosis_enqueue_assets() {
    // 診断ウィジェットがあるページでのみ読み込み
    global $post;
    if (!$post || !has_shortcode($post->post_content, 'powerspot_diagnosis')) {
        return;
    }

    // インラインCSS
    $css = '
    .ps-diagnosis-widget {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        padding: 32px;
        margin: 40px 0;
        box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
    }
    .ps-diagnosis-widget h3 {
        color: #fff;
        font-size: 1.4rem;
        margin: 0 0 8px 0;
    }
    .ps-diagnosis-widget > p {
        color: rgba(255, 255, 255, 0.9);
        margin: 0 0 24px 0;
    }
    .ps-diagnosis-form {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
    }
    .ps-form-group {
        margin-bottom: 20px;
    }
    .ps-form-group label {
        display: block;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
    }
    .ps-form-group input {
        width: 100%;
        padding: 14px 16px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
        box-sizing: border-box;
    }
    .ps-form-group input:focus {
        outline: none;
        border-color: #667eea;
    }
    .ps-submit-btn {
        width: 100%;
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
    }
    .ps-submit-btn:hover {
        opacity: 0.9;
    }
    .ps-submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .ps-result-container {
        margin-top: 24px;
    }
    .ps-result {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
    }
    .ps-result-section {
        padding: 16px 0;
        border-bottom: 1px solid #eee;
    }
    .ps-result-section:last-child {
        border-bottom: none;
    }
    .ps-result-section h4 {
        color: #333;
        font-size: 1rem;
        margin: 0 0 12px 0;
    }
    .ps-type-badge {
        display: inline-block;
        padding: 10px 20px;
        border-radius: 50px;
        color: #fff;
        font-weight: 600;
        font-size: 1.1rem;
        margin-bottom: 8px;
    }
    .ps-type-desc {
        color: #666;
        font-size: 0.95rem;
        margin: 0;
    }
    .ps-compat-score {
        font-size: 2.5rem;
        font-weight: 700;
        color: #667eea;
    }
    .ps-compat-level {
        display: inline-block;
        padding: 4px 12px;
        background: #e8f5e9;
        color: #2e7d32;
        border-radius: 20px;
        font-size: 0.9rem;
        margin-left: 12px;
    }
    .ps-cta-section {
        text-align: center;
        padding-top: 20px !important;
    }
    .ps-cta-btn {
        display: inline-block;
        padding: 14px 32px;
        background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
        color: #fff;
        text-decoration: none;
        border-radius: 50px;
        font-weight: 600;
    }
    .ps-cta-btn:hover {
        color: #fff;
        opacity: 0.9;
    }
    .ps-error {
        background: #ffebee;
        color: #c62828;
        padding: 12px;
        border-radius: 8px;
        margin-top: 16px;
    }
    @media (max-width: 768px) {
        .ps-diagnosis-widget {
            padding: 20px;
        }
    }
    ';
    wp_add_inline_style('wp-block-library', $css);

    // インラインJS
    $js = "
    document.addEventListener('DOMContentLoaded', function() {
        const widgets = document.querySelectorAll('.ps-diagnosis-widget');

        widgets.forEach(function(widget) {
            const form = widget.querySelector('.ps-diagnosis-form');
            const resultContainer = widget.querySelector('.ps-result-container');
            const apiUrl = widget.dataset.apiUrl;
            const spotName = widget.dataset.spotName;
            const spotAttributes = JSON.parse(widget.dataset.spotAttributes || '{}');

            form.addEventListener('submit', async function(e) {
                e.preventDefault();

                const birthday = form.querySelector('[name=\"birthday\"]').value;
                const submitBtn = form.querySelector('.ps-submit-btn');

                if (!birthday) {
                    alert('生年月日を入力してください');
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = '診断中...';

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            birthdate: birthday,
                            spot_name: spotName,
                            spot_attributes: spotAttributes
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || '診断に失敗しました');
                    }

                    displayResult(data, resultContainer, spotName);
                    resultContainer.style.display = 'block';
                    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

                } catch (error) {
                    resultContainer.innerHTML = '<div class=\"ps-error\">' + error.message + '</div>';
                    resultContainer.style.display = 'block';
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '無料で診断する';
                }
            });
        });

        function displayResult(data, container, spotName) {
            const elementColors = {
                '木': '#4CAF50',
                '火': '#F44336',
                '土': '#FF9800',
                '金': '#9E9E9E',
                '水': '#2196F3'
            };
            const color = elementColors[data.element] || '#667eea';

            let html = '<div class=\"ps-result\">';

            // 縁タイプ
            html += '<div class=\"ps-result-section\">';
            html += '<h4>あなたの縁タイプ</h4>';
            html += '<div class=\"ps-type-badge\" style=\"background: ' + color + '\">' + data.type_name + '</div>';
            html += '<p class=\"ps-type-desc\">' + data.phenomena_brief + '。' + data.element_brief + 'のエネルギーを持っています。</p>';
            html += '</div>';

            // 相性（あれば）
            if (data.compatibility) {
                html += '<div class=\"ps-result-section\">';
                html += '<h4>' + spotName + 'との相性</h4>';
                html += '<span class=\"ps-compat-score\">' + data.compatibility.percentage + '%</span>';
                html += '<span class=\"ps-compat-level\">' + data.compatibility.level + '</span>';
                html += '</div>';
            }

            // CTA
            html += '<div class=\"ps-result-section ps-cta-section\">';
            html += '<p>あなたに最適なパワースポット18選と<br>詳細な相性解説を見る</p>';
            html += '<a href=\"#\" class=\"ps-cta-btn\">詳細診断（¥980）</a>';
            html += '</div>';

            html += '</div>';

            container.innerHTML = html;
        }
    });
    ";
    wp_add_inline_script('wp-block-library', $js);
}
add_action('wp_enqueue_scripts', 'ps_diagnosis_enqueue_assets');
