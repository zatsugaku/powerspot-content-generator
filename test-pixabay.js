require('dotenv').config();
const axios = require('axios');

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

async function testPixabay() {
  console.log('Testing Pixabay API...');
  console.log(`API Key: ${PIXABAY_API_KEY}`);

  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: PIXABAY_API_KEY,
        q: 'japan',
        image_type: 'photo',
        per_page: 3
      }
    });

    console.log('\n✓ API Connection Successful!');
    console.log(`Total hits: ${response.data.totalHits}`);
    console.log(`Returned: ${response.data.hits.length} images`);

    if (response.data.hits.length > 0) {
      console.log('\nFirst image:');
      console.log(`  - ID: ${response.data.hits[0].id}`);
      console.log(`  - Tags: ${response.data.hits[0].tags}`);
      console.log(`  - URL: ${response.data.hits[0].largeImageURL}`);
    }
  } catch (error) {
    console.error('\n✗ API Error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testPixabay();
