#!/usr/bin/env node
// タクソノミーのスラッグを日本語から英語に変更

require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// スラッグマッピング
const taxonomyUpdates = {
  powerspot_area: {
    '北海道・東北': 'hokkaido-tohoku',
    '関東': 'kanto',
    '中部・北陸': 'chubu-hokuriku',
    '関西': 'kansai',
    '中国・四国': 'chugoku-shikoku',
    '九州・沖縄': 'kyushu-okinawa'
  },
  powerspot_type: {
    '神社': 'shrine',
    '寺院': 'temple',
    '山・自然': 'nature',
    '湖・海': 'lake-sea',
    '遺跡・史跡': 'ruins',
    'その他': 'other'
  },
  powerspot_benefit: {
    '縁結び・恋愛運': 'love-marriage',
    '金運・仕事運': 'money-career',
    '健康・病気平癒': 'health',
    '学業・合格祈願': 'study-exam',
    '厄除け・開運': 'fortune',
    '子宝・安産': 'fertility-childbirth',
    '家内安全': 'family-safety',
    '商売繁盛': 'business',
    '交通安全': 'traffic-safety',
    '心願成就': 'wish-fulfillment'
  }
};

async function updateTaxonomySlug(taxonomy, oldSlug, newSlug, name) {
  try {
    // まず既存のタームを検索
    const searchResponse = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/${taxonomy}?search=${encodeURIComponent(name)}`,
      {
        headers: { 'Authorization': `Basic ${auth}` }
      }
    );

    if (searchResponse.data.length === 0) {
      console.log(`⚠️  ${taxonomy}: "${name}" が見つかりません`);
      return;
    }

    const termId = searchResponse.data[0].id;
    const currentSlug = searchResponse.data[0].slug;

    console.log(`\n📝 更新中: ${name}`);
    console.log(`   タームID: ${termId}`);
    console.log(`   現在のスラッグ: ${currentSlug}`);
    console.log(`   新しいスラッグ: ${newSlug}`);

    // スラッグを更新
    const updateResponse = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/${taxonomy}/${termId}`,
      {
        slug: newSlug
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`   ✅ 更新完了`);
    console.log(`   新しいURL: ${WP_SITE_URL}/${taxonomy}/${newSlug}/`);

  } catch (error) {
    console.error(`❌ エラー (${name}):`, error.response?.data?.message || error.message);
  }
}

async function updateAllTaxonomies() {
  console.log('\n🔄 タクソノミースラッグを英語に更新中...\n');
  console.log('=' .repeat(60));

  for (const [taxonomy, terms] of Object.entries(taxonomyUpdates)) {
    console.log(`\n\n【${taxonomy}】`);
    console.log('-'.repeat(60));

    for (const [name, newSlug] of Object.entries(terms)) {
      await updateTaxonomySlug(taxonomy, name, newSlug, name);
      // API制限を避けるため少し待つ
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('✅ すべてのタクソノミースラッグを更新しました！\n');
  console.log('💡 次のステップ:');
  console.log('1. トップページのリンクを英語スラッグに更新');
  console.log('2. 既存の記事が正しいタクソノミーに紐付いているか確認');
}

updateAllTaxonomies();
