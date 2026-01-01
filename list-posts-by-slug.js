require('dotenv').config();
const axios = require('axios');

// WordPress credentials
const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

// Authentication header
const authHeader = 'Basic ' + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// Target slugs
const targetSlugs = [
  'osorezan',
  'shikina-gu-en',
  'shikina-gu',
  'yutoku-inari-jinja-en',
  'yutoku-inari-jinja',
  'seimei-jinja-en',
  'seimei-jinja',
  'sado-kinzan-en',
  'sado-kinzan',
  'itsukushima-jinja-en',
  'itsukushima-jinja',
  'suwa-taisha-en'
];

async function searchPostBySlug(slug) {
  try {
    const response = await axios({
      method: 'GET',
      url: `${WP_SITE_URL}/wp-json/wp/v2/posts`,
      headers: {
        'Authorization': authHeader
      },
      params: {
        slug: slug,
        status: 'any', // Include all statuses
        per_page: 100
      }
    });

    return response.data;
  } catch (error) {
    console.error(`Error searching for slug ${slug}: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('Searching for posts by slug...\n');

  const foundPosts = [];

  for (const slug of targetSlugs) {
    console.log(`Searching: ${slug}...`);
    const posts = await searchPostBySlug(slug);

    if (posts.length > 0) {
      const post = posts[0];
      console.log(`  ✅ Found: ID ${post.id} - "${post.title.rendered}" (${post.status})`);
      foundPosts.push({
        id: post.id,
        slug: slug,
        title: post.title.rendered,
        status: post.status
      });
    } else {
      console.log(`  ❌ Not found`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n=== SUMMARY ===\n');
  console.log('Found posts:');
  foundPosts.forEach(post => {
    console.log(`{ id: ${post.id}, slug: '${post.slug}', name: '${post.title}' },`);
  });

  console.log(`\n\nTotal found: ${foundPosts.length}/${targetSlugs.length}`);
}

main().catch(console.error);
