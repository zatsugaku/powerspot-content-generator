# サイト改善実装ガイド

作成日: 2026-01-07
ステータス: 作業中

## 完了した作業

- [x] タクソノミー調査
- [x] 空ターム削除（10件）
- [x] メニュー構造データ生成（`generate-menu-structure.js`）

---

## 調査結果サマリー

### 良いニュース
- タクソノミーアーカイブページは**機能している**
  - `/powerspot_area/kanto/` → 関東のパワースポット4件表示 ✅
  - `/powerspot_benefit/fortune/` → 厄除け・開運10件表示 ✅
- 画像付きカード表示は動作している ✅

### 問題点
1. **ナビゲーション**: 「パワースポット一覧」の1項目のみ
2. **トップページのリンク**: 「地域から探す」等がどこにリンクしているか不明
3. **フィルターUI**: 一覧ページにフィルターがない
4. **検索機能**: サイト内検索がない
5. **目次**: 記事に目次がない
6. **タクソノミー重複**: 同じ名前のタームが複数存在

---

## 実装タスク

### Phase 1: ナビゲーション改善（WordPress管理画面）

#### 1-1. メニュー構造の拡充

**場所**: 外観 → メニュー

**現状**:
```
- パワースポット一覧
```

**目標**:
```
- トップ
- エリアから探す ▼
  - 北海道 (/powerspot_area/北海道/)
  - 東北 (/powerspot_area/東北/)
  - 関東 (/powerspot_area/kanto/)
  - 中部 (/powerspot_area/中部/)
  - 近畿 (/powerspot_area/近畿/)
  - 中国 (/powerspot_area/中国/)
  - 四国 (/powerspot_area/四国/)
  - 九州 (/powerspot_area/九州/)
  - 沖縄 (/powerspot_area/沖縄/)
- ご利益から探す ▼
  - 縁結び・恋愛運 (/powerspot_benefit/love-marriage/)
  - 金運・仕事運 (/powerspot_benefit/money-career/)
  - 厄除け・開運 (/powerspot_benefit/fortune/)
  - 健康・病気平癒 (/powerspot_benefit/health/)
  - 商売繁盛 (/powerspot_benefit/business/)
  - 家内安全 (/powerspot_benefit/family-safety/)
  - 学業・合格祈願 (/powerspot_benefit/study-exam/)
  - 子宝・安産 (/powerspot_benefit/fertility-childbirth/)
- タイプ別 ▼
  - 神社 (/powerspot_type/shrine/)
  - 寺院 (/powerspot_type/temple/)
  - 山・自然 (/powerspot_type/mountain-nature/)
  - 湖・海 (/powerspot_type/lake-ocean/)
- パワースポット一覧
```

**手順**:
1. WordPress管理画面 → 外観 → メニュー
2. 「新規メニュー作成」または既存メニューを編集
3. 「カスタムリンク」で各タクソノミーアーカイブへのリンクを追加
4. ドラッグ&ドロップで階層構造（ドロップダウン）を作成
5. 保存

**エリアリンク一覧**（コピー用）:
| 表示名 | URL |
|--------|-----|
| 北海道 | /powerspot_area/%e5%8c%97%e6%b5%b7%e9%81%93/ |
| 東北 | /powerspot_area/%e6%9d%b1%e5%8c%97/ |
| 関東 | /powerspot_area/kanto/ |
| 中部 | /powerspot_area/%e4%b8%ad%e9%83%a8/ |
| 近畿 | /powerspot_area/%e8%bf%91%e7%95%bf/ |
| 中国 | /powerspot_area/%e4%b8%ad%e5%9b%bd/ |
| 四国 | /powerspot_area/%e5%9b%9b%e5%9b%bd/ |
| 九州 | /powerspot_area/%e4%b9%9d%e5%b7%9e/ |
| 沖縄 | /powerspot_area/%e6%b2%96%e7%b8%84/ |

**ご利益リンク一覧**（コピー用）:
| 表示名 | URL |
|--------|-----|
| 縁結び・恋愛運 | /powerspot_benefit/love-marriage/ |
| 金運・仕事運 | /powerspot_benefit/money-career/ |
| 厄除け・開運 | /powerspot_benefit/fortune/ |
| 健康・病気平癒 | /powerspot_benefit/health/ |
| 商売繁盛 | /powerspot_benefit/business/ |
| 家内安全 | /powerspot_benefit/family-safety/ |
| 心願成就 | /powerspot_benefit/wish-fulfillment/ |

**タイプリンク一覧**（コピー用）:
| 表示名 | URL |
|--------|-----|
| 神社 | /powerspot_type/shrine/ |
| 寺院 | /powerspot_type/temple/ |
| 山・自然 | /powerspot_type/nature/ |
| 湖・海 | /powerspot_type/lake-sea/ |

---

### Phase 2: サイト内検索の追加

#### 2-1. ウィジェットで検索追加

**場所**: 外観 → ウィジェット

**手順**:
1. 「検索」ウィジェットを探す
2. ヘッダーまたはサイドバーに追加
3. プレースホルダーテキスト: 「パワースポットを検索...」

#### 2-2. より高度な検索（オプション）

**推奨プラグイン**: SearchWP または Relevanssi

**理由**:
- カスタム投稿タイプ（powerspot）に対応
- カスタムフィールドも検索対象に
- 関連度順でソート

---

### Phase 3: 目次（TOC）プラグインの導入

**推奨プラグイン**: Easy Table of Contents

**手順**:
1. プラグイン → 新規追加
2. 「Easy Table of Contents」を検索
3. インストール → 有効化
4. 設定 → Table of Contents
5. 設定項目:
   - 投稿タイプ: `powerspot` にチェック
   - 位置: 最初の見出しの前
   - 表示条件: 見出しが3個以上
   - 見出しレベル: H2, H3

**期待効果**:
- 長文記事（4,500-5,000字）の可読性向上
- ユーザーが目的のセクションに直接ジャンプ可能

---

### Phase 4: 一覧ページにフィルターUI追加

#### オプションA: プラグイン使用（推奨）

**推奨プラグイン**: FacetWP または Search & Filter Pro

**FacetWPの場合**:
1. プラグインをインストール
2. ファセット作成:
   - エリア（powerspot_area）
   - ご利益（powerspot_benefit）
   - タイプ（powerspot_type）
3. テンプレートまたはショートコードで表示

#### オプションB: カスタムコード（テーマ編集）

子テーマに `archive-powerspot.php` を作成し、フィルターフォームを実装。

```php
<?php
// archive-powerspot.php の例
get_header();
?>

<div class="powerspot-filters">
  <form method="get" action="<?php echo get_post_type_archive_link('powerspot'); ?>">
    <select name="area">
      <option value="">エリアを選択</option>
      <?php
      $areas = get_terms(['taxonomy' => 'powerspot_area', 'hide_empty' => true]);
      foreach ($areas as $area) {
        $selected = (isset($_GET['area']) && $_GET['area'] == $area->slug) ? 'selected' : '';
        echo "<option value='{$area->slug}' {$selected}>{$area->name}</option>";
      }
      ?>
    </select>

    <select name="benefit">
      <option value="">ご利益を選択</option>
      <?php
      $benefits = get_terms(['taxonomy' => 'powerspot_benefit', 'hide_empty' => true]);
      foreach ($benefits as $benefit) {
        $selected = (isset($_GET['benefit']) && $_GET['benefit'] == $benefit->slug) ? 'selected' : '';
        echo "<option value='{$benefit->slug}' {$selected}>{$benefit->name}</option>";
      }
      ?>
    </select>

    <button type="submit">絞り込む</button>
  </form>
</div>

<?php
// クエリ修正
$args = [
  'post_type' => 'powerspot',
  'posts_per_page' => 12,
  'paged' => get_query_var('paged') ? get_query_var('paged') : 1,
];

if (!empty($_GET['area'])) {
  $args['tax_query'][] = [
    'taxonomy' => 'powerspot_area',
    'field' => 'slug',
    'terms' => sanitize_text_field($_GET['area']),
  ];
}

if (!empty($_GET['benefit'])) {
  $args['tax_query'][] = [
    'taxonomy' => 'powerspot_benefit',
    'field' => 'slug',
    'terms' => sanitize_text_field($_GET['benefit']),
  ];
}

$query = new WP_Query($args);
// ... 記事ループ
?>
```

---

### Phase 5: 重複タクソノミーの整理

**発見された重複**:

| タクソノミー | 重複例 |
|-------------|--------|
| powerspot_area | 関東（ID:268, ID:57）、関西（ID:101, ID:59）など |
| powerspot_region | 三重県（ID:86, ID:89, ID:20）など多数 |
| powerspot_benefit | 厄除け・開運（ID:72, ID:105）など |
| powerspot_type | 神社（ID:62, ID:103） |

**対応方針**:
1. 各重複ペアのうち、投稿が紐付いている方を残す
2. 空のタームを削除
3. 投稿の紐付けを統一後、残りを削除

**手順**:
1. WordPress管理画面 → パワースポット → 各タクソノミー
2. 「件数: 0」のタームを削除
3. 重複がある場合、投稿を1つのタームに統一

**注意**:
- 削除前にバックアップを取ること
- 投稿の再割り当てが必要な場合あり

---

### Phase 6: トップページのリンク修正

**確認事項**:
トップページの「地域から探す」「ご利益から探す」「タイプ別」のリンク先を確認・修正

**手順**:
1. トップページがどのように構成されているか確認
   - 固定ページ + Elementor?
   - カスタムテンプレート?
2. 各リンクのhref属性を正しいタクソノミーアーカイブURLに修正

**正しいURL例**:
```
地域から探す:
- 北海道: /powerspot_area/北海道/  (URLエンコード: %E5%8C%97%E6%B5%B7%E9%81%93)
- 関東: /powerspot_area/kanto/

ご利益から探す:
- 縁結び: /powerspot_benefit/love-marriage/
- 金運: /powerspot_benefit/money-career/
- 厄除け: /powerspot_benefit/fortune/
```

---

## 優先順位

| 順位 | タスク | 工数 | 効果 |
|------|--------|------|------|
| 1 | ナビゲーション拡充 | 30分 | 即座に導線改善 |
| 2 | 検索機能追加 | 15分 | ユーザビリティ向上 |
| 3 | TOCプラグイン導入 | 15分 | 記事可読性向上 |
| 4 | 重複タクソノミー整理 | 1時間 | データ整合性 |
| 5 | トップページリンク修正 | 30分 | 導線修正 |
| 6 | フィルターUI追加 | 2-4時間 | 高度な絞り込み |

---

## 次のアクション

1. **今すぐ実行可能**: ナビゲーション拡充、検索追加、TOCプラグイン
2. **WordPress管理画面で確認が必要**: トップページの構成
3. **技術的検討が必要**: フィルターUIの実装方法

---

## 関連ファイル

- `site-improvement-report.md` - 総合改善レポート
- `competitor-analysis.md` - 競合分析
- `URGENT-SITE-FIX.md` - 緊急対応（完了）

