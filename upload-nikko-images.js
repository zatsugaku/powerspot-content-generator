#!/usr/bin/env node
// 日光東照宮記事用の画像を検索・アップロード

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// 日光東照宮に適した画像URL（フリー素材サイトから）
const imageUrls = [
  'https://images.pexels.com/photos/7914822/pexels-photo-7914822.jpeg?auto=compress&cs=tinysrgb&w=1260', // 鳥居と石灯籠
  'https://images.pexels.com/photos/3881104/pexels-photo-3881104.jpeg?auto=compress&cs=tinysrgb&w=1260', // 日本の寺院建築
  'https://images.pexels.com/photos/161401/fushimi-inari-taisha-shrine-kyoto-japan-temple-161401.jpeg?auto=compress&cs=tinysrgb&w=1260', // 朱塗りの門
  'https://images.pexels.com/photos/3881105/pexels-photo-3881105.jpeg?auto=compress&cs=tinysrgb&w=1260', // 伝統的な日本建築
  'https://images.pexels.com/photos/3881101/pexels-photo-3881101.jpeg?auto=compress&cs=tinysrgb&w=1260'  // 神社の森
];

const descriptions = [
  '鳥居と石灯籠のある参道',
  '荘厳な日本の寺社建築',
  '朱塗りの美しい門',
  '伝統的な日本建築の装飾',
  '神聖な杉木立の参道'
];

async function uploadImage(imageUrl, description, index) {
  try {
    console.log(`\n${index + 1}. 画像をダウンロード中: ${description}`);

    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const imageBuffer = Buffer.from(imageResponse.data);
    const fileName = `nikko-toshogu-${index + 1}.jpg`;

    console.log(`   WordPressにアップロード中...`);

    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: fileName,
      contentType: 'image/jpeg'
    });

    const uploadResponse = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/media`,
      formData,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log(`   ✅ アップロード成功！`);
    console.log(`   メディアID: ${uploadResponse.data.id}`);
    console.log(`   URL: ${uploadResponse.data.source_url}`);

    return {
      id: uploadResponse.data.id,
      url: uploadResponse.data.source_url,
      description: description
    };

  } catch (error) {
    console.error(`   ❌ エラー (${description}):`, error.message);
    return null;
  }
}

async function uploadAllImages() {
  console.log('📸 日光東照宮の記事用画像をアップロード中...\n');

  const results = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const result = await uploadImage(imageUrls[i], descriptions[i], i);
    if (result) {
      results.push(result);
    }
    // レート制限を避けるため少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n📋 アップロード結果まとめ:');
  console.log('========================\n');

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.description}`);
    console.log(`   ID: ${result.id}`);
    console.log(`   URL: ${result.url}\n`);
  });

  console.log('\n💡 記事への挿入用マークダウン:\n');
  results.forEach((result, index) => {
    console.log(`![${result.description}](${result.url})`);
    console.log(`*${result.description}*\n`);
  });
}

uploadAllImages();
