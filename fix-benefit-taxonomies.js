/**
 * ご利益タクソノミーの修正スクリプト
 *
 * 1. 「学業成就」タクソノミーを新規作成
 * 2. 既存記事に適切なご利益を追加
 */

const axios = require('axios');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');
const headers = { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' };

// 既存のご利益ID
const BENEFIT_IDS = {
  '縁結び・恋愛運': [68, 109],
  '金運・仕事運': [69],
  '健康・病気平癒': [70],
  '厄除け・開運': [72, 105],
  '子宝・安産': [73],
  '家内安全': [74, 107],
  '商売繁盛': [75],
  '交通安全': [76],
  '心願成就': [77],
  // 学業成就は後で追加
};

// パワースポットごとのご利益マッピング
const POWERSPOT_BENEFITS = {
  // 北海道
  '北海道神宮': ['縁結び・恋愛運', '厄除け・開運', '家内安全', '交通安全'],
  '樽前山神社': ['厄除け・開運', '心願成就', '商売繁盛'],
  '阿寒湖': ['縁結び・恋愛運', '厄除け・開運', '心願成就', '健康・病気平癒'],
  '定山渓神社': ['健康・病気平癒', '厄除け・開運', '家内安全'],

  // 東北
  '羽黒山神社': ['厄除け・開運', '心願成就', '健康・病気平癒', '商売繁盛'],
  '中尊寺金色堂': ['厄除け・開運', '家内安全', '健康・病気平癒', '学業成就'],
  '松島': ['縁結び・恋愛運', '厄除け・開運', '心願成就'],
  '大崎八幡宮': ['厄除け・開運', '商売繁盛', '学業成就', '交通安全'],

  // 関東
  '日光東照宮': ['厄除け・開運', '学業成就', '商売繁盛', '家内安全'],

  // 中部
  '熱田神宮': ['厄除け・開運', '家内安全', '商売繁盛', '交通安全', '学業成就'],
  '金剱宮': ['金運・仕事運', '商売繁盛', '厄除け・開運'],

  // 近畿
  '伊勢神宮': ['厄除け・開運', '家内安全', '縁結び・恋愛運', '心願成就'],
  '伏見稲荷大社': ['金運・仕事運', '商売繁盛', '厄除け・開運', '学業成就'],
  '住吉大社': ['厄除け・開運', '商売繁盛', '交通安全', '縁結び・恋愛運'],

  // 中国
  '出雲大社': ['縁結び・恋愛運', '子宝・安産', '家内安全', '商売繁盛'],

  // 四国
  '金刀比羅宮': ['厄除け・開運', '商売繁盛', '交通安全', '学業成就'],

  // 沖縄
  '斎場御嶽': ['縁結び・恋愛運', '厄除け・開運', '心願成就', '子宝・安産'],
};

/**
 * 学業成就タクソノミーを作成
 */
async function createGakugyoTaxonomy() {
  console.log('=== 学業成就タクソノミーを作成 ===\n');

  try {
    const res = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot_benefit`,
      {
        name: '学業成就',
        slug: 'academic-success',
        description: '学業成就・合格祈願のご利益があるパワースポット'
      },
      { headers }
    );
    console.log(`作成完了: ID ${res.data.id} - ${res.data.name}`);
    return res.data.id;
  } catch (e) {
    if (e.response?.data?.code === 'term_exists') {
      console.log('既に存在します。IDを取得中...');
      const existingRes = await axios.get(
        `${WP_SITE_URL}/wp-json/wp/v2/powerspot_benefit?slug=academic-success`,
        { headers }
      );
      if (existingRes.data.length > 0) {
        console.log(`既存ID: ${existingRes.data[0].id}`);
        return existingRes.data[0].id;
      }
    }
    console.error('エラー:', e.response?.data?.message || e.message);
    return null;
  }
}

/**
 * パワースポット記事を取得
 */
async function getPowerspots() {
  const res = await axios.get(
    `${WP_SITE_URL}/wp-json/wp/v2/powerspot?per_page=100&_fields=id,title,slug,powerspot_benefit`,
    { headers }
  );
  return res.data.filter(p => !p.slug.includes('-en')); // 日本語記事のみ
}

/**
 * 記事のご利益を更新
 */
async function updatePowerspotBenefits(postId, title, benefitIds) {
  try {
    await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot/${postId}`,
      { powerspot_benefit: benefitIds },
      { headers }
    );
    console.log(`  ✅ ${title}: ${benefitIds.length}件のご利益を設定`);
    return true;
  } catch (e) {
    console.error(`  ❌ ${title}: エラー - ${e.response?.data?.message || e.message}`);
    return false;
  }
}

/**
 * メイン処理
 */
async function main() {
  // 1. 学業成就タクソノミーを作成
  const gakugyoId = await createGakugyoTaxonomy();
  if (gakugyoId) {
    BENEFIT_IDS['学業成就'] = [gakugyoId];
  }

  console.log('\n=== 既存記事のご利益を更新 ===\n');

  // 2. パワースポット記事を取得
  const powerspots = await getPowerspots();
  console.log(`パワースポット記事: ${powerspots.length}件\n`);

  let updateCount = 0;

  // 3. 各記事のご利益を更新
  for (const post of powerspots) {
    const title = post.title.rendered.replace(/ \|.*$/, '').trim();

    // マッピングにあるか確認
    const benefitNames = POWERSPOT_BENEFITS[title];
    if (!benefitNames) {
      console.log(`  ⏭️ ${title}: マッピングなし（スキップ）`);
      continue;
    }

    // ご利益IDを収集
    const benefitIds = [];
    for (const name of benefitNames) {
      const ids = BENEFIT_IDS[name];
      if (ids) {
        benefitIds.push(...ids);
      }
    }

    // 重複を除去
    const uniqueBenefitIds = [...new Set(benefitIds)];

    // 現在のご利益と比較
    const currentIds = post.powerspot_benefit || [];
    const newIds = uniqueBenefitIds.filter(id => !currentIds.includes(id));

    if (newIds.length > 0) {
      const allIds = [...new Set([...currentIds, ...uniqueBenefitIds])];
      const success = await updatePowerspotBenefits(post.id, title, allIds);
      if (success) updateCount++;
    } else {
      console.log(`  ✓ ${title}: 変更なし（${currentIds.length}件のご利益設定済み）`);
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`更新した記事: ${updateCount}件`);

  // 4. 更新後のタクソノミー状況を確認
  console.log('\n=== 更新後のご利益タクソノミー ===\n');
  const benefitsRes = await axios.get(
    `${WP_SITE_URL}/wp-json/wp/v2/powerspot_benefit?per_page=100`,
    { headers }
  );
  benefitsRes.data.forEach(b => {
    console.log(`ID ${b.id}: ${b.name} (${b.count}件)`);
  });
}

main().catch(console.error);
