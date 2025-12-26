#!/usr/bin/env node
// Pixabay画像IDまたはURLを指定してWordPressにアップロード

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const imageIdOrUrl = process.argv[2];
const customAlt = process.argv[3];
const customCaption = process.argv[4];

if (!imageIdOrUrl) {
  console.error('Pixabay画像IDまたはURLを指定してください');
  console.log('使用例: node upload-pixabay-image.js 12345 "神社の鳥居" "朱色の鳥居"');
  console.log('       node upload-pixabay-image.js https://pixabay.com/get/xxx.jpg');
  process.exit(1);
}

// Pixabay画像の情報を取得
async function getPixabayPhoto(photoId) {
  if (!PIXABAY_API_KEY) {
    throw new Error('PIXABAY_API_KEYが設定されていません');
  }

  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: PIXABAY_API_KEY,
        id: photoId
      }
    });

    if (response.data.hits.length === 0) {
      throw new Error(`画像ID ${photoId} が見つかりません`);
    }

    const hit = response.data.hits[0];

    return {
      id: hit.id,
      user: hit.user,
      user_id: hit.user_id,
      tags: hit.tags,
      url: hit.largeImageURL,
      page_url: hit.pageURL,
      width: hit.imageWidth,
      height: hit.imageHeight
    };

  } catch (error) {
    console.error('Pixabay画像取得エラー:', error.response?.data || error.message);
    throw error;
  }
}

// 画像をダウンロード
async function downloadImage(url, filename) {
  console.log(`画像をダウンロード中: ${url}\n`);

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

    console.log(`ダウンロード完了: ${Math.round(response.data.length / 1024)} KB\n`);

    return filePath;
  } catch (error) {
    console.error('ダウンロードエラー:', error.message);
    throw error;
  }
}

// WordPressにアップロード
async function uploadToWordPress(filePath, altText, caption) {
  const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  try {
    console.log('WordPressにアップロード中...\n');

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    if (altText) {
      form.append('alt_text', altText);
    }

    if (caption) {
      form.append('caption', caption);
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

    const media = response.data;

    console.log('アップロード成功！\n');
    console.log('【画像情報】');
    console.log(`メディアID: ${media.id}`);
    console.log(`タイトル: ${media.title.rendered}`);
    console.log(`URL: ${media.source_url}`);
    console.log(`幅x高さ: ${media.media_details.width} x ${media.media_details.height}`);
    console.log(`ファイルサイズ: ${Math.round(media.media_details.filesize / 1024)} KB\n`);

    // 一時ファイルを削除
    fs.unlinkSync(filePath);

    return media;

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
    let photoUrl, photoInfo;

    // URLが直接指定された場合
    if (imageIdOrUrl.startsWith('http')) {
      photoUrl = imageIdOrUrl;
      photoInfo = {
        tags: customAlt || 'Pixabay photo',
        user: 'Unknown'
      };
    } else {
      // Pixabay IDの場合
      const photoId = imageIdOrUrl;
      console.log(`\nPixabay画像ID ${photoId} の情報を取得中...\n`);

      photoInfo = await getPixabayPhoto(photoId);
      photoUrl = photoInfo.url;

      console.log('【画像情報】');
      console.log(`タグ: ${photoInfo.tags}`);
      console.log(`撮影者: ${photoInfo.user}`);
      console.log(`サイズ: ${photoInfo.width} x ${photoInfo.height}\n`);
    }

    // ダウンロード
    const filename = imageIdOrUrl.startsWith('http')
      ? `pixabay-${Date.now()}.jpg`
      : `pixabay-${imageIdOrUrl}.jpg`;
    const filePath = await downloadImage(photoUrl, filename);

    // アップロード
    const altText = customAlt || photoInfo.tags;
    const caption = customCaption || photoInfo.tags;
    const credit = photoInfo.user !== 'Unknown'
      ? `Photo by ${photoInfo.user} / Pixabay`
      : null;

    const media = await uploadToWordPress(
      filePath,
      altText,
      credit ? `${caption} (${credit})` : caption
    );

    console.log('この画像をアイキャッチに設定する場合:');
    console.log(`   node set-featured-image.js [投稿ID] ${media.id}\n`);

    console.log('記事に埋め込む場合:');
    console.log(`   ![${altText}](${media.source_url})`);
    console.log(`   *${caption}*\n`);

    return media;

  } catch (error) {
    console.error('\nエラーが発生しました:', error.message);
    process.exit(1);
  }
}

main();
