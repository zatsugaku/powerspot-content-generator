const axios = require('axios');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = {
  username: WP_USERNAME,
  password: WP_APP_PASSWORD
};

async function checkPostImages(postId) {
  try {
    const response = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot/${postId}`, { auth });
    const post = response.data;
    const content = post.content.rendered;

    console.log(`\n## 投稿ID: ${postId} - ${post.title.rendered}`);

    // Extract all image sources
    const imgRegex = /<img[^>]+src="([^"]+)"/g;
    let match;
    let imageCount = 0;

    while ((match = imgRegex.exec(content)) !== null) {
      imageCount++;
      const imgUrl = match[1];
      const fileName = imgUrl.split('/').pop();

      console.log(`- 画像${imageCount}: ${fileName}`);
      console.log(`  URL: ${imgUrl}`);

      // Check if it's a Pexels image
      const pexelsMatch = fileName.match(/pexels-(\d+)\.jpg/);
      if (pexelsMatch) {
        const pexelsId = pexelsMatch[1];
        console.log(`  タイプ: Pexels画像 (ID: ${pexelsId})`);

        // Check Pexels API for image details
        try {
          const pexelsResponse = await axios.get(`https://api.pexels.com/v1/photos/${pexelsId}`, {
            headers: { 'Authorization': process.env.PEXELS_API_KEY }
          });
          console.log(`  Alt: ${pexelsResponse.data.alt}`);
          console.log(`  Pexels URL: ${pexelsResponse.data.url}`);
        } catch (err) {
          console.log(`  ⚠️ Pexels API取得エラー`);
        }
      } else {
        // Generic image names to flag
        const genericNames = [
          'shrine-entrance', 'temple-garden', 'forest-path', 'stone-lantern',
          'torii-gate', 'spiritual-site', 'powerspot', 'sacred-place'
        ];

        const isGeneric = genericNames.some(name => fileName.includes(name));
        if (isGeneric) {
          console.log(`  ❌ 要差し替え: 汎用画像名`);
        } else {
          console.log(`  ⚠️ 確認必要: カスタム画像または特定の画像`);
        }
      }
    }

    if (imageCount === 0) {
      console.log('- 画像なし');
    }

  } catch (error) {
    console.error(`Error checking post ${postId}:`, error.message);
  }
}

// Main execution
const postIds = process.argv.slice(2);

async function main() {
  for (const postId of postIds) {
    await checkPostImages(postId);
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

main();
