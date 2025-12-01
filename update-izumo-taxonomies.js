#!/usr/bin/env node
// 出雲大社のタクソノミーを設定

require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

const POST_ID = 2410;

// 設定するタクソノミー
const taxonomies = {
  powerspot_region: '島根県',
  powerspot_area: '中国・四国',  // 英語スラッグ: chugoku-shikoku
  powerspot_type: '神社',    // 英語スラッグ: shrine
  powerspot_benefit: ['縁結び・恋愛運', '子宝・安産', '家内安全', '商売繁盛'] // love-marriage, fertility-childbirth, family-safety, business
};

async function getTermId(taxonomy, termName) {
  try {
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/${taxonomy}?search=${encodeURIComponent(termName)}`,
      {
        headers: { 'Authorization': `Basic ${auth}` }
      }
    );

    if (response.data.length > 0) {
      return response.data[0].id;
    }
    return null;
  } catch (error) {
    console.error(`❌ エラー (${taxonomy}/${termName}):`, error.message);
    return null;
  }
}

async function updateTaxonomies() {
  console.log('\n📝 出雲大社（ID: 2410）のタクソノミーを設定中...\n');

  // 地域（powerspot_region）
  console.log('1. 地域を設定中...');
  const regionId = await getTermId('powerspot_region', taxonomies.powerspot_region);
  if (regionId) {
    console.log(`   ✅ ${taxonomies.powerspot_region} (ID: ${regionId})`);
  }

  // エリア（powerspot_area）
  console.log('\n2. エリアを設定中...');
  const areaId = await getTermId('powerspot_area', taxonomies.powerspot_area);
  if (areaId) {
    console.log(`   ✅ ${taxonomies.powerspot_area} (ID: ${areaId})`);
  }

  // タイプ（powerspot_type）
  console.log('\n3. スポットタイプを設定中...');
  const typeId = await getTermId('powerspot_type', taxonomies.powerspot_type);
  if (typeId) {
    console.log(`   ✅ ${taxonomies.powerspot_type} (ID: ${typeId})`);
  }

  // ご利益（powerspot_benefit）複数
  console.log('\n4. ご利益を設定中...');
  const benefitIds = [];
  for (const benefit of taxonomies.powerspot_benefit) {
    const benefitId = await getTermId('powerspot_benefit', benefit);
    if (benefitId) {
      benefitIds.push(benefitId);
      console.log(`   ✅ ${benefit} (ID: ${benefitId})`);
    }
  }

  // 投稿を更新
  console.log('\n5. 投稿にタクソノミーを設定中...');

  const updateData = {};
  if (regionId) updateData.powerspot_region = [regionId];
  if (areaId) updateData.powerspot_area = [areaId];
  if (typeId) updateData.powerspot_type = [typeId];
  if (benefitIds.length > 0) updateData.powerspot_benefit = benefitIds;

  try {
    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot/${POST_ID}`,
      updateData,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ タクソノミー設定完了！\n');
    console.log('【設定内容】');
    console.log(`地域: ${taxonomies.powerspot_region}`);
    console.log(`エリア: ${taxonomies.powerspot_area}`);
    console.log(`タイプ: ${taxonomies.powerspot_type}`);
    console.log(`ご利益: ${taxonomies.powerspot_benefit.join('、')}`);
    console.log('');
    console.log('💡 確認URL:');
    console.log(`   ${WP_SITE_URL}/wp-admin/post.php?post=${POST_ID}&action=edit`);

  } catch (error) {
    console.error('❌ エラー:', error.response?.data || error.message);
  }
}

updateTaxonomies();
