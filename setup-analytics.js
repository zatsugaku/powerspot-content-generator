#!/usr/bin/env node
// Google Analytics 4をWordPressに設定

require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// Google Analytics 4 測定ID
const GA4_MEASUREMENT_ID = 'G-FXW5P6VDSJ';

// Google Analytics 4のトラッキングコード
const analyticsCode = `
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA4_MEASUREMENT_ID}');
</script>
<!-- End Google Analytics 4 -->
`;

async function setupAnalytics() {
  console.log('\n📊 Google Analytics 4を設定中...\n');
  console.log(`測定ID: ${GA4_MEASUREMENT_ID}`);
  console.log('');

  try {
    // WordPressのカスタムフィールドにAnalyticsコードを保存
    // または、テーマのヘッダーに直接挿入する方法を案内

    console.log('✅ 以下のコードをWordPressのテーマに追加してください:\n');
    console.log('【方法1】外観 > テーマファイルエディター');
    console.log('1. header.php を開く');
    console.log('2. </head> タグの直前に以下を挿入:\n');
    console.log(analyticsCode);
    console.log('\n【方法2】プラグインを使用');
    console.log('1. プラグイン「Insert Headers and Footers」をインストール');
    console.log('2. 設定 > Insert Headers and Footers');
    console.log('3. "Scripts in Header" に上記コードを貼り付け\n');

    console.log('【方法3】functions.phpに追加（推奨）');
    console.log('外観 > テーマファイルエディター > functions.php の末尾に以下を追加:\n');

    const functionsCode = `
// Google Analytics 4
function add_google_analytics() {
?>
${analyticsCode}
<?php
}
add_action('wp_head', 'add_google_analytics');
`;

    console.log(functionsCode);

    console.log('\n💡 設定後の確認方法:');
    console.log('1. https://k005.net にアクセス');
    console.log('2. ページのソースを表示（右クリック > ページのソースを表示）');
    console.log('3. "G-FXW5P6VDSJ" で検索してコードが挿入されているか確認');
    console.log('4. Google Analytics（https://analytics.google.com）でリアルタイムレポートを確認');
    console.log('   （データ反映には数分かかる場合があります）\n');

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

setupAnalytics();
