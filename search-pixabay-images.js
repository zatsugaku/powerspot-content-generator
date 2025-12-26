#!/usr/bin/env node
// Pixabay APIで画像を検索し、WordPressにアップロード

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

if (!PIXABAY_API_KEY) {
  console.error('PIXABAY_API_KEY が設定されていません');
  console.log('\nPixabay APIキーの取得方法:');
  console.log('1. https://pixabay.com/api/docs/ にアクセス');
  console.log('2. 無料アカウントを作成');
  console.log('3. APIキーを取得');
  console.log('4. .envファイルに追加: PIXABAY_API_KEY=your_api_key_here\n');
  process.exit(1);
}

const searchQuery = process.argv[2];
const count = parseInt(process.argv[3]) || 5;

if (!searchQuery) {
  console.error('検索キーワードを指定してください');
  console.log('使用例: node search-pixabay-images.js "japanese shrine" 5');
  console.log('       node search-pixabay-images.js "temple japan" 3 --upload');
  process.exit(1);
}

// Pixabayで画像を検索
async function searchPixabay(query, perPage = 5) {
  console.log(`\nPixabayで「${query}」を検索中...\n`);

  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: PIXABAY_API_KEY,
        q: query,
        per_page: perPage,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: 'true',
        lang: 'ja',
        min_width: 1200
      }
    });

    const hits = response.data.hits;

    if (hits.length === 0) {
      console.log('画像が見つかりませんでした');
      return [];
    }

    console.log(`${hits.length}枚の画像が見つかりました（総数: ${response.data.totalHits}）\n`);

    return hits.map((hit) => ({
      id: hit.id,
      user: hit.user,
      user_id: hit.user_id,
      tags: hit.tags,
      url: hit.largeImageURL,
      preview_url: hit.webformatURL,
      page_url: hit.pageURL,
      width: hit.imageWidth,
      height: hit.imageHeight,
      downloads: hit.downloads,
      likes: hit.likes
    }));

  } catch (error) {
    console.error('Pixabay検索エラー:', error.response?.data || error.message);
    throw error;
  }
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
    console.error('ダウンロードエラー:', error.message);
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
    console.error('アップロードエラー:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  try {
    // 画像を検索
    const photos = await searchPixabay(searchQuery, count);

    if (photos.length === 0) {
      return;
    }

    // 各画像を表示
    console.log('検索結果:\n');
    photos.forEach((photo, index) => {
      console.log(`${index + 1}. ID: ${photo.id}`);
      console.log(`   タグ: ${photo.tags}`);
      console.log(`   撮影者: ${photo.user}`);
      console.log(`   URL: ${photo.url}`);
      console.log(`   サイズ: ${photo.width} x ${photo.height}`);
      console.log(`   DL数: ${photo.downloads} / いいね: ${photo.likes}`);
      console.log('');
    });

    // WordPressにアップロードするか
    console.log('これらの画像をWordPressにアップロードする場合:');
    console.log(`   node search-pixabay-images.js "${searchQuery}" ${count} --upload\n`);

    const uploadedImages = [];

    // 自動アップロードモード（--uploadフラグがある場合）
    if (process.argv.includes('--upload')) {
      console.log('WordPressにアップロード中...\n');

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        console.log(`[${i + 1}/${photos.length}] ${photo.tags} をアップロード中...`);

        // ダウンロード
        const filename = `pixabay-${photo.id}.jpg`;
        const filePath = await downloadImage(photo.url, filename);
        console.log(`  ダウンロード完了 (${Math.round(fs.statSync(filePath).size / 1024)} KB)`);

        // アップロード
        const media = await uploadToWordPress(
          filePath,
          photo.tags,
          photo.tags,
          `${photo.user} / Pixabay`
        );

        console.log(`  アップロード完了 (メディアID: ${media.id})`);
        console.log(`  URL: ${media.source_url}\n`);

        uploadedImages.push({
          id: media.id,
          url: media.source_url,
          description: photo.tags
        });
      }

      console.log('\nすべての画像をアップロードしました！\n');
      console.log('アップロードされた画像:\n');
      uploadedImages.forEach((img, index) => {
        console.log(`${index + 1}. メディアID: ${img.id}`);
        console.log(`   URL: ${img.url}`);
        console.log(`   説明: ${img.description}\n`);
      });
    }

  } catch (error) {
    console.error('\nエラーが発生しました:', error.message);
    process.exit(1);
  }
}

main();
