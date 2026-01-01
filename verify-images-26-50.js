require('dotenv').config();
const axios = require('axios');

// 認証情報
const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

// Basic認証ヘッダー
const auth = {
  username: WP_USERNAME,
  password: WP_APP_PASSWORD
};

// 汎用画像のファイル名パターン
const GENERIC_IMAGE_PATTERNS = [
  'shrine-entrance',
  'temple-garden',
  'forest-path',
  'stone-lantern-path',
  'bamboo-path',
  'moss-lantern',
  'mountain-view',
  'waterfall',
  'torii-gate',
  'sacred-tree'
];

// 画像のsrcからファイル名を抽出
function extractImageNames(content) {
  if (!content) return [];

  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  const images = [];
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const url = match[1];
    const filename = url.split('/').pop().split('?')[0];
    images.push({ url, filename });
  }

  return images;
}

// 画像の適切性を判定
function assessImage(filename, title) {
  // 画像なし
  if (!filename) {
    return { status: '❌', reason: '画像なし' };
  }

  // Pixabay画像（ID付き）は一応適切とみなす
  if (filename.startsWith('pixabay-') && /pixabay-\d+/.test(filename)) {
    return { status: '✅', reason: 'Pixabay画像' };
  }

  // 汎用画像チェック
  const isGeneric = GENERIC_IMAGE_PATTERNS.some(pattern =>
    filename.toLowerCase().includes(pattern)
  );

  if (isGeneric) {
    return { status: '⚠️', reason: '汎用画像' };
  }

  // タイトルに含まれるキーワードチェック
  const titleKeywords = title.replace(/【.*?】/g, '').trim();
  const filenameClean = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');

  // ファイル名にスポット名が含まれているか
  if (titleKeywords && filenameClean.includes(titleKeywords)) {
    return { status: '✅', reason: 'スポット名を含む' };
  }

  // デフォルトは不明（要確認）
  return { status: '⚠️', reason: '要確認' };
}

async function verifyPowerspotImages() {
  console.log('='.repeat(80));
  console.log('WordPress PowerSpot投稿 画像検証（26-50件目）');
  console.log('='.repeat(80));
  console.log();

  try {
    // 1ページ目（1-100件）を取得
    console.log('📡 投稿一覧を取得中...');
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot`,
      {
        auth,
        params: {
          per_page: 100,
          page: 1,
          orderby: 'id',
          order: 'asc'
        }
      }
    );

    const allPosts = response.data;
    console.log(`✅ 取得完了: ${allPosts.length}件\n`);

    // 26-50件目を抽出（インデックスは25-49）
    const targetPosts = allPosts.slice(25, 50);

    console.log(`🔍 検証対象: 26-50件目（${targetPosts.length}件）\n`);
    console.log('='.repeat(80));
    console.log();

    const results = [];
    let okCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    // 各投稿を検証
    for (let i = 0; i < targetPosts.length; i++) {
      const post = targetPosts[i];
      const postNum = i + 26;

      console.log(`\n[${postNum}] 投稿ID: ${post.id}`);
      console.log(`タイトル: ${post.title.rendered}`);
      console.log(`スラッグ: ${post.slug}`);

      // 画像を抽出
      const images = extractImageNames(post.content.rendered);
      console.log(`画像数: ${images.length}枚`);

      if (images.length === 0) {
        console.log(`❌ ステータス: 画像なし`);
        results.push({
          num: postNum,
          id: post.id,
          title: post.title.rendered,
          slug: post.slug,
          imageCount: 0,
          images: [],
          status: '❌',
          reason: '画像なし'
        });
        errorCount++;
      } else {
        // 各画像を評価
        console.log('画像一覧:');
        const imageAssessments = [];

        for (const img of images) {
          const assessment = assessImage(img.filename, post.title.rendered);
          console.log(`  ${assessment.status} ${img.filename} (${assessment.reason})`);
          imageAssessments.push({
            filename: img.filename,
            url: img.url,
            ...assessment
          });
        }

        // 全体のステータスを決定（最も悪い状態を採用）
        const hasError = imageAssessments.some(a => a.status === '❌');
        const hasWarning = imageAssessments.some(a => a.status === '⚠️');
        const overallStatus = hasError ? '❌' : (hasWarning ? '⚠️' : '✅');

        if (overallStatus === '✅') okCount++;
        else if (overallStatus === '⚠️') warningCount++;
        else errorCount++;

        console.log(`${overallStatus} 総合ステータス`);

        results.push({
          num: postNum,
          id: post.id,
          title: post.title.rendered,
          slug: post.slug,
          imageCount: images.length,
          images: imageAssessments,
          status: overallStatus
        });
      }

      console.log('-'.repeat(80));
    }

    // 最終レポート
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('📊 最終レポート（26-50件目）');
    console.log('='.repeat(80));
    console.log();
    console.log(`検証件数: ${targetPosts.length}件`);
    console.log(`✅ 適切: ${okCount}件`);
    console.log(`⚠️  要確認: ${warningCount}件`);
    console.log(`❌ 問題あり: ${errorCount}件`);
    console.log();

    // 問題のある投稿をリスト
    console.log('='.repeat(80));
    console.log('⚠️  要確認・問題ありの投稿');
    console.log('='.repeat(80));
    console.log();

    const problematicPosts = results.filter(r => r.status !== '✅');

    if (problematicPosts.length === 0) {
      console.log('✅ すべての投稿の画像は適切です！');
    } else {
      for (const post of problematicPosts) {
        console.log(`\n[${post.num}] ${post.status} ID:${post.id} - ${post.title}`);
        console.log(`スラッグ: ${post.slug}`);

        if (post.imageCount === 0) {
          console.log('理由: 画像が0枚');
        } else {
          console.log(`画像: ${post.imageCount}枚`);
          for (const img of post.images) {
            console.log(`  ${img.status} ${img.filename} (${img.reason})`);
          }
        }
      }
    }

    // 詳細レポートをJSONで保存
    const fs = require('fs');
    const reportPath = 'C:\\Users\\user\\work\\powerspot-content-generator\\image-verification-report-26-50.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');

    console.log('\n\n');
    console.log('='.repeat(80));
    console.log(`📄 詳細レポートを保存しました: ${reportPath}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error('メッセージ:', error.message);

    if (error.response) {
      console.error('ステータス:', error.response.status);
      console.error('レスポンス:', error.response.data);
    }

    process.exit(1);
  }
}

// 実行
verifyPowerspotImages();
