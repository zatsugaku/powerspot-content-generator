#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const postId = process.argv[2] || '2358';

async function checkPost() {
  const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  try {
    console.log(`\n📋 投稿ID ${postId} の情報を取得中...\n`);

    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/posts/${postId}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );

    const post = response.data;

    console.log('✅ 投稿が見つかりました！\n');
    console.log('【基本情報】');
    console.log(`ID: ${post.id}`);
    console.log(`タイトル: ${post.title.rendered}`);
    console.log(`ステータス: ${post.status}`);
    console.log(`作成日時: ${post.date}`);
    console.log(`リンク: ${post.link}`);
    console.log(`\n【プレビューURL】`);

    if (post.status === 'draft') {
      console.log(`下書きプレビュー: ${WP_SITE_URL}/?p=${postId}&preview=true`);
      console.log(`または管理画面から: ${WP_SITE_URL}/wp-admin/post.php?post=${postId}&action=edit`);
    } else {
      console.log(`公開URL: ${post.link}`);
    }

    console.log(`\n【コンテンツ情報】`);
    console.log(`文字数: ${post.content.rendered.length}文字`);
    console.log(`抜粋: ${post.excerpt.rendered ? post.excerpt.rendered.substring(0, 100) + '...' : 'なし'}`);

  } catch (error) {
    if (error.response?.status === 404) {
      console.error(`❌ 投稿ID ${postId} は存在しません`);
    } else if (error.response?.status === 401) {
      console.error('❌ 認証エラー: ユーザー名またはパスワードが間違っています');
    } else {
      console.error('❌ エラー:', error.response?.data || error.message);
    }
  }
}

checkPost();
