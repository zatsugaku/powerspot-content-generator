// WordPress REST API 接続テスト
require('dotenv').config();
const https = require('https');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

// Basic認証用のヘッダーを作成
const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

console.log('🔗 WordPress REST API 接続テスト\n');
console.log(`サイトURL: ${WP_SITE_URL}`);
console.log(`ユーザー名: ${WP_USERNAME}`);
console.log(`\n接続中...\n`);

// ユーザー情報を取得してテスト
const options = {
  hostname: 'k005.net',
  path: '/wp-json/wp/v2/users/me',
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      const user = JSON.parse(data);
      console.log('✅ 接続成功！\n');
      console.log(`ユーザーID: ${user.id}`);
      console.log(`表示名: ${user.name}`);
      console.log(`権限: ${user.capabilities ? Object.keys(user.capabilities).join(', ') : 'N/A'}`);
      console.log(`\n✨ WordPress REST APIに正常に接続できました！`);
    } else {
      console.log(`❌ 接続失敗 (ステータスコード: ${res.statusCode})`);
      console.log('レスポンス:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ エラーが発生しました:', error.message);
});

req.end();
