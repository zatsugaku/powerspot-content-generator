#!/usr/bin/env node
// 阿蘇山記事用の画像を検索・アップロード

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// 阿蘇山に適した画像URL（フリー素材サイトから）
const imageUrls = [
  'https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=1260', // 火山クレーター
  'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1260',  // 山岳風景
  'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1260', // 草原と山
  'https://images.pexels.com/photos/2559941/pexels-photo-2559941.jpeg?auto=compress&cs=tinysrgb&w=1260', // 霧の山
  'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1260'  // 雄大な山岳
];

const descriptions = [
  '火山の噴火口',
  '雄大な山岳風景',
  '緑の草原と山々',
  '霧に包まれた神秘的な山',
  '壮大な山岳パノラマ'
];

async function uploadImage(imageUrl, description, index) {
  try {
    console.log(`\n${index + 1}. 画像をダウンロード中: ${description}`);

    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const imageBuffer = Buffer.from(imageResponse.data);
    const fileName = `aso-mountain-${index + 1}.jpg`;

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
  console.log('📸 阿蘇山の記事用画像をアップロード中...\n');

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
