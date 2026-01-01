require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// WordPress credentials
const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

// WordPress API authentication
const wpAuth = {
  username: WP_USERNAME,
  password: WP_APP_PASSWORD
};

// Image directory
const IMAGE_DIR = path.join(__dirname, 'downloaded-images');
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR);
}

// Generic images to remove
const GENERIC_IMAGES = [
  'shrine-entrance.jpg',
  'temple-garden.jpg',
  'forest-path-1.jpg',
  'stone-lantern-path.jpg',
  'bamboo-path.jpg',
  'moss-lantern.jpg'
];

// Posts to update with their search keywords
const POSTS = [
  { id: 2615, slug: 'hakone-jinja', name: '箱根神社', keywords: ['Hakone shrine', 'Lake Ashi torii', 'Hakone Japan', 'torii gate lake'] },
  { id: 2616, slug: 'hakone-jinja-en', name: 'Hakone Shrine', keywords: ['Hakone shrine', 'Lake Ashi torii', 'Hakone Japan', 'torii gate lake'] },
  { id: 2614, slug: 'enoshima-jinja-en', name: 'Enoshima Shrine', keywords: ['Enoshima shrine', 'Enoshima island', 'Kanagawa Japan', 'coastal shrine Japan'] },
  { id: 2613, slug: 'enoshima-jinja', name: '江島神社', keywords: ['Enoshima shrine', 'Enoshima island', 'Kanagawa Japan', 'coastal shrine Japan'] },
  { id: 2612, slug: 'tojinbo-en', name: 'Tojinbo', keywords: ['Tojinbo cliffs', 'Fukui Japan cliffs', 'Japan coast cliffs', 'basalt columns Japan'] },
  { id: 2611, slug: 'tojinbo', name: '東尋坊', keywords: ['Tojinbo cliffs', 'Fukui Japan cliffs', 'Japan coast cliffs', 'basalt columns Japan'] },
  { id: 2610, slug: 'kawaguchiko-en', name: 'Lake Kawaguchi', keywords: ['Lake Kawaguchi', 'Mount Fuji lake', 'Fuji Five Lakes', 'Yamanashi Japan'] },
  { id: 2609, slug: 'kawaguchiko', name: '河口湖', keywords: ['Lake Kawaguchi', 'Mount Fuji lake', 'Fuji Five Lakes', 'Yamanashi Japan'] },
  { id: 2608, slug: 'kamui-kotan-en', name: 'Kamui Kotan', keywords: ['Hokkaido river gorge', 'Asahikawa Japan', 'Japan mountain river', 'Hokkaido nature'] },
  { id: 2607, slug: 'kamui-kotan', name: '神居古潭', keywords: ['Hokkaido river gorge', 'Asahikawa Japan', 'Japan mountain river', 'Hokkaido nature'] },
  { id: 2606, slug: 'chitose-jinja-en', name: 'Chitose Shrine', keywords: ['Japan shrine', 'Hokkaido shrine', 'Chitose Japan', 'Japanese temple'] },
  { id: 2605, slug: 'chitose-jinja', name: '千歳神社', keywords: ['Japan shrine', 'Hokkaido shrine', 'Chitose Japan', 'Japanese temple'] },
  { id: 2604, slug: 'sounkyo-en', name: 'Sounkyo Gorge', keywords: ['Hokkaido gorge', 'Daisetsuzan', 'Japan mountain gorge', 'Hokkaido canyon'] },
  { id: 2603, slug: 'sounkyo', name: '層雲峡', keywords: ['Hokkaido gorge', 'Daisetsuzan', 'Japan mountain gorge', 'Hokkaido canyon'] },
  { id: 2585, slug: 'osorezan-en', name: 'Mount Osore', keywords: ['Aomori Japan volcano', 'sacred mountain Japan', 'volcanic lake Japan', 'Japan spiritual mountain'] }
];

// Search Pixabay for images
async function searchPixabayImages(query) {
  try {
    console.log(`  Searching Pixabay for: "${query}"`);

    // Build URL manually to avoid issues with axios param serialization
    // Note: Not using per_page parameter as the free API key has restrictions
    const queryEncoded = encodeURIComponent(query);
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${queryEncoded}&image_type=photo&safesearch=true&order=popular`;

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await axios.get(url);

    if (response.data.hits && response.data.hits.length > 0) {
      console.log(`  Found ${response.data.hits.length} images`);
      return response.data.hits;
    } else {
      console.log(`  No images found for: ${query}`);
      return [];
    }
  } catch (error) {
    console.error(`  Error searching Pixabay for "${query}": ${error.response?.status} - ${error.response?.data || error.message}`);
    return [];
  }
}

// Download image from URL
async function downloadImage(url, filepath) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    fs.writeFileSync(filepath, response.data);
    console.log(`  Downloaded: ${path.basename(filepath)}`);
    return true;
  } catch (error) {
    console.error(`  Error downloading image: ${error.message}`);
    return false;
  }
}

// Upload image to WordPress
async function uploadImageToWordPress(imagePath, altText, caption) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    formData.append('alt_text', altText);
    formData.append('caption', caption);

    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/media`,
      formData,
      {
        auth: wpAuth,
        headers: {
          ...formData.getHeaders()
        }
      }
    );

    console.log(`  Uploaded to WordPress: ${response.data.source_url}`);
    return {
      id: response.data.id,
      url: response.data.source_url,
      width: response.data.media_details.width,
      height: response.data.media_details.height
    };
  } catch (error) {
    console.error(`  Error uploading to WordPress: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Get WordPress post content
async function getPostContent(postId) {
  try {
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot/${postId}`,
      { auth: wpAuth }
    );
    return response.data.content.rendered;
  } catch (error) {
    console.error(`  Error fetching post ${postId}: ${error.response?.status} - ${error.message}`);
    return null;
  }
}

// Update WordPress post content
async function updatePostContent(postId, newContent) {
  try {
    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot/${postId}`,
      { content: newContent },
      { auth: wpAuth }
    );
    console.log(`  Updated post ${postId}`);
    return true;
  } catch (error) {
    console.error(`  Error updating post ${postId}: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Remove generic images from content
function removeGenericImages(content) {
  let updatedContent = content;

  GENERIC_IMAGES.forEach(filename => {
    // Remove image tags containing the generic filename
    const imgPattern = new RegExp(`<img[^>]*${filename}[^>]*>`, 'gi');
    updatedContent = updatedContent.replace(imgPattern, '');

    // Remove figure tags containing the generic filename
    const figurePattern = new RegExp(`<figure[^>]*>.*?${filename}.*?</figure>`, 'gis');
    updatedContent = updatedContent.replace(figurePattern, '');
  });

  return updatedContent;
}

// Insert images into content
function insertImagesIntoContent(content, images, spotName) {
  let updatedContent = content;

  // Find the first heading (after introduction)
  const firstHeadingMatch = updatedContent.match(/<h2[^>]*>.*?<\/h2>/i);
  if (firstHeadingMatch && images[0]) {
    const insertPosition = firstHeadingMatch.index + firstHeadingMatch[0].length;
    const imageHtml = `\n\n<figure class="wp-block-image size-large"><img src="${images[0].url}" alt="${spotName}の風景" width="${images[0].width}" height="${images[0].height}" /><figcaption>${spotName}</figcaption></figure>\n\n`;
    updatedContent = updatedContent.slice(0, insertPosition) + imageHtml + updatedContent.slice(insertPosition);
  }

  // Find a middle heading (around 40-60% of content)
  if (images[1]) {
    const headings = [...updatedContent.matchAll(/<h2[^>]*>.*?<\/h2>/gi)];
    if (headings.length >= 3) {
      const midIndex = Math.floor(headings.length / 2);
      const midHeading = headings[midIndex];
      const insertPosition = midHeading.index + midHeading[0].length;
      const imageHtml = `\n\n<figure class="wp-block-image size-large"><img src="${images[1].url}" alt="${spotName}の景観" width="${images[1].width}" height="${images[1].height}" /><figcaption>${spotName}の魅力</figcaption></figure>\n\n`;
      updatedContent = updatedContent.slice(0, insertPosition) + imageHtml + updatedContent.slice(insertPosition);
    }
  }

  return updatedContent;
}

// Process a single post
async function processPost(post) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${post.name} (ID: ${post.id})`);
  console.log(`${'='.repeat(60)}`);

  // Search for images using both keywords
  let allImages = [];
  for (const keyword of post.keywords) {
    const images = await searchPixabayImages(keyword, 2);
    allImages = allImages.concat(images);
    if (allImages.length >= 2) break;
  }

  if (allImages.length === 0) {
    console.log(`  ❌ No images found for ${post.name}`);
    return { success: false, reason: 'No images found' };
  }

  // Download top 2 images
  const downloadedImages = [];
  for (let i = 0; i < Math.min(2, allImages.length); i++) {
    const image = allImages[i];
    const filename = `pixabay-${post.id}-${post.slug}-${i + 1}.jpg`;
    const filepath = path.join(IMAGE_DIR, filename);

    const downloaded = await downloadImage(image.largeImageURL, filepath);
    if (downloaded) {
      downloadedImages.push({ path: filepath, pixabayId: image.id });
    }
  }

  if (downloadedImages.length === 0) {
    console.log(`  ❌ Failed to download images for ${post.name}`);
    return { success: false, reason: 'Failed to download images' };
  }

  // Upload images to WordPress
  const uploadedImages = [];
  for (let i = 0; i < downloadedImages.length; i++) {
    const uploaded = await uploadImageToWordPress(
      downloadedImages[i].path,
      `${post.name}${i === 0 ? 'の風景' : 'の景観'}`,
      `${post.name} - Image ${i + 1}`
    );
    if (uploaded) {
      uploadedImages.push(uploaded);
    }
  }

  if (uploadedImages.length === 0) {
    console.log(`  ❌ Failed to upload images for ${post.name}`);
    return { success: false, reason: 'Failed to upload images' };
  }

  // Get current post content
  const currentContent = await getPostContent(post.id);
  if (!currentContent) {
    console.log(`  ❌ Failed to fetch content for ${post.name}`);
    return { success: false, reason: 'Failed to fetch content' };
  }

  // Remove generic images
  let updatedContent = removeGenericImages(currentContent);

  // Insert new images
  updatedContent = insertImagesIntoContent(updatedContent, uploadedImages, post.name);

  // Update post
  const updateSuccess = await updatePostContent(post.id, updatedContent);

  if (updateSuccess) {
    console.log(`  ✅ Successfully updated ${post.name}`);
    console.log(`  Images uploaded: ${uploadedImages.length}`);
    return {
      success: true,
      imagesUploaded: uploadedImages.length,
      imageUrls: uploadedImages.map(img => img.url)
    };
  } else {
    console.log(`  ❌ Failed to update ${post.name}`);
    return { success: false, reason: 'Failed to update post' };
  }
}

// Main function
async function main() {
  console.log('Starting image replacement for powerspot posts...');
  console.log(`Total posts to process: ${POSTS.length}\n`);

  const results = [];

  for (const post of POSTS) {
    const result = await processPost(post);
    results.push({
      id: post.id,
      name: post.name,
      ...result
    });

    // Wait 2 seconds between posts to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print summary
  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${POSTS.length}`);
  successful.forEach(r => {
    console.log(`  - ${r.name} (ID: ${r.id}): ${r.imagesUploaded} images`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${POSTS.length}`);
    failed.forEach(r => {
      console.log(`  - ${r.name} (ID: ${r.id}): ${r.reason}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('Image replacement completed!');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
