require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuration
const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const WP_USERNAME = process.env.WP_USERNAME || 'power';
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || 'Ml5H 2psf K1CK 3BLl fIcV ulQn';
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || '45586630-752c7bd54cc63bc798d7be07d';

// Pages to process (only existing pages)
const POSTS = [
  { id: 2030, slug: '%e5%ae%9a%e5%b1%b1%e6%b8%93%e7%a5%9e%e7%a4%be', name: '定山渓神社', keywords: ['Jozankei', 'Hokkaido shrine'] },
  { id: 2044, slug: '%e9%87%91%e5%89%b1%e5%ae%ae', name: '金剱宮', keywords: ['Japanese shrine', 'Ishikawa'] },
  { id: 2027, slug: '%e5%8c%97%e6%b5%b7%e9%81%93%e7%a5%9e%e5%ae%ae', name: '北海道神宮', keywords: ['Hokkaido shrine', 'Sapporo shrine'] },
  { id: 2028, slug: '%e6%a8%bd%e5%89%8d%e5%b1%b1%e7%a5%9e%e7%a4%be', name: '樽前山神社', keywords: ['Tomakomai shrine', 'Hokkaido'] }
];

// Generic images to remove
const GENERIC_IMAGES = [
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

// WordPress auth header
const wpAuth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// Helper function to search Pixabay
async function searchPixabay(keywords, perPage = 5) {
  try {
    const query = keywords.join(' ');
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=${perPage}`;

    console.log(`Searching Pixabay for: "${query}"`);
    const response = await axios.get(url);

    if (response.data.hits && response.data.hits.length > 0) {
      return response.data.hits;
    }

    return [];
  } catch (error) {
    console.error(`Pixabay search error: ${error.message}`);
    return [];
  }
}

// Helper function to download image
async function downloadImage(imageUrl, filepath) {
  try {
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Download error: ${error.message}`);
    throw error;
  }
}

// Helper function to upload image to WordPress
async function uploadToWordPress(filepath, filename) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filepath), filename);

    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/media`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Basic ${wpAuth}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`WordPress upload error: ${error.message}`);
    throw error;
  }
}

// Helper function to get page content
async function getPage(pageId) {
  try {
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/pages/${pageId}`,
      {
        headers: {
          'Authorization': `Basic ${wpAuth}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Get page error: ${error.message}`);
    throw error;
  }
}

// Helper function to update page content
async function updatePage(pageId, content) {
  try {
    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/pages/${pageId}`,
      { content },
      {
        headers: {
          'Authorization': `Basic ${wpAuth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Update page error: ${error.message}`);
    throw error;
  }
}

// Helper function to remove generic images from content
function removeGenericImages(content) {
  let updatedContent = content;

  GENERIC_IMAGES.forEach(imageName => {
    // Remove image tags containing the generic image name
    const patterns = [
      new RegExp(`<img[^>]*${imageName}[^>]*>`, 'gi'),
      new RegExp(`<figure[^>]*>.*?${imageName}.*?</figure>`, 'gis'),
      new RegExp(`<p[^>]*>\\s*<img[^>]*${imageName}[^>]*>\\s*</p>`, 'gi')
    ];

    patterns.forEach(pattern => {
      updatedContent = updatedContent.replace(pattern, '');
    });
  });

  return updatedContent;
}

// Helper function to insert images into content
function insertImages(content, imageUrls) {
  // Find the first </h2> tag (after introduction section)
  const firstH2Index = content.indexOf('</h2>');
  if (firstH2Index === -1) {
    console.log('No <h2> tags found, inserting at beginning');
    return `<figure class="wp-block-image"><img src="${imageUrls[0]}" alt=""></figure>\n\n${content}`;
  }

  // Insert first image after the first paragraph following first h2
  const afterFirstH2 = content.substring(firstH2Index + 5);
  const firstPIndex = afterFirstH2.indexOf('</p>');

  if (firstPIndex === -1) {
    console.log('No paragraph after first h2, inserting directly after h2');
    const firstImageTag = `\n\n<figure class="wp-block-image"><img src="${imageUrls[0]}" alt=""></figure>\n\n`;
    content = content.substring(0, firstH2Index + 5) + firstImageTag + afterFirstH2;
  } else {
    const insertPoint1 = firstH2Index + 5 + firstPIndex + 4;
    const firstImageTag = `\n\n<figure class="wp-block-image"><img src="${imageUrls[0]}" alt=""></figure>\n\n`;
    content = content.substring(0, insertPoint1) + firstImageTag + content.substring(insertPoint1);
  }

  // Insert second image in the middle of the content if we have one
  if (imageUrls.length > 1) {
    const middleIndex = Math.floor(content.length / 2);

    // Find the nearest </p> after middle point
    const remainingContent = content.substring(middleIndex);
    const nearestPIndex = remainingContent.indexOf('</p>');

    if (nearestPIndex !== -1) {
      const insertPoint2 = middleIndex + nearestPIndex + 4;
      const secondImageTag = `\n\n<figure class="wp-block-image"><img src="${imageUrls[1]}" alt=""></figure>\n\n`;
      content = content.substring(0, insertPoint2) + secondImageTag + content.substring(insertPoint2);
    }
  }

  return content;
}

// Main processing function
async function processPage(page) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${page.name} (ID: ${page.id})`);
  console.log('='.repeat(60));

  try {
    // Step 1: Search Pixabay for images
    console.log('\n[1/6] Searching Pixabay...');
    const pixabayResults = await searchPixabay(page.keywords, 5);

    if (pixabayResults.length === 0) {
      console.log('❌ No Pixabay images found. Skipping this page.');
      return { success: false, page: page.name, error: 'No images found' };
    }

    console.log(`✓ Found ${pixabayResults.length} images on Pixabay`);

    // Step 2: Download top 2 images
    console.log('\n[2/6] Downloading images...');
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const downloadedFiles = [];
    const imagesToDownload = Math.min(2, pixabayResults.length);

    for (let i = 0; i < imagesToDownload; i++) {
      const imageUrl = pixabayResults[i].largeImageURL || pixabayResults[i].webformatURL;
      const filename = `pixabay-${page.id}-${i + 1}.jpg`;
      const filepath = path.join(tempDir, filename);

      console.log(`Downloading image ${i + 1}...`);
      await downloadImage(imageUrl, filepath);
      downloadedFiles.push({ filepath, filename });
      console.log(`✓ Downloaded: ${filename}`);
    }

    // Step 3: Upload images to WordPress
    console.log('\n[3/6] Uploading images to WordPress...');
    const uploadedImages = [];

    for (const file of downloadedFiles) {
      console.log(`Uploading ${file.filename}...`);
      const wpImage = await uploadToWordPress(file.filepath, file.filename);
      uploadedImages.push(wpImage.source_url);
      console.log(`✓ Uploaded: ${wpImage.source_url}`);

      // Clean up temp file
      fs.unlinkSync(file.filepath);
    }

    // Step 4: Get current page content
    console.log('\n[4/6] Fetching page content...');
    const pageData = await getPage(page.id);
    console.log(`✓ Retrieved page: ${pageData.title.rendered}`);

    // Step 5: Remove generic images and insert new ones
    console.log('\n[5/6] Updating content...');
    let updatedContent = removeGenericImages(pageData.content.rendered);
    console.log('✓ Removed generic images');

    updatedContent = insertImages(updatedContent, uploadedImages);
    console.log('✓ Inserted new Pixabay images');

    // Step 6: Update page
    console.log('\n[6/6] Updating WordPress page...');
    await updatePage(page.id, updatedContent);
    console.log(`✓ Page updated successfully!`);

    console.log(`\n✅ SUCCESS: ${page.name}`);
    console.log(`   - Images added: ${uploadedImages.length}`);
    console.log(`   - View at: ${WP_SITE_URL}/?page_id=${page.id}&preview=true`);

    return { success: true, page: page.name, images: uploadedImages.length };

  } catch (error) {
    console.error(`\n❌ ERROR processing ${page.name}:`);
    console.error(error.message);
    return { success: false, page: page.name, error: error.message };
  }
}

// Main execution
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Pixabay Image Replacement for WordPress Pages           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTotal pages to process: ${POSTS.length}`);
  console.log(`WordPress site: ${WP_SITE_URL}`);
  console.log(`Pixabay API key: ${PIXABAY_API_KEY.substring(0, 10)}...`);

  const results = [];

  for (const page of POSTS) {
    const result = await processPage(page);
    results.push(result);

    // Wait 2 seconds between pages to avoid rate limiting
    if (POSTS.indexOf(page) < POSTS.length - 1) {
      console.log('\nWaiting 2 seconds before next page...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL SUMMARY                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total processed: ${results.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('Failed pages:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.page}: ${r.error}`);
    });
  }

  console.log('\n✓ All done!');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
