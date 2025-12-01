#!/usr/bin/env node
// 投稿のスラッグを英語に一括変更

require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// 記事タイトルと推奨スラッグのマッピング
const slugMappings = {
  '日光東照宮': 'nikko-toshogu',
  '出雲大社': 'izumo-taisha',
  '阿蘇山': 'mount-aso',
  '金刀比羅宮': 'kotohira-gu',
  '斎場御嶽': 'sefa-utaki',
  '伏見稲荷大社': 'fushimi-inari-taisha',
  '伊勢神宮': 'ise-jingu'
};

async function getAllPosts() {
  let allPosts = [];

  try {
    // 通常の投稿を取得
    const postsResponse = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/posts?per_page=100`,
      {
        headers: { 'Authorization': `Basic ${auth}` }
      }
    );
    allPosts = allPosts.concat(postsResponse.data);
  } catch (error) {
    console.log('通常の投稿: なし');
  }

  try {
    // powerspotカスタム投稿タイプを取得
    const powerspotsResponse = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot?per_page=100`,
      {
        headers: { 'Authorization': `Basic ${auth}` }
      }
    );
    allPosts = allPosts.concat(powerspotsResponse.data.map(p => ({
      ...p,
      postType: 'powerspot'
    })));
  } catch (error) {
    console.log('powerspotカスタム投稿: なし');
  }

  return allPosts;
}

async function updateSlug(postId, newSlug, title, postType = 'posts') {
  try {
    const endpoint = postType === 'powerspot'
      ? `${WP_SITE_URL}/wp-json/wp/v2/powerspot/${postId}`
      : `${WP_SITE_URL}/wp-json/wp/v2/posts/${postId}`;

    const response = await axios.post(
      endpoint,
      { slug: newSlug },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`   ✅ 更新成功: ${title}`);
    console.log(`      旧URL: ${WP_SITE_URL}/?p=${postId}`);
    console.log(`      新URL: ${WP_SITE_URL}/${newSlug}/`);
    return true;
  } catch (error) {
    console.error(`   ❌ 更新失敗: ${title} - ${error.message}`);
    return false;
  }
}

async function updateAllSlugs() {
  console.log('\n📝 投稿のスラッグを英語に変更中...\n');

  const posts = await getAllPosts();
  console.log(`取得した投稿数: ${posts.length}件\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const post of posts) {
    const title = post.title.rendered;
    const currentSlug = post.slug;

    // タイトルに含まれるキーワードからマッピングを探す
    let newSlug = null;
    for (const [keyword, slug] of Object.entries(slugMappings)) {
      if (title.includes(keyword)) {
        newSlug = slug;
        break;
      }
    }

    if (newSlug && currentSlug !== newSlug) {
      console.log(`\n${updatedCount + 1}. ${title}`);
      console.log(`   現在のスラッグ: ${currentSlug}`);
      console.log(`   新しいスラッグ: ${newSlug}`);

      const success = await updateSlug(post.id, newSlug, title, post.postType);
      if (success) {
        updatedCount++;
      }

      // レート制限を避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 500));
    } else if (newSlug && currentSlug === newSlug) {
      console.log(`\n⏭️  スキップ: ${title} (すでに英語スラッグ: ${currentSlug})`);
      skippedCount++;
    } else {
      // パワースポット記事以外
      console.log(`\n⏭️  スキップ: ${title} (マッピングなし)`);
      skippedCount++;
    }
  }

  console.log('\n\n📊 処理結果:');
  console.log(`✅ 更新した記事: ${updatedCount}件`);
  console.log(`⏭️  スキップした記事: ${skippedCount}件`);
  console.log(`📝 合計: ${posts.length}件\n`);

  if (updatedCount > 0) {
    console.log('💡 次のステップ:');
    console.log('1. Redirectionプラグインをインストール（リダイレクト設定）');
    console.log('2. サイトにアクセスして新しいURLが動作するか確認');
    console.log('3. Google Search Consoleでサイトマップを再送信\n');
  }
}

updateAllSlugs();
