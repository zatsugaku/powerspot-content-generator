#!/usr/bin/env node
// パワースポットのタクソノミーとタームを作成

require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// エリアのタームを作成
const areas = [
  '北海道・東北',
  '関東',
  '中部・北陸',
  '関西',
  '中国・四国',
  '九州・沖縄'
];

// スポットタイプのタームを作成
const types = [
  '神社',
  '寺院',
  '山・自然',
  '湖・海',
  '遺跡・史跡',
  'その他'
];

// ご利益のタームを作成
const benefits = [
  '縁結び・恋愛運',
  '金運・仕事運',
  '健康・病気平癒',
  '学業・合格祈願',
  '厄除け・開運',
  '子宝・安産',
  '家内安全',
  '商売繁盛',
  '交通安全',
  '心願成就'
];

async function createTerm(taxonomy, termName) {
  try {
    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/${taxonomy}`,
      { name: termName },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`  ✅ ${termName} (ID: ${response.data.id})`);
    return response.data.id;

  } catch (error) {
    if (error.response?.data?.code === 'term_exists') {
      console.log(`  ⏭️  ${termName} (既に存在)`);
      return error.response.data.data.term_id;
    }
    console.error(`  ❌ ${termName}: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function main() {
  console.log('\n📋 パワースポットのタクソノミー・タームを作成します\n');

  // エリア
  console.log('🗺️  エリア (powerspot_area):');
  for (const area of areas) {
    await createTerm('powerspot_area', area);
  }

  console.log('\n🏛️  スポットタイプ (powerspot_type):');
  for (const type of types) {
    await createTerm('powerspot_type', type);
  }

  console.log('\n✨ ご利益 (powerspot_benefit):');
  for (const benefit of benefits) {
    await createTerm('powerspot_benefit', benefit);
  }

  console.log('\n🎉 完了しました！');
  console.log('\n💡 これらのタクソノミーは投稿時に以下のように指定できます:');
  console.log('   node post-powerspot-full.js "articles/伊勢神宮.md" \\');
  console.log('     --region "三重県" \\');
  console.log('     --area "関西" \\');
  console.log('     --type "神社" \\');
  console.log('     --benefits "縁結び・恋愛運,金運・仕事運"');
}

main().catch(err => {
  console.error('\n❌ エラー:', err.message);
  process.exit(1);
});
