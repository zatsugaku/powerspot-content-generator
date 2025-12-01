#!/usr/bin/env node
// WordPressにGoogle Analytics 4コードを自動挿入

require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// Google Analytics 4 測定ID
const GA4_MEASUREMENT_ID = 'G-FXW5P6VDSJ';

// Google Analytics 4のトラッキングコード
const analyticsCode = `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA4_MEASUREMENT_ID}');
</script>
<!-- End Google Analytics 4 -->`;

async function installAnalytics() {
  console.log('\n📊 Google Analytics 4を設定中...\n');
  console.log(`測定ID: ${GA4_MEASUREMENT_ID}`);
  console.log('');

  try {
    // WordPress REST APIを使ってカスタムオプションに保存
    // （Simple Custom CSS and JSプラグインがない場合の代替方法）

    // カスタムHTMLウィジェットとしてヘッダーに挿入する方法を試す
    console.log('方法: WordPressの設定オプションに保存します...\n');

    // header_scriptオプションを作成/更新
    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/custom/v1/analytics`,
      {
        code: analyticsCode
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Google Analytics 4の設定が完了しました！\n');
    console.log('💡 確認方法:');
    console.log('1. https://k005.net にアクセス');
    console.log('2. Google Analyticsのリアルタイムレポートを確認\n');

  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  カスタムAPIエンドポイントが見つかりません。\n');
      console.log('手動設定が必要です。以下のいずれかの方法で設定してください:\n');

      console.log('【推奨】プラグインを使う方法:');
      console.log('1. WordPress管理画面 > プラグイン > 新規追加');
      console.log('2. "Insert Headers and Footers" を検索してインストール・有効化');
      console.log('3. 設定 > Insert Headers and Footers');
      console.log('4. "Scripts in Header" に以下を貼り付けて保存:\n');
      console.log(analyticsCode);
      console.log('\n---\n');

      console.log('【または】テーマファイルを直接編集:');
      console.log('1. WordPress管理画面 > 外観 > テーマファイルエディター');
      console.log('2. 右側から "テーマヘッダー (header.php)" を選択');
      console.log('3. </head> タグを探す');
      console.log('4. </head> の直前に以下を貼り付けて保存:\n');
      console.log(analyticsCode);

    } else {
      console.error('❌ エラー:', error.message);
    }
  }
}

installAnalytics();
