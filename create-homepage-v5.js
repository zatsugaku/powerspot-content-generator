#!/usr/bin/env node
// 英語スラッグ対応のトップページ

require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const EN_SHINDAN_URL = process.env.EN_SHINDAN_URL;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// トップページのHTML（英語スラッグ対応）
const homepageContent = `<!-- wp:html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500;600&family=Zen+Kaku+Gothic+New:wght@300;400;500&display=swap" rel="stylesheet">

<style>
body {
  font-family: 'Zen Kaku Gothic New', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
}

.powerspot-hero {
  background: linear-gradient(rgba(15,15,25,0.5), rgba(15,15,25,0.5)), url('https://images.pexels.com/photos/161401/fushimi-inari-taisha-shrine-kyoto-japan-temple-161401.jpeg?auto=compress&cs=tinysrgb&w=1920');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  padding: 140px 20px;
  text-align: center;
  color: white;
  margin-bottom: 80px;
}

.powerspot-hero h1 {
  font-family: 'Noto Serif JP', serif;
  font-size: 52px;
  font-weight: 400;
  letter-spacing: 0.15em;
  margin-bottom: 25px;
  text-shadow: 2px 2px 8px rgba(0,0,0,0.7);
  color: white;
}

.powerspot-hero p {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 16px;
  font-weight: 300;
  letter-spacing: 0.15em;
  margin-bottom: 0;
  color: rgba(255,255,255,0.95);
  text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
}

.section-title {
  font-family: 'Noto Serif JP', serif;
  text-align: center;
  font-size: 38px;
  font-weight: 400;
  letter-spacing: 0.15em;
  margin: 80px 0 50px;
  color: #1a1a1a;
  position: relative;
  padding-bottom: 25px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #c9a961, transparent);
}

.powerspot-card {
  background: white;
  border: 1px solid #e8e8e8;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.powerspot-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
  border-color: #c9a961;
}

.powerspot-card-image {
  width: 100%;
  height: 280px;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}

.powerspot-card:hover .powerspot-card-image {
  transform: scale(1.05);
}

.powerspot-card-content {
  padding: 35px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.powerspot-card h3 {
  font-family: 'Noto Serif JP', serif;
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 18px;
  color: #1a1a1a;
  letter-spacing: 0.08em;
  line-height: 1.6;
  border-left: 3px solid #c9a961;
  padding-left: 18px;
}

.powerspot-card h3 a {
  color: #1a1a1a;
  text-decoration: none;
  transition: color 0.3s ease;
}

.powerspot-card h3 a:hover {
  color: #c9a961;
}

.powerspot-card-excerpt {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 14px;
  color: #666;
  line-height: 1.9;
  margin-bottom: 25px;
  flex: 1;
  letter-spacing: 0.03em;
}

.powerspot-card-link {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  display: inline-block;
  color: #c9a961;
  text-decoration: none;
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 0.1em;
  padding-top: 15px;
  border-top: 1px solid #f5f5f5;
  transition: all 0.3s ease;
}

.powerspot-card-link:hover {
  color: #a08040;
  padding-left: 5px;
}

.category-section {
  background: linear-gradient(180deg, #fafaf8 0%, #f5f5f3 100%);
  padding: 80px 20px;
  margin: 80px 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 35px;
  max-width: 1200px;
  margin: 0 auto;
}

.category-card {
  background: white;
  padding: 45px 35px;
  text-align: center;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
  cursor: pointer;
}

.category-card:hover {
  border-color: #c9a961;
  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
  transform: translateY(-3px);
}

.category-card h3 {
  font-family: 'Noto Serif JP', serif;
  color: #1a1a1a;
  margin-bottom: 18px;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.1em;
}

.category-card p {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  color: #666;
  line-height: 1.9;
  font-size: 14px;
  letter-spacing: 0.05em;
}

.cta-section {
  background: #1a1a1a;
  padding: 60px 20px;
  text-align: center;
  color: white;
  margin: 80px 0;
}

.cta-section h3 {
  font-family: 'Noto Serif JP', serif;
  font-size: 22px;
  font-weight: 400;
  margin-bottom: 18px;
  letter-spacing: 0.12em;
  color: white;
}

.cta-section p {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 14px;
  margin-bottom: 30px;
  color: rgba(255,255,255,0.85);
  letter-spacing: 0.05em;
}

.cta-button {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  display: inline-block;
  background: #c9a961;
  color: #1a1a1a;
  padding: 14px 45px;
  text-decoration: none;
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 0.15em;
  transition: all 0.3s ease;
  border: 2px solid #c9a961;
}

.cta-button:hover {
  background: transparent;
  color: #c9a961;
}

.powerspot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 45px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .powerspot-grid {
    grid-template-columns: 1fr;
  }
  .powerspot-hero h1 {
    font-size: 36px;
  }
  .section-title {
    font-size: 28px;
  }
}
</style>

<div class="powerspot-hero">
  <h1>日本の聖地を巡る</h1>
  <p>神社・寺院・自然の霊験あらたかなパワースポットへ</p>
</div>

<div style="padding: 0 20px;">
  <h2 class="section-title">厳選パワースポット</h2>
  <div id="powerspot-list" class="powerspot-grid"></div>
</div>

<div class="category-section">
  <h2 class="section-title">パワースポットを探す</h2>
  <div class="category-grid">
    <a href="${WP_SITE_URL}/powerspot_area/kansai/" style="text-decoration: none;">
      <div class="category-card">
        <h3>地域から探す</h3>
        <p>全国47都道府県のパワースポットを<br>地域別にご紹介</p>
      </div>
    </a>
    <a href="${WP_SITE_URL}/powerspot_benefit/love-marriage/" style="text-decoration: none;">
      <div class="category-card">
        <h3>ご利益から探す</h3>
        <p>縁結び・金運・健康など<br>願いに合わせて検索</p>
      </div>
    </a>
    <a href="${WP_SITE_URL}/powerspot_type/shrine/" style="text-decoration: none;">
      <div class="category-card">
        <h3>スポットタイプ</h3>
        <p>神社・寺院・自然など<br>タイプ別に検索</p>
      </div>
    </a>
  </div>
</div>

<div class="cta-section">
  <h3>あなたに最適なパワースポットを診断</h3>
  <p>無料の相性診断で、あなたに合うパワースポットを見つけましょう</p>
  <a href="${EN_SHINDAN_URL}" class="cta-button" target="_blank" rel="noopener">無料診断を受ける</a>
</div>

<script>
(function() {
  console.log('パワースポット一覧を読み込み開始');

  fetch('${WP_SITE_URL}/wp-json/wp/v2/powerspot?per_page=6&_embed')
    .then(function(response) {
      console.log('API レスポンス:', response.status);
      if (!response.ok) {
        throw new Error('API error: ' + response.status);
      }
      return response.json();
    })
    .then(function(posts) {
      console.log('取得した投稿数:', posts.length);

      var container = document.getElementById('powerspot-list');

      if (!posts || posts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">パワースポット記事はまだありません</p>';
        return;
      }

      var html = posts.map(function(post) {
        var imageUrl = '';
        if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
          imageUrl = post._embedded['wp:featuredmedia'][0].source_url;
        }

        var excerpt = post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 100);
        var title = post.title.rendered;

        return '<div class="powerspot-card">' +
          (imageUrl ? '<img src="' + imageUrl + '" alt="' + title + '" class="powerspot-card-image">' : '') +
          '<div class="powerspot-card-content">' +
            '<h3><a href="' + post.link + '">' + title + '</a></h3>' +
            '<div class="powerspot-card-excerpt">' + excerpt + '...</div>' +
            '<a href="' + post.link + '" class="powerspot-card-link">詳しく見る →</a>' +
          '</div>' +
        '</div>';
      }).join('');

      container.innerHTML = html;
      console.log('パワースポット一覧の表示完了');
    })
    .catch(function(error) {
      console.error('エラー:', error);
      document.getElementById('powerspot-list').innerHTML =
        '<p style="text-align: center; color: #666; grid-column: 1 / -1;">パワースポット一覧の読み込みに失敗しました。<br>エラー: ' + error.message + '</p>';
    });
})();
</script>
<!-- /wp:html -->`;

async function updateHomepage() {
  try {
    console.log('\n📝 トップページを更新中（英語スラッグ版）...\n');

    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/pages/2158`,
      {
        content: homepageContent,
        title: 'パワースポット開運ナビ',
        status: 'publish'
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ トップページを更新しました！\n');
    console.log('【更新内容】');
    console.log('1. ✅ カテゴリリンクを英語スラッグに変更');
    console.log('   - 関西 → kansai');
    console.log('   - 縁結び・恋愛運 → love-marriage');
    console.log('   - 神社 → shrine');
    console.log('');
    console.log('💡 トップページを確認:');
    console.log(`   ${WP_SITE_URL}`);
    console.log('');
    console.log('💡 カテゴリページも確認:');
    console.log(`   ${WP_SITE_URL}/powerspot_area/kansai/`);
    console.log(`   ${WP_SITE_URL}/powerspot_benefit/love-marriage/`);
    console.log(`   ${WP_SITE_URL}/powerspot_type/shrine/`);

  } catch (error) {
    console.error('❌ エラー:', error.response?.data || error.message);
    throw error;
  }
}

updateHomepage();
