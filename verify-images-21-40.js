require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

// Basic認証ヘッダー
const auth = {
  username: WP_USERNAME,
  password: WP_APP_PASSWORD
};

// 画像判定用の汎用画像リスト
const GENERIC_IMAGES = [
  'shrine-entrance.jpg',
  'temple-garden.jpg',
  'forest-path-1.jpg',
  'stone-lantern-path.jpg',
  'bamboo-path.jpg',
  'moss-lantern.jpg'
];

// HTML内の画像を抽出
function extractImages(htmlContent) {
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  const images = [];
  let match;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    images.push(match[1]);
  }

  return images;
}

// ファイル名を抽出
function getFilename(url) {
  return url.split('/').pop().split('?')[0];
}

// 画像の適切性を判定
function assessImages(images, powerspotTitle) {
  if (images.length === 0) {
    return { status: '❌', reason: '画像なし (0枚)' };
  }

  if (images.length === 1) {
    return { status: '❌', reason: '画像不足 (1枚のみ、最低2枚必要)' };
  }

  const filenames = images.map(getFilename);

  // 汎用画像チェック
  const hasGeneric = filenames.some(f => GENERIC_IMAGES.includes(f));
  if (hasGeneric) {
    return { status: '⚠️', reason: `汎用画像使用 (${filenames.filter(f => GENERIC_IMAGES.includes(f)).join(', ')})` };
  }

  // pixabay/pexels画像チェック
  const hasProperImages = filenames.filter(f =>
    f.startsWith('pixabay-') || f.startsWith('pexels-')
  ).length >= 2;

  if (hasProperImages) {
    return { status: '✅', reason: `適切 (専用画像${images.length}枚)` };
  }

  return { status: '⚠️', reason: `要確認 (${images.length}枚、命名規則不明)` };
}

async function verifyPosts() {
  try {
    console.log('WordPress投稿画像検証（21-40件目）\n');
    console.log('='.repeat(80));

    // per_page=100で投稿を取得
    const response = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot`, {
      auth: auth,
      params: {
        per_page: 100,
        _fields: 'id,title,slug,content,status'
      }
    });

    const allPosts = response.data;
    console.log(`\n総投稿数: ${allPosts.length}件\n`);

    // 21-40件目を抽出（インデックス20-39）
    const targetPosts = allPosts.slice(20, 40);
    console.log(`検証対象: 21-40件目 (${targetPosts.length}件)\n`);
    console.log('='.repeat(80) + '\n');

    let okCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    targetPosts.forEach((post, index) => {
      const actualIndex = index + 21; // 実際の番号（21から開始）
      const images = extractImages(post.content.rendered);
      const filenames = images.map(getFilename);
      const assessment = assessImages(images, post.title.rendered);

      // カウント
      if (assessment.status === '✅') okCount++;
      else if (assessment.status === '⚠️') warningCount++;
      else errorCount++;

      console.log(`\n【${actualIndex}】ID:${post.id} - ${post.slug}`);
      console.log(`タイトル: ${post.title.rendered}`);
      console.log(`ステータス: ${post.status}`);
      console.log(`画像数: ${images.length}枚`);

      if (images.length > 0) {
        console.log(`ファイル:`);
        filenames.forEach((f, i) => {
          console.log(`  ${i + 1}. ${f}`);
        });
      }

      console.log(`判定: ${assessment.status} ${assessment.reason}`);
      console.log('-'.repeat(80));
    });

    // サマリー
    console.log('\n' + '='.repeat(80));
    console.log('【検証サマリー】');
    console.log('='.repeat(80));
    console.log(`✅ 適切: ${okCount}件`);
    console.log(`⚠️  要確認: ${warningCount}件`);
    console.log(`❌ 問題あり: ${errorCount}件`);
    console.log(`合計: ${targetPosts.length}件`);
    console.log('='.repeat(80));

    // 問題がある投稿の詳細
    if (errorCount > 0 || warningCount > 0) {
      console.log('\n【要対応リスト】');
      targetPosts.forEach((post, index) => {
        const actualIndex = index + 21;
        const images = extractImages(post.content.rendered);
        const assessment = assessImages(images, post.title.rendered);

        if (assessment.status !== '✅') {
          console.log(`- ID:${post.id} (${post.slug}): ${assessment.reason}`);
        }
      });
    }

  } catch (error) {
    console.error('エラー:', error.response?.data || error.message);
    if (error.response) {
      console.error('ステータス:', error.response.status);
    }
  }
}

verifyPosts();
