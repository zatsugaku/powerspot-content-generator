#!/usr/bin/env node
// パワースポット投稿にタクソノミーを追加

require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const postId = process.argv[2];
const area = process.argv[3];
const type = process.argv[4];
const benefits = process.argv[5]; // カンマ区切り

if (!postId || !area || !type) {
  console.error('❌ 投稿ID、エリア、スポットタイプを指定してください');
  console.log('使用例: node update-powerspot-taxonomies.js 2376 "関西" "神社" "縁結び・恋愛運,厄除け・開運"');
  process.exit(1);
}

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// タクソノミー名からタームIDを取得
async function getTermId(taxonomy, termName) {
  try {
    const response = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/${taxonomy}`, {
      headers: { 'Authorization': `Basic ${auth}` },
      params: { search: termName, per_page: 100 }
    });

    const term = response.data.find(t => t.name === termName);
    if (term) {
      return term.id;
    }

    console.log(`⚠️  ${termName} が見つかりませんでした（${taxonomy}）`);
    return null;

  } catch (error) {
    console.error(`エラー（${taxonomy}）:`, error.response?.data || error.message);
    return null;
  }
}

async function updateTaxonomies() {
  try {
    console.log(`\n📊 投稿ID ${postId} にタクソノミーを設定中...\n`);

    // エリアIDを取得
    console.log(`🗺️  エリア「${area}」を検索中...`);
    const areaId = await getTermId('powerspot_area', area);
    if (!areaId) {
      console.error(`❌ エリア「${area}」が見つかりません`);
      process.exit(1);
    }
    console.log(`   ✅ ID: ${areaId}\n`);

    // スポットタイプIDを取得
    console.log(`🏛️  スポットタイプ「${type}」を検索中...`);
    const typeId = await getTermId('powerspot_type', type);
    if (!typeId) {
      console.error(`❌ スポットタイプ「${type}」が見つかりません`);
      process.exit(1);
    }
    console.log(`   ✅ ID: ${typeId}\n`);

    // ご利益IDを取得
    let benefitIds = [];
    if (benefits) {
      const benefitNames = benefits.split(',').map(b => b.trim());
      console.log(`✨ ご利益を検索中...`);
      for (const benefitName of benefitNames) {
        const benefitId = await getTermId('powerspot_benefit', benefitName);
        if (benefitId) {
          benefitIds.push(benefitId);
          console.log(`   ✅ ${benefitName} (ID: ${benefitId})`);
        }
      }
      console.log('');
    }

    // 投稿を更新
    console.log('📤 WordPressに送信中...\n');

    const updateData = {
      powerspot_area: [areaId],
      powerspot_type: [typeId]
    };

    if (benefitIds.length > 0) {
      updateData.powerspot_benefit = benefitIds;
    }

    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot/${postId}`,
      updateData,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ タクソノミーを設定しました！\n');
    console.log('【設定内容】');
    console.log(`投稿ID: ${response.data.id}`);
    console.log(`タイトル: ${response.data.title.rendered}`);
    console.log(`エリア: ${area} (ID: ${areaId})`);
    console.log(`スポットタイプ: ${type} (ID: ${typeId})`);
    if (benefitIds.length > 0) {
      console.log(`ご利益: ${benefits.split(',').join(', ')}`);
    }
    console.log(`\n💡 管理画面で確認: ${WP_SITE_URL}/wp-admin/post.php?post=${postId}&action=edit`);

  } catch (error) {
    console.error('❌ WordPress更新エラー:', error.response?.data || error.message);
    throw error;
  }
}

updateTaxonomies();
