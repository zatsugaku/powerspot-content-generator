/**
 * タクソノミー重複チェック＆整理スクリプト
 *
 * 使い方:
 *   node cleanup-taxonomies.js           # 重複をチェック（読み取りのみ）
 *   node cleanup-taxonomies.js --delete  # 空のタームを削除
 */

const axios = require('axios');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');

const headers = { Authorization: 'Basic ' + auth };

const TAXONOMIES = [
  'powerspot_region',
  'powerspot_area',
  'powerspot_type',
  'powerspot_benefit',
  'powerspot_element'
];

async function getTerms(taxonomy) {
  const terms = [];
  let page = 1;
  while (true) {
    try {
      const res = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/${taxonomy}?per_page=100&page=${page}`, { headers });
      if (res.data.length === 0) break;
      terms.push(...res.data);
      page++;
    } catch (e) {
      if (e.response && e.response.status === 400) break;
      throw e;
    }
  }
  return terms;
}

async function deleteTerm(taxonomy, termId) {
  try {
    await axios.delete(`${WP_SITE_URL}/wp-json/wp/v2/${taxonomy}/${termId}?force=true`, { headers });
    return true;
  } catch (e) {
    console.error(`  削除失敗 ID:${termId} - ${e.message}`);
    return false;
  }
}

async function analyzeTaxonomy(taxonomy) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`タクソノミー: ${taxonomy}`);
  console.log('='.repeat(60));

  const terms = await getTerms(taxonomy);
  console.log(`総ターム数: ${terms.length}`);

  // 名前でグループ化
  const byName = {};
  terms.forEach(t => {
    const name = t.name;
    if (!byName[name]) byName[name] = [];
    byName[name].push(t);
  });

  // 重複を検出
  const duplicates = Object.entries(byName).filter(([_, arr]) => arr.length > 1);

  // 空のタームを検出
  const empty = terms.filter(t => t.count === 0);

  console.log(`重複している名前: ${duplicates.length}件`);
  console.log(`投稿なしのターム: ${empty.length}件`);

  if (duplicates.length > 0) {
    console.log('\n--- 重複詳細 ---');
    duplicates.forEach(([name, arr]) => {
      console.log(`\n「${name}」(${arr.length}件の重複)`);
      arr.forEach(t => {
        console.log(`  ID:${t.id} | slug:${t.slug} | count:${t.count}`);
      });
    });
  }

  return { taxonomy, terms, duplicates, empty };
}

async function main() {
  const shouldDelete = process.argv.includes('--delete');

  console.log('タクソノミー重複・空ターム分析');
  console.log('================================');
  console.log(`モード: ${shouldDelete ? '削除実行' : '分析のみ'}`);

  let totalEmpty = 0;
  let totalDuplicates = 0;

  for (const taxonomy of TAXONOMIES) {
    try {
      const result = await analyzeTaxonomy(taxonomy);
      totalEmpty += result.empty.length;
      totalDuplicates += result.duplicates.length;

      if (shouldDelete && result.empty.length > 0) {
        console.log('\n--- 空ターム削除中 ---');
        for (const term of result.empty) {
          process.stdout.write(`  削除: ID:${term.id} (${term.name})... `);
          const success = await deleteTerm(taxonomy, term.id);
          console.log(success ? '✅' : '❌');
        }
      }
    } catch (e) {
      console.error(`エラー (${taxonomy}): ${e.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('サマリー');
  console.log('='.repeat(60));
  console.log(`重複名: ${totalDuplicates}件`);
  console.log(`空ターム: ${totalEmpty}件`);

  if (!shouldDelete && totalEmpty > 0) {
    console.log('\n空タームを削除するには: node cleanup-taxonomies.js --delete');
  }
}

main().catch(console.error);
