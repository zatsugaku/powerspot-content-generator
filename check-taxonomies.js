#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');

const auth = Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString('base64');

async function checkTaxonomies() {
  try {
    // タクソノミー一覧を取得
    const taxResponse = await axios.get(`${process.env.WP_SITE_URL}/wp-json/wp/v2/taxonomies`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    console.log('\n📋 利用可能なタクソノミー:\n');
    Object.keys(taxResponse.data).forEach(key => {
      const tax = taxResponse.data[key];
      console.log(`- ${key}: ${tax.name}`);
      if (tax.types) {
        console.log(`  投稿タイプ: ${tax.types.join(', ')}`);
      }
    });

    // powerspot_region の term を確認
    console.log('\n📍 powerspot_region のタームを確認:\n');
    try {
      const regionResponse = await axios.get(`${process.env.WP_SITE_URL}/wp-json/wp/v2/powerspot_region`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      if (regionResponse.data.length > 0) {
        regionResponse.data.forEach(term => {
          console.log(`  - ${term.name} (ID: ${term.id})`);
        });
      } else {
        console.log('  （まだタームがありません）');
      }
    } catch (e) {
      console.log('  エラー:', e.response?.status);
    }

    // powerspot_element の term を確認
    console.log('\n✨ powerspot_element のタームを確認:\n');
    try {
      const elementResponse = await axios.get(`${process.env.WP_SITE_URL}/wp-json/wp/v2/powerspot_element`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      if (elementResponse.data.length > 0) {
        elementResponse.data.forEach(term => {
          console.log(`  - ${term.name} (ID: ${term.id})`);
        });
      } else {
        console.log('  （まだタームがありません）');
      }
    } catch (e) {
      console.log('  エラー:', e.response?.status);
    }

  } catch (error) {
    console.error('❌ エラー:', error.response?.data || error.message);
  }
}

checkTaxonomies();
