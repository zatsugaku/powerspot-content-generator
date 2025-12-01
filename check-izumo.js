const axios = require('axios');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

async function checkIzumo() {
  try {
    // powerspotカスタム投稿タイプで確認
    const powerspots = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot?per_page=100`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    console.log('powerspotカスタム投稿一覧:\n');
    powerspots.data.forEach((p, i) => {
      const title = p.title.rendered.split('|')[0].trim();
      console.log(`${i+1}. ${title}`);
      console.log(`   ID: ${p.id}, スラッグ: ${p.slug}`);
      console.log(`   URL: ${WP_SITE_URL}/powerspot/${p.slug}/\n`);
    });

    console.log(`合計: ${powerspots.data.length}件`);

    // 出雲大社を探す
    const izumo = powerspots.data.find(p => p.title.rendered.includes('出雲'));
    if (izumo) {
      console.log('\n✅ 出雲大社はpowerspotカスタム投稿タイプです');
    } else {
      console.log('\n⚠️  出雲大社が見つかりません');
    }
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

checkIzumo();
