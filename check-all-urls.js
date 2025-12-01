#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

async function checkAll() {
  try {
    const posts = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/posts?per_page=100&status=any`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    const powerspots = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot?per_page=100`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    console.log('=== 現在のURL状況 ===\n');
    console.log('【通常の投稿（posts）】', posts.data.length, '件');
    posts.data.forEach((p, i) => {
      const title = p.title.rendered.split('|')[0].trim();
      console.log(`${i+1}. ${title}`);
      console.log(`   URL: ${WP_SITE_URL}/${p.slug || '(スラッグなし)'}/`);
      console.log(`   ステータス: ${p.status}\n`);
    });

    console.log('【powerspotカスタム投稿】', powerspots.data.length, '件');
    powerspots.data.forEach((p, i) => {
      const title = p.title.rendered.split('|')[0].trim();
      console.log(`${i+1}. ${title}`);
      console.log(`   URL: ${WP_SITE_URL}/${p.slug}/`);
      console.log(`   ステータス: ${p.status}\n`);
    });

    console.log(`合計: ${posts.data.length + powerspots.data.length} 件`);
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

checkAll();
