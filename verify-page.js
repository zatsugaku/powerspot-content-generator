require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = 'https://k005.net';
const WP_USERNAME = 'power';
const WP_APP_PASSWORD = 'Ml5H 2psf K1CK 3BLl fIcV ulQn';

const wpAuth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

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

async function verifyPage(pageId) {
  try {
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/pages/${pageId}`,
      {
        headers: {
          'Authorization': `Basic ${wpAuth}`
        }
      }
    );

    const page = response.data;
    const content = page.content.rendered;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Page: ${page.title.rendered} (ID: ${pageId})`);
    console.log('='.repeat(60));

    // Check for generic images
    const foundGeneric = GENERIC_IMAGES.filter(img => content.includes(img));
    if (foundGeneric.length > 0) {
      console.log(`\n❌ Still contains generic images:`);
      foundGeneric.forEach(img => console.log(`   - ${img}`));
    } else {
      console.log(`\n✓ No generic images found`);
    }

    // Check for Pixabay images
    const pixabayMatches = content.match(/pixabay-\d+-\d+\.jpg/g);
    if (pixabayMatches) {
      console.log(`\n✓ Pixabay images found: ${pixabayMatches.length}`);
      pixabayMatches.forEach(img => console.log(`   - ${img}`));
    } else {
      console.log(`\n❌ No Pixabay images found`);
    }

    // Count total images
    const allImages = content.match(/<img[^>]*>/g);
    if (allImages) {
      console.log(`\n✓ Total images in page: ${allImages.length}`);
    }

    console.log(`\nView page: ${WP_SITE_URL}/?page_id=${pageId}`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

async function main() {
  const pageIds = [2030, 2044, 2027, 2028];

  for (const id of pageIds) {
    await verifyPage(id);
  }
}

main();
