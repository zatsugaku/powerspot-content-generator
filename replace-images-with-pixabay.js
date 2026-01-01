require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// WordPress credentials
const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

// Authentication header
const authHeader = 'Basic ' + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// Post configurations
const posts = [
  { id: 2584, slug: 'osorezan', name: '恐山', keywords: ['Osorezan volcano', 'sacred mountain Japan', 'Buddhist temple Japan'] },
  { id: 2583, slug: 'shikina-gu-en', name: '識名宮(EN)', keywords: ['Okinawa shrine', 'Ryukyu shrine', 'traditional Japanese shrine'] },
  { id: 2582, slug: 'shikina-gu', name: '識名宮', keywords: ['Okinawa shrine', 'Ryukyu shrine', 'traditional Japanese shrine'] },
  { id: 2581, slug: 'yutoku-inari-jinja-en', name: '祐徳稲荷神社(EN)', keywords: ['Yutoku Inari', 'red shrine Japan', 'Inari shrine'] },
  { id: 2580, slug: 'yutoku-inari-jinja', name: '祐徳稲荷神社', keywords: ['Yutoku Inari', 'red shrine Japan', 'Inari shrine'] },
  { id: 2579, slug: 'seimei-jinja-en', name: '晴明神社(EN)', keywords: ['Kyoto shrine', 'pentagram shrine', 'Japanese temple'] },
  { id: 2578, slug: 'seimei-jinja', name: '晴明神社', keywords: ['Kyoto shrine', 'pentagram shrine', 'Japanese temple'] },
  { id: 2577, slug: 'sado-kinzan-en', name: '佐渡金山(EN)', keywords: ['gold mine Japan', 'Sado mine', 'historic mine'] },
  { id: 2576, slug: 'sado-kinzan', name: '佐渡金山', keywords: ['gold mine Japan', 'Sado mine', 'historic mine'] },
  { id: 2575, slug: 'itsukushima-jinja-en', name: '厳島神社(EN)', keywords: ['Miyajima torii', 'Itsukushima shrine', 'floating torii'] },
  { id: 2574, slug: 'itsukushima-jinja', name: '厳島神社', keywords: ['Miyajima torii', 'Itsukushima shrine', 'floating torii'] },
  { id: 2573, slug: 'suwa-taisha-en', name: '諏訪大社(EN)', keywords: ['Suwa shrine', 'Nagano shrine', 'traditional shrine Japan'] }
];

// Generic images to remove
const genericImages = [
  'shrine-entrance.jpg',
  'temple-garden.jpg',
  'forest-path-1.jpg',
  'stone-lantern-path.jpg',
  'bamboo-path.jpg',
  'moss-lantern.jpg',
  'snow-torii.jpg',
  'peaceful-japan.jpg',
  'snow-temple.jpg'
];

// Search Pixabay for images
async function searchPixabay(keywords, perPage = 3) {
  try {
    const keyword = keywords[0]; // Use first keyword
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: PIXABAY_API_KEY,
        q: keyword,
        image_type: 'photo',
        orientation: 'horizontal',
        per_page: perPage,
        safesearch: true
      }
    });

    if (response.data.hits && response.data.hits.length > 0) {
      return response.data.hits;
    }

    // Try second keyword if first fails
    if (keywords.length > 1) {
      const response2 = await axios.get('https://pixabay.com/api/', {
        params: {
          key: PIXABAY_API_KEY,
          q: keywords[1],
          image_type: 'photo',
          orientation: 'horizontal',
          per_page: perPage,
          safesearch: true
        }
      });

      if (response2.data.hits && response2.data.hits.length > 0) {
        return response2.data.hits;
      }
    }

    return [];
  } catch (error) {
    console.error(`Error searching Pixabay: ${error.message}`);
    return [];
  }
}

// Download image from URL
async function downloadImage(url, filepath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer'
    });

    fs.writeFileSync(filepath, response.data);
    return true;
  } catch (error) {
    console.error(`Error downloading image: ${error.message}`);
    return false;
  }
}

// Upload image to WordPress
async function uploadToWordPress(filepath, filename) {
  try {
    const imageBuffer = fs.readFileSync(filepath);

    const response = await axios({
      method: 'POST',
      url: `${WP_SITE_URL}/wp-json/wp/v2/media`,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`
      },
      data: imageBuffer,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    return response.data;
  } catch (error) {
    console.error(`Error uploading to WordPress: ${error.message}`);
    return null;
  }
}

// Get post content
async function getPost(postId) {
  try {
    const response = await axios({
      method: 'GET',
      url: `${WP_SITE_URL}/wp-json/wp/v2/posts/${postId}`,
      headers: {
        'Authorization': authHeader
      }
    });

    return response.data;
  } catch (error) {
    console.error(`Error getting post ${postId}: ${error.message}`);
    return null;
  }
}

// Update post content
async function updatePost(postId, content) {
  try {
    const response = await axios({
      method: 'POST',
      url: `${WP_SITE_URL}/wp-json/wp/v2/posts/${postId}`,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      data: {
        content: content
      }
    });

    return response.data;
  } catch (error) {
    console.error(`Error updating post ${postId}: ${error.message}`);
    return null;
  }
}

// Process a single post
async function processPost(post) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${post.name} (ID: ${post.id})`);
  console.log(`${'='.repeat(60)}`);

  // 1. Search Pixabay for images
  console.log(`\n1. Searching Pixabay for: ${post.keywords[0]}...`);
  const images = await searchPixabay(post.keywords, 3);

  if (images.length === 0) {
    console.log('❌ No images found on Pixabay');
    return { success: false, reason: 'No images found' };
  }

  console.log(`✅ Found ${images.length} images`);

  // Select 2 best images
  const selectedImages = images.slice(0, 2);

  // 2. Download images
  console.log('\n2. Downloading images...');
  const downloadedImages = [];

  for (let i = 0; i < selectedImages.length; i++) {
    const img = selectedImages[i];
    const tempPath = path.join(__dirname, `temp-pixabay-${post.id}-${i + 1}.jpg`);

    console.log(`   Downloading image ${i + 1}...`);
    const success = await downloadImage(img.largeImageURL, tempPath);

    if (success) {
      downloadedImages.push({
        path: tempPath,
        filename: `pixabay-${post.slug}-${i + 1}.jpg`,
        width: img.imageWidth,
        height: img.imageHeight,
        photographer: img.user
      });
      console.log(`   ✅ Downloaded: ${img.imageWidth}x${img.imageHeight}`);
    }
  }

  if (downloadedImages.length === 0) {
    console.log('❌ Failed to download any images');
    return { success: false, reason: 'Download failed' };
  }

  // 3. Upload to WordPress
  console.log('\n3. Uploading to WordPress...');
  const uploadedImages = [];

  for (const img of downloadedImages) {
    console.log(`   Uploading ${img.filename}...`);
    const media = await uploadToWordPress(img.path, img.filename);

    if (media) {
      uploadedImages.push({
        id: media.id,
        url: media.source_url,
        filename: img.filename
      });
      console.log(`   ✅ Uploaded: ID ${media.id}`);
      console.log(`      URL: ${media.source_url}`);
    }

    // Clean up temp file
    fs.unlinkSync(img.path);
  }

  if (uploadedImages.length === 0) {
    console.log('❌ Failed to upload any images');
    return { success: false, reason: 'Upload failed' };
  }

  // 4. Get current post content
  console.log('\n4. Getting current post content...');
  const postData = await getPost(post.id);

  if (!postData) {
    console.log('❌ Failed to get post content');
    return { success: false, reason: 'Failed to get post' };
  }

  let content = postData.content.rendered;
  console.log(`   Current content length: ${content.length} characters`);

  // 5. Remove generic images
  console.log('\n5. Removing generic images...');
  let removedCount = 0;

  for (const genericImg of genericImages) {
    // Remove <figure> blocks containing generic images
    const figureRegex = new RegExp(`<figure[^>]*>\\s*<img[^>]*${genericImg}[^>]*>\\s*(?:<figcaption[^>]*>.*?</figcaption>)?\\s*</figure>`, 'gi');
    const beforeLength = content.length;
    content = content.replace(figureRegex, '');

    // Also remove standalone img tags
    const imgRegex = new RegExp(`<img[^>]*${genericImg}[^>]*>`, 'gi');
    content = content.replace(imgRegex, '');

    if (content.length < beforeLength) {
      removedCount++;
      console.log(`   ✅ Removed: ${genericImg}`);
    }
  }

  console.log(`   Total removed: ${removedCount} generic images`);

  // 6. Insert new Pixabay images
  console.log('\n6. Inserting new Pixabay images...');

  // Find insertion points (after first section and middle of content)
  const h2Regex = /<h2[^>]*>/gi;
  const h2Matches = [...content.matchAll(h2Regex)];

  if (h2Matches.length >= 2) {
    // Insert first image after first h2 section
    const firstInsertPoint = h2Matches[0].index + h2Matches[0][0].length;
    const firstImageHtml = `\n\n<figure class="wp-block-image size-large">
<img src="${uploadedImages[0].url}" alt="${post.name} - Photo by Pixabay" class="wp-image-${uploadedImages[0].id}"/>
<figcaption>Photo by Pixabay</figcaption>
</figure>\n\n`;

    content = content.slice(0, firstInsertPoint) + firstImageHtml + content.slice(firstInsertPoint);
    console.log(`   ✅ Inserted image 1 after first section`);

    // Insert second image in the middle (if we have it)
    if (uploadedImages.length >= 2 && h2Matches.length >= 4) {
      const midpoint = Math.floor(h2Matches.length / 2);
      const secondInsertPoint = h2Matches[midpoint].index + h2Matches[midpoint][0].length + firstImageHtml.length;
      const secondImageHtml = `\n\n<figure class="wp-block-image size-large">
<img src="${uploadedImages[1].url}" alt="${post.name} - Photo by Pixabay" class="wp-image-${uploadedImages[1].id}"/>
<figcaption>Photo by Pixabay</figcaption>
</figure>\n\n`;

      content = content.slice(0, secondInsertPoint) + secondImageHtml + content.slice(secondInsertPoint);
      console.log(`   ✅ Inserted image 2 in middle section`);
    }
  } else {
    console.log('   ⚠️ Warning: Not enough h2 sections found, inserting at beginning');
    const firstImageHtml = `<figure class="wp-block-image size-large">
<img src="${uploadedImages[0].url}" alt="${post.name} - Photo by Pixabay" class="wp-image-${uploadedImages[0].id}"/>
<figcaption>Photo by Pixabay</figcaption>
</figure>\n\n`;
    content = firstImageHtml + content;
  }

  // 7. Update post
  console.log('\n7. Updating post on WordPress...');
  const updated = await updatePost(post.id, content);

  if (updated) {
    console.log(`   ✅ Post updated successfully`);
    console.log(`   New content length: ${content.length} characters`);
    console.log(`   View: ${WP_SITE_URL}/?p=${post.id}`);
    return {
      success: true,
      imagesAdded: uploadedImages.length,
      imagesRemoved: removedCount
    };
  } else {
    console.log('   ❌ Failed to update post');
    return { success: false, reason: 'Update failed' };
  }
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  WordPress Generic Images → Pixabay Images Replacer       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTotal posts to process: ${posts.length}`);
  console.log(`WordPress Site: ${WP_SITE_URL}`);
  console.log(`Pixabay API Key: ${PIXABAY_API_KEY ? '✅ Set' : '❌ Not set'}`);

  const results = {
    success: [],
    failed: []
  };

  for (const post of posts) {
    const result = await processPost(post);

    if (result.success) {
      results.success.push({
        ...post,
        ...result
      });
    } else {
      results.failed.push({
        ...post,
        reason: result.reason
      });
    }

    // Wait 2 seconds between posts to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print summary
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                     SUMMARY REPORT                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log(`\n✅ Successful: ${results.success.length}/${posts.length}`);
  results.success.forEach(post => {
    console.log(`   • ${post.name} (ID: ${post.id})`);
    console.log(`     - Added: ${post.imagesAdded} Pixabay images`);
    console.log(`     - Removed: ${post.imagesRemoved} generic images`);
    console.log(`     - URL: ${WP_SITE_URL}/?p=${post.id}`);
  });

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}/${posts.length}`);
    results.failed.forEach(post => {
      console.log(`   • ${post.name} (ID: ${post.id})`);
      console.log(`     Reason: ${post.reason}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('Process complete!');
  console.log('='.repeat(60) + '\n');
}

// Run
main().catch(console.error);
