require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

async function verifyImages() {
  try {
    console.log('='.repeat(80));
    console.log('WordPressパワースポット投稿の画像検証');
    console.log('='.repeat(80));
    console.log();

    // 投稿を取得
    const response = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot`, {
      headers: {
        'Authorization': `Basic ${auth}`
      },
      params: {
        per_page: 100,
        orderby: 'date',
        order: 'desc'
      }
    });

    const posts = response.data.slice(0, 20); // 最初の20件
    console.log(`検証対象: ${posts.length}件\n`);

    let countGood = 0;
    let countWarning = 0;
    let countProblem = 0;

    // 汎用画像のリスト
    const genericImages = [
      'shrine-entrance.jpg',
      'temple-garden.jpg',
      'forest-path-1.jpg',
      'stone-lantern-path.jpg',
      'bamboo-path.jpg',
      'moss-lantern.jpg'
    ];

    for (const post of posts) {
      const id = post.id;
      const title = post.title.rendered;
      const slug = post.slug;
      const content = post.content.rendered;

      // 画像を抽出（img src属性）
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      const images = [];
      let match;
      while ((match = imgRegex.exec(content)) !== null) {
        images.push(match[1]);
      }

      // ファイル名のみを抽出
      const filenames = images.map(url => {
        const parts = url.split('/');
        return parts[parts.length - 1];
      });

      // 判定
      let status = '';
      let statusEmoji = '';
      let reasons = [];

      if (images.length === 0) {
        status = '問題あり';
        statusEmoji = '❌';
        reasons.push('画像なし（0枚）');
        countProblem++;
      } else if (images.length === 1) {
        status = '問題あり';
        statusEmoji = '❌';
        reasons.push('画像不足（1枚のみ、最低2枚必要）');
        countProblem++;
      } else {
        // 汎用画像をチェック
        const genericCount = filenames.filter(f => genericImages.includes(f)).length;
        const pixabayPexelsCount = filenames.filter(f =>
          f.startsWith('pixabay-') || f.startsWith('pexels-')
        ).length;

        // パワースポット名と画像の不一致をチェック（簡易版）
        const titleLower = title.toLowerCase();
        let mismatch = false;

        // 沖縄のスポットに沖縄以外の地名、または逆
        if (titleLower.includes('沖縄') || titleLower.includes('斎場') || titleLower.includes('久高')) {
          if (filenames.some(f =>
            f.includes('hakone') || f.includes('kyoto') || f.includes('shrine') && !f.includes('okinawa')
          )) {
            mismatch = true;
          }
        }

        if (genericCount > 0) {
          status = '要確認';
          statusEmoji = '⚠️';
          reasons.push(`汎用画像 ${genericCount}枚`);
          countWarning++;
        } else if (mismatch) {
          status = '要確認';
          statusEmoji = '⚠️';
          reasons.push('画像とスポット名が不一致の可能性');
          countWarning++;
        } else if (pixabayPexelsCount >= 2) {
          status = '適切';
          statusEmoji = '✅';
          reasons.push(`pixabay/pexels画像 ${pixabayPexelsCount}枚`);
          countGood++;
        } else {
          status = '要確認';
          statusEmoji = '⚠️';
          reasons.push('画像の種類を確認推奨');
          countWarning++;
        }
      }

      // 出力
      console.log(`ID:${id} [${slug}] - ${statusEmoji} ${status}`);
      console.log(`  タイトル: ${title}`);
      console.log(`  画像数: ${images.length}枚`);
      if (filenames.length > 0) {
        console.log(`  ファイル: ${filenames.join(', ')}`);
      }
      console.log(`  判定理由: ${reasons.join(', ')}`);
      console.log();
    }

    // サマリー
    console.log('='.repeat(80));
    console.log('検証サマリー');
    console.log('='.repeat(80));
    console.log(`✅ 適切:   ${countGood}件`);
    console.log(`⚠️ 要確認: ${countWarning}件`);
    console.log(`❌ 問題あり: ${countProblem}件`);
    console.log(`合計:     ${posts.length}件`);
    console.log();

    // 推奨アクション
    if (countProblem > 0) {
      console.log('【推奨アクション】');
      console.log('- 画像なし・不足の投稿には、pixabay/pexelsから2枚以上の画像を追加');
      console.log('- 画像検索: "パワースポット名 + 絶景" で検索');
    }
    if (countWarning > 0) {
      console.log('【要確認項目】');
      console.log('- 汎用画像を使用している投稿は、スポット固有の画像に差し替え推奨');
      console.log('- 画像とスポット名の整合性を目視確認');
    }

  } catch (error) {
    console.error('エラー:', error.message);
    if (error.response) {
      console.error('レスポンス:', error.response.status, error.response.statusText);
      console.error('データ:', error.response.data);
    }
  }
}

verifyImages();
