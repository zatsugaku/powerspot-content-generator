#!/usr/bin/env node
// powerspotカスタム投稿タイプのフィールドを確認

require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

async function checkPowerspotFields() {
  try {
    // 既存のpowerspot投稿を確認
    const response = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot`, {
      headers: { 'Authorization': `Basic ${auth}` },
      params: { per_page: 1 }
    });

    console.log('\n📋 powerspotカスタム投稿タイプの情報\n');

    if (response.data.length > 0) {
      const post = response.data[0];
      console.log('投稿例が見つかりました：');
      console.log(`ID: ${post.id}`);
      console.log(`タイトル: ${post.title.rendered}`);
      console.log(`\n利用可能なフィールド:`);
      console.log(Object.keys(post).join(', '));

      // カスタムフィールド（meta）があるか確認
      if (post.meta) {
        console.log('\n📝 カスタムフィールド (meta):');
        console.log(JSON.stringify(post.meta, null, 2));
      }

      // ACFフィールドがあるか確認
      if (post.acf) {
        console.log('\n📝 ACFフィールド:');
        console.log(JSON.stringify(post.acf, null, 2));
      }

    } else {
      console.log('まだpowerspotの投稿がありません');
      console.log('\n新しいpowerspot投稿を作成してみます...\n');

      // テスト投稿を作成
      const testPost = await axios.post(
        `${WP_SITE_URL}/wp-json/wp/v2/powerspot`,
        {
          title: 'テスト - 伊勢神宮',
          content: 'テスト投稿',
          status: 'draft'
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ テスト投稿作成成功！');
      console.log(`投稿ID: ${testPost.data.id}`);
      console.log('\n利用可能なフィールド:');
      console.log(Object.keys(testPost.data).join(', '));
    }

  } catch (error) {
    console.error('❌ エラー:', error.response?.data || error.message);
  }
}

checkPowerspotFields();
