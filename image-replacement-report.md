# パワースポット投稿 画像差し替え作業レポート

**実行日時**: 2025-12-31  
**対象サイト**: https://k005.net

## 作業結果サマリー

### ✅ 画像アップロード: 成功（30枚）

Pixabay APIから画像を取得し、WordPressメディアライブラリに正常にアップロードしました。

#### アップロードされた画像

| スポット名 | 画像1 ID | 画像2 ID |
|---|---|---|
| 恐山 (osorezan) | 2673 | 2674 |
| 識名宮-EN (shikina-gu-en) | 2675 | 2676 |
| 識名宮 (shikina-gu) | 2677 | 2678 |
| 祐徳稲荷神社-EN (yutoku-inari-jinja-en) | 2679 | 2680 |
| 祐徳稲荷神社 (yutoku-inari-jinja) | 2681 | 2682 |
| 晴明神社-EN (seimei-jinja-en) | 2683 | 2684 |
| 晴明神社 (seimei-jinja) | 2685 | 2686 |
| 佐渡金山-EN (sado-kinzan-en) | 2687 | 2688 |
| 佐渡金山 (sado-kinzan) | 2689 | 2690 |
| 厳島神社-EN (itsukushima-jinja-en) | 2691 | 2692 |
| 厳島神社 (itsukushima-jinja) | 2693 | 2694 |
| 諏訪大社-EN (suwa-taisha-en) | 2695 | 2696 |
| 諏訪大社 (suwa-taisha) | 2697 | 2698 |
| 石鎚神社-EN (ishizuchi-jinja-en) | 2699 | 2700 |
| 石鎚神社 (ishizuchi-jinja) | 2701 | 2702 |

### ❌ 投稿更新: 失敗（15件）

**理由**: 指定された投稿ID（2570-2584）が存在しません

## WordPress投稿の現状

WordPressサイトで投稿を検索した結果：
- **総投稿数**: 1件のみ（ID:2617 - sample）
- 指定された15件のパワースポット投稿は存在していません

## アップロード済み画像の使用方法

画像は既にWordPressにアップロードされているため、以下の方法で利用できます：

### 方法1: WordPress管理画面から手動挿入

メディアライブラリから画像を選択して投稿に挿入
- https://k005.net/wp-admin/upload.php

### 方法2: 正しい投稿IDで再実行

正しい投稿IDが判明したら、update-powerspot-images.js を更新して再実行してください。
