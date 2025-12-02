#!/usr/bin/env node
// 英語版ホームページを更新

require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

const englishHomepageContent = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500;600&family=Zen+Kaku+Gothic+New:wght@300;400;500&display=swap" rel="stylesheet">

<style>
body {
  font-family: 'Zen Kaku Gothic New', -apple-system, BlinkMacSystemFont, sans-serif;
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
  font-size: 48px;
  font-weight: 400;
  letter-spacing: 0.1em;
  margin-bottom: 25px;
  text-shadow: 2px 2px 8px rgba(0,0,0,0.7);
  color: white;
}

.powerspot-hero p {
  font-size: 16px;
  font-weight: 300;
  letter-spacing: 0.1em;
  margin-bottom: 0;
  color: rgba(255,255,255,0.95);
  text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
}

.section-title {
  font-family: 'Noto Serif JP', serif;
  text-align: center;
  font-size: 36px;
  font-weight: 400;
  letter-spacing: 0.1em;
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
  letter-spacing: 0.05em;
  line-height: 1.5;
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
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin-bottom: 25px;
  flex: 1;
}

.powerspot-card-link {
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
  letter-spacing: 0.08em;
}

.category-card p {
  color: #666;
  line-height: 1.8;
  font-size: 14px;
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
    font-size: 32px;
  }
  .section-title {
    font-size: 26px;
  }
}
</style>

<div class="powerspot-hero">
  <h1>Discover Japan's Sacred Places</h1>
  <p>Explore spiritual shrines, temples, and natural power spots across Japan</p>
</div>

<div style="padding: 0 20px;">
  <h2 class="section-title">Featured Power Spots</h2>
  <div id="powerspot-list" class="powerspot-grid"></div>
</div>

<div class="category-section">
  <h2 class="section-title">Explore Power Spots</h2>
  <div class="category-grid">
    <a href="https://k005.net/en/powerspot_area/kansai/" style="text-decoration: none;">
      <div class="category-card">
        <h3>By Region</h3>
        <p>Discover power spots across all 47 prefectures of Japan</p>
      </div>
    </a>
    <a href="https://k005.net/en/powerspot_benefit/love-marriage/" style="text-decoration: none;">
      <div class="category-card">
        <h3>By Blessing</h3>
        <p>Find spots for love, fortune, health, and more</p>
      </div>
    </a>
    <a href="https://k005.net/en/powerspot_type/shrine/" style="text-decoration: none;">
      <div class="category-card">
        <h3>By Type</h3>
        <p>Shrines, temples, mountains, and natural wonders</p>
      </div>
    </a>
  </div>
</div>

<!-- wp:html -->
<script>
(function() {
  console.log('Loading power spots list');
  fetch('https://k005.net/wp-json/wp/v2/powerspot?per_page=20&_embed')
    .then(function(response) {
      console.log('API response:', response.status);
      if (!response.ok) { throw new Error('API error: ' + response.status); }
      return response.json();
    })
    .then(function(allPosts) {
      var posts = allPosts.filter(function(post) { return post.link.indexOf('/en/') !== -1; }).slice(0, 6);
      console.log('English posts found:', posts.length);
      var container = document.getElementById('powerspot-list');
      if (!posts || posts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">No power spot articles available yet. Check back soon!</p>';
        return;
      }
      var html = posts.map(function(post) {
        var imageUrl = '';
        if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) { imageUrl = post._embedded['wp:featuredmedia'][0].source_url; }
        var excerpt = post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 120);
        var title = post.title.rendered;
        return '<div class="powerspot-card">' + (imageUrl ? '<img decoding="async" src="' + imageUrl + '" alt="' + title + '" class="powerspot-card-image">' : '') + '<div class="powerspot-card-content"><h3><a href="' + post.link + '">' + title + '</a></h3><div class="powerspot-card-excerpt">' + excerpt + '...</div><a href="' + post.link + '" class="powerspot-card-link">Read More →</a></div></div>';
      }).join('');
      container.innerHTML = html;
      console.log('Power spots list displayed');
    })
    .catch(function(error) {
      console.error('Error:', error);
      document.getElementById('powerspot-list').innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">Failed to load power spots.<br>Error: ' + error.message + '</p>';
    });
})();
</script>
<!-- /wp:html -->
`;

async function updateEnglishHomepage() {
  try {
    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/pages/2427`,
      {
        content: englishHomepageContent
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ 英語版ホームページを更新しました');
    console.log('ID:', response.data.id);
    console.log('タイトル:', response.data.title.rendered);
    console.log('URL: https://k005.net/en/');
  } catch (error) {
    console.error('❌ エラー:', error.response?.data || error.message);
  }
}

updateEnglishHomepage();
