require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

// 認証ヘッダー
const auth = {
  username: WP_USERNAME,
  password: WP_APP_PASSWORD
};

// 汎用画像のリスト
const GENERIC_IMAGES = [
  'shrine-entrance.jpg',
  'temple-garden.jpg',
  'forest-path-1.jpg',
  'stone-lantern-path.jpg',
  'bamboo-path.jpg',
  'moss-lantern.jpg'
];

// HTMLから画像を抽出
function extractImages(content) {
  if (!content) return [];

  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  const images = [];
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1];
    // ファイル名を抽出
    const filename = src.split('/').pop();
    images.push({
      src: src,
      filename: filename
    });
  }

  return images;
}

// 画像の判定
function evaluateImages(images, postTitle) {
  if (images.length === 0) {
    return { status: '❌', message: '画像なし' };
  }

  if (images.length === 1) {
    return { status: '❌', message: '画像不足（1枚のみ）' };
  }

  // 汎用画像のチェック
  const genericCount = images.filter(img =>
    GENERIC_IMAGES.some(generic => img.filename === generic)
  ).length;

  if (genericCount === images.length) {
    return { status: '⚠️', message: '全て汎用画像' };
  }

  if (genericCount > 0) {
    return { status: '⚠️', message: `汎用画像を含む（${genericCount}/${images.length}枚）` };
  }

  // pixabay/pexels画像のチェック
  const properImages = images.filter(img =>
    img.filename.startsWith('pixabay-') || img.filename.startsWith('pexels-')
  );

  if (properImages.length >= 2) {
    return { status: '✅', message: '適切' };
  }

  return { status: '⚠️', message: '要確認' };
}

async function verifyImagesBatch3() {
  try {
    console.log('投稿61-80件目の画像検証を開始します...\n');

    // per_page=100で取得（インデックス60-79が対象）
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot`,
      {
        params: {
          per_page: 100,
          _fields: 'id,title,slug,content,status'
        },
        auth: auth
      }
    );

    const allPosts = response.data;
    console.log(`総投稿数: ${response.headers['x-wp-total']}件`);
    console.log(`取得した投稿数: ${allPosts.length}件\n`);

    // 61-80件目を抽出（インデックス60-79、または最後まで）
    const startIndex = 60;
    const endIndex = Math.min(80, allPosts.length);
    const posts = allPosts.slice(startIndex, endIndex);

    console.log(`検証対象: ${startIndex + 1}件目～${endIndex}件目（${posts.length}件）\n`);
    console.log('='.repeat(80));
    console.log();

    let appropriateCount = 0;
    let warningCount = 0;
    let problemCount = 0;

    posts.forEach((post, index) => {
      const postNumber = startIndex + index + 1;
      const title = post.title.rendered;
      const slug = post.slug;
      const status = post.status;

      // 画像を抽出
      const images = extractImages(post.content.rendered);

      // 画像を評価
      const evaluation = evaluateImages(images, title);

      // カウント
      if (evaluation.status === '✅') {
        appropriateCount++;
      } else if (evaluation.status === '⚠️') {
        warningCount++;
      } else {
        problemCount++;
      }

      // 出力
      console.log(`【${postNumber}件目】 ID:${post.id} [${slug}] - ${status}`);
      console.log(`  タイトル: ${title}`);
      console.log(`  画像数: ${images.length}枚`);

      if (images.length > 0) {
        const filenames = images.map(img => img.filename).join(', ');
        console.log(`  ファイル: ${filenames}`);
      }

      console.log(`  判定: ${evaluation.status} ${evaluation.message}`);
      console.log();
    });

    // サマリー
    console.log('='.repeat(80));
    console.log('\n【サマリー】');
    console.log(`検証対象: ${posts.length}件`);
    console.log(`✅ 適切: ${appropriateCount}件`);
    console.log(`⚠️ 要確認: ${warningCount}件`);
    console.log(`❌ 問題あり: ${problemCount}件`);
    console.log();

    // 総投稿数の最終報告
    console.log(`【全体】`);
    console.log(`総投稿数: ${response.headers['x-wp-total']}件`);

    if (endIndex >= allPosts.length) {
      console.log('\n✅ 全ての投稿の検証が完了しました！');
    } else {
      console.log(`\n📝 次回: ${endIndex + 1}件目以降の検証が可能です`);
    }

  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    if (error.response) {
      console.error('ステータス:', error.response.status);
      console.error('データ:', error.response.data);
    }
    process.exit(1);
  }
}

verifyImagesBatch3();
