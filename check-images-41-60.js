require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = {
  username: WP_USERNAME,
  password: WP_APP_PASSWORD
};

async function checkImages() {
  try {
    console.log('WordPressパワースポット投稿の画像検証を開始します...\n');
    console.log('取得対象: 投稿41-60件目（インデックス40-59）\n');
    console.log('='.repeat(80));

    // per_page=100で取得し、インデックス40-59を抽出
    const response = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot`, {
      auth,
      params: {
        per_page: 100,
        orderby: 'date',
        order: 'asc'
      }
    });

    const posts = response.data;
    console.log(`\n全投稿数: ${posts.length}件\n`);

    if (posts.length < 41) {
      console.log('⚠️ 投稿が41件未満のため、検証対象がありません。');
      return;
    }

    // インデックス40-59（41件目から60件目）を抽出
    const targetPosts = posts.slice(40, 60);
    console.log(`検証対象: ${targetPosts.length}件\n`);
    console.log('='.repeat(80) + '\n');

    let appropriateCount = 0;
    let warningCount = 0;
    let problemCount = 0;

    const genericImages = [
      'shrine-entrance.jpg',
      'temple-garden.jpg',
      'forest-path-1.jpg',
      'stone-lantern-path.jpg',
      'bamboo-path.jpg',
      'moss-lantern.jpg'
    ];

    for (let i = 0; i < targetPosts.length; i++) {
      const post = targetPosts[i];
      const postNumber = 41 + i; // 実際の投稿番号

      console.log(`\n【投稿 #${postNumber}】`);
      console.log(`ID: ${post.id}`);
      console.log(`タイトル: ${post.title.rendered}`);
      console.log(`スラッグ: ${post.slug}`);
      console.log(`ステータス: ${post.status}`);

      // HTML本文から画像を抽出
      const content = post.content.rendered;
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      const images = [];
      let match;

      while ((match = imgRegex.exec(content)) !== null) {
        images.push(match[1]);
      }

      console.log(`画像数: ${images.length}枚`);

      if (images.length === 0) {
        console.log('ファイル: なし');
        console.log('判定: ❌ 問題あり（画像なし）');
        problemCount++;
        continue;
      }

      // ファイル名を抽出
      const filenames = images.map(url => {
        const parts = url.split('/');
        return parts[parts.length - 1];
      });

      console.log('ファイル:');
      filenames.forEach((filename, idx) => {
        console.log(`  ${idx + 1}. ${filename}`);
      });

      // 判定
      if (images.length === 1) {
        console.log('判定: ❌ 問題あり（画像不足: 最低2枚必要）');
        problemCount++;
      } else {
        // 汎用画像のチェック
        const hasGeneric = filenames.some(filename =>
          genericImages.some(generic => filename.includes(generic))
        );

        // pixabay/pexels画像のチェック
        const hasSpecific = filenames.some(filename =>
          filename.startsWith('pixabay-') || filename.startsWith('pexels-')
        );

        if (hasGeneric && !hasSpecific) {
          console.log('判定: ⚠️ 要確認（汎用画像のみ）');
          warningCount++;
        } else if (hasSpecific && images.length >= 2) {
          console.log('判定: ✅ 適切（専用画像2枚以上）');
          appropriateCount++;
        } else if (hasGeneric && hasSpecific) {
          console.log('判定: ⚠️ 要確認（汎用画像と専用画像の混在）');
          warningCount++;
        } else {
          console.log('判定: ⚠️ 要確認（画像の種類が不明確）');
          warningCount++;
        }
      }

      console.log('-'.repeat(80));
    }

    // サマリー
    console.log('\n' + '='.repeat(80));
    console.log('\n【検証サマリー】');
    console.log(`検証対象: ${targetPosts.length}件`);
    console.log(`✅ 適切: ${appropriateCount}件`);
    console.log(`⚠️ 要確認: ${warningCount}件`);
    console.log(`❌ 問題あり: ${problemCount}件`);
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ エラーが発生しました:');
    if (error.response) {
      console.error(`ステータス: ${error.response.status}`);
      console.error(`メッセージ: ${error.response.statusText}`);
      console.error('詳細:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

checkImages();
