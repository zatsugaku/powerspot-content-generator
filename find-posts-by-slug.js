require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = {
  username: WP_USERNAME,
  password: WP_APP_PASSWORD
};

const slugs = [
  'osorezan', 'shikina-gu-en', 'shikina-gu',
  'yutoku-inari-jinja-en', 'yutoku-inari-jinja',
  'seimei-jinja-en', 'seimei-jinja',
  'sado-kinzan-en', 'sado-kinzan',
  'itsukushima-jinja-en', 'itsukushima-jinja',
  'suwa-taisha-en', 'suwa-taisha',
  'ishizuchi-jinja-en', 'ishizuchi-jinja'
];

async function findPostBySlug(slug) {
  try {
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/posts`,
      {
        auth,
        params: {
          slug: slug,
          status: 'any'
        }
      }
    );

    if (response.data.length > 0) {
      const post = response.data[0];
      console.log(`✓ Found: ${slug} - ID:${post.id} - ${post.status}`);
      return post;
    } else {
      console.log(`✗ Not found: ${slug}`);
      return null;
    }
  } catch (error) {
    console.error(`✗ Error for ${slug}: ${error.message}`);
    return null;
  }
}

async function findAllPosts() {
  console.log('Searching for posts by slug...\n');

  const found = [];

  for (const slug of slugs) {
    const post = await findPostBySlug(slug);
    if (post) {
      found.push(post);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n\nSummary: Found ${found.length} out of ${slugs.length} posts\n`);

  if (found.length > 0) {
    console.log('Post IDs to use:');
    found.forEach(post => {
      console.log(`  { id: ${post.id}, slug: '${post.slug}', name: '...' }`);
    });
  }
}

findAllPosts();
