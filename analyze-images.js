const fs = require('fs');
const path = require('path');

const posts = [
  { id: 2376, name: '伊勢神宮' },
  { id: 2383, name: '伏見稲荷大社' },
  { id: 2398, name: '斎場御嶽' },
  { id: 2404, name: '金刀比羅宮' },
  { id: 2410, name: '出雲大社' },
  { id: 2425, name: '日光東照宮' },
  { id: 2426, name: '阿蘇山' },
  { id: 2430, name: 'Ise Grand Shrine EN' },
  { id: 2443, name: 'Fushimi Inari EN' },
  { id: 2444, name: 'Sefa Utaki EN' },
  { id: 2445, name: 'Kotohira-gu EN' },
  { id: 2446, name: 'Izumo Taisha EN' },
  { id: 2447, name: 'Nikko Toshogu EN' },
  { id: 2448, name: 'Mount Aso EN' },
  { id: 2463, name: '羽黒山神社' },
  { id: 2464, name: '中尊寺金色堂' },
  { id: 2467, name: 'Haguro-san EN' },
  { id: 2468, name: 'Chusonji EN' },
  { id: 2470, name: '松島' },
  { id: 2471, name: 'Matsushima EN' }
];

const results = [];

for (const post of posts) {
  const filePath = `C:\\Users\\user\\AppData\\Local\\Temp\\post-${post.id}.json`;

  if (!fs.existsSync(filePath)) {
    results.push({
      id: post.id,
      name: post.name,
      error: 'File not found'
    });
    continue;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const content = data.content?.rendered || '';

  // Extract all img src attributes
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
  const images = [];
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1];
    const filename = path.basename(src);

    // Check if it's a Pexels image
    const pexelsMatch = filename.match(/pexels-(\d+)\.jpg/);

    images.push({
      src: src,
      filename: filename,
      isPexels: !!pexelsMatch,
      pexelsId: pexelsMatch ? pexelsMatch[1] : null
    });
  }

  results.push({
    id: post.id,
    name: post.name,
    title: data.title?.rendered || '',
    images: images
  });
}

// Output results
for (const result of results) {
  console.log(`\n## Post ID: ${result.id} - ${result.name}`);

  if (result.error) {
    console.log(`ERROR: ${result.error}`);
    continue;
  }

  if (result.images.length === 0) {
    console.log('画像なし');
    continue;
  }

  result.images.forEach((img, idx) => {
    console.log(`- 画像${idx + 1}: ${img.filename}`);
    if (img.isPexels) {
      console.log(`  Pexels ID: ${img.pexelsId}`);
    }
  });
}

// Output JSON for further processing
fs.writeFileSync('C:\\Users\\user\\work\\powerspot-content-generator\\image-analysis.json', JSON.stringify(results, null, 2));
console.log('\n\nJSON saved to image-analysis.json');
