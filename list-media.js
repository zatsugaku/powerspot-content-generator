require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = {
  username: WP_USERNAME,
  password: WP_APP_PASSWORD
};

async function listRecentMedia() {
  try {
    console.log('Fetching recent media...\n');

    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/media`,
      {
        auth,
        params: {
          per_page: 50,
          orderby: 'id',
          order: 'desc'
        }
      }
    );

    console.log(`Total media found: ${response.data.length}\n`);

    response.data.forEach((media, index) => {
      const title = media.title.rendered.replace(/<[^>]*>/g, '');
      console.log(`${index + 1}. ID:${media.id} - ${title}`);
      if (index < 10) {
        console.log(`   URL: ${media.source_url}`);
      }
    });

    // Pixabayからアップロードした画像を検索
    console.log('\n\nPixabay images uploaded today:\n');
    const pixabayImages = response.data.filter(media => {
      const title = media.title.rendered.replace(/<[^>]*>/g, '');
      return title.includes('pixabay');
    });

    console.log(`Found ${pixabayImages.length} Pixabay images:\n`);
    pixabayImages.forEach(media => {
      const title = media.title.rendered.replace(/<[^>]*>/g, '');
      console.log(`  ID:${media.id} - ${title}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

listRecentMedia();
