#!/usr/bin/env node
// Markdownファイルを読み込んで、デザインを整えたHTMLでWordPressに投稿

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const EN_SHINDAN_URL = process.env.EN_SHINDAN_URL;

// パワースポットデータベースを読み込む（エネルギー値順にソート済み）
function loadPowerspotDatabase() {
  const dbPath = path.join(__dirname, '04_powerspot_database.json');
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const keys = Object.keys(data[0]);

  // エネルギー値でソート
  const sorted = data.sort((a, b) => b[keys[2]] - a[keys[2]]);

  // キーインデックスでアクセス（文字化け対策）
  return sorted.map((spot, index) => {
    const elements = spot[keys[3]];
    const elementKeys = Object.keys(elements);
    return {
      rank: index + 1,  // エネルギー値順の順位
      region: spot[keys[0]],
      name: spot[keys[1]],
      baseEnergy: spot[keys[2]],
      elements: {
        wood: elements[elementKeys[0]],
        fire: elements[elementKeys[1]],
        earth: elements[elementKeys[2]],
        metal: elements[elementKeys[3]],
        water: elements[elementKeys[4]]
      }
    };
  });
}

// パワースポット名と詳細情報の対応表
const POWERSPOT_MAPPING = {
  '伊勢神宮': {
    rank: 1, region: '三重県', slug: 'ise-jingu',
    type: '神社', benefits: ['厄除け・開運', '家内安全', '縁結び・恋愛運'],
    featuredImage: 2367
  },
  '伏見稲荷大社': {
    rank: 2, region: '京都府', slug: 'fushimi-inari-taisha',
    type: '神社', benefits: ['厄除け・開運', '商売繁盛', '金運・仕事運'],
    featuredImage: 2378
  },
  '斎場御嶽': {
    rank: 3, region: '沖縄県', slug: 'sefa-utaki',
    type: '遺跡・史跡', benefits: ['厄除け・開運', '心願成就', '縁結び・恋愛運'],
    featuredImage: 2393
  },
  '金刀比羅宮': {
    rank: 4, region: '香川県', slug: 'kotohira-gu',
    type: '神社', benefits: ['交通安全', '厄除け・開運', '商売繁盛'],
    featuredImage: 2399
  },
  '出雲大社': {
    rank: 5, region: '島根県', slug: 'izumo-taisha',
    type: '神社', benefits: ['縁結び・恋愛運', '商売繁盛', '家内安全'],
    featuredImage: 2405
  },
  '阿蘇山': {
    rank: 6, region: '熊本県', slug: 'mount-aso',
    type: '山・自然', benefits: ['厄除け・開運', '健康・病気平癒', '心願成就'],
    featuredImage: 2411
  },
  '日光東照宮': {
    rank: 7, region: '栃木県', slug: 'nikko-toshogu',
    type: '神社', benefits: ['厄除け・開運', '学業・合格祈願', '商売繁盛'],
    featuredImage: 2419
  },
  '羽黒山神社': {
    rank: 8, region: '山形県', slug: 'haguro-san',
    type: '神社', benefits: ['厄除け・開運', '健康・病気平癒', '心願成就'],
    featuredImage: 2465
  },
  '中尊寺金色堂': {
    rank: 9, region: '岩手県', slug: 'chusonji-konjikido',
    type: '寺院', benefits: ['厄除け・開運', '家内安全', '健康・病気平癒'],
    featuredImage: 2466
  },
  '松島': {
    rank: 10, region: '宮城県', slug: 'matsushima',
    type: '山・自然', benefits: ['厄除け・開運', '心願成就', '縁結び・恋愛運'],
    featuredImage: 2469
  },
  '大崎八幡宮': {
    rank: 11, region: '宮城県', slug: 'osaki-hachimangu',
    type: '神社', benefits: ['厄除け・開運', '商売繁盛', '勝負運'],
    featuredImage: 2472
  },
  '熱田神宮': {
    rank: 12, region: '愛知県', slug: 'atsuta-jingu',
    type: '神社', benefits: ['厄除け・開運', '家内安全', '商売繁盛'],
    featuredImage: 2475
  },
  '北海道神宮': {
    rank: 13, region: '北海道', slug: 'hokkaido-jingu',
    type: '神社', benefits: ['厄除け・開運', '縁結び・恋愛運', '家内安全'],
    featuredImage: 2478
  },
  '樽前山神社': {
    rank: 14, region: '北海道', slug: 'tarumaesan-jinja',
    type: '神社', benefits: ['厄除け・開運', '商売繁盛', '心願成就'],
    featuredImage: 2481
  },
  '阿寒湖': {
    rank: 15, region: '北海道', slug: 'akan-lake',
    type: '湖・海', benefits: ['厄除け・開運', '心願成就', '縁結び・恋愛運'],
    featuredImage: 2484
  },
};

// タクソノミーID対応表（重複を避けるため固定）
const TAXONOMY_IDS = {
  type: {
    '神社': 62,
    '寺院': 63,
    '山・自然': 64,
    '湖・海': 65,
    '遺跡・史跡': 66,
    'その他': 67
  },
  benefit: {
    '縁結び・恋愛運': 68,
    '金運・仕事運': 69,
    '健康・病気平癒': 70,
    '学業・合格祈願': 71,
    '厄除け・開運': 72,
    '子宝・安産': 73,
    '家内安全': 74,
    '商売繁盛': 75,
    '交通安全': 76,
    '心願成就': 77
  },
  element: {
    '木': 51,
    '火': 52,
    '土': 53,
    '金': 54,
    '水': 55
  }
};

// タイトルからパワースポット名と都道府県を抽出
function extractSpotInfo(title) {
  // "スポット名 | 都道府県の..." 形式からスポット名と都道府県を抽出
  const nameMatch = title.match(/^(.+?)\s*[|｜]/);
  const spotName = nameMatch ? nameMatch[1].trim() : title;

  // 都道府県を抽出
  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県',
    '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
    '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県',
    '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県',
    '沖縄県'
  ];

  let region = null;
  for (const pref of prefectures) {
    if (title.includes(pref)) {
      region = pref;
      break;
    }
  }

  return { spotName, region };
}

// データベースからパワースポット情報を検索（マッピングテーブルを使用）
function findPowerspotInDB(spotName, region, database) {
  // マッピングテーブルから情報を取得
  const mapping = POWERSPOT_MAPPING[spotName];
  if (mapping) {
    // 順位でデータベースから五行属性を取得（0-indexed）
    const dbEntry = database[mapping.rank - 1];
    return {
      rank: mapping.rank,
      region: mapping.region,
      slug: mapping.slug,
      type: mapping.type,
      benefits: mapping.benefits,
      featuredImage: mapping.featuredImage,
      elements: dbEntry ? dbEntry.elements : null,
      baseEnergy: dbEntry ? dbEntry.baseEnergy : null
    };
  }

  return null;
}

// 都道府県からエリアを判定
function getAreaFromRegion(region) {
  const areaMapping = {
    '北海道': '北海道',
    '青森県': '東北', '岩手県': '東北', '宮城県': '東北', '秋田県': '東北', '山形県': '東北', '福島県': '東北',
    '茨城県': '関東', '栃木県': '関東', '群馬県': '関東', '埼玉県': '関東', '千葉県': '関東', '東京都': '関東', '神奈川県': '関東',
    '新潟県': '中部', '富山県': '中部', '石川県': '中部', '福井県': '中部', '山梨県': '中部', '長野県': '中部', '岐阜県': '中部', '静岡県': '中部', '愛知県': '中部',
    '三重県': '近畿', '滋賀県': '近畿', '京都府': '近畿', '大阪府': '近畿', '兵庫県': '近畿', '奈良県': '近畿', '和歌山県': '近畿',
    '鳥取県': '中国', '島根県': '中国', '岡山県': '中国', '広島県': '中国', '山口県': '中国',
    '徳島県': '四国', '香川県': '四国', '愛媛県': '四国', '高知県': '四国',
    '福岡県': '九州', '佐賀県': '九州', '長崎県': '九州', '熊本県': '九州', '大分県': '九州', '宮崎県': '九州', '鹿児島県': '九州',
    '沖縄県': '沖縄'
  };
  return areaMapping[region] || null;
}

// WordPressタクソノミーのタームIDを取得または作成
async function getOrCreateTermId(auth, taxonomy, termName) {
  try {
    // まず既存のタームを検索
    const searchResponse = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/${taxonomy}`,
      {
        params: { search: termName, per_page: 100 },
        headers: { 'Authorization': `Basic ${auth}` }
      }
    );

    const existingTerm = searchResponse.data.find(term => term.name === termName);
    if (existingTerm) {
      return existingTerm.id;
    }

    // なければ作成
    const createResponse = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/${taxonomy}`,
      { name: termName },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return createResponse.data.id;
  } catch (error) {
    console.log(`⚠️ タクソノミー ${taxonomy}/${termName} の取得/作成に失敗: ${error.message}`);
    return null;
  }
}

// 五行属性のトップ要素を取得
function getTopElements(elements, count = 2) {
  const elementNames = {
    wood: '木',
    fire: '火',
    earth: '土',
    metal: '金',
    water: '水'
  };

  return Object.entries(elements)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key, value]) => elementNames[key]);
}

// コマンドライン引数からMarkdownファイルのパスを取得
const markdownFile = process.argv[2];

if (!markdownFile) {
  console.error('❌ Markdownファイルを指定してください');
  console.log('使用例: node post-from-markdown-styled.js articles/izumo-taisha.md');
  process.exit(1);
}

// Markdownファイルを読み込む
function parseMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // タイトル（# で始まる行）を抽出
  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'タイトルなし';

  // タイトル行を除去
  const body = content.replace(/^# .+$/m, '').trim();

  return {
    title: title,
    excerpt: '', // 自動生成される場合は空
    content: body
  };
}

// インラインCSSスタイル
const styles = {
  section: 'background: linear-gradient(to right, #f8f9fa 0%, #ffffff 100%); border-left: 5px solid #4a90e2; padding: 25px; margin: 35px 0; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);',
  infoBox: 'background: linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%); border: 2px solid #2196f3; padding: 25px; margin: 25px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(33,150,243,0.1);',
  accessBox: 'background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 15px 0;',
  highlightBox: 'background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%); border-left: 5px solid #ffa726; padding: 20px; margin: 20px 0; border-radius: 8px;',
  reviewBox: 'background: #f5f5f5; padding: 20px; margin: 15px 0; border-radius: 10px; border-left: 4px solid #9c27b0; box-shadow: 0 2px 6px rgba(0,0,0,0.08);',
  ctaBox: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; margin: 50px 0; border-radius: 15px; text-align: center; box-shadow: 0 4px 20px rgba(102,126,234,0.3);',
  ctaButton: 'display: inline-block; background: white; color: #667eea; padding: 18px 50px; margin: 25px 0; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); transition: transform 0.3s ease;',
  table: 'width: 100%; border-collapse: collapse; margin: 20px 0;',
  tableCell: 'border: 1px solid #ddd; padding: 12px; text-align: left;',
  tableHeader: 'background-color: #4a90e2; color: white; padding: 12px; text-align: left;'
};

// Markdownをスタイル付きHTMLに変換
function markdownToHtml(markdown) {
  let sections = markdown.split(/(?=^## )/gm);
  let html = '';

  sections.forEach((section, index) => {
    if (!section.trim()) return;

    // セクションタイトルを抽出
    const titleMatch = section.match(/^## (.+)$/m);
    const sectionTitle = titleMatch ? titleMatch[1] : '';
    const sectionContent = section.replace(/^## .+$/m, '').trim();

    // セクションタイプを判定
    let sectionStyle = styles.section;
    let sectionClass = 'powerspot-section';

    if (sectionTitle.includes('基本情報') || sectionTitle.includes('アクセス')) {
      sectionStyle = styles.infoBox;
      sectionClass = 'info-section';
    } else if (sectionTitle.includes('口コミ') || sectionTitle.includes('体験談')) {
      sectionClass = 'review-section';
    }

    // セクション開始
    html += `<div class="${sectionClass}" style="${sectionStyle}">`;

    if (sectionTitle) {
      html += `<h2 style="color: #333; border-bottom: 2px solid #4a90e2; padding-bottom: 10px; margin-bottom: 20px;">${sectionTitle}</h2>`;
    }

    // コンテンツを変換
    html += convertContent(sectionContent, sectionTitle);

    html += '</div>';
  });

  // 記事下部にCTAを追加
  html += addFooterCTA();

  return html;
}

// コンテンツを変換
function convertContent(content, sectionTitle) {
  let html = content;

  // H3見出し
  html = html.replace(/^### (.+)$/gm, (match, title) => {
    if (sectionTitle.includes('アクセス') || sectionTitle.includes('基本情報')) {
      return `<h3 style="color: #2196f3; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">📍 ${title}</h3>`;
    } else if (sectionTitle.includes('グルメ') || sectionTitle.includes('カフェ')) {
      return `<h3 style="color: #ff6b6b; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">🍽️ ${title}</h3>`;
    } else if (sectionTitle.includes('ご利益')) {
      return `<h3 style="color: #9c27b0; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">✨ ${title}</h3>`;
    }
    return `<h3 style="color: #555; margin-top: 20px; margin-bottom: 10px;">${title}</h3>`;
  });

  // H4見出し
  html = html.replace(/^#### (.+)$/gm, '<h4 style="color: #666; margin-top: 15px; margin-bottom: 8px;">$1</h4>');

  // 画像（Markdown形式をHTMLに変換）- キャプション付き
  html = html.replace(/!\[(.*?)\]\((.*?)\)\n\*(.*?)\*/g, (match, alt, url, caption) => {
    return `<figure style="margin: 30px 0; text-align: center;">
      <img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
      <figcaption style="margin-top: 10px; font-size: 14px; color: #666; font-style: italic;">${caption}</figcaption>
    </figure>`;
  });

  // 画像（シンプル形式）- キャプションなし
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
    return `<figure style="margin: 30px 0; text-align: center;">
      <img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
    </figure>`;
  });

  // 太字
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #d32f2f;">$1</strong>');

  // リスト
  html = html.replace(/^- (.+)$/gm, '<li style="margin: 8px 0; line-height: 1.8;">$1</li>');
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, '<ul style="padding-left: 25px; margin: 15px 0;">$&</ul>');

  // 口コミ・体験談の特殊処理
  if (sectionTitle && (sectionTitle.includes('口コミ') || sectionTitle.includes('体験談'))) {
    html = html.replace(/\*\*「(.+?)」\*\*（(.+?)）/g, (match, quote, author) => {
      return `<div style="${styles.reviewBox}">
        <p style="font-size: 16px; color: #333; margin-bottom: 10px;">"${quote}"</p>
        <p style="text-align: right; color: #666; font-size: 14px;">— ${author}</p>
      </div>`;
    });
  }

  // FAQの特殊処理
  if (sectionTitle && sectionTitle.includes('よくある質問')) {
    html = html.replace(/\*\*Q: (.+?)\*\*/g, '<p style="font-weight: bold; color: #4a90e2; margin-top: 20px; margin-bottom: 5px;">❓ Q: $1</p>');
    html = html.replace(/A: (.+?)(?=\n|$)/g, '<p style="margin-left: 20px; color: #555; line-height: 1.8;">💡 A: $1</p>');
  }

  // 季節のおすすめ度（★）
  html = html.replace(/おすすめ度:\s*(★+)/g, '<span style="color: #ffa726; font-size: 18px;">おすすめ度: $1</span>');

  // 段落
  html = html.replace(/\n\n/g, '</p>\n<p style="line-height: 1.8; margin: 15px 0;">');
  html = '<p style="line-height: 1.8; margin: 15px 0;">' + html + '</p>';

  // 空の<p>タグを削除
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '');
  html = html.replace(/<p[^>]*>\s*<ul/g, '<ul');
  html = html.replace(/<\/ul>\s*<\/p>/g, '</ul>');
  html = html.replace(/<p[^>]*>\s*<h[234]/g, '<h');
  html = html.replace(/<\/h[234]>\s*<\/p>/g, '</h>');

  return html;
}

// 記事下部に控えめなCTAを追加
function addFooterCTA() {
  return `
  <!-- 控えめな診断リンク -->
  <div style="text-align: center; padding: 30px; background: #f9f9f9; margin: 40px 0; border-radius: 8px; border: 1px solid #e0e0e0;">
    <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.8;">
      💡 あなたに最適なパワースポットを知りたい方は
      <a href="${EN_SHINDAN_URL}" target="_blank" rel="noopener" style="color: #4a90e2; font-weight: bold; text-decoration: none; border-bottom: 1px solid #4a90e2;">無料の相性診断</a>をお試しください（3分で完了）
    </p>
  </div>

  <!-- 関連記事プレースホルダー -->
  <div style="${styles.section}">
    <h2 style="color: #333; border-bottom: 2px solid #4a90e2; padding-bottom: 10px; margin-bottom: 20px;">
      📚 この記事を読んだ方におすすめ
    </h2>
    <p style="color: #666; font-size: 14px; font-style: italic;">
      ※ 関連記事はWordPress管理画面で設定してください
    </p>
    <!-- WordPress側で関連記事プラグインを使用するか、手動で設定 -->
  </div>`;
}

async function postToWordPress(article, spotInfo) {
  const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  const htmlContent = markdownToHtml(article.content);

  const postData = {
    title: article.title,
    content: htmlContent,
    excerpt: article.excerpt || '',
    status: 'draft'
  };

  // スラッグを設定
  if (spotInfo && spotInfo.slug) {
    postData.slug = spotInfo.slug;
    console.log(`🔗 スラッグ: ${spotInfo.slug}`);
  }

  // アイキャッチ画像を設定
  if (spotInfo && spotInfo.featuredImage) {
    postData.featured_media = spotInfo.featuredImage;
    console.log(`🖼️ アイキャッチ画像: ID ${spotInfo.featuredImage}`);
  }

  // タクソノミーを設定
  if (spotInfo) {
    console.log('📊 タクソノミーを設定中...');

    // 地域（都道府県）
    if (spotInfo.region) {
      const regionId = await getOrCreateTermId(auth, 'powerspot_region', spotInfo.region);
      if (regionId) {
        postData.powerspot_region = [regionId];
        console.log(`   地域: ${spotInfo.region} (ID: ${regionId})`);
      }
    }

    // エリア
    const area = getAreaFromRegion(spotInfo.region);
    if (area) {
      const areaId = await getOrCreateTermId(auth, 'powerspot_area', area);
      if (areaId) {
        postData.powerspot_area = [areaId];
        console.log(`   エリア: ${area} (ID: ${areaId})`);
      }
    }

    // スポットタイプ
    if (spotInfo.type && TAXONOMY_IDS.type[spotInfo.type]) {
      postData.powerspot_type = [TAXONOMY_IDS.type[spotInfo.type]];
      console.log(`   タイプ: ${spotInfo.type} (ID: ${TAXONOMY_IDS.type[spotInfo.type]})`);
    }

    // ご利益
    if (spotInfo.benefits && spotInfo.benefits.length > 0) {
      const benefitIds = spotInfo.benefits
        .map(b => TAXONOMY_IDS.benefit[b])
        .filter(id => id);
      if (benefitIds.length > 0) {
        postData.powerspot_benefit = benefitIds;
        console.log(`   ご利益: ${spotInfo.benefits.join(', ')} (IDs: ${benefitIds.join(', ')})`);
      }
    }

    // 五行属性（上位2つ）
    if (spotInfo.elements) {
      const topElements = getTopElements(spotInfo.elements, 2);
      const elementIds = topElements
        .map(e => TAXONOMY_IDS.element[e])
        .filter(id => id);
      if (elementIds.length > 0) {
        postData.powerspot_element = elementIds;
        console.log(`   五行属性: ${topElements.join(', ')} (IDs: ${elementIds.join(', ')})`);
      }
    }

    console.log('');
  }

  try {
    console.log('📤 WordPressに投稿中...\n');

    const response = await axios.post(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot`,
      postData,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ 投稿成功！\n');
    console.log(`投稿ID: ${response.data.id}`);
    console.log(`タイトル: ${response.data.title.rendered}`);
    console.log(`スラッグ: ${response.data.slug}`);
    console.log(`ステータス: ${response.data.status} (下書き)`);
    console.log(`プレビューURL: ${response.data.link}`);
    console.log(`\n💡 WordPress管理画面で確認・公開してください`);
    console.log(`   ${WP_SITE_URL}/wp-admin/post.php?post=${response.data.id}&action=edit`);

    return response.data;
  } catch (error) {
    console.error('❌ WordPress投稿エラー:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log(`📖 ${markdownFile} を読み込んでいます...\n`);

    const article = parseMarkdown(markdownFile);

    console.log(`タイトル: ${article.title}`);
    console.log(`文字数: ${article.content.length}文字\n`);

    // タイトルからパワースポット名と都道府県を抽出
    const { spotName, region } = extractSpotInfo(article.title);
    console.log(`🔍 パワースポット名: ${spotName}`);
    console.log(`🗾 都道府県（タイトルから）: ${region || '不明'}`);

    // データベースから五行属性を取得
    const database = loadPowerspotDatabase();
    const dbSpotInfo = findPowerspotInDB(spotName, region, database);

    // spotInfoを構築
    let spotInfo = null;
    if (dbSpotInfo) {
      spotInfo = dbSpotInfo;
      console.log(`✅ データベースで見つかりました（順位: ${dbSpotInfo.rank}）`);
      console.log(`   地域: ${dbSpotInfo.region}`);
      console.log(`   エネルギー: ${dbSpotInfo.baseEnergy}`);
      const topElements = getTopElements(dbSpotInfo.elements, 2);
      console.log(`   五行属性（上位2つ）: ${topElements.join(', ')}`);
      console.log('');
    } else if (region) {
      // マッピングにない場合はタイトルから抽出した都道府県を使用
      spotInfo = { region: region, elements: null, baseEnergy: null };
      console.log(`⚠️ マッピングテーブルに見つかりませんでした`);
      console.log(`   地域（タイトルから）: ${region}`);
      console.log(`   五行属性は手動設定してください\n`);
    } else {
      console.log(`⚠️ パワースポット情報が見つかりませんでした（タクソノミーは手動設定してください）\n`);
    }

    await postToWordPress(article, spotInfo);

    console.log('\n🎉 完了しました！');
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

main();
