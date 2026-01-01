require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// WordPress認証情報
const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

const auth = {
  username: WP_USERNAME,
  password: WP_APP_PASSWORD
};

// 処理する投稿のリスト（単語のキーワードで検索）
const posts = [
  { id: 2584, slug: 'osorezan', name: '恐山', keywords: ['volcano japan', 'sulfur', 'crater'] },
  { id: 2583, slug: 'shikina-gu-en', name: 'Shikina-gu', keywords: ['okinawa beach', 'ryukyu', 'tropical'] },
  { id: 2582, slug: 'shikina-gu', name: '識名宮', keywords: ['okinawa beach', 'ryukyu', 'tropical'] },
  { id: 2581, slug: 'yutoku-inari-jinja-en', name: 'Yutoku Inari', keywords: ['torii gate', 'shrine japan', 'red temple'] },
  { id: 2580, slug: 'yutoku-inari-jinja', name: '祐徳稲荷神社', keywords: ['torii gate', 'shrine japan', 'red temple'] },
  { id: 2579, slug: 'seimei-jinja-en', name: 'Seimei Shrine', keywords: ['kyoto temple', 'shrine japan', 'zen garden'] },
  { id: 2578, slug: 'seimei-jinja', name: '晴明神社', keywords: ['kyoto temple', 'shrine japan', 'zen garden'] },
  { id: 2577, slug: 'sado-kinzan-en', name: 'Sado Kinzan', keywords: ['mining', 'tunnel', 'goldmine'] },
  { id: 2576, slug: 'sado-kinzan', name: '佐渡金山', keywords: ['mining', 'tunnel', 'goldmine'] },
  { id: 2575, slug: 'itsukushima-jinja-en', name: 'Itsukushima', keywords: ['miyajima', 'torii water', 'floating gate'] },
  { id: 2574, slug: 'itsukushima-jinja', name: '厳島神社', keywords: ['miyajima', 'torii water', 'floating gate'] },
  { id: 2573, slug: 'suwa-taisha-en', name: 'Suwa Taisha', keywords: ['shrine japan', 'nagano mountains', 'temple'] },
  { id: 2572, slug: 'suwa-taisha', name: '諏訪大社', keywords: ['shrine japan', 'nagano mountains', 'temple'] },
  { id: 2571, slug: 'ishizuchi-jinja-en', name: 'Ishizuchi', keywords: ['japan mountains', 'mountain peak', 'hiking'] },
  { id: 2570, slug: 'ishizuchi-jinja', name: '石鎚神社', keywords: ['japan mountains', 'mountain peak', 'hiking'] }
];

// 汎用画像のリスト（削除対象）
const genericImages = [
  'shrine-entrance.jpg',
  'temple-garden.jpg',
  'forest-path-1.jpg',
  'stone-lantern-path.jpg',
  'bamboo-path.jpg',
  'moss-lantern.jpg'
];

// Pixabay APIで画像を検索
async function searchPixabayImages(keywords, count = 5) {
  try {
    for (const keyword of keywords) {
      console.log(`  Searching Pixabay for: "${keyword}"`);
      const response = await axios.get('https://pixabay.com/api/', {
        params: {
          key: PIXABAY_API_KEY,
          q: keyword,
          image_type: 'photo',
          orientation: 'horizontal',
          per_page: Math.max(3, count),  // 最小3に設定
          safesearch: true
        }
      });

      if (response.data.hits && response.data.hits.length > 0) {
        console.log(`  Found ${response.data.hits.length} images`);
        return response.data.hits;
      }
    }
    console.log('  No images found for any keywords');
    return [];
  } catch (error) {
    console.error(`  Pixabay API error: ${error.message}`);
    if (error.response) {
      console.error(`  Response status: ${error.response.status}`);
      console.error(`  Response data: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

// 画像をダウンロード
async function downloadImage(url, filepath) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(filepath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// WordPressに画像をアップロード
async function uploadToWordPress(imagePath, filename) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath), filename);

    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/media`,
      form,
      {
        auth,
        headers: {
          ...form.getHeaders(),
        }
      }
    );

    console.log(`  ✓ Uploaded: ${filename} (ID: ${response.data.id})`);
    return response.data;
  } catch (error) {
    console.error(`  ✗ Upload failed: ${error.message}`);
    return null;
  }
}

// 投稿を取得
async function getPost(postId) {
  try {
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/posts/${postId}`,
      { auth }
    );
    return response.data;
  } catch (error) {
    console.error(`  ✗ Failed to get post: ${error.message}`);
    return null;
  }
}

// 投稿を更新
async function updatePost(postId, content) {
  try {
    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/posts/${postId}`,
      { content },
      { auth }
    );
    console.log(`  ✓ Post updated successfully`);
    return response.data;
  } catch (error) {
    console.error(`  ✗ Failed to update post: ${error.message}`);
    return null;
  }
}

// コンテンツから汎用画像を削除し、新しい画像を挿入
function replaceImages(content, newImageUrls) {
  let updatedContent = content;

  // 汎用画像を全て削除
  for (const genericImg of genericImages) {
    const imgRegex = new RegExp(`<img[^>]*${genericImg}[^>]*>`, 'g');
    updatedContent = updatedContent.replace(imgRegex, '');

    // figure タグも削除
    const figureRegex = new RegExp(`<figure[^>]*>\\s*<img[^>]*${genericImg}[^>]*>\\s*(?:<figcaption>.*?</figcaption>)?\\s*</figure>`, 'g');
    updatedContent = updatedContent.replace(figureRegex, '');
  }

  // 新しい画像を挿入
  if (newImageUrls.length > 0) {
    // 最初の画像: 導入セクションの後（最初のh2の後）
    const firstH2Match = updatedContent.match(/<\/h2>/);
    if (firstH2Match && newImageUrls[0]) {
      const insertPos = updatedContent.indexOf(firstH2Match[0]) + firstH2Match[0].length;
      const img1 = `\n<figure class="wp-block-image size-large"><img src="${newImageUrls[0]}" alt="" /></figure>\n`;
      updatedContent = updatedContent.slice(0, insertPos) + img1 + updatedContent.slice(insertPos);
    }

    // 2番目の画像: 中盤（3番目のh2の後）
    if (newImageUrls[1]) {
      const h2Matches = [...updatedContent.matchAll(/<\/h2>/g)];
      if (h2Matches.length >= 3) {
        const insertPos = h2Matches[2].index + h2Matches[2][0].length;
        const img2 = `\n<figure class="wp-block-image size-large"><img src="${newImageUrls[1]}" alt="" /></figure>\n`;
        updatedContent = updatedContent.slice(0, insertPos) + img2 + updatedContent.slice(insertPos);
      }
    }
  }

  return updatedContent;
}

// メイン処理
async function processPost(post) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${post.name} (ID: ${post.id})`);
  console.log('='.repeat(60));

  // 1. Pixabayで画像を検索
  console.log('\n1. Searching for images...');
  const images = await searchPixabayImages(post.keywords, 5);

  if (images.length === 0) {
    console.log('  ⚠ No images found, skipping this post');
    return { success: false, reason: 'No images found' };
  }

  // 2. 画像をダウンロード
  console.log('\n2. Downloading images...');
  const downloadedImages = [];
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  for (let i = 0; i < Math.min(2, images.length); i++) {
    const image = images[i];
    const filename = `pixabay-${image.id}-${post.slug}.jpg`;
    const filepath = path.join(tempDir, filename);

    try {
      await downloadImage(image.largeImageURL, filepath);
      console.log(`  ✓ Downloaded: ${filename}`);
      downloadedImages.push({ filepath, filename });
    } catch (error) {
      console.error(`  ✗ Download failed: ${error.message}`);
    }
  }

  if (downloadedImages.length === 0) {
    console.log('  ⚠ No images downloaded, skipping this post');
    return { success: false, reason: 'Download failed' };
  }

  // 3. WordPressに画像をアップロード
  console.log('\n3. Uploading to WordPress...');
  const uploadedImages = [];

  for (const img of downloadedImages) {
    const uploaded = await uploadToWordPress(img.filepath, img.filename);
    if (uploaded) {
      uploadedImages.push(uploaded);
    }
    // クリーンアップ
    fs.unlinkSync(img.filepath);
  }

  if (uploadedImages.length === 0) {
    console.log('  ⚠ No images uploaded, skipping this post');
    return { success: false, reason: 'Upload failed' };
  }

  // 4. 投稿を取得
  console.log('\n4. Getting post content...');
  const postData = await getPost(post.id);
  if (!postData) {
    return { success: false, reason: 'Failed to get post' };
  }

  // 5. 画像を差し替え
  console.log('\n5. Replacing images in content...');
  const imageUrls = uploadedImages.map(img => img.source_url);
  const updatedContent = replaceImages(postData.content.rendered, imageUrls);

  // 6. 投稿を更新
  console.log('\n6. Updating post...');
  const updated = await updatePost(post.id, updatedContent);

  if (updated) {
    console.log(`\n✅ SUCCESS: ${post.name}`);
    console.log(`   Images: ${uploadedImages.map(img => img.id).join(', ')}`);
    return {
      success: true,
      imageCount: uploadedImages.length,
      imageIds: uploadedImages.map(img => img.id)
    };
  } else {
    return { success: false, reason: 'Update failed' };
  }
}

// 全投稿を処理
async function processAllPosts() {
  console.log('Starting image replacement process...');
  console.log(`Total posts to process: ${posts.length}\n`);

  const results = [];

  for (const post of posts) {
    const result = await processPost(post);
    results.push({
      id: post.id,
      name: post.name,
      ...result
    });

    // APIレート制限を避けるため、少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 結果サマリー
  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\nTotal: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\n✅ Successful updates:');
    successful.forEach(r => {
      console.log(`   - ID:${r.id} ${r.name} (${r.imageCount} images)`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed updates:');
    failed.forEach(r => {
      console.log(`   - ID:${r.id} ${r.name} (${r.reason})`);
    });
  }
}

// 実行
processAllPosts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
