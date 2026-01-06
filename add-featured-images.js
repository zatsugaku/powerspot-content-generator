require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// スラッグからキーワードを生成
function getKeywords(slug, title) {
  const mapping = {
    'hakone-jinja': 'hakone shrine torii',
    'hakone-jinja-en': 'hakone shrine torii',
    'enoshima-jinja': 'enoshima shrine japan',
    'enoshima-jinja-en': 'enoshima shrine japan',
    'tojinbo': 'tojinbo cliff japan',
    'tojinbo-en': 'tojinbo cliff japan',
    'kawaguchiko': 'lake kawaguchiko fuji',
    'kawaguchiko-en': 'lake kawaguchiko fuji',
    'kamui-kotan': 'kamui kotan hokkaido',
    'kamui-kotan-en': 'kamui kotan hokkaido',
    'chitose-jinja': 'chitose shrine hokkaido',
    'chitose-jinja-en': 'chitose shrine hokkaido',
    'sounkyo': 'sounkyo gorge hokkaido',
    'sounkyo-en': 'sounkyo gorge hokkaido',
    'osorezan': 'osorezan sacred mountain',
    'osorezan-en': 'osorezan sacred mountain',
    'shikina-gu': 'okinawa shrine',
    'shikina-gu-en': 'okinawa shrine',
    'yutoku-inari-jinja': 'yutoku inari shrine',
    'yutoku-inari-jinja-en': 'yutoku inari shrine',
    'seimei-jinja': 'seimei shrine kyoto',
    'seimei-jinja-en': 'seimei shrine kyoto',
    'sado-kinzan': 'sado gold mine',
    'sado-kinzan-en': 'sado gold mine',
    'itsukushima-jinja': 'itsukushima shrine torii',
    'itsukushima-jinja-en': 'itsukushima shrine torii',
    'suwa-taisha': 'suwa shrine nagano',
    'suwa-taisha-en': 'suwa shrine nagano',
    'ishizuchi-jinja': 'ishizuchi mountain shrine',
    'ishizuchi-jinja-en': 'ishizuchi mountain shrine',
    'mitake-jinja': 'mitake shrine tokyo',
    'mitake-jinja-en': 'mitake shrine tokyo',
    'tsukubasan-jinja': 'tsukuba shrine mountain',
    'tsukubasan-jinja-en': 'tsukuba shrine mountain',
    'nachi-falls': 'nachi falls waterfall',
    'nachi-falls-en': 'nachi falls waterfall',
    'usa-jingu': 'usa shrine oita',
    'usa-jingu-en': 'usa shrine oita',
    'miho-jinja': 'miho shrine shimane',
    'miho-jinja-en': 'miho shrine shimane',
    'oyamazumi-jinja': 'oyamazumi shrine ehime',
    'oyamazumi-jinja-en': 'oyamazumi shrine ehime',
    'okinogu': 'okinawa shrine naha',
    'okinogu-en': 'okinawa shrine naha',
    'sumiyoshi-taisha': 'sumiyoshi taisha osaka',
    'sumiyoshi-taisha-en': 'sumiyoshi taisha osaka',
    'jozankei-jinja': 'jozankei onsen shrine',
    'jozankei-jinja-en': 'jozankei onsen shrine',
    'kinkengu': 'kinkengu shrine ishikawa',
    'kinkengu-en': 'kinkengu shrine ishikawa',
    'osaki-hachimangu': 'osaki hachimangu sendai',
    'osaki-hachimangu-en': 'osaki hachimangu sendai',
    'atsuta-jingu': 'atsuta shrine nagoya',
    'atsuta-jingu-en': 'atsuta shrine nagoya',
    'hokkaido-jingu': 'hokkaido jingu shrine',
    'hokkaido-jingu-en': 'hokkaido jingu shrine',
    'tarumaesan-jinja': 'tarumaesan shrine hokkaido',
    'tarumaesan-jinja-en': 'tarumaesan shrine hokkaido',
    'akan-lake': 'akan lake hokkaido',
    'akan-lake-en': 'akan lake hokkaido'
  };

  return mapping[slug] || slug.replace(/-en$/, '').replace(/-/g, ' ') + ' japan shrine';
}

// Pixabayで画像検索
async function searchPixabay(query) {
  const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&per_page=5&image_type=photo&orientation=horizontal&min_width=1200`;

  try {
    const res = await axios.get(url);
    if (res.data.hits && res.data.hits.length > 0) {
      return res.data.hits[0].largeImageURL;
    }
  } catch (e) {
    console.log(`Pixabay検索エラー: ${e.message}`);
  }
  return null;
}

// フォールバック検索
async function searchWithFallback(slug, title) {
  const keywords = getKeywords(slug, title);
  console.log(`  検索キーワード: ${keywords}`);

  let imageUrl = await searchPixabay(keywords);

  if (!imageUrl) {
    // フォールバック: 一般的なキーワード
    const fallbackKeywords = ['japan shrine torii', 'japan temple', 'japan nature mountain'];
    for (const fallback of fallbackKeywords) {
      imageUrl = await searchPixabay(fallback);
      if (imageUrl) {
        console.log(`  フォールバックキーワード使用: ${fallback}`);
        break;
      }
    }
  }

  return imageUrl;
}

// 画像をダウンロード
async function downloadImage(url, filename) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const filepath = path.join(__dirname, 'images', filename);

  if (!fs.existsSync(path.join(__dirname, 'images'))) {
    fs.mkdirSync(path.join(__dirname, 'images'));
  }

  fs.writeFileSync(filepath, response.data);
  return filepath;
}

// WordPressにアップロード
async function uploadToWordPress(filepath, filename) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filepath), filename);

  const res = await axios.post(`${WP_SITE_URL}/wp-json/wp/v2/media`, form, {
    headers: {
      ...form.getHeaders(),
      'Authorization': `Basic ${auth}`
    }
  });

  return res.data;
}

// 投稿のアイキャッチ画像を更新
async function updateFeaturedImage(postId, mediaId) {
  await axios.post(`${WP_SITE_URL}/wp-json/wp/v2/powerspot/${postId}`, {
    featured_media: mediaId
  }, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
}

// メイン処理
async function main() {
  // アイキャッチ画像がない投稿を取得
  let allPosts = [];
  let page = 1;

  while (true) {
    const res = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot?per_page=100&page=${page}`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    allPosts = allPosts.concat(res.data);
    if (res.data.length < 100) break;
    page++;
  }

  const postsWithoutImage = allPosts.filter(p => !p.featured_media || p.featured_media === 0);
  console.log(`アイキャッチ画像がない投稿: ${postsWithoutImage.length}件\n`);

  let success = 0;
  let failed = 0;

  for (const post of postsWithoutImage) {
    console.log(`処理中: ${post.slug} (ID: ${post.id})`);

    try {
      // 画像検索
      const imageUrl = await searchWithFallback(post.slug, post.title.rendered);

      if (!imageUrl) {
        console.log(`  ❌ 画像が見つかりません\n`);
        failed++;
        continue;
      }

      console.log(`  画像URL: ${imageUrl}`);

      // ダウンロード
      const filename = `${post.slug}.jpg`;
      const filepath = await downloadImage(imageUrl, filename);
      console.log(`  ダウンロード完了`);

      // WordPressにアップロード
      const media = await uploadToWordPress(filepath, filename);
      console.log(`  アップロード完了 (ID: ${media.id})`);

      // アイキャッチ画像を設定
      await updateFeaturedImage(post.id, media.id);
      console.log(`  ✅ アイキャッチ画像設定完了\n`);

      // ローカルファイル削除
      fs.unlinkSync(filepath);

      success++;

      // API制限を考慮して少し待機
      await new Promise(r => setTimeout(r, 1000));

    } catch (e) {
      console.log(`  ❌ エラー: ${e.message}\n`);
      failed++;
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`成功: ${success}件`);
  console.log(`失敗: ${failed}件`);
}

main().catch(console.error);
