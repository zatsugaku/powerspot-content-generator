require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

// Basic認証ヘッダーを作成
const authHeader = 'Basic ' + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// 汎用画像のパターン
const genericImagePatterns = [
  'shrine-entrance',
  'temple-garden',
  'forest-path',
  'stone-lantern-path',
  'bamboo-path',
  'moss-lantern',
  'mountain-view',
  'waterfall',
  'stone-steps',
  'torii-gate',
  'sacred-tree',
  'prayer-hall'
];

// 画像ファイル名を抽出
function extractImageFilenames(content) {
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  const images = [];
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1];
    const filename = src.split('/').pop().split('?')[0];
    images.push({ src, filename });
  }

  return images;
}

// 画像の適切性を判定
function evaluateImage(filename, postTitle) {
  // 画像なし
  if (!filename) {
    return { status: '❌', reason: '画像なし' };
  }

  // 汎用画像チェック
  const isGeneric = genericImagePatterns.some(pattern =>
    filename.toLowerCase().includes(pattern)
  );

  if (isGeneric) {
    return { status: '⚠️', reason: '汎用画像' };
  }

  // pixabay画像（固有ID付き）は基本的にOK
  if (filename.match(/pixabay-\d+/i)) {
    return { status: '✅', reason: 'Pixabay画像（固有ID）' };
  }

  // パワースポット名を含む画像
  const spotNameParts = postTitle.replace(/[【】（）()]/g, ' ').split(/\s+/);
  const hasSpotName = spotNameParts.some(part =>
    part.length > 1 && filename.includes(part)
  );

  if (hasSpotName) {
    return { status: '✅', reason: 'スポット名を含む' };
  }

  // その他の画像
  return { status: '⚠️', reason: '要確認' };
}

async function verifyPowerspotImages() {
  console.log('='.repeat(80));
  console.log('WordPress REST API - パワースポット投稿画像検証（51-75件目）');
  console.log('='.repeat(80));
  console.log('');

  try {
    // 全投稿を取得（最大100件ずつ）
    console.log('📥 投稿一覧を取得中...\n');

    let allPosts = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `${WP_SITE_URL}/wp-json/wp/v2/powerspot`,
        {
          params: {
            per_page: 100,
            page: page,
            orderby: 'id',
            order: 'asc',
            _fields: 'id,title,slug,content,link'
          },
          headers: {
            'Authorization': authHeader
          }
        }
      );

      allPosts = allPosts.concat(response.data);

      // 次のページがあるかチェック
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');
      hasMore = page < totalPages;
      page++;
    }

    console.log(`✅ 総投稿数: ${allPosts.length}件\n`);

    // 51-75件目を抽出（インデックスは0始まりなので50-74）
    const targetPosts = allPosts.slice(50, 75);

    if (targetPosts.length === 0) {
      console.log('⚠️ 51-75件目の投稿が見つかりませんでした。');
      return;
    }

    console.log(`🔍 検証対象: ${targetPosts.length}件（51-${50 + targetPosts.length}件目）\n`);
    console.log('='.repeat(80));
    console.log('');

    // 統計情報
    let stats = {
      total: targetPosts.length,
      noImage: 0,
      generic: 0,
      needsCheck: 0,
      appropriate: 0
    };

    // 各投稿を検証
    targetPosts.forEach((post, index) => {
      const postNumber = 51 + index;
      const title = post.title.rendered;
      const images = extractImageFilenames(post.content.rendered);

      console.log(`📄 投稿 #${postNumber} (ID: ${post.id})`);
      console.log(`   タイトル: ${title}`);
      console.log(`   スラッグ: ${post.slug}`);
      console.log(`   URL: ${post.link}`);

      if (images.length === 0) {
        console.log(`   🖼️  画像: 0枚`);
        console.log(`   判定: ❌ 画像なし`);
        stats.noImage++;
      } else {
        console.log(`   🖼️  画像: ${images.length}枚`);

        images.forEach((img, imgIndex) => {
          const evaluation = evaluateImage(img.filename, title);
          console.log(`      ${imgIndex + 1}. ${img.filename}`);
          console.log(`         判定: ${evaluation.status} ${evaluation.reason}`);

          // 統計更新（最初の画像で判定）
          if (imgIndex === 0) {
            if (evaluation.status === '❌') stats.noImage++;
            else if (evaluation.status === '⚠️') {
              if (evaluation.reason === '汎用画像') stats.generic++;
              else stats.needsCheck++;
            } else {
              stats.appropriate++;
            }
          }
        });
      }

      console.log('');
    });

    // 統計サマリー
    console.log('='.repeat(80));
    console.log('📊 検証結果サマリー');
    console.log('='.repeat(80));
    console.log(`総投稿数: ${stats.total}件`);
    console.log(`✅ 適切な画像: ${stats.appropriate}件 (${(stats.appropriate/stats.total*100).toFixed(1)}%)`);
    console.log(`⚠️  汎用画像: ${stats.generic}件 (${(stats.generic/stats.total*100).toFixed(1)}%)`);
    console.log(`⚠️  要確認: ${stats.needsCheck}件 (${(stats.needsCheck/stats.total*100).toFixed(1)}%)`);
    console.log(`❌ 画像なし: ${stats.noImage}件 (${(stats.noImage/stats.total*100).toFixed(1)}%)`);
    console.log('');

    // 問題のある投稿をリストアップ
    console.log('='.repeat(80));
    console.log('⚠️  対応が必要な投稿');
    console.log('='.repeat(80));

    let issueCount = 0;
    targetPosts.forEach((post, index) => {
      const postNumber = 51 + index;
      const title = post.title.rendered;
      const images = extractImageFilenames(post.content.rendered);

      if (images.length === 0) {
        issueCount++;
        console.log(`${issueCount}. [❌ 画像なし] #${postNumber} ${title}`);
        console.log(`   ${post.link}`);
      } else {
        const evaluation = evaluateImage(images[0].filename, title);
        if (evaluation.status === '⚠️' && evaluation.reason === '汎用画像') {
          issueCount++;
          console.log(`${issueCount}. [⚠️  汎用画像] #${postNumber} ${title}`);
          console.log(`   画像: ${images[0].filename}`);
          console.log(`   ${post.link}`);
        }
      }
    });

    if (issueCount === 0) {
      console.log('✅ すべての投稿に適切な画像が設定されています！');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:');
    if (error.response) {
      console.error(`   ステータス: ${error.response.status}`);
      console.error(`   メッセージ: ${error.response.statusText}`);
      console.error(`   詳細: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// 実行
verifyPowerspotImages();
