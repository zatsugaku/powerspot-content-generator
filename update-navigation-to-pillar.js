/**
 * ナビゲーションメニューをピラーページにリンクするよう更新
 */

const axios = require('axios');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');
const headers = { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' };

// 新しいピラーページURL
const AREA_PILLAR_PAGES = {
  '北海道': '/hokkaido-powerspot/',
  '東北': '/tohoku-powerspot/',
  '関東': '/kanto-powerspot/',
  '中部': '/chubu-powerspot/',
  '近畿': '/kinki-powerspot/',
  '中国': '/chugoku-powerspot/',
  '四国': '/shikoku-powerspot/',
  '九州・沖縄': '/kyushu-okinawa-powerspot/'
};

async function main() {
  console.log('=== ナビゲーションメニュー更新 ===\n');

  try {
    // メニュー項目を取得
    const menuRes = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/menu-items?menus=230&per_page=100`,
      { headers }
    );

    const menuItems = menuRes.data;
    console.log(`メニュー項目: ${menuItems.length}件\n`);

    let updateCount = 0;

    for (const item of menuItems) {
      const title = item.title.rendered;

      // エリア名に一致するピラーページURLがあれば更新
      if (AREA_PILLAR_PAGES[title]) {
        const newUrl = WP_SITE_URL + AREA_PILLAR_PAGES[title];

        if (item.url !== newUrl) {
          console.log(`更新: ${title}`);
          console.log(`  旧URL: ${item.url}`);
          console.log(`  新URL: ${newUrl}`);

          await axios.post(
            `${WP_SITE_URL}/wp-json/wp/v2/menu-items/${item.id}`,
            { url: newUrl },
            { headers }
          );

          updateCount++;
        }
      }
    }

    console.log(`\n更新件数: ${updateCount}件`);

  } catch (e) {
    console.error('エラー:', e.response?.data?.message || e.message);
  }
}

main().catch(console.error);
