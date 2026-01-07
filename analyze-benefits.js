/**
 * ご利益別パワースポット分析スクリプト
 */

const axios = require('axios');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');
const headers = { Authorization: 'Basic ' + auth };

async function main() {
  console.log('=== ご利益別パワースポット分析 ===\n');

  // ご利益タクソノミーを取得
  const benefitsRes = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot_benefit?per_page=100`, { headers });
  const benefits = benefitsRes.data;

  console.log('## ご利益一覧\n');
  benefits.forEach(b => {
    console.log(`- ID ${b.id}: ${b.name} (${b.count}件) - slug: ${b.slug}`);
  });

  // パワースポットを取得
  const postsRes = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/powerspot?per_page=100&_fields=id,title,slug,link,powerspot_benefit`, { headers });
  const posts = postsRes.data;

  console.log(`\n## パワースポット総数: ${posts.length}件\n`);

  // ご利益別に分類
  const byBenefit = {};
  const benefitMap = {};
  benefits.forEach(b => {
    benefitMap[b.id] = b.name;
    byBenefit[b.id] = [];
  });

  posts.forEach(p => {
    const benefitIds = p.powerspot_benefit || [];
    benefitIds.forEach(benefitId => {
      if (byBenefit[benefitId]) {
        byBenefit[benefitId].push({
          id: p.id,
          title: p.title.rendered,
          slug: p.slug,
          link: p.link
        });
      }
    });
  });

  console.log('## ご利益別パワースポット\n');

  // ご利益ごとに表示（件数順）
  const sortedBenefits = benefits.sort((a, b) => b.count - a.count);

  sortedBenefits.forEach(benefit => {
    const spots = byBenefit[benefit.id] || [];
    // 英語版を除外
    const jpSpots = spots.filter(s => !s.slug.includes('-en'));

    if (jpSpots.length > 0) {
      console.log(`### ${benefit.name} (${jpSpots.length}件) - ID: ${benefit.id}, slug: ${benefit.slug}`);
      jpSpots.forEach(p => {
        console.log(`  - ${p.title}`);
      });
      console.log('');
    }
  });

  // ピラーページ作成対象の10ご利益を提案
  console.log('\n## ピラーページ作成対象（提案）\n');
  console.log('件数が多いご利益トップ10:');

  const top10 = sortedBenefits
    .filter(b => {
      const spots = byBenefit[b.id] || [];
      return spots.filter(s => !s.slug.includes('-en')).length > 0;
    })
    .slice(0, 15);

  top10.forEach((b, i) => {
    const spots = byBenefit[b.id] || [];
    const jpCount = spots.filter(s => !s.slug.includes('-en')).length;
    console.log(`${i + 1}. ${b.name} (${jpCount}件) - ID: ${b.id}, slug: ${b.slug}`);
  });
}

main().catch(console.error);
