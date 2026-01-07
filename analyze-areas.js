/**
 * エリア別パワースポット分析スクリプト
 */

const axios = require('axios');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');
const headers = { Authorization: 'Basic ' + auth };

async function main() {
  console.log('=== エリア別パワースポット分析 ===\n');

  // エリアタクソノミーを取得
  const areasRes = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot_area?per_page=50`, { headers });
  const areas = areasRes.data;

  console.log('## エリア一覧\n');
  areas.forEach(a => {
    console.log(`- ID ${a.id}: ${a.name} (${a.count}件) - slug: ${a.slug}`);
  });

  // パワースポットを取得
  const postsRes = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot?per_page=100&_fields=id,title,slug,link,powerspot_area`, { headers });
  const posts = postsRes.data;

  console.log(`\n## パワースポット総数: ${posts.length}件\n`);

  // エリア別に分類
  const byArea = {};
  const areaMap = {};
  areas.forEach(a => {
    areaMap[a.id] = a.name;
    byArea[a.id] = [];
  });

  posts.forEach(p => {
    const areaIds = p.powerspot_area || [];
    areaIds.forEach(areaId => {
      if (byArea[areaId]) {
        byArea[areaId].push({
          id: p.id,
          title: p.title.rendered,
          slug: p.slug,
          link: p.link
        });
      }
    });
  });

  console.log('## エリア別パワースポット\n');

  // 主要エリアのみ表示（重複除く）
  const mainAreas = [
    { ids: [194], name: '北海道' },
    { ids: [190], name: '東北' },
    { ids: [57, 268], name: '関東' },
    { ids: [192], name: '中部' },
    { ids: [208, 59, 101], name: '近畿' },
    { ids: [214, 60], name: '中国' },
    { ids: [212, 60], name: '四国' },
    { ids: [226, 210, 61], name: '九州・沖縄' }
  ];

  mainAreas.forEach(area => {
    const spots = [];
    const seen = new Set();
    area.ids.forEach(id => {
      (byArea[id] || []).forEach(p => {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          spots.push(p);
        }
      });
    });

    console.log(`### ${area.name} (${spots.length}件)`);
    spots.forEach(p => {
      console.log(`  - ${p.title} (${p.slug})`);
    });
    console.log('');
  });

  // 既存の固定ページを確認
  console.log('## 既存の固定ページ（ピラーページ候補）\n');
  const pagesRes = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/pages?per_page=50&_fields=id,title,slug,status`, { headers });
  pagesRes.data.forEach(p => {
    console.log(`- ID ${p.id}: ${p.title.rendered} (${p.slug}) [${p.status}]`);
  });
}

main().catch(console.error);
