/**
 * ご利益別ピラーページ作成スクリプト
 *
 * 10種類のご利益別SEO最適化ピラーページを作成
 */

const axios = require('axios');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');
const headers = { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' };

// ご利益定義（重複IDを統合）
const BENEFIT_DEFINITIONS = [
  {
    name: '縁結び・恋愛運',
    slug: 'enmusubi-powerspot',
    benefitIds: [68, 109], // love-marriage, love-marriage-ja
    seoTitle: '縁結び・恋愛運のパワースポット',
    metaDescription: '縁結び・恋愛運アップにご利益のあるパワースポットを厳選紹介。出雲大社、北海道神宮など、良縁祈願・恋愛成就の聖地をご案内します。',
    intro: `
      <p><strong>縁結び・恋愛運</strong>のご利益を求めて、多くの人がパワースポットを訪れます。「良い出会いがほしい」「恋愛を成就させたい」「結婚相手を見つけたい」——そんな願いを叶えてくれる聖地が日本各地に存在します。</p>
      <p>縁結びの神様として最も有名な<strong>出雲大社</strong>をはじめ、全国には恋愛運アップに効果があるとされるパワースポットが数多くあります。</p>
      <h3>縁結びパワースポットの特徴</h3>
      <ul>
        <li><strong>大国主大神</strong>：出雲大社に祀られる縁結びの神様</li>
        <li><strong>結び石・恋愛成就の木</strong>：特別なパワーを持つスポット</li>
        <li><strong>縁結びのお守り</strong>：多くの神社で授与されている</li>
        <li><strong>恋みくじ</strong>：恋愛運を占える特別なおみくじ</li>
      </ul>
      <h3>参拝のポイント</h3>
      <p>縁結びの参拝では、<strong>具体的な願いを心に描く</strong>ことが大切です。「素敵な出会いがありますように」よりも「○○のような人と出会えますように」と具体的に願うと効果的。また、参拝後は<strong>自分磨き</strong>を忘れずに。神様は努力する人を応援してくれます。</p>
    `,
    accessInfo: `
      <h3>縁結びパワースポット巡りのコツ</h3>
      <ul>
        <li><strong>出雲大社</strong>：旧暦10月（神在月）は全国の神様が集まる最強の縁結び月</li>
        <li><strong>複数参拝</strong>：縁結び神社を複数巡る「縁結びツアー」が人気</li>
        <li><strong>お守りの持ち方</strong>：肌身離さず持ち歩くのがおすすめ</li>
      </ul>
    `
  },
  {
    name: '金運・仕事運',
    slug: 'kinun-powerspot',
    benefitIds: [69], // money-career
    seoTitle: '金運・仕事運のパワースポット',
    metaDescription: '金運・仕事運アップにご利益のあるパワースポットを厳選紹介。伏見稲荷大社、金剱宮など、財運上昇・出世の聖地をご案内します。',
    intro: `
      <p><strong>金運・仕事運</strong>のご利益を求める方に人気のパワースポット。「収入を増やしたい」「商売を繁盛させたい」「出世したい」——そんな願いを叶えてくれる聖地をご紹介します。</p>
      <p>全国の稲荷神社の総本宮<strong>伏見稲荷大社</strong>は商売繁盛の神様として有名。また、石川県の<strong>金剱宮</strong>は金運パワースポットとして知る人ぞ知る聖地です。</p>
      <h3>金運パワースポットの特徴</h3>
      <ul>
        <li><strong>稲荷神社</strong>：商売繁盛・五穀豊穣の神様を祀る</li>
        <li><strong>弁財天</strong>：財運と芸能の女神</li>
        <li><strong>銭洗い</strong>：お金を洗って金運アップを祈願</li>
        <li><strong>黄金色のお守り</strong>：金運に特化したお守りが人気</li>
      </ul>
      <h3>参拝のポイント</h3>
      <p>金運アップの参拝では、<strong>感謝の気持ち</strong>を忘れずに。「もっとお金がほしい」ではなく「いただいているご縁に感謝します」という心持ちで参拝すると効果的。また、新しい財布を持参して祈祷してもらうのもおすすめです。</p>
    `,
    accessInfo: `
      <h3>金運パワースポット巡りのコツ</h3>
      <ul>
        <li><strong>初詣</strong>：年始の参拝は特に金運アップに効果的</li>
        <li><strong>一粒万倍日</strong>：金運に良い吉日を選んで参拝</li>
        <li><strong>新月の日</strong>：財布の新調は新月の日が縁起良し</li>
      </ul>
    `
  },
  {
    name: '健康・病気平癒',
    slug: 'kenko-powerspot',
    benefitIds: [70], // health
    seoTitle: '健康・病気平癒のパワースポット',
    metaDescription: '健康運・病気平癒にご利益のあるパワースポットを厳選紹介。病気回復、健康長寿を祈願できる聖地をご案内します。',
    intro: `
      <p><strong>健康・病気平癒</strong>のご利益を求めて参拝する方は多くいらっしゃいます。「病気を治したい」「健康で長生きしたい」「家族の健康を守りたい」——そんな切実な願いを受け止めてくれる聖地があります。</p>
      <p>古来より日本人は、病気や怪我の治癒を神仏に祈ってきました。今でもその信仰は受け継がれ、多くのパワースポットで健康祈願が行われています。</p>
      <h3>健康パワースポットの特徴</h3>
      <ul>
        <li><strong>薬師如来</strong>：病気治癒を司る仏様</li>
        <li><strong>霊水・御神水</strong>：飲むと病気が治ると言われる聖なる水</li>
        <li><strong>撫で仏</strong>：体の悪い部分を撫でると治ると言われる像</li>
        <li><strong>健康守り</strong>：身につけて健康を祈願</li>
      </ul>
      <h3>参拝のポイント</h3>
      <p>健康祈願の参拝では、<strong>具体的に願う</strong>ことが大切。「健康でありますように」よりも「○○の病気が治りますように」と具体的に願いましょう。また、参拝後は生活習慣の改善も忘れずに。神仏は努力する人を守ってくれます。</p>
    `,
    accessInfo: `
      <h3>健康パワースポット巡りのコツ</h3>
      <ul>
        <li><strong>早朝参拝</strong>：清浄な気に満ちた朝の参拝が効果的</li>
        <li><strong>写経・写仏</strong>：心を落ち着けて祈りを捧げる</li>
        <li><strong>温泉との組み合わせ</strong>：近くに温泉があれば心身ともにリフレッシュ</li>
      </ul>
    `
  },
  {
    name: '厄除け・開運',
    slug: 'yakuyoke-powerspot',
    benefitIds: [72, 105], // fortune, fortune-ja
    seoTitle: '厄除け・開運のパワースポット',
    metaDescription: '厄除け・開運にご利益のあるパワースポットを厳選紹介。厄年の厄払い、運気上昇を祈願できる聖地をご案内します。',
    intro: `
      <p><strong>厄除け・開運</strong>は、パワースポット参拝の最もポピュラーな目的の一つ。「厄年を無事に乗り越えたい」「悪い運気を払いたい」「人生を好転させたい」——そんな願いを叶えてくれる聖地が全国に点在しています。</p>
      <p>日本には男性の25歳・42歳・61歳、女性の19歳・33歳・37歳・61歳が<strong>厄年</strong>とされ、多くの人が厄除け祈願のために神社仏閣を訪れます。</p>
      <h3>厄除けパワースポットの特徴</h3>
      <ul>
        <li><strong>厄除け大師</strong>：川崎大師、西新井大師など厄除けで有名な寺院</li>
        <li><strong>茅の輪くぐり</strong>：夏越の祓で厄を落とす神事</li>
        <li><strong>お祓い・祈祷</strong>：神職や僧侶による厄除け祈願</li>
        <li><strong>厄除けの御札・お守り</strong>：一年間お祀りして厄を防ぐ</li>
      </ul>
      <h3>参拝のポイント</h3>
      <p>厄除け参拝は<strong>厄年の前厄から</strong>始めるのがおすすめ。本厄、後厄と3年間続けて参拝することで、厄を確実に祓えるとされています。また、厄除け祈祷を受けた後は、お札を神棚に祀り、お守りは肌身離さず持ち歩きましょう。</p>
    `,
    accessInfo: `
      <h3>厄除けパワースポット巡りのコツ</h3>
      <ul>
        <li><strong>年始の参拝</strong>：正月から節分までに厄除け祈願を</li>
        <li><strong>節分</strong>：厄を祓う最も効果的な日</li>
        <li><strong>数え年で計算</strong>：厄年は数え年（誕生日で+1歳）で計算</li>
      </ul>
    `
  },
  {
    name: '子宝・安産',
    slug: 'kodakara-powerspot',
    benefitIds: [73], // fertility-childbirth
    seoTitle: '子宝・安産のパワースポット',
    metaDescription: '子宝・安産にご利益のあるパワースポットを厳選紹介。妊活、安産祈願ができる聖地をご案内します。',
    intro: `
      <p><strong>子宝・安産</strong>のご利益を求めて、多くのご夫婦がパワースポットを訪れます。「赤ちゃんを授かりたい」「無事に出産したい」——そんな切実な願いを受け止めてくれる聖地があります。</p>
      <p>日本には古くから子授け・安産の神様を祀る神社が各地にあり、現代でも多くの方が参拝されています。</p>
      <h3>子宝・安産パワースポットの特徴</h3>
      <ul>
        <li><strong>子安神社</strong>：安産・子育ての神様を祀る神社</li>
        <li><strong>子授け石</strong>：撫でると子宝に恵まれるという霊石</li>
        <li><strong>安産守り</strong>：腹帯やお守りで母子の安全を祈願</li>
        <li><strong>戌の日参り</strong>：妊娠5ヶ月の戌の日に安産祈願</li>
      </ul>
      <h3>参拝のポイント</h3>
      <p>子宝祈願は<strong>ご夫婦一緒に</strong>参拝するのがおすすめ。二人で願いを共有することで、より強いご縁が結ばれます。安産祈願は妊娠5ヶ月の<strong>戌の日</strong>に行うのが伝統的。犬は多産で安産であることから、縁起の良い日とされています。</p>
    `,
    accessInfo: `
      <h3>子宝・安産パワースポット巡りのコツ</h3>
      <ul>
        <li><strong>戌の日カレンダー</strong>：安産祈願に最適な日を確認</li>
        <li><strong>腹帯の持参</strong>：神社でお祓いしてもらえる場合も</li>
        <li><strong>温泉との組み合わせ</strong>：子宝の湯として有名な温泉地も多数</li>
      </ul>
    `
  },
  {
    name: '家内安全',
    slug: 'kanai-anzen-powerspot',
    benefitIds: [74, 107], // family-safety, family-safety-ja
    seoTitle: '家内安全のパワースポット',
    metaDescription: '家内安全にご利益のあるパワースポットを厳選紹介。家族の幸せ、家庭円満を祈願できる聖地をご案内します。',
    intro: `
      <p><strong>家内安全</strong>は、日本人が最も大切にしてきた願いの一つ。「家族が健康でありますように」「家庭が円満でありますように」「家を守ってください」——そんな願いを神様に託す参拝は、今も変わらず行われています。</p>
      <p>家内安全のご利益がある神社は全国各地にあり、初詣の定番として多くの家族連れが訪れます。</p>
      <h3>家内安全パワースポットの特徴</h3>
      <ul>
        <li><strong>氏神様</strong>：地域を守る神様への参拝</li>
        <li><strong>家内安全の御札</strong>：神棚に祀って家を守る</li>
        <li><strong>火伏せの神様</strong>：火災から家を守る神社</li>
        <li><strong>地鎮祭・新築祈願</strong>：新しい家の安全を祈る</li>
      </ul>
      <h3>参拝のポイント</h3>
      <p>家内安全の参拝は<strong>家族全員で</strong>行くのが理想的。難しい場合は代表者が参拝し、お札やお守りを持ち帰りましょう。また、毎年<strong>初詣</strong>で新しいお札を受けて、古いお札はお焚き上げするのが伝統的な作法です。</p>
    `,
    accessInfo: `
      <h3>家内安全パワースポット巡りのコツ</h3>
      <ul>
        <li><strong>初詣</strong>：年始に家族で参拝して一年の安全を祈願</li>
        <li><strong>七五三</strong>：子どもの成長を祝う参拝も家内安全の一環</li>
        <li><strong>氏神様への参拝</strong>：まずは地元の神社から</li>
      </ul>
    `
  },
  {
    name: '商売繁盛',
    slug: 'shoubai-hanjo-powerspot',
    benefitIds: [75], // business
    seoTitle: '商売繁盛のパワースポット',
    metaDescription: '商売繁盛にご利益のあるパワースポットを厳選紹介。事業成功、商売繁盛を祈願できる聖地をご案内します。',
    intro: `
      <p><strong>商売繁盛</strong>のご利益を求めて、多くの経営者や自営業者がパワースポットを訪れます。「商売が繁盛しますように」「事業が成功しますように」——そんな願いを叶えてくれる聖地が全国にあります。</p>
      <p>商売繁盛の神様といえば<strong>お稲荷さん</strong>が有名。全国約3万社の稲荷神社の総本宮である伏見稲荷大社は、商売人の聖地として知られています。</p>
      <h3>商売繁盛パワースポットの特徴</h3>
      <ul>
        <li><strong>稲荷神社</strong>：商売繁盛・五穀豊穣の神様</li>
        <li><strong>えびす様</strong>：商売の神様として親しまれる</li>
        <li><strong>千客万来の祈願</strong>：お客様が絶えないことを願う</li>
        <li><strong>商売繁盛の熊手</strong>：縁起物として人気</li>
      </ul>
      <h3>参拝のポイント</h3>
      <p>商売繁盛の参拝では、<strong>感謝の気持ち</strong>を第一に。「もっと儲かりますように」ではなく「お客様とのご縁に感謝します」という心持ちで参拝すると効果的。また、<strong>十日戎</strong>（1月10日前後）は商売繁盛祈願の最盛期です。</p>
    `,
    accessInfo: `
      <h3>商売繁盛パワースポット巡りのコツ</h3>
      <ul>
        <li><strong>十日戎</strong>：1月10日前後の商売繁盛祈願の祭り</li>
        <li><strong>酉の市</strong>：熊手を買って商売繁盛を祈願</li>
        <li><strong>毎月1日・15日</strong>：商売人の定期参拝日</li>
      </ul>
    `
  },
  {
    name: '交通安全',
    slug: 'kotsu-anzen-powerspot',
    benefitIds: [76], // traffic-safety
    seoTitle: '交通安全のパワースポット',
    metaDescription: '交通安全にご利益のあるパワースポットを厳選紹介。車のお祓い、旅行安全を祈願できる聖地をご案内します。',
    intro: `
      <p><strong>交通安全</strong>のご利益を求めて、車やバイクのお祓いにパワースポットを訪れる方は多くいらっしゃいます。「事故に遭いませんように」「旅行が無事でありますように」——そんな願いを叶えてくれる聖地があります。</p>
      <p>日本では新車購入時や車検後に<strong>車のお祓い</strong>を受ける風習があり、交通安全祈願の神社は全国各地で親しまれています。</p>
      <h3>交通安全パワースポットの特徴</h3>
      <ul>
        <li><strong>車のお祓い</strong>：車両祈祷で安全運転を祈願</li>
        <li><strong>交通安全守り</strong>：車内に吊るして事故を防ぐ</li>
        <li><strong>旅行安全祈願</strong>：長距離旅行前の参拝</li>
        <li><strong>航海安全</strong>：船旅の安全を祈る神社も</li>
      </ul>
      <h3>参拝のポイント</h3>
      <p>交通安全の参拝では、<strong>新車購入時</strong>や<strong>車検後</strong>がおすすめのタイミング。車のお祓いは予約が必要な場合が多いので、事前に確認しましょう。また、交通安全のお守りは車内の目につく場所に吊るすと効果的です。</p>
    `,
    accessInfo: `
      <h3>交通安全パワースポット巡りのコツ</h3>
      <ul>
        <li><strong>車のお祓い</strong>：多くの神社で受付あり（要予約確認）</li>
        <li><strong>お守りの更新</strong>：1年ごとに新しいものに交換</li>
        <li><strong>旅行前の参拝</strong>：長距離ドライブ前に安全祈願</li>
      </ul>
    `
  },
  {
    name: '学業成就',
    slug: 'gakugyo-powerspot',
    benefitIds: [271], // academic-success
    seoTitle: '学業成就のパワースポット',
    metaDescription: '学業成就・合格祈願にご利益のあるパワースポットを厳選紹介。受験合格、資格取得を祈願できる聖地をご案内します。',
    intro: `
      <p><strong>学業成就</strong>のご利益を求めて、受験生や資格試験を控えた方がパワースポットを訪れます。「試験に合格しますように」「頭が良くなりますように」——そんな願いを叶えてくれる聖地があります。</p>
      <p>学問の神様といえば<strong>菅原道真公</strong>を祀る天満宮が有名。全国約12,000社の天満宮では、毎年多くの受験生が合格祈願に訪れます。</p>
      <h3>学業成就パワースポットの特徴</h3>
      <ul>
        <li><strong>天満宮・天神様</strong>：学問の神様・菅原道真公を祀る</li>
        <li><strong>合格祈願の絵馬</strong>：願いを書いて奉納</li>
        <li><strong>学業守り</strong>：試験当日に持参</li>
        <li><strong>撫で牛</strong>：頭を撫でると賢くなると言われる</li>
      </ul>
      <h3>参拝のポイント</h3>
      <p>学業成就の参拝では、<strong>努力の誓い</strong>を立てることが大切。「合格しますように」だけでなく「一生懸命勉強しますので、お力添えください」と誓うのが効果的。また、試験直前よりも<strong>早めの参拝</strong>がおすすめです。</p>
    `,
    accessInfo: `
      <h3>学業成就パワースポット巡りのコツ</h3>
      <ul>
        <li><strong>早めの参拝</strong>：受験シーズン（1月〜3月）は混雑</li>
        <li><strong>絵馬の書き方</strong>：具体的な志望校を書くと効果的</li>
        <li><strong>お礼参り</strong>：合格後のお礼参りも忘れずに</li>
      </ul>
    `
  },
  {
    name: '心願成就',
    slug: 'shingan-powerspot',
    benefitIds: [77], // wish-fulfillment
    seoTitle: '心願成就のパワースポット',
    metaDescription: '心願成就にご利益のあるパワースポットを厳選紹介。どんな願いも叶えてくれる万能の聖地をご案内します。',
    intro: `
      <p><strong>心願成就</strong>とは、心に強く願ったことが叶うこと。「この願いだけは叶えたい」「人生を変えたい」——そんな強い思いを持つ方が訪れるパワースポットがあります。</p>
      <p>心願成就のご利益がある神社仏閣は、特定の願いに限らず<strong>あらゆる願い</strong>を受け止めてくれる万能の聖地。人生の転機に訪れる方も多くいらっしゃいます。</p>
      <h3>心願成就パワースポットの特徴</h3>
      <ul>
        <li><strong>万能のご利益</strong>：どんな願いも受け止めてくれる</li>
        <li><strong>強力なパワー</strong>：エネルギーの高い聖地が多い</li>
        <li><strong>本気の祈り</strong>：真剣な願いほど叶いやすい</li>
        <li><strong>人生の転機</strong>：大きな決断前の参拝に最適</li>
      </ul>
      <h3>参拝のポイント</h3>
      <p>心願成就の参拝では、<strong>一つの願いに集中</strong>することが大切。あれもこれもと欲張らず、最も叶えたい願いを一つだけ心に描いて祈りましょう。また、<strong>参拝後の行動</strong>も重要。願いを叶えるための努力を続けることで、神様のお力添えをいただけます。</p>
    `,
    accessInfo: `
      <h3>心願成就パワースポット巡りのコツ</h3>
      <ul>
        <li><strong>真剣な祈り</strong>：本気の願いほど叶いやすい</li>
        <li><strong>継続参拝</strong>：願いが叶うまで定期的に参拝</li>
        <li><strong>お礼参り</strong>：願いが叶ったら必ずお礼を</li>
      </ul>
    `
  }
];

/**
 * ご利益別のパワースポット一覧を取得
 */
async function getSpotsByBenefit(benefitIds) {
  const spots = [];
  const seen = new Set();

  for (const benefitId of benefitIds) {
    try {
      const res = await axios.get(
        `${WP_SITE_URL}/wp-json/wp/v2/powerspot?powerspot_benefit=${benefitId}&per_page=50&_fields=id,title,slug,link,excerpt`,
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
      console.error(`Error fetching benefit ${benefitId}:`, e.message);
    }
  }

  return spots;
}

/**
 * ピラーページのHTMLを生成
 */
function generatePillarPageHTML(benefit, spots) {
  const spotListHTML = spots.length > 0
    ? spots.map(s => `
      <div class="powerspot-card-mini" style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
        <h4 style="margin: 0 0 8px 0;"><a href="${s.link}" style="color: #4a90a4; text-decoration: none;">${s.title}</a></h4>
        ${s.excerpt ? `<p style="margin: 0; color: #666; font-size: 0.9em;">${s.excerpt}...</p>` : ''}
      </div>
    `).join('')
    : '<p>このご利益のパワースポット記事は準備中です。今後追加予定ですのでお楽しみに。</p>';

  return `
<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">${benefit.name}のパワースポット一覧</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<div class="benefit-pillar-intro" style="background: linear-gradient(135deg, #fff8e1 0%, #ffffff 100%); border-left: 5px solid #ff9800; padding: 24px; margin-bottom: 30px; border-radius: 8px;">
${benefit.intro}
</div>
<!-- /wp:html -->

<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">${benefit.name}のおすすめパワースポット${spots.length > 0 ? `（${spots.length}件）` : ''}</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<div class="powerspot-list" style="margin-bottom: 30px;">
${spotListHTML}
</div>
<!-- /wp:html -->

<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">参拝のコツ</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<div class="benefit-access-info" style="background: #e8f5e9; padding: 24px; border-radius: 8px; margin-bottom: 30px;">
${benefit.accessInfo}
</div>
<!-- /wp:html -->

<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">パワースポット探しをもっと便利に</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>エリアやタイプで絞り込みたい方は、<a href="/powerspot/">パワースポット一覧ページ</a>のフィルター機能をご活用ください。エリア・ご利益・スポットタイプで簡単に検索できます。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>あなたにぴったりのパワースポットを見つけて、願いを叶える旅に出かけましょう。</p>
<!-- /wp:paragraph -->
`;
}

/**
 * WordPressに固定ページを投稿
 */
async function createPillarPage(benefit, content) {
  try {
    // 既存ページをチェック
    const existingRes = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/pages?slug=${benefit.slug}&_fields=id`,
      { headers }
    );

    if (existingRes.data.length > 0) {
      // 既存ページを更新
      const pageId = existingRes.data[0].id;
      const updateRes = await axios.post(
        `${WP_SITE_URL}/wp-json/wp/v2/pages/${pageId}`,
        {
          title: benefit.seoTitle,
          content: content,
          status: 'publish',
          meta: {
            _yoast_wpseo_metadesc: benefit.metaDescription
          }
        },
        { headers }
      );
      console.log(`  更新: ID ${pageId} - ${benefit.seoTitle}`);
      return updateRes.data;
    } else {
      // 新規作成
      const createRes = await axios.post(
        `${WP_SITE_URL}/wp-json/wp/v2/pages`,
        {
          title: benefit.seoTitle,
          slug: benefit.slug,
          content: content,
          status: 'publish',
          meta: {
            _yoast_wpseo_metadesc: benefit.metaDescription
          }
        },
        { headers }
      );
      console.log(`  作成: ID ${createRes.data.id} - ${benefit.seoTitle}`);
      return createRes.data;
    }
  } catch (e) {
    console.error(`  エラー: ${benefit.name} - ${e.response?.data?.message || e.message}`);
    return null;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('=== ご利益別ピラーページ作成 ===\n');

  const results = [];

  for (const benefit of BENEFIT_DEFINITIONS) {
    console.log(`\n✨ ${benefit.name}のピラーページを作成中...`);

    // ご利益のパワースポットを取得
    const spots = await getSpotsByBenefit(benefit.benefitIds);
    console.log(`  パワースポット: ${spots.length}件`);

    // HTMLコンテンツを生成
    const content = generatePillarPageHTML(benefit, spots);

    // WordPressに投稿
    const result = await createPillarPage(benefit, content);
    if (result) {
      results.push({
        benefit: benefit.name,
        id: result.id,
        url: result.link,
        spots: spots.length
      });
    }
  }

  console.log('\n=== 作成結果 ===\n');
  console.log('| ご利益 | ページID | スポット数 | URL |');
  console.log('|--------|----------|------------|-----|');
  results.forEach(r => {
    console.log(`| ${r.benefit} | ${r.id} | ${r.spots}件 | ${r.url} |`);
  });

  console.log('\n完了しました。');
}

main().catch(console.error);
