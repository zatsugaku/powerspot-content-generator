/**
 * 九州・沖縄を別々のピラーページとして作成
 *
 * 既存の結合ページ（ID: 3134）を削除し、
 * 九州専用と沖縄専用のページを新規作成
 */

const axios = require('axios');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');
const headers = { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' };

// 九州・沖縄の個別定義
const AREA_DEFINITIONS = [
  {
    name: '九州',
    slug: 'kyushu-powerspot',
    areaIds: [226], // 九州のエリアID
    seoTitle: '九州のパワースポット',
    metaDescription: '九州のおすすめパワースポットを厳選紹介。阿蘇山、宇佐神宮、祐徳稲荷神社、霧島神宮など、火山のエネルギーと八幡信仰の聖地をご案内します。',
    intro: `
      <p><strong>九州</strong>は、活火山のエネルギーと古代からの信仰が融合した独自のパワースポットが魅力。阿蘇山のカルデラ、霧島神宮の神話の舞台など、大地のパワーを直接感じられる聖地が点在しています。</p>
      <p>全国八幡宮の総本社・宇佐神宮、日本三大稲荷の祐徳稲荷神社など、格式高い神社も多数。九州独自の温暖な気候と相まって、年間を通じてパワースポット巡りを楽しめます。</p>
      <h3>九州パワースポットの特徴</h3>
      <ul>
        <li><strong>火山のパワー</strong>：阿蘇山、霧島山など活火山の聖地が多数</li>
        <li><strong>八幡信仰の総本宮</strong>：宇佐神宮は全国4万社の八幡宮の総本社</li>
        <li><strong>日本三大稲荷</strong>：祐徳稲荷神社は九州最大の稲荷神社</li>
        <li><strong>神話の舞台</strong>：霧島は天孫降臨の地として知られる</li>
        <li><strong>温泉との組み合わせ</strong>：別府、由布院など温泉地も充実</li>
      </ul>
      <h3>ベストシーズン</h3>
      <p>九州は<strong>年間を通じて温暖</strong>で参拝しやすい地域です。春（3月〜5月）は桜と新緑、秋（10月〜11月）は紅葉が美しく、特におすすめ。阿蘇山は晴天の日に訪れると雄大なカルデラを一望できます。</p>
    `,
    accessInfo: `
      <h3>九州へのアクセス</h3>
      <ul>
        <li><strong>飛行機</strong>：福岡空港、北九州空港、長崎空港、熊本空港、大分空港、宮崎空港、鹿児島空港</li>
        <li><strong>新幹線</strong>：博多駅まで東京から約5時間、大阪から約2時間30分</li>
        <li><strong>フェリー</strong>：大阪・神戸から北九州・別府へ就航</li>
      </ul>
      <h4>主要スポットへのアクセス</h4>
      <ul>
        <li><strong>阿蘇山</strong>：熊本空港から車で約1時間</li>
        <li><strong>宇佐神宮</strong>：大分空港から車で約1時間</li>
        <li><strong>祐徳稲荷神社</strong>：佐賀駅からバスで約1時間</li>
        <li><strong>霧島神宮</strong>：鹿児島空港から車で約40分</li>
      </ul>
      <p>九州は新幹線・飛行機・フェリーなど多彩なアクセス手段があります。九州内の移動は車が便利ですが、JR九州の観光列車も人気です。</p>
    `
  },
  {
    name: '沖縄',
    slug: 'okinawa-powerspot',
    areaIds: [210, 61], // 沖縄のエリアID
    seoTitle: '沖縄のパワースポット',
    metaDescription: '沖縄のおすすめパワースポットを厳選紹介。斎場御嶽、識名宮、沖宮など、琉球王国の聖地と世界遺産をご案内します。',
    intro: `
      <p><strong>沖縄</strong>は、琉球王国時代から続く独自の信仰文化が息づく聖地。本土とは全く異なる「御嶽（うたき）」信仰が今も受け継がれ、独特のスピリチュアルな雰囲気を感じられます。</p>
      <p>世界遺産の斎場御嶽は、琉球王国最高の聖地として知られ、沖縄を訪れたら必ず参拝したいパワースポット。青い海と緑豊かな自然に囲まれた聖地は、心身を浄化し、深い癒しを与えてくれます。</p>
      <h3>沖縄パワースポットの特徴</h3>
      <ul>
        <li><strong>御嶽信仰</strong>：自然崇拝を基盤とした琉球独自の聖地</li>
        <li><strong>世界遺産</strong>：斎場御嶽は琉球王国最高の聖地</li>
        <li><strong>ノロ・ユタ文化</strong>：女性の霊能者が守り継ぐ信仰</li>
        <li><strong>海と太陽のエネルギー</strong>：青い海と強い日差しが独特のパワーを生む</li>
        <li><strong>首里城周辺</strong>：琉球王国の王城跡地に聖地が集中</li>
      </ul>
      <h3>ベストシーズン</h3>
      <p><strong>3月〜5月</strong>と<strong>10月〜11月</strong>が過ごしやすくおすすめ。夏（6月〜9月）は暑さが厳しいですが、海のエネルギーを感じるには最適。冬（12月〜2月）も本土より温暖で、静かに参拝できます。</p>
    `,
    accessInfo: `
      <h3>沖縄へのアクセス</h3>
      <ul>
        <li><strong>飛行機</strong>：那覇空港（東京から約2時間30分、大阪から約2時間）</li>
        <li><strong>離島</strong>：石垣島、宮古島へは那覇または本土から直行便</li>
      </ul>
      <h4>主要スポットへのアクセス</h4>
      <ul>
        <li><strong>斎場御嶽</strong>：那覇空港から車で約1時間（南城市）</li>
        <li><strong>識名宮</strong>：那覇市内、首里城から車で約10分</li>
        <li><strong>沖宮</strong>：那覇市内、奥武山公園内</li>
        <li><strong>波上宮</strong>：那覇市内、那覇空港から車で約15分</li>
      </ul>
      <p>沖縄はレンタカーでの移動が最も便利です。那覇市内はゆいレール（モノレール）も利用可能。バスも運行していますが、本数が少ない路線もあるため事前に確認を。</p>
    `
  }
];

/**
 * エリア別のパワースポット一覧を取得
 */
async function getSpotsByArea(areaIds) {
  const spots = [];
  const seen = new Set();

  for (const areaId of areaIds) {
    try {
      const res = await axios.get(
        `${WP_SITE_URL}/wp-json/wp/v2/powerspot?powerspot_area=${areaId}&per_page=50&_fields=id,title,slug,link,excerpt`,
        { headers }
      );

      for (const post of res.data) {
        // 英語版は除外
        if (post.slug && post.slug.includes('-en')) continue;
        if (seen.has(post.id)) continue;
        seen.add(post.id);
        spots.push({
          id: post.id,
          title: post.title.rendered.replace(/ \|.*$/, ''),
          slug: post.slug,
          link: post.link,
          excerpt: post.excerpt?.rendered?.replace(/<[^>]*>/g, '').substring(0, 100) || ''
        });
      }
    } catch (e) {
      console.error(`Error fetching area ${areaId}:`, e.message);
    }
  }

  return spots;
}

/**
 * ピラーページのHTMLを生成
 */
function generatePillarPageHTML(area, spots) {
  const spotListHTML = spots.length > 0
    ? spots.map(s => `
      <div class="powerspot-card-mini" style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
        <h4 style="margin: 0 0 8px 0;"><a href="${s.link}" style="color: #4a90a4; text-decoration: none;">${s.title}</a></h4>
        ${s.excerpt ? `<p style="margin: 0; color: #666; font-size: 0.9em;">${s.excerpt}...</p>` : ''}
      </div>
    `).join('')
    : '<p>このエリアのパワースポット記事は準備中です。</p>';

  return `
<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">${area.name}のパワースポット一覧</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<div class="area-pillar-intro" style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-left: 5px solid #4a90a4; padding: 24px; margin-bottom: 30px; border-radius: 8px;">
${area.intro}
</div>
<!-- /wp:html -->

<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">${area.name}のおすすめパワースポット（${spots.length}件）</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<div class="powerspot-list" style="margin-bottom: 30px;">
${spotListHTML}
</div>
<!-- /wp:html -->

<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">${area.name}へのアクセス情報</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<div class="area-access-info" style="background: #e3f2fd; padding: 24px; border-radius: 8px; margin-bottom: 30px;">
${area.accessInfo}
</div>
<!-- /wp:html -->

<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">パワースポット探しをもっと便利に</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>ご利益やタイプで絞り込みたい方は、<a href="/powerspot/">パワースポット一覧ページ</a>のフィルター機能をご活用ください。エリア・ご利益・スポットタイプで簡単に検索できます。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>あなたにぴったりのパワースポットを見つけて、素敵な開運の旅をお楽しみください。</p>
<!-- /wp:paragraph -->
`;
}

/**
 * WordPressに固定ページを投稿
 */
async function createPillarPage(area, content) {
  try {
    // 既存ページをチェック
    const existingRes = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/pages?slug=${area.slug}&_fields=id`,
      { headers }
    );

    if (existingRes.data.length > 0) {
      // 既存ページを更新
      const pageId = existingRes.data[0].id;
      const updateRes = await axios.post(
        `${WP_SITE_URL}/wp-json/wp/v2/pages/${pageId}`,
        {
          title: area.seoTitle,
          content: content,
          status: 'publish',
          meta: {
            _yoast_wpseo_metadesc: area.metaDescription
          }
        },
        { headers }
      );
      console.log(`  更新: ID ${pageId} - ${area.seoTitle}`);
      return updateRes.data;
    } else {
      // 新規作成
      const createRes = await axios.post(
        `${WP_SITE_URL}/wp-json/wp/v2/pages`,
        {
          title: area.seoTitle,
          slug: area.slug,
          content: content,
          status: 'publish',
          meta: {
            _yoast_wpseo_metadesc: area.metaDescription
          }
        },
        { headers }
      );
      console.log(`  作成: ID ${createRes.data.id} - ${area.seoTitle}`);
      return createRes.data;
    }
  } catch (e) {
    console.error(`  エラー: ${area.name} - ${e.response?.data?.message || e.message}`);
    return null;
  }
}

/**
 * 既存の結合ページを削除
 */
async function deleteOldCombinedPage() {
  const OLD_PAGE_ID = 3134; // 九州・沖縄の結合ページ

  try {
    // まず非公開（下書き）に変更
    await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/pages/${OLD_PAGE_ID}`,
      { status: 'draft' },
      { headers }
    );
    console.log(`\n旧ページ（ID: ${OLD_PAGE_ID}）を下書きに変更しました`);

    // 完全削除する場合は以下を有効化
    // await axios.delete(
    //   `${WP_SITE_URL}/wp-json/wp/v2/pages/${OLD_PAGE_ID}?force=true`,
    //   { headers }
    // );
    // console.log(`旧ページ（ID: ${OLD_PAGE_ID}）を削除しました`);

  } catch (e) {
    console.error(`旧ページの処理でエラー: ${e.response?.data?.message || e.message}`);
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('=== 九州・沖縄 個別ピラーページ作成 ===\n');

  // 1. 既存の結合ページを非公開に
  await deleteOldCombinedPage();

  const results = [];

  // 2. 九州・沖縄それぞれのページを作成
  for (const area of AREA_DEFINITIONS) {
    console.log(`\n📍 ${area.name}のピラーページを作成中...`);

    // エリアのパワースポットを取得
    const spots = await getSpotsByArea(area.areaIds);
    console.log(`  パワースポット: ${spots.length}件`);

    // HTMLコンテンツを生成
    const content = generatePillarPageHTML(area, spots);

    // WordPressに投稿
    const result = await createPillarPage(area, content);
    if (result) {
      results.push({
        area: area.name,
        id: result.id,
        url: result.link,
        spots: spots.length
      });
    }
  }

  console.log('\n=== 作成結果 ===\n');
  console.log('| エリア | ページID | スポット数 | URL |');
  console.log('|--------|----------|------------|-----|');
  results.forEach(r => {
    console.log(`| ${r.area} | ${r.id} | ${r.spots}件 | ${r.url} |`);
  });

  console.log('\n=== ナビゲーションメニュー更新（手動） ===');
  console.log('WordPress管理画面で以下のURLに変更してください：');
  console.log('- 九州 → /kyushu-powerspot/');
  console.log('- 沖縄 → /okinawa-powerspot/');

  console.log('\n完了しました。');
}

main().catch(console.error);
