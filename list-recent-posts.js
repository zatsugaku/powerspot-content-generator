#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

async function listPosts() {
  const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  try {
    console.log('\n📋 WordPressの投稿一覧を取得中...\n');

    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/posts`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        },
        params: {
          status: 'any',
          per_page: 100,
          orderby: 'id',
          order: 'desc'
        }
      }
    );

    const posts = response.data;

    console.log(`Total posts: ${posts.length}\n`);
    console.log('='.repeat(80));
    console.log('\nRecent 30 posts:\n');

    posts.slice(0, 30).forEach(p => {
      console.log(`ID: ${p.id.toString().padEnd(6)} | ${p.status.padEnd(8)} | ${p.title.rendered}`);
      console.log(`    Slug: ${p.slug}\n`);
    });

    // Search for target patterns
    const patterns = ['恐山', '識名', '祐徳', '晴明', '佐渡', '厳島', '諏訪'];
    console.log('\n' + '='.repeat(80));
    console.log('\nSearching for target posts:\n');

    patterns.forEach(pattern => {
      const found = posts.filter(p => p.title.rendered.includes(pattern));
      if (found.length > 0) {
        console.log(`${pattern}:`);
        found.forEach(p => {
          console.log(`  ID: ${p.id} | Slug: ${p.slug} | Title: ${p.title.rendered}`);
        });
        console.log('');
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

listPosts();
