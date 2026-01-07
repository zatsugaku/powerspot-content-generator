/**
 * WordPress ナビゲーションメニュー構造生成
 *
 * 使い方: node generate-menu-structure.js
 */

const axios = require('axios');
require('dotenv').config();

const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');
const headers = { Authorization: 'Basic ' + auth };

async function generateMenuStructure() {
  console.log('# WordPress ナビゲーションメニュー構造\n');
  console.log('以下をWordPress管理画面 → 外観 → メニュー で設定してください。\n');
  console.log('---\n');

  // エリア
  console.log('## エリアから探す（ドロップダウン）\n');
  const areas = await axios.get('https://k005.net/wp-json/wp/v2/powerspot_area?per_page=50', { headers });
  const areaMap = {};
  areas.data.forEach(a => {
    // 日本語版のみ（-enがないもの）
    if (!a.slug.includes('-en') && a.count > 0) {
      const name = a.name;
      if (!areaMap[name] || a.count > areaMap[name].count) {
        areaMap[name] = a;
      }
    }
  });

  const areaOrder = ['北海道', '東北', '関東', '中部', '近畿', '関西', '中国', '四国', '九州', '沖縄'];
  areaOrder.forEach(name => {
    const area = areaMap[name];
    if (area) {
      console.log('- ' + name + ': ' + area.link + ' (' + area.count + '件)');
    }
  });

  // ご利益
  console.log('\n## ご利益から探す（ドロップダウン）\n');
  const benefits = await axios.get('https://k005.net/wp-json/wp/v2/powerspot_benefit?per_page=50', { headers });
  const benefitMap = {};
  benefits.data.forEach(b => {
    // -enや-jaがないメインのスラッグで、投稿があるもの
    if (!b.slug.includes('-en') && !b.slug.includes('-ja') && b.count > 0) {
      benefitMap[b.name] = b;
    }
  });

  const benefitOrder = ['縁結び・恋愛運', '金運・仕事運', '厄除け・開運', '健康・病気平癒', '商売繁盛', '家内安全', '心願成就', '子宝・安産', '交通安全'];
  benefitOrder.forEach(name => {
    const benefit = benefitMap[name];
    if (benefit) {
      console.log('- ' + name + ': ' + benefit.link + ' (' + benefit.count + '件)');
    }
  });

  // タイプ
  console.log('\n## タイプ別（ドロップダウン）\n');
  const types = await axios.get('https://k005.net/wp-json/wp/v2/powerspot_type?per_page=50', { headers });
  const typeMap = {};
  types.data.forEach(t => {
    if (!t.slug.includes('-en') && !t.slug.includes('-ja') && t.count > 0) {
      typeMap[t.name] = t;
    }
  });

  Object.values(typeMap).forEach(t => {
    console.log('- ' + t.name + ': ' + t.link + ' (' + t.count + '件)');
  });

  console.log('\n---\n');
  console.log('## 推奨メニュー構造\n');
  console.log('```');
  console.log('トップ (https://k005.net/)');
  console.log('エリアから探す ▼');
  Object.values(areaMap).forEach(a => {
    console.log('  └ ' + a.name + ' → ' + a.link);
  });
  console.log('ご利益から探す ▼');
  Object.values(benefitMap).forEach(b => {
    console.log('  └ ' + b.name + ' → ' + b.link);
  });
  console.log('タイプ別 ▼');
  Object.values(typeMap).forEach(t => {
    console.log('  └ ' + t.name + ' → ' + t.link);
  });
  console.log('パワースポット一覧 (https://k005.net/powerspot/)');
  console.log('```');

  console.log('\n---\n');
  console.log('## WordPress設定手順\n');
  console.log('1. 外観 → メニュー を開く');
  console.log('2. 新規メニューを作成（または既存を編集）');
  console.log('3. 「カスタムリンク」を追加:');
  console.log('   - URL: 上記の各リンク');
  console.log('   - リンクテキスト: 表示名');
  console.log('4. ドラッグ&ドロップで階層化（子メニューは右にずらす）');
  console.log('5. メニューの位置: ヘッダーメニュー にチェック');
  console.log('6. 保存');
}

generateMenuStructure().catch(console.error);
