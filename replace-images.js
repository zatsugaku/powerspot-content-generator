require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// 削除対象の汎用画像リスト
const GENERIC_IMAGES = [
  'shrine-entrance.jpg',
  'temple-garden.jpg',
  'forest-path-1.jpg',
  'stone-lantern-path.jpg',
  'bamboo-path.jpg',
  'moss-lantern.jpg',
  'snow-torii.jpg',
  'peaceful-japan.jpg'
];

// Pixabayから画像を検索
async function searchPixabayImages(query, perPage = 3) {
  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: PIXABAY_API_KEY,
        q: query,
        image_type: 'photo',
        orientation: 'horizontal',
        per_page: perPage,
        safesearch: true
      }
    });
    return response.data.hits;
  } catch (error) {
    console.error(`Pixabay検索エラー (${query}):`, error.message);
    return [];
  }
}

// 画像をダウンロード
async function downloadImage(url, filepath) {
  const writer = fs.createWriteStream(filepath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// WordPressに画像をアップロード
async function uploadToWordPress(filepath, filename) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filepath), filename);

    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/media`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Basic ${auth}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('WordPress画像アップロードエラー:', error.response?.data || error.message);
    throw error;
  }
}

// 投稿のコンテンツから汎用画像を削除
function removeGenericImages(content) {
  let updatedContent = content;
  GENERIC_IMAGES.forEach(imageName => {
    // <img>タグを含む段落全体を削除
    const imgPattern = new RegExp(`<p[^>]*>\\s*<img[^>]*${imageName}[^>]*>\\s*</p>`, 'gi');
    updatedContent = updatedContent.replace(imgPattern, '');

    // 単独の<img>タグも削除
    const imgOnlyPattern = new RegExp(`<img[^>]*${imageName}[^>]*>`, 'gi');
    updatedContent = updatedContent.replace(imgOnlyPattern, '');
  });
  return updatedContent;
}

// コンテンツに画像を挿入
function insertImages(content, images) {
  // 最初の見出し（h2）の後に1枚目を挿入
  const firstH2Pattern = /(<h2[^>]*>.*?<\/h2>)/i;
  let updatedContent = content.replace(firstH2Pattern,
    `$1\n<p><img src="${images[0].source_url}" alt="${images[0].alt_text}" class="wp-image-${images[0].id}" style="width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" /></p>\n`
  );

  // コンテンツの中盤（全体の40-50%の位置）に2枚目を挿入
  if (images.length > 1) {
    const h2Tags = updatedContent.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
    if (h2Tags.length >= 4) {
      const targetH2Index = Math.floor(h2Tags.length * 0.45);
      const targetH2 = h2Tags[targetH2Index];
      let replaced = false;
      updatedContent = updatedContent.replace(targetH2, function(match) {
        if (!replaced) {
          replaced = true;
          return `${match}\n<p><img src="${images[1].source_url}" alt="${images[1].alt_text}" class="wp-image-${images[1].id}" style="width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" /></p>\n`;
        }
        return match;
      });
    }
  }

  return updatedContent;
}

// 投稿を更新
async function updatePost(postId, content) {
  try {
    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot/${postId}`,
      { content },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('投稿更新エラー:', error.response?.data || error.message);
    throw error;
  }
}

// メイン処理
async function processPost(post) {
  console.log('\n' + '='.repeat(80));
  console.log(`処理中: ID:${post.id} - ${post.title.rendered}`);
  console.log('='.repeat(80));

  try {
    // 検索キーワードを準備（スポット名から英語キーワードを抽出）
    const slug = post.slug;
    const searchKeywords = [
      slug.replace(/-en$/, '').replace(/-/g, ' '),
      // 追加の関連キーワード
    ];

    console.log(`検索キーワード: ${searchKeywords[0]}`);

    // Pixabayで画像を検索
    let images = await searchPixabayImages(searchKeywords[0], 3);

    if (images.length === 0) {
      console.log('⚠️ 画像が見つかりませんでした。一般的なキーワードで再検索...');
      // フォールバック検索
      const fallbackKeywords = ['japanese shrine', 'japan temple', 'japan nature'];
      for (const keyword of fallbackKeywords) {
        images = await searchPixabayImages(keyword, 3);
        if (images.length > 0) {
          console.log(`✓ フォールバック検索成功: ${keyword}`);
          break;
        }
      }
    }

    if (images.length === 0) {
      console.log('❌ 画像が見つかりませんでした。スキップします。');
      return { success: false, error: '画像が見つかりません' };
    }

    console.log(`✓ ${images.length}件の画像を発見`);

    // 画像をダウンロードしてアップロード
    const uploadedImages = [];
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    for (let i = 0; i < Math.min(2, images.length); i++) {
      const image = images[i];
      const filename = `pixabay-${image.id}.jpg`;
      const filepath = path.join(tempDir, filename);

      console.log(`  ${i + 1}. ダウンロード中: ${filename}`);
      await downloadImage(image.largeImageURL, filepath);

      console.log(`     アップロード中...`);
      const wpImage = await uploadToWordPress(filepath, filename);
      uploadedImages.push(wpImage);

      console.log(`     ✓ アップロード完了: ID:${wpImage.id}`);

      // 一時ファイルを削除
      fs.unlinkSync(filepath);
    }

    // コンテンツから汎用画像を削除
    console.log('汎用画像を削除中...');
    let updatedContent = removeGenericImages(post.content.rendered);

    // 新しい画像を挿入
    console.log('新しい画像を挿入中...');
    updatedContent = insertImages(updatedContent, uploadedImages);

    // 投稿を更新
    console.log('投稿を更新中...');
    await updatePost(post.id, updatedContent);

    console.log('✅ 更新完了!');
    return { success: true, imagesUploaded: uploadedImages.length };

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    return { success: false, error: error.message };
  }
}

// メイン実行
async function main() {
  try {
    // 投稿リストを取得
    console.log('投稿リストを取得中...');
    const response = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot?per_page=100`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    const posts = response.data.slice(30, 45);  // 31-45番目
    console.log(`対象投稿: ${posts.length}件`);

    const results = [];

    // 各投稿を処理
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const result = await processPost(post);
      results.push({
        id: post.id,
        title: post.title.rendered,
        ...result
      });

      // レート制限を避けるため、少し待機
      if (i < posts.length - 1) {
        console.log('\n⏳ 次の投稿まで5秒待機...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // 結果サマリー
    console.log('\n\n' + '='.repeat(80));
    console.log('処理結果サマリー');
    console.log('='.repeat(80));

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ 成功: ${successCount}件`);
    console.log(`❌ 失敗: ${failCount}件`);
    console.log('');

    results.forEach((r, i) => {
      const status = r.success ? '✅' : '❌';
      console.log(`${i + 31}. ${status} ID:${r.id} - ${r.title}`);
      if (!r.success && r.error) {
        console.log(`   エラー: ${r.error}`);
      } else if (r.success) {
        console.log(`   画像アップロード: ${r.imagesUploaded}枚`);
      }
    });

  } catch (error) {
    console.error('メイン処理エラー:', error.message);
  }
}

main();
