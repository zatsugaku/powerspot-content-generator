/**
 * add-related-links.js
 * 既存のパワースポット記事に関連リンクセクションを追加するスクリプト
 *
 * 使用方法:
 *   node add-related-links.js [--dry-run] [--single=slug]
 *
 * オプション:
 *   --dry-run    実際に更新せず、変更内容を表示するだけ
 *   --single=xxx 指定したslugの記事のみ更新
 */

require('dotenv').config();
const https = require('https');

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const AUTH = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// 地域ID → 地域名のマッピング
const REGION_NAMES = {
  5: '東京都', 4: '茨城県', 11: '愛媛県', 14: '山形県', 15: '岩手県',
  16: '宮城県', 18: '青森県', 21: '愛知県', 22: '長野県', 26: '島根県',
  27: '広島県', 31: '北海道', 32: '石川県', 33: '新潟県', 36: '京都府',
  37: '大阪府', 41: '大分県', 42: '佐賀県', 47: '沖縄県', 48: '和歌山県',
  89: '三重県', 86: '三重県', 10: '香川県'
};

// エリアID → エリア名のマッピング
const AREA_NAMES = {
  57: '関東', 59: '関西', 60: '中国・四国', 61: '九州・沖縄',
  101: '東海', 190: '東北', 192: '中部', 194: '北海道',
  208: '関西', 210: '沖縄', 212: '四国', 214: '中国', 226: '九州'
};

// ご利益カテゴリ（記事タイトルから推測）
const BENEFIT_KEYWORDS = {
  '縁結び': ['縁結び', 'matchmaking', '恋愛'],
  '金運': ['金運', 'wealth', 'financial', 'fortune', '商売繁盛', 'business'],
  '厄除け': ['厄除け', 'evil', 'protection', '浄化'],
  '健康': ['健康', 'healing', '温泉'],
  '勝運': ['勝運', 'victory', '必勝'],
  '世界遺産': ['世界遺産', 'world heritage', 'unesco'],
  '国宝': ['国宝', 'national treasure'],
};

// コマンドライン引数の解析
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const singleArg = args.find(a => a.startsWith('--single='));
const SINGLE_SLUG = singleArg ? singleArg.split('=')[1] : null;

// HTTPリクエストを送信
function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// すべての記事を取得
async function fetchAllArticles() {
  const url = new URL(`${WP_SITE_URL}/wp-json/wp/v2/powerspot`);
  url.searchParams.set('per_page', '100');
  url.searchParams.set('status', 'publish,draft');

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'Authorization': `Basic ${AUTH}`
    }
  };

  const response = await httpRequest(options);
  return response.data;
}

// 記事を更新
async function updateArticle(id, content) {
  const url = new URL(`${WP_SITE_URL}/wp-json/wp/v2/powerspot/${id}`);
  const postData = JSON.stringify({ content });

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Basic ${AUTH}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return httpRequest(options, postData);
}

// 記事のご利益カテゴリを判定
function getBenefitCategories(title) {
  const categories = [];
  const lowerTitle = title.toLowerCase();

  for (const [category, keywords] of Object.entries(BENEFIT_KEYWORDS)) {
    if (keywords.some(kw => lowerTitle.includes(kw.toLowerCase()))) {
      categories.push(category);
    }
  }
  return categories;
}

// 関連記事を見つける
function findRelatedArticles(article, allArticles) {
  const related = {
    sameRegion: [],
    sameBenefit: [],
    pillarPage: null
  };

  const myRegions = article.powerspot_region || [];
  const myAreas = article.powerspot_area || [];
  const myBenefits = getBenefitCategories(article.title.rendered);
  const isJapanese = !article.slug.endsWith('-en') && !article.slug.endsWith('-2');
  const isEnglish = article.slug.endsWith('-en') || article.slug.endsWith('-2');

  for (const other of allArticles) {
    if (other.id === article.id) continue;

    // 言語が一致しない場合はスキップ
    const otherIsJapanese = !other.slug.endsWith('-en') && !other.slug.endsWith('-2');
    const otherIsEnglish = other.slug.endsWith('-en') || other.slug.endsWith('-2');

    if (isJapanese && !otherIsJapanese) continue;
    if (isEnglish && !otherIsEnglish) continue;

    // ピラーページを検出
    if (other.slug === 'powerspot-guide') {
      related.pillarPage = other;
      continue;
    }

    // 同じ地域の記事
    const otherRegions = other.powerspot_region || [];
    if (myRegions.some(r => otherRegions.includes(r)) && related.sameRegion.length < 3) {
      related.sameRegion.push(other);
    }

    // 同じご利益の記事
    const otherBenefits = getBenefitCategories(other.title.rendered);
    if (myBenefits.some(b => otherBenefits.includes(b)) && related.sameBenefit.length < 3) {
      // 地域で既に追加されていなければ追加
      if (!related.sameRegion.find(r => r.id === other.id)) {
        related.sameBenefit.push(other);
      }
    }
  }

  return related;
}

// 関連リンクセクションのHTMLを生成
function generateRelatedLinksHTML(related, isEnglish) {
  const sections = [];

  // ピラーページへのリンク
  if (related.pillarPage && !isEnglish) {
    sections.push(`
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin: 30px 0; text-align: center;">
  <p style="color: white; font-size: 16px; margin-bottom: 15px;">🗾 日本全国のパワースポットを探す</p>
  <a href="/powerspot/powerspot-guide/" style="display: inline-block; background: white; color: #667eea; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
    パワースポット完全ガイドを見る →
  </a>
</div>`);
  }

  // 同じ地域の関連記事
  if (related.sameRegion.length > 0) {
    const regionTitle = isEnglish ? '📍 Related Power Spots in the Same Region' : '📍 同じ地域のパワースポット';
    const links = related.sameRegion.map(a => {
      const title = a.title.rendered.replace(/&#8217;/g, "'").replace(/&#038;/g, "&").split('|')[0].trim();
      return `<li><a href="/powerspot/${a.slug}/">${title}</a></li>`;
    }).join('\n');

    sections.push(`
<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4a90e2;">
  <h4 style="margin-top: 0; color: #333;">${regionTitle}</h4>
  <ul style="margin-bottom: 0;">
    ${links}
  </ul>
</div>`);
  }

  // 同じご利益の関連記事
  if (related.sameBenefit.length > 0) {
    const benefitTitle = isEnglish ? '✨ Power Spots with Similar Benefits' : '✨ 同じご利益のパワースポット';
    const links = related.sameBenefit.map(a => {
      const title = a.title.rendered.replace(/&#8217;/g, "'").replace(/&#038;/g, "&").split('|')[0].trim();
      return `<li><a href="/powerspot/${a.slug}/">${title}</a></li>`;
    }).join('\n');

    sections.push(`
<div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
  <h4 style="margin-top: 0; color: #333;">${benefitTitle}</h4>
  <ul style="margin-bottom: 0;">
    ${links}
  </ul>
</div>`);
  }

  if (sections.length === 0) return null;

  const wrapperTitle = isEnglish ? 'Related Articles' : '関連記事';
  return `
<!-- Related Links Section -->
<div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #eee;">
  <h3 style="font-size: 1.3em; margin-bottom: 20px;">📚 ${wrapperTitle}</h3>
  ${sections.join('\n')}
</div>`;
}

// 既存コンテンツに関連リンクセクションが含まれているか確認
function hasRelatedLinksSection(content) {
  return content.includes('<!-- Related Links Section -->') ||
         content.includes('関連記事') && content.includes('同じ地域のパワースポット');
}

// メイン処理
async function main() {
  console.log('='.repeat(60));
  console.log('パワースポット記事 関連リンク追加スクリプト');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN モード: 実際の更新は行いません\n');
  }

  // 全記事を取得
  console.log('📥 記事を取得中...');
  const allArticles = await fetchAllArticles();
  console.log(`   ${allArticles.length} 件の記事を取得しました\n`);

  // 日本語記事のみをフィルタリング（ピラーページと-en/-2を除外）
  let targetArticles = allArticles.filter(a => {
    // ピラーページは対象外
    if (a.slug === 'powerspot-guide') return false;
    // 英語記事は後で処理
    // -2サフィックスの重複記事は対象外
    if (a.slug.endsWith('-2')) return false;
    return true;
  });

  // 単一記事モードの場合
  if (SINGLE_SLUG) {
    targetArticles = targetArticles.filter(a => a.slug === SINGLE_SLUG);
    if (targetArticles.length === 0) {
      console.log(`❌ スラッグ "${SINGLE_SLUG}" の記事が見つかりません`);
      return;
    }
  }

  console.log(`🎯 処理対象: ${targetArticles.length} 件\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const article of targetArticles) {
    const title = article.title.rendered.replace(/&#8217;/g, "'").replace(/&#038;/g, "&");
    const shortTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
    const isEnglish = article.slug.endsWith('-en');

    console.log(`\n📝 ${shortTitle}`);
    console.log(`   ID: ${article.id}, Slug: ${article.slug}`);

    // 既存コンテンツを確認
    if (hasRelatedLinksSection(article.content?.rendered || '')) {
      console.log('   ⏭️  既に関連リンクセクションが存在します - スキップ');
      skipped++;
      continue;
    }

    // 関連記事を見つける
    const related = findRelatedArticles(article, allArticles);
    const totalRelated = related.sameRegion.length + related.sameBenefit.length + (related.pillarPage ? 1 : 0);

    if (totalRelated === 0) {
      console.log('   ⏭️  関連記事が見つかりません - スキップ');
      skipped++;
      continue;
    }

    console.log(`   🔗 関連記事: 地域=${related.sameRegion.length}, ご利益=${related.sameBenefit.length}, ピラー=${related.pillarPage ? 1 : 0}`);

    // 関連リンクHTMLを生成
    const relatedHTML = generateRelatedLinksHTML(related, isEnglish);

    if (!relatedHTML) {
      console.log('   ⏭️  関連リンクHTMLを生成できません - スキップ');
      skipped++;
      continue;
    }

    // 新しいコンテンツを作成（末尾に追加）
    const currentContent = article.content?.rendered || '';
    const newContent = currentContent + relatedHTML;

    if (DRY_RUN) {
      console.log('   ✅ [DRY RUN] 更新をシミュレート');
      console.log('   --- 追加される関連リンク ---');
      console.log(`   地域: ${related.sameRegion.map(a => a.slug).join(', ') || 'なし'}`);
      console.log(`   ご利益: ${related.sameBenefit.map(a => a.slug).join(', ') || 'なし'}`);
      updated++;
    } else {
      try {
        const result = await updateArticle(article.id, newContent);
        if (result.status === 200) {
          console.log('   ✅ 更新成功');
          updated++;
        } else {
          console.log(`   ❌ 更新失敗: HTTP ${result.status}`);
          errors++;
        }
      } catch (err) {
        console.log(`   ❌ エラー: ${err.message}`);
        errors++;
      }
    }

    // API制限を考慮して少し待機
    if (!DRY_RUN) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('処理完了');
  console.log('='.repeat(60));
  console.log(`✅ 更新: ${updated} 件`);
  console.log(`⏭️  スキップ: ${skipped} 件`);
  console.log(`❌ エラー: ${errors} 件`);
}

main().catch(console.error);
