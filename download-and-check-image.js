const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadAndCheckImage(imageUrl, imageName) {
  try {
    console.log(`\nDownloading: ${imageName}`);
    console.log(`URL: ${imageUrl}`);

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    const localPath = path.join(__dirname, 'temp-images', imageName);

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'temp-images'))) {
      fs.mkdirSync(path.join(__dirname, 'temp-images'));
    }

    fs.writeFileSync(localPath, buffer);
    console.log(`✓ Saved to: ${localPath}`);
    console.log(`File size: ${(buffer.length / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error(`✗ Error downloading ${imageName}:`, error.message);
  }
}

// Download sample images
const imagesToCheck = [
  // Generic names that should be replaced
  { url: 'https://k005.net/wp-content/uploads/2025/12/temple-garden.jpg', name: 'temple-garden.jpg' },
  { url: 'https://k005.net/wp-content/uploads/2025/12/stone-lantern-path.jpg', name: 'stone-lantern-path.jpg' },
  { url: 'https://k005.net/wp-content/uploads/2025/12/forest-path-1.jpg', name: 'forest-path-1.jpg' },
  { url: 'https://k005.net/wp-content/uploads/2025/12/bamboo-path.jpg', name: 'bamboo-path.jpg' },

  // Custom names that might be appropriate
  { url: 'https://k005.net/wp-content/uploads/2025/12/akan-lake-1-1.jpg', name: 'akan-lake-1-1.jpg' },
  { url: 'https://k005.net/wp-content/uploads/2025/12/tarumaesan-1.jpg', name: 'tarumaesan-1.jpg' },
  { url: 'https://k005.net/wp-content/uploads/2025/12/hokkaido-jingu-1.jpg', name: 'hokkaido-jingu-1.jpg' },
  { url: 'https://k005.net/wp-content/uploads/2025/12/atsuta-jingu-1.jpg', name: 'atsuta-jingu-1.jpg' },
];

async function main() {
  for (const img of imagesToCheck) {
    await downloadAndCheckImage(img.url, img.name);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\nAll images downloaded to temp-images/ folder');
  console.log('Please review them manually to confirm appropriateness for each power spot.');
}

main();
