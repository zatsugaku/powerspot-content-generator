#!/usr/bin/env node
// 通常の投稿をpowerspotカスタム投稿タイプに変換

require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// 変換対象の投稿ID
const POST_IDS = [2423, 2416]; // 日光東照宮、阿蘇山

async function getPost(postId) {
  try {
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/posts/${postId}`,
      {
        headers: { 'Authorization': `Basic ${auth}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`❌ 投稿ID ${postId} の取得エラー:`, error.message);
    return null;
  }
}

async function createPowerspotPost(postData) {
  try {
    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot`,
      {
        title: postData.title.rendered,
        content: postData.content.rendered,
        slug: postData.slug,
        status: postData.status,
        featured_media: postData.featured_media,
        // タクソノミーも引き継ぐ
        powerspot_region: postData.powerspot_region || [],
        powerspot_area: postData.powerspot_area || [],
        powerspot_type: postData.powerspot_type || [],
        powerspot_benefit: postData.powerspot_benefit || []
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ powerspot投稿の作成エラー:', error.response?.data || error.message);
    return null;
  }
}

async function deletePost(postId) {
  try {
    await axios.delete(
      `${WP_SITE_URL}/wp-json/wp/v2/posts/${postId}?force=true`,
      {
        headers: { 'Authorization': `Basic ${auth}` }
      }
    );
    return true;
  } catch (error) {
    console.error(`❌ 投稿ID ${postId} の削除エラー:`, error.message);
    return false;
  }
}

async function convertToPowerspot() {
  console.log('\n🔄 通常の投稿をpowerspotカスタム投稿タイプに変換中...\n');

  let successCount = 0;
  let failCount = 0;

  for (const postId of POST_IDS) {
    console.log(`\n--- 投稿ID: ${postId} ---`);

    // 1. 元の投稿を取得
    console.log('1. 投稿データを取得中...');
    const originalPost = await getPost(postId);
    if (!originalPost) {
      failCount++;
      continue;
    }

    const title = originalPost.title.rendered.split('|')[0].trim();
    console.log(`   タイトル: ${title}`);
    console.log(`   スラッグ: ${originalPost.slug}`);

    // 2. powerspotカスタム投稿タイプとして作成
    console.log('\n2. powerspotカスタム投稿タイプとして作成中...');
    const newPost = await createPowerspotPost(originalPost);
    if (!newPost) {
      failCount++;
      continue;
    }

    console.log(`   ✅ 作成成功`);
    console.log(`   新ID: ${newPost.id}`);
    console.log(`   新URL: ${WP_SITE_URL}/powerspot/${newPost.slug}/`);

    // 3. 元の投稿を削除
    console.log('\n3. 元の投稿を削除中...');
    const deleted = await deletePost(postId);
    if (deleted) {
      console.log('   ✅ 削除成功');
      successCount++;
    } else {
      console.log('   ⚠️  削除失敗（手動で削除してください）');
    }

    // レート制限を避けるため待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n📊 変換結果:');
  console.log(`✅ 成功: ${successCount}件`);
  console.log(`❌ 失敗: ${failCount}件`);

  if (successCount > 0) {
    console.log('\n💡 次のステップ:');
    console.log('1. WordPress管理画面で新しいpowerspot投稿を確認');
    console.log('2. Search Consoleで新しいURLのインデックス登録をリクエスト');
    console.log('   - https://k005.net/powerspot/nikko-toshogu/');
    console.log('   - https://k005.net/powerspot/mount-aso/');
    console.log('3. Redirectionプラグインで古いURLから新しいURLへリダイレクト設定\n');
  }
}

convertToPowerspot();
