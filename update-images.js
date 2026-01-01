require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD.replace(/\s/g, '');
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// スポット名と検索キーワードのマッピング
const searchKeywords = {
  'sumiyoshi-taisha': 'Sumiyoshi Taisha Osaka shrine',
  'jozankei-jinja': 'Jozankei shrine Hokkaido',
  'kinkengu': 'Kinkakuji golden pavilion Kyoto',
  'osaki-hachimangu': 'Osaki Hachimangu Sendai shrine',
  'atsuta-jingu': 'Atsuta shrine Nagoya',
  'hokkaido-jingu': 'Hokkaido shrine Sapporo',
  'tarumaesan-jinja': 'Tarumae mountain Hokkaido',
  'akan-lake': 'Lake Akan Hokkaido',
  'matsushima': 'Matsushima bay islands Japan',
  'chusonji-konjikido': 'Chusonji temple golden hall',
  'haguro-san': 'Mount Haguro pagoda',
  'kotohira-gu': 'Kotohira shrine Kompira',
  'mount-aso': 'Mount Aso volcano',
  'izumo-taisha': 'Izumo Taisha shrine',
  'nikko-toshogu': 'Nikko Toshogu shrine',
  'sefa-utaki': 'Sefa Utaki Okinawa sacred site',
  'fushimi-inari-taisha': 'Fushimi Inari shrine torii',
  'ise-grand-shrine': 'Ise Grand Shrine',
  'ise-jingu': 'Ise Jingu shrine'
};

// 汎用画像のリスト
const genericImages = [
  'shrine-entrance.jpg',
  'temple-garden.jpg',
  'forest-path-1.jpg',
  'stone-lantern-path.jpg',
  'bamboo-path.jpg',
  'moss-lantern.jpg'
];

async function downloadImage(url, filename) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filename, response.data);
  return filename;
}

async function uploadToWordPress(imagePath, title) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imagePath));
  formData.append('title', title);

  const response = await axios.post(
    `${WP_SITE_URL}/wp-json/wp/v2/media`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Basic ${auth}`
      }
    }
  );

  return response.data;
}

async function searchPixabay(keyword, count = 2) {
  const response = await axios.get('https://pixabay.com/api/', {
    params: {
      key: PIXABAY_API_KEY,
      q: keyword,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: true
    }
  });

  return response.data.hits.slice(0, count);
}

async function updatePostImages(postId, postSlug) {
  console.log(`\n=== Processing: ${postSlug} (ID: ${postId}) ===`);

  // Get post content with retry
  let postResponse;
  let retries = 3;
  while (retries > 0) {
    try {
      postResponse = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot/${postId}`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      break;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      console.log(`  → Retry getting post (${retries} retries left)...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  let content = postResponse.data.content.rendered;
  const title = postResponse.data.title.rendered;

  // 英語版投稿をスキップ
  if (postSlug.endsWith('-en')) {
    console.log('  → Skipping English version');
    return { postId, postSlug, status: 'skipped-en' };
  }

  // Search keyword
  let searchKeyword = searchKeywords[postSlug];

  // slugから-en, -2を除去して検索
  if (!searchKeyword) {
    const baseSlug = postSlug.replace(/-en$/, '').replace(/-2$/, '');
    searchKeyword = searchKeywords[baseSlug];
  }

  if (!searchKeyword) {
    console.log(`  → No search keyword found for ${postSlug}`);
    searchKeyword = postSlug.replace(/-/g, ' ') + ' Japan';
  }

  console.log(`  → Searching Pixabay: ${searchKeyword}`);

  try {
    // Search and download images
    const images = await searchPixabay(searchKeyword, 2);

    if (images.length === 0) {
      console.log('  → No images found on Pixabay');
      return { postId, postSlug, status: 'no-images' };
    }

    console.log(`  → Found ${images.length} images`);

    const uploadedImages = [];

    for (let i = 0; i < Math.min(2, images.length); i++) {
      const image = images[i];
      const filename = `pixabay-${image.id}.jpg`;
      const filepath = path.join(__dirname, 'temp', filename);

      // Create temp directory if not exists
      if (!fs.existsSync(path.join(__dirname, 'temp'))) {
        fs.mkdirSync(path.join(__dirname, 'temp'));
      }

      console.log(`  → Downloading image ${i + 1}...`);
      await downloadImage(image.largeImageURL, filepath);

      console.log(`  → Uploading to WordPress...`);
      const mediaData = await uploadToWordPress(filepath, `${title} - Image ${i + 1}`);
      uploadedImages.push(mediaData);

      // Clean up temp file
      fs.unlinkSync(filepath);
    }

    // Remove generic images from content
    genericImages.forEach(genericImg => {
      const regex = new RegExp(`<img[^>]*src="[^"]*${genericImg}"[^>]*>`, 'g');
      content = content.replace(regex, '');
    });

    // Insert new images
    if (uploadedImages.length > 0) {
      // First image after introduction
      const firstImg = `<img src="${uploadedImages[0].source_url}" alt="${uploadedImages[0].title.rendered}" style="max-width: 100%; height: auto; margin: 20px 0;">`;

      // Insert after first paragraph
      content = content.replace(/(<p>.*?<\/p>)/, `$1\n\n${firstImg}`);

      // Second image in the middle if available
      if (uploadedImages.length > 1) {
        const secondImg = `<img src="${uploadedImages[1].source_url}" alt="${uploadedImages[1].title.rendered}" style="max-width: 100%; height: auto; margin: 20px 0;">`;

        // Split content and insert in middle
        const paragraphs = content.match(/<p>.*?<\/p>/g) || [];
        if (paragraphs.length > 3) {
          const middleIndex = Math.floor(paragraphs.length / 2);
          const middleParagraph = paragraphs[middleIndex];
          content = content.replace(middleParagraph, `${middleParagraph}\n\n${secondImg}`);
        }
      }
    }

    // Update post with retry
    console.log(`  → Updating post content...`);
    let updateRetries = 3;
    while (updateRetries > 0) {
      try {
        await axios.post(
          `${WP_SITE_URL}/wp-json/wp/v2/powerspot/${postId}`,
          { content: content },
          { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } }
        );
        break;
      } catch (err) {
        updateRetries--;
        if (updateRetries === 0) throw err;
        console.log(`  → Retry updating post (${updateRetries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log(`  ✓ Successfully updated ${postSlug}`);
    return { postId, postSlug, status: 'success', imagesAdded: uploadedImages.length };

  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    if (error.response) {
      console.error(`  Response status: ${error.response.status}`);
      console.error(`  Response data:`, JSON.stringify(error.response.data, null, 2));
    }
    return { postId, postSlug, status: 'error', error: error.message };
  }
}

async function main() {
  console.log('Starting image update process...\n');

  // Get posts
  const response = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot?per_page=100`, {
    headers: { 'Authorization': `Basic ${auth}` }
  });

  const startIndex = process.argv[2] ? parseInt(process.argv[2]) : 45;
  const posts = response.data.slice(startIndex); // 46番目以降（または指定位置）
  console.log(`Found ${posts.length} posts to process (starting from index ${startIndex})\n`);

  const results = [];

  for (const post of posts) {
    const result = await updatePostImages(post.id, post.slug);
    results.push(result);

    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Summary
  console.log('\n\n=== SUMMARY ===');
  console.log(`Total posts: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.status === 'success').length}`);
  console.log(`Skipped (EN): ${results.filter(r => r.status === 'skipped-en').length}`);
  console.log(`No images: ${results.filter(r => r.status === 'no-images').length}`);
  console.log(`Errors: ${results.filter(r => r.status === 'error').length}`);

  console.log('\n=== DETAILS ===');
  results.forEach(r => {
    console.log(`${r.postSlug}: ${r.status}${r.imagesAdded ? ` (${r.imagesAdded} images)` : ''}`);
  });
}

main().catch(console.error);
