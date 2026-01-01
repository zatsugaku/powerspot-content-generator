require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const imageData = JSON.parse(fs.readFileSync('image-analysis.json', 'utf8'));

const genericImagePatterns = [
  /^nikko-toshogu-\d+\.jpg$/,
  /^aso-mountain-\d+\.jpg$/,
  /^shrine-entrance/,
  /^temple-garden/,
  /^forest-path/,
  /^stone-lantern/,
  /^pixabay-/
];

async function checkPexelsImage(pexelsId) {
  try {
    const response = await axios.get(`https://api.pexels.com/v1/photos/${pexelsId}`, {
      headers: {
        'Authorization': process.env.PEXELS_API_KEY
      }
    });
    return {
      alt: response.data.alt || 'No description',
      url: response.data.url,
      photographer: response.data.photographer
    };
  } catch (error) {
    return { error: error.message };
  }
}

function isGenericImage(filename) {
  return genericImagePatterns.some(pattern => pattern.test(filename));
}

async function main() {
  console.log('# 画像チェック結果\n');

  const needsReplacement = [];

  for (const post of imageData) {
    console.log(`## 投稿ID: ${post.id} - ${post.name}`);

    if (post.error) {
      console.log(`ERROR: ${post.error}\n`);
      continue;
    }

    if (!post.images || post.images.length === 0) {
      console.log('画像なし ❌要追加\n');
      needsReplacement.push({
        id: post.id,
        name: post.name,
        reason: '画像なし'
      });
      continue;
    }

    for (let i = 0; i < post.images.length; i++) {
      const img = post.images[i];
      console.log(`- 画像${i + 1}: ${img.filename}`);

      if (img.isPexels) {
        const pexelsInfo = await checkPexelsImage(img.pexelsId);
        if (pexelsInfo.error) {
          console.log(`  ⚠️確認必要 - Pexels API Error: ${pexelsInfo.error}`);
        } else {
          console.log(`  説明: ${pexelsInfo.alt}`);
          console.log(`  撮影者: ${pexelsInfo.photographer}`);

          // Check if the description is relevant to the powerspot
          const alt = pexelsInfo.alt.toLowerCase();
          const postName = post.name.toLowerCase();

          // Simple relevance check
          if (alt.includes('japan') || alt.includes('shrine') || alt.includes('temple') ||
              alt.includes('torii') || alt.includes('kyoto') || alt.includes('tokyo')) {
            console.log(`  ✅適切 - 日本の寺社仏閣関連画像`);
          } else if (alt.includes('mountain') || alt.includes('nature') || alt.includes('landscape')) {
            console.log(`  ⚠️確認必要 - 一般的な風景画像（パワースポット特定性が低い）`);
          } else {
            console.log(`  ❌要差し替え - パワースポットと関連性が低い`);
            needsReplacement.push({
              id: post.id,
              name: post.name,
              image: img.filename,
              reason: `Pexels画像の説明が不適切: ${pexelsInfo.alt}`
            });
          }
        }
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (isGenericImage(img.filename)) {
        console.log(`  ❌要差し替え - 汎用画像ファイル名`);
        needsReplacement.push({
          id: post.id,
          name: post.name,
          image: img.filename,
          reason: '汎用画像ファイル名（具体的な場所が不明）'
        });
      } else {
        console.log(`  ⚠️確認必要 - 不明な画像形式`);
      }
    }

    console.log('');
  }

  console.log('\n\n# 要差し替え画像リスト\n');
  if (needsReplacement.length === 0) {
    console.log('すべての画像が適切です。');
  } else {
    console.log(`合計 ${needsReplacement.length} 件\n`);
    needsReplacement.forEach(item => {
      console.log(`- **${item.name}** (ID: ${item.id})`);
      if (item.image) {
        console.log(`  - 画像: ${item.image}`);
      }
      console.log(`  - 理由: ${item.reason}`);
    });
  }
}

main();
