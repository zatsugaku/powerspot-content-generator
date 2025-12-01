#!/usr/bin/env node
// WordPress投稿にアイキャッチ画像を設定

require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const postId = process.argv[2];
const mediaId = process.argv[3];
const postType = process.argv[4] || 'posts'; // デフォルトは通常投稿

if (!postId || !mediaId) {
  console.error('❌ 投稿IDとメディアIDを指定してください');
  console.log('使用例: node set-featured-image.js 2358 123 [投稿タイプ]');
  console.log('       node set-featured-image.js 2376 2367 powerspot');
  console.log('\n投稿IDの確認: node check-post.js 2358');
  console.log('画像のアップロード: node upload-image-to-wp.js path/to/image.jpg');
  process.exit(1);
}

async function setFeaturedImage() {
  const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  try {
    console.log(`\n🖼️  投稿ID ${postId} にアイキャッチ画像（メディアID ${mediaId}）を設定中...\n`);

    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/${postType}/${postId}`,
      {
        featured_media: parseInt(mediaId)
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const post = response.data;

    console.log('✅ アイキャッチ画像を設定しました！\n');
    console.log('【投稿情報】');
    console.log(`投稿ID: ${post.id}`);
    console.log(`タイトル: ${post.title.rendered}`);
    console.log(`アイキャッチ画像ID: ${post.featured_media}`);
    console.log(`プレビューURL: ${WP_SITE_URL}/?p=${postId}&preview=true`);
    console.log(`管理画面: ${WP_SITE_URL}/wp-admin/post.php?post=${postId}&action=edit\n`);

  } catch (error) {
    console.error('❌ エラー:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      console.log(`\n💡 投稿ID ${postId} またはメディアID ${mediaId} が見つかりません。`);
      console.log(`   node check-post.js ${postId} で確認してください。`);
    } else if (error.response?.status === 401) {
      console.log('\n💡 認証エラーです。.envファイルの認証情報を確認してください。');
    }

    throw error;
  }
}

setFeaturedImage();
