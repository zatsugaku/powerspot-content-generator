require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

// Basic認証のヘッダーを作成
const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// 汎用画像のファイル名パターン
const genericImagePatterns = [
  'shrine-entrance.jpg',
  'temple-garden.jpg',
  'forest-path-1.jpg',
  'forest-path-2.jpg',
  'forest-path-3.jpg',
  'stone-lantern-path.jpg',
  'bamboo-path.jpg',
  'moss-lantern.jpg',
  'mountain-view.jpg',
  'waterfall.jpg',
  'torii-gate.jpg',
  'sacred-tree.jpg'
];

// 画像のファイル名を抽出
function extractImageFilenames(content) {
  const imageRegex = /<img[^>]+src="([^"]+)"/g;
  const filenames = [];
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const url = match[1];
    const filename = url.split('/').pop();
    filenames.push(filename);
  }

  return filenames;
}

// 画像の適切性を判定
function evaluateImages(title, filenames) {
  if (filenames.length === 0) {
    return { status: '❌', reason: '画像なし' };
  }

  // 汎用画像チェック
  const hasGenericImages = filenames.some(filename =>
    genericImagePatterns.includes(filename)
  );

  if (hasGenericImages) {
    return {
      status: '⚠️',
      reason: '汎用画像使用',
      details: filenames.filter(f => genericImagePatterns.includes(f))
    };
  }

  // pixabay形式の画像をチェック
  const hasPixabayImages = filenames.some(filename =>
    filename.match(/pixabay-\d+\.jpg/)
  );

  if (hasPixabayImages) {
    return {
      status: '✅',
      reason: 'Pixabay画像使用',
      details: filenames
    };
  }

  // その他の画像
  return {
    status: '✅',
    reason: 'カスタム画像',
    details: filenames
  };
}

async function fetchAllPowerspotPosts() {
  try {
    console.log('WordPress REST APIに接続中...\n');

    let allPosts = [];
    let page = 1;
    let hasMore = true;

    // 全ページを取得
    while (hasMore) {
      const response = await axios.get(
        `${WP_SITE_URL}/wp-json/wp/v2/powerspot`,
        {
          params: {
            per_page: 100,
            page: page,
            _embed: true // メディア情報も取得
          },
          headers: {
            'Authorization': `Basic ${auth}`
          }
        }
      );

      allPosts = allPosts.concat(response.data);

      // ヘッダーから総ページ数を確認
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');
      console.log(`ページ ${page}/${totalPages} を取得しました（${response.data.length}件）`);

      if (page >= totalPages) {
        hasMore = false;
      } else {
        page++;
      }
    }

    console.log(`\n総投稿数: ${allPosts.length}件\n`);
    console.log('='.repeat(80));
    console.log('最初の25件を検証中...');
    console.log('='.repeat(80));
    console.log();

    // 最初の25件を検証
    const postsToVerify = allPosts.slice(0, 25);

    let statusCounts = {
      '✅': 0,
      '⚠️': 0,
      '❌': 0
    };

    postsToVerify.forEach((post, index) => {
      const actualIndex = index + 1; // 実際の順序番号（1から開始）
      const title = post.title.rendered.replace(/<[^>]*>/g, ''); // HTMLタグを除去
      const slug = post.slug;
      const content = post.content.rendered;

      // 画像ファイル名を抽出
      const imageFilenames = extractImageFilenames(content);

      // 画像の適切性を判定
      const evaluation = evaluateImages(title, imageFilenames);
      statusCounts[evaluation.status]++;

      // 結果を出力
      console.log(`${evaluation.status} [投稿 ${actualIndex}] ID: ${post.id} | ${title}`);
      console.log(`   スラッグ: ${slug}`);
      console.log(`   画像数: ${imageFilenames.length}枚`);

      if (imageFilenames.length > 0) {
        console.log(`   ファイル名: ${imageFilenames.join(', ')}`);
      }

      console.log(`   判定: ${evaluation.reason}`);
      console.log();
    });

    // サマリー
    console.log('='.repeat(80));
    console.log('検証結果サマリー');
    console.log('='.repeat(80));
    console.log(`総投稿数: ${allPosts.length}件`);
    console.log(`検証対象: 投稿1〜25（${postsToVerify.length}件）`);
    console.log();
    console.log(`✅ 適切な画像: ${statusCounts['✅']}件`);
    console.log(`⚠️ 汎用画像使用: ${statusCounts['⚠️']}件`);
    console.log(`❌ 画像なし: ${statusCounts['❌']}件`);
    console.log();

    // 問題がある投稿のリスト
    if (statusCounts['⚠️'] > 0 || statusCounts['❌'] > 0) {
      console.log('='.repeat(80));
      console.log('修正が必要な投稿');
      console.log('='.repeat(80));

      postsToVerify.forEach((post, index) => {
        const actualIndex = index + 1;
        const title = post.title.rendered.replace(/<[^>]*>/g, '');
        const content = post.content.rendered;
        const imageFilenames = extractImageFilenames(content);
        const evaluation = evaluateImages(title, imageFilenames);

        if (evaluation.status === '⚠️' || evaluation.status === '❌') {
          console.log(`${evaluation.status} [投稿 ${actualIndex}] ${title} (ID: ${post.id})`);
          console.log(`   理由: ${evaluation.reason}`);
          if (evaluation.details) {
            console.log(`   詳細: ${evaluation.details.join(', ')}`);
          }
          console.log(`   管理画面URL: ${WP_SITE_URL}/wp-admin/post.php?post=${post.id}&action=edit`);
          console.log();
        }
      });
    }

  } catch (error) {
    console.error('エラーが発生しました:');
    if (error.response) {
      console.error(`ステータス: ${error.response.status}`);
      console.error(`メッセージ: ${error.response.data.message || error.response.statusText}`);
    } else {
      console.error(error.message);
    }
  }
}

// 実行
fetchAllPowerspotPosts();
