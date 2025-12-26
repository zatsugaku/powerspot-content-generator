#!/usr/bin/env node
// Pexels / Pixabay APIで画像を検索し、WordPressにアップロード

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

// 引数解析
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    query: '',
    count: 1,
    source: 'pexels',
    upload: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--source' || arg === '-s') {
      options.source = (args[++i] || 'pexels').toLowerCase();
    } else if (arg === '--count' || arg === '-c') {
      options.count = parseInt(args[++i], 10) || 1;
    } else if (arg === '--upload') {
      options.upload = true;
    } else if (!arg.startsWith('-')) {
      options.query = arg;
    }
  }

  return options;
}

// 環境変数チェック
function validateEnvironment(source) {
  if (source === 'pexels') {
    if (!PEXELS_API_KEY) {
      console.error('[!] PEXELS_API_KEYが設定されていません');
      console.log('\n設定方法:');
      console.log('1. https://www.pexels.com/api/ でAPIキーを取得');
      console.log('2. .envファイルに追加: PEXELS_API_KEY=your_api_key\n');
      return false;
    }
  } else if (source === 'pixabay') {
    if (!PIXABAY_API_KEY) {
      console.error('[!] PIXABAY_API_KEYが設定されていません');
      console.log('\n設定方法:');
      console.log('1. https://pixabay.com/api/docs/ でAPIキーを取得');
      console.log('2. .envファイルに追加: PIXABAY_API_KEY=your_api_key\n');
      return false;
    }
  } else {
    console.error(`[!] 非対応のソース: ${source}`);
    console.log('    対応: pexels, pixabay');
    return false;
  }
  return true;
}

// Pexelsで画像を検索
async function searchPexels(query, perPage = 5) {
  console.log(`\n[*] Pexelsで「${query}」を検索中...\n`);

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      headers: {
        'Authorization': PEXELS_API_KEY
      },
      params: {
        query: query,
        per_page: perPage,
        orientation: 'landscape',
        size: 'large'
      }
    });

    const photos = response.data.photos;

    if (photos.length === 0) {
      console.log('[!] 画像が見つかりませんでした');
      return [];
    }

    console.log(`[+] ${photos.length}枚の画像が見つかりました\n`);

    return photos.map(photo => ({
      id: photo.id,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      url: photo.src.large,
      original_url: photo.src.original,
      description: photo.alt || query,
      width: photo.width,
      height: photo.height,
      source: 'Pexels'
    }));

  } catch (error) {
    console.error('[!] Pexels検索エラー:', error.response?.data || error.message);
    throw error;
  }
}

// Pixabayで画像を検索
async function searchPixabay(query, perPage = 5) {
  console.log(`\n[*] Pixabayで「${query}」を検索中...\n`);

  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: PIXABAY_API_KEY,
        q: query,
        per_page: perPage,
        orientation: 'horizontal',
        image_type: 'photo',
        safesearch: true,
        lang: 'ja'
      }
    });

    const hits = response.data.hits;

    if (hits.length === 0) {
      console.log('[!] 画像が見つかりませんでした');
      return [];
    }

    console.log(`[+] ${hits.length}枚の画像が見つかりました\n`);

    return hits.map(hit => ({
      id: hit.id,
      photographer: hit.user,
      photographer_url: `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
      url: hit.largeImageURL,
      original_url: hit.largeImageURL,
      description: hit.tags || query,
      width: hit.imageWidth,
      height: hit.imageHeight,
      source: 'Pixabay'
    }));

  } catch (error) {
    console.error('[!] Pixabay検索エラー:', error.response?.data || error.message);
    throw error;
  }
}

// 画像を検索（ソースに応じて切り替え）
async function searchImages(query, source, count) {
  if (source === 'pexels') {
    return searchPexels(query, count);
  } else if (source === 'pixabay') {
    return searchPixabay(query, count);
  }
  throw new Error(`非対応のソース: ${source}`);
}

// 画像をダウンロード
async function downloadImage(url, filename) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      maxRedirects: 5
    });

    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, response.data);

    return filePath;
  } catch (error) {
    console.error('[!] ダウンロードエラー:', error.message);
    throw error;
  }
}

// WordPressにアップロード
async function uploadToWordPress(filePath, altText, caption, credit) {
  const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    if (altText) {
      form.append('alt_text', altText);
    }

    if (caption) {
      const fullCaption = credit ? `${caption} (Photo by ${credit})` : caption;
      form.append('caption', fullCaption);
    }

    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/media`,
      form,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    // 一時ファイルを削除
    fs.unlinkSync(filePath);

    return response.data;

  } catch (error) {
    // エラー時も一時ファイルを削除
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error('[!] アップロードエラー:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  const options = parseArgs();

  if (!options.query) {
    console.error('[!] 検索キーワードを指定してください');
    console.log('');
    console.log('使用例:');
    console.log('  node search-images.js "japanese shrine" --count 5');
    console.log('  node search-images.js "temple garden" --source pixabay');
    console.log('  node search-images.js "torii" --source pexels --upload');
    console.log('');
    console.log('オプション:');
    console.log('  --source, -s   画像ソース: pexels, pixabay（デフォルト: pexels）');
    console.log('  --count, -c    取得する画像数（デフォルト: 1）');
    console.log('  --upload       WordPressに自動アップロード');
    process.exit(1);
  }

  if (!validateEnvironment(options.source)) {
    process.exit(1);
  }

  try {
    // 画像を検索
    const photos = await searchImages(options.query, options.source, options.count);

    if (photos.length === 0) {
      return;
    }

    // 各画像を表示
    console.log('[*] 検索結果:\n');
    photos.forEach((photo, index) => {
      console.log(`${index + 1}. ID: ${photo.id} (${photo.source})`);
      console.log(`   説明: ${photo.description}`);
      console.log(`   撮影者: ${photo.photographer}`);
      console.log(`   URL: ${photo.url}`);
      console.log(`   サイズ: ${photo.width} x ${photo.height}`);
      console.log('');
    });

    const uploadedImages = [];

    // 自動アップロードモード
    if (options.upload) {
      console.log('[*] WordPressにアップロード中...\n');

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        console.log(`[${i + 1}/${photos.length}] ${photo.description} をアップロード中...`);

        // ダウンロード
        const filename = `${photo.source.toLowerCase()}-${photo.id}.jpg`;
        const filePath = await downloadImage(photo.url, filename);
        console.log(`  [+] ダウンロード完了 (${Math.round(fs.statSync(filePath).size / 1024)} KB)`);

        // アップロード
        const media = await uploadToWordPress(
          filePath,
          photo.description,
          photo.description,
          `${photo.photographer} / ${photo.source}`
        );

        console.log(`  [+] アップロード完了 (メディアID: ${media.id})`);
        console.log(`  URL: ${media.source_url}\n`);

        uploadedImages.push({
          id: media.id,
          url: media.source_url,
          description: photo.description
        });
      }

      console.log('\n[OK] すべての画像をアップロードしました！\n');
      console.log('[*] アップロードされた画像:\n');
      uploadedImages.forEach((img, index) => {
        console.log(`${index + 1}. メディアID: ${img.id}`);
        console.log(`   URL: ${img.url}`);
        console.log(`   説明: ${img.description}\n`);
      });
    } else {
      console.log('[*] WordPressにアップロードするには --upload オプションを追加してください');
    }

  } catch (error) {
    console.error('\n[!] エラーが発生しました:', error.message);
    process.exit(1);
  }
}

main();
