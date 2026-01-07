/**
 * エリア別ピラーページ作成スクリプト
 *
 * 8つのエリア（北海道、東北、関東、中部、近畿、中国、四国、九州・沖縄）の
 * SEO最適化されたピラーページを作成し、WordPressに投稿する
 */

const axios = require('axios');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');
const headers = { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' };

// エリア定義
const AREA_DEFINITIONS = [
  {
    name: '北海道',
    slug: 'hokkaido-powerspot',
    areaIds: [194],
    seoTitle: '北海道のパワースポット',
    metaDescription: '北海道のおすすめパワースポットを厳選紹介。北海道神宮、阿寒湖、層雲峡など、大自然と神秘のエネルギーが溢れる聖地をご案内します。',
    intro: `
      <p>広大な大地と雄大な自然が広がる<strong>北海道</strong>には、アイヌ文化に根ざした神秘的なパワースポットが数多く存在します。</p>
      <p>原始の森が残る神域、火山のエネルギーを宿す聖地、そして先住民族アイヌの人々が大切にしてきた聖なる場所。北海道のパワースポットは、本州とは異なる独自の霊気を放っています。</p>
      <h3>北海道パワースポットの特徴</h3>
      <ul>
        <li><strong>アイヌ文化との融合</strong>：自然崇拝を基盤としたアイヌの聖地が多数</li>
        <li><strong>火山のエネルギー</strong>：活火山が多く、大地のパワーを直接感じられる</li>
        <li><strong>原始の自然</strong>：手つかずの森林や湖が神秘的な雰囲気を醸成</li>
        <li><strong>開拓の歴史</strong>：明治以降の神社も独自の霊気を持つ</li>
      </ul>
      <h3>ベストシーズン</h3>
      <p>北海道のパワースポット巡りは<strong>6月〜9月</strong>がおすすめ。特に夏の北海道神宮や阿寒湖は、緑豊かで最も神聖な雰囲気を味わえます。冬は積雪で参拝が難しい場所もありますが、雪に覆われた神社は格別の美しさです。</p>
    `,
    accessInfo: `
      <h3>北海道へのアクセス</h3>
      <ul>
        <li><strong>飛行機</strong>：新千歳空港（札幌）、旭川空港、函館空港など</li>
        <li><strong>新幹線</strong>：東京から新函館北斗駅まで約4時間</li>
        <li><strong>フェリー</strong>：青森・大洗・新潟などから就航</li>
      </ul>
      <p>北海道内は広大なため、レンタカーでの移動がおすすめです。JR北海道やバスも利用可能ですが、パワースポット巡りには車が便利です。</p>
    `
  },
  {
    name: '東北',
    slug: 'tohoku-powerspot',
    areaIds: [190],
    seoTitle: '東北のパワースポット',
    metaDescription: '東北地方のおすすめパワースポットを厳選紹介。恐山、出羽三山、中尊寺金色堂など、古来からの霊場と世界遺産を巡る旅をご案内します。',
    intro: `
      <p>古来より<strong>霊場</strong>として崇められてきた<strong>東北地方</strong>。恐山、出羽三山、平泉など、日本有数のパワースポットが集中しています。</p>
      <p>厳しい自然環境の中で育まれた信仰は、独特の神秘性を帯びています。山岳信仰、修験道、浄土思想など、多様な宗教文化が融合した東北のパワースポットは、訪れる人に深い精神性を感じさせます。</p>
      <h3>東北パワースポットの特徴</h3>
      <ul>
        <li><strong>日本三大霊場</strong>：恐山（青森）は高野山、比叡山と並ぶ霊場</li>
        <li><strong>出羽三山</strong>：羽黒山・月山・湯殿山の山岳信仰の聖地</li>
        <li><strong>世界遺産</strong>：平泉の中尊寺金色堂は浄土思想の結晶</li>
        <li><strong>絶景の聖地</strong>：松島など、自然美と信仰が融合</li>
      </ul>
      <h3>ベストシーズン</h3>
      <p><strong>5月〜10月</strong>がおすすめ。特に紅葉の時期（10月）は、中尊寺や出羽三山が美しく色づきます。恐山は7月の大祭時期が特に賑わいます。</p>
    `,
    accessInfo: `
      <h3>東北へのアクセス</h3>
      <ul>
        <li><strong>新幹線</strong>：東京から仙台まで約1時間30分、盛岡まで約2時間10分</li>
        <li><strong>飛行機</strong>：仙台空港、青森空港、秋田空港など</li>
        <li><strong>高速バス</strong>：東京・大阪から各地へ夜行バスあり</li>
      </ul>
      <p>東北新幹線沿線のスポットはアクセス良好。山岳霊場へは車やバスの乗り継ぎが必要な場合があります。</p>
    `
  },
  {
    name: '関東',
    slug: 'kanto-powerspot',
    areaIds: [57, 268],
    seoTitle: '関東のパワースポット',
    metaDescription: '関東地方のおすすめパワースポットを厳選紹介。箱根神社、明治神宮、日光東照宮など、首都圏から日帰りで行ける聖地をご案内します。',
    intro: `
      <p><strong>関東地方</strong>は、首都圏からアクセスしやすいパワースポットが豊富。日帰りで訪れられる聖地から、宿泊して巡りたい世界遺産まで、多彩なスポットが揃っています。</p>
      <p>徳川家康を祀る日光東照宮、箱根の山岳信仰、東京のど真ん中にある明治神宮など、歴史と自然が調和したパワースポットが関東の魅力です。</p>
      <h3>関東パワースポットの特徴</h3>
      <ul>
        <li><strong>アクセス抜群</strong>：東京から日帰りで訪問可能なスポット多数</li>
        <li><strong>世界遺産</strong>：日光東照宮の陽明門は必見</li>
        <li><strong>山岳信仰</strong>：箱根、筑波山、御岳山などの霊山</li>
        <li><strong>縁結び</strong>：九頭龍神社、江島神社など恋愛成就の聖地</li>
      </ul>
      <h3>ベストシーズン</h3>
      <p><strong>年間を通じて訪問可能</strong>。春の桜、秋の紅葉時期は特に人気。箱根神社は元旦の初詣、日光は紅葉の10月〜11月がおすすめです。</p>
    `,
    accessInfo: `
      <h3>関東エリアへのアクセス</h3>
      <ul>
        <li><strong>箱根</strong>：新宿から小田急ロマンスカーで約85分</li>
        <li><strong>日光</strong>：浅草から東武特急で約2時間</li>
        <li><strong>筑波山</strong>：秋葉原からつくばエクスプレスで約45分</li>
        <li><strong>御岳山</strong>：新宿から約90分（JR青梅線＋ケーブルカー）</li>
      </ul>
    `
  },
  {
    name: '中部',
    slug: 'chubu-powerspot',
    areaIds: [192],
    seoTitle: '中部のパワースポット',
    metaDescription: '中部地方のおすすめパワースポットを厳選紹介。熱田神宮、諏訪大社、金剱宮など、日本の中心に位置する聖地をご案内します。',
    intro: `
      <p>日本列島の中央に位置する<strong>中部地方</strong>は、古くから交通の要衝として栄え、多くの信仰を集めてきました。三種の神器を祀る熱田神宮、日本最古の神社の一つ諏訪大社など、格式高いパワースポットが点在しています。</p>
      <p>富士山を望む河口湖、日本海側の金剱宮、世界遺産候補の佐渡金山など、自然と歴史が織りなす聖地が中部の魅力です。</p>
      <h3>中部パワースポットの特徴</h3>
      <ul>
        <li><strong>三種の神器</strong>：熱田神宮には草薙神剣が祀られる</li>
        <li><strong>古代信仰</strong>：諏訪大社は日本最古級の神社</li>
        <li><strong>金運上昇</strong>：金剱宮は金運パワースポットとして人気</li>
        <li><strong>富士山信仰</strong>：河口湖周辺は富士山のエネルギーを感じられる</li>
      </ul>
      <h3>ベストシーズン</h3>
      <p><strong>春〜秋</strong>がおすすめ。諏訪大社の御柱祭（6年に一度）、熱田神宮の熱田祭（6月）は特に賑わいます。</p>
    `,
    accessInfo: `
      <h3>中部エリアへのアクセス</h3>
      <ul>
        <li><strong>熱田神宮</strong>：名古屋駅から名鉄で約6分</li>
        <li><strong>諏訪大社</strong>：新宿から特急あずさで約2時間</li>
        <li><strong>金剱宮</strong>：金沢駅から車で約40分</li>
        <li><strong>河口湖</strong>：新宿からバスで約1時間45分</li>
      </ul>
    `
  },
  {
    name: '近畿',
    slug: 'kinki-powerspot',
    areaIds: [208, 59, 101],
    seoTitle: '近畿のパワースポット',
    metaDescription: '近畿地方のおすすめパワースポットを厳選紹介。伊勢神宮、伏見稲荷大社、高野山など、日本を代表する聖地をご案内します。',
    intro: `
      <p><strong>近畿地方</strong>は、日本の精神文化の中心地。伊勢神宮、高野山、比叡山など、日本を代表するパワースポットが集中しています。</p>
      <p>千年の都・京都には伏見稲荷大社をはじめとする数々の神社仏閣、大阪には商売繁盛の住吉大社、奈良には日本最古の神社群、和歌山には熊野古道と那智の滝。近畿は日本の聖地巡礼の出発点です。</p>
      <h3>近畿パワースポットの特徴</h3>
      <ul>
        <li><strong>伊勢神宮</strong>：日本の総氏神、最高峰のパワースポット</li>
        <li><strong>千本鳥居</strong>：伏見稲荷大社の象徴的な景観</li>
        <li><strong>世界遺産</strong>：熊野古道、高野山、比叡山など多数</li>
        <li><strong>商売繁盛</strong>：住吉大社、今宮戎神社など</li>
      </ul>
      <h3>ベストシーズン</h3>
      <p><strong>年間を通じて参拝可能</strong>。伊勢神宮は早朝参拝がおすすめ。紅葉の時期（11月）は京都の神社仏閣が特に美しいです。</p>
    `,
    accessInfo: `
      <h3>近畿エリアへのアクセス</h3>
      <ul>
        <li><strong>伊勢神宮</strong>：名古屋から近鉄特急で約1時間20分</li>
        <li><strong>伏見稲荷大社</strong>：京都駅からJR奈良線で約5分</li>
        <li><strong>住吉大社</strong>：なんば駅から南海本線で約10分</li>
        <li><strong>那智の滝</strong>：紀伊勝浦駅からバスで約30分</li>
      </ul>
    `
  },
  {
    name: '中国',
    slug: 'chugoku-powerspot',
    areaIds: [214, 60],
    seoTitle: '中国地方のパワースポット',
    metaDescription: '中国地方のおすすめパワースポットを厳選紹介。出雲大社、厳島神社、美保神社など、縁結びと海の聖地をご案内します。',
    intro: `
      <p><strong>中国地方</strong>は、神話の舞台として知られる聖地が多い地域。出雲大社は縁結びの総本山として全国から参拝者が訪れ、厳島神社は海上に浮かぶ大鳥居で世界的に有名です。</p>
      <p>古事記・日本書紀に登場する神々を祀る神社が点在し、神話のロマンを感じながらパワースポット巡りができます。</p>
      <h3>中国地方パワースポットの特徴</h3>
      <ul>
        <li><strong>縁結びの聖地</strong>：出雲大社は全国の神々が集まる場所</li>
        <li><strong>世界遺産</strong>：厳島神社の海上大鳥居は圧巻</li>
        <li><strong>神話の舞台</strong>：古事記に登場する神社が多数</li>
        <li><strong>両参り</strong>：出雲大社と美保神社の両参りで効果倍増</li>
      </ul>
      <h3>ベストシーズン</h3>
      <p><strong>10月（神無月）</strong>は出雲では「神在月」。全国の神々が出雲に集まる時期で、縁結び祈願に最適です。厳島神社は干潮時に大鳥居まで歩けます。</p>
    `,
    accessInfo: `
      <h3>中国地方へのアクセス</h3>
      <ul>
        <li><strong>出雲大社</strong>：出雲空港からバスで約25分、または出雲市駅からバスで約25分</li>
        <li><strong>厳島神社</strong>：広島駅からJR＋フェリーで約1時間</li>
        <li><strong>美保神社</strong>：米子駅からバスで約50分</li>
      </ul>
    `
  },
  {
    name: '四国',
    slug: 'shikoku-powerspot',
    areaIds: [212, 60],
    seoTitle: '四国のパワースポット',
    metaDescription: '四国のおすすめパワースポットを厳選紹介。金刀比羅宮、石鎚神社、大山祇神社など、お遍路の聖地をご案内します。',
    intro: `
      <p><strong>四国</strong>は、弘法大師空海ゆかりの<strong>八十八ヶ所霊場</strong>で知られる巡礼の地。四国遍路は1200年以上の歴史を持つ日本最大の巡礼路です。</p>
      <p>「こんぴらさん」の愛称で親しまれる金刀比羅宮、西日本最高峰の霊山・石鎚山、国宝の甲冑を所蔵する大山祇神社など、独自の信仰文化が息づいています。</p>
      <h3>四国パワースポットの特徴</h3>
      <ul>
        <li><strong>785段の石段</strong>：金刀比羅宮への参道は体力勝負</li>
        <li><strong>修験道の聖地</strong>：石鎚山は日本七霊山の一つ</li>
        <li><strong>武運の神</strong>：大山祇神社は全国の山祇神社の総本社</li>
        <li><strong>四国遍路</strong>：88ヶ所の霊場巡りで心身を浄化</li>
      </ul>
      <h3>ベストシーズン</h3>
      <p><strong>春（3月〜5月）と秋（9月〜11月）</strong>がおすすめ。夏は石鎚山のお山開き（7月）、秋は金刀比羅宮の例大祭（10月）が賑わいます。</p>
    `,
    accessInfo: `
      <h3>四国へのアクセス</h3>
      <ul>
        <li><strong>金刀比羅宮</strong>：高松空港から車で約40分、または琴平駅から徒歩15分</li>
        <li><strong>石鎚神社</strong>：松山駅から車で約1時間30分</li>
        <li><strong>大山祇神社</strong>：今治駅からバスで約1時間</li>
      </ul>
      <p>四国は車での移動が便利。瀬戸大橋、明石海峡大橋、しまなみ海道など、本州からのアクセスルートも充実しています。</p>
    `
  },
  {
    name: '九州・沖縄',
    slug: 'kyushu-okinawa-powerspot',
    areaIds: [226, 210, 61],
    seoTitle: '九州・沖縄のパワースポット',
    metaDescription: '九州・沖縄のおすすめパワースポットを厳選紹介。阿蘇山、斎場御嶽、宇佐神宮など、火山と琉球の聖地をご案内します。',
    intro: `
      <p><strong>九州・沖縄</strong>は、火山のエネルギーと琉球文化が融合した独自のパワースポットが魅力。阿蘇山のカルデラ、霧島神宮の神話の舞台、そして沖縄の斎場御嶽など、本土とは異なる霊気を感じられます。</p>
      <p>全国八幡宮の総本社・宇佐神宮、日本三大稲荷の祐徳稲荷神社、そして琉球王国の聖地・斎場御嶽まで、多様な信仰文化が息づいています。</p>
      <h3>九州・沖縄パワースポットの特徴</h3>
      <ul>
        <li><strong>火山のパワー</strong>：阿蘇山、霧島山など活火山の聖地</li>
        <li><strong>八幡信仰</strong>：宇佐神宮は全国4万社の八幡宮の総本社</li>
        <li><strong>琉球の聖地</strong>：斎場御嶽は世界遺産の祈りの場</li>
        <li><strong>日本三大稲荷</strong>：祐徳稲荷神社は九州最大の稲荷</li>
      </ul>
      <h3>ベストシーズン</h3>
      <p>九州は<strong>年間を通じて温暖</strong>。沖縄は<strong>3月〜5月</strong>と<strong>10月〜11月</strong>が過ごしやすくおすすめです。</p>
    `,
    accessInfo: `
      <h3>九州・沖縄へのアクセス</h3>
      <ul>
        <li><strong>阿蘇山</strong>：熊本空港から車で約1時間</li>
        <li><strong>宇佐神宮</strong>：大分空港から車で約1時間</li>
        <li><strong>祐徳稲荷神社</strong>：佐賀駅からバスで約1時間</li>
        <li><strong>斎場御嶽</strong>：那覇空港から車で約1時間</li>
      </ul>
      <p>九州は新幹線・飛行機・フェリーなど多彩なアクセス手段があります。沖縄は那覇空港を拠点にレンタカーでの移動が便利です。</p>
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
          title: post.title.rendered.replace(/ \|.*$/, ''), // タイトルからサブタイトルを除去
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
 * メイン処理
 */
async function main() {
  console.log('=== エリア別ピラーページ作成 ===\n');

  const results = [];

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

  console.log('\n完了しました。');
}

main().catch(console.error);
