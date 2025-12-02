#!/usr/bin/env node
// 英語版Markdownファイルを読み込んで、Polylang対応でWordPressに投稿

require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

// コマンドライン引数
const markdownFile = process.argv[2];
const japanesePostId = process.argv[3]; // 日本語版の投稿ID（オプション）

if (!markdownFile) {
  console.error('❌ Markdownファイルを指定してください');
  console.log('使用例: node post-english-article.js articles/ise-jingu-en.md [日本語版投稿ID]');
  console.log('');
  console.log('日本語版投稿IDを指定すると、Polylangで翻訳として紐づけます');
  process.exit(1);
}

// Markdownファイルを読み込む
function parseMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // タイトル（# で始まる行）を抽出
  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'No Title';

  // タイトル行を除去
  const body = content.replace(/^# .+$/m, '').trim();

  return {
    title: title,
    excerpt: '',
    content: body
  };
}

// インラインCSSスタイル（英語版用）
const styles = {
  section: 'background: linear-gradient(to right, #f8f9fa 0%, #ffffff 100%); border-left: 5px solid #4a90e2; padding: 25px; margin: 35px 0; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);',
  infoBox: 'background: linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%); border: 2px solid #2196f3; padding: 25px; margin: 25px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(33,150,243,0.1);',
  accessBox: 'background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 15px 0;',
  highlightBox: 'background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%); border-left: 5px solid #ffa726; padding: 20px; margin: 20px 0; border-radius: 8px;',
  reviewBox: 'background: #f5f5f5; padding: 20px; margin: 15px 0; border-radius: 10px; border-left: 4px solid #9c27b0; box-shadow: 0 2px 6px rgba(0,0,0,0.08);',
};

// Markdownをスタイル付きHTMLに変換（英語版）
function markdownToHtml(markdown) {
  let sections = markdown.split(/(?=^## )/gm);
  let html = '';

  sections.forEach((section, index) => {
    if (!section.trim()) return;

    // セクションタイトルを抽出
    const titleMatch = section.match(/^## (.+)$/m);
    const sectionTitle = titleMatch ? titleMatch[1] : '';
    const sectionContent = section.replace(/^## .+$/m, '').trim();

    // セクションタイプを判定（英語版）
    let sectionStyle = styles.section;
    let sectionClass = 'powerspot-section';

    if (sectionTitle.includes('Basic Information') || sectionTitle.includes('Access') || sectionTitle.includes('Practical Information')) {
      sectionStyle = styles.infoBox;
      sectionClass = 'info-section';
    } else if (sectionTitle.includes('Review') || sectionTitle.includes('Experience') || sectionTitle.includes('Testimonial')) {
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

  // 英語版フッター（診断リンクなし）
  html += addEnglishFooter();

  return html;
}

// コンテンツを変換
function convertContent(content, sectionTitle) {
  let html = content;

  // H3見出し
  html = html.replace(/^### (.+)$/gm, (match, title) => {
    if (sectionTitle && (sectionTitle.includes('Access') || sectionTitle.includes('Basic Information') || sectionTitle.includes('Practical'))) {
      return `<h3 style="color: #2196f3; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">📍 ${title}</h3>`;
    } else if (sectionTitle && (sectionTitle.includes('Food') || sectionTitle.includes('Restaurant') || sectionTitle.includes('Dining'))) {
      return `<h3 style="color: #ff6b6b; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">🍽️ ${title}</h3>`;
    } else if (sectionTitle && (sectionTitle.includes('Benefit') || sectionTitle.includes('Blessing'))) {
      return `<h3 style="color: #9c27b0; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">✨ ${title}</h3>`;
    }
    return `<h3 style="color: #555; margin-top: 20px; margin-bottom: 10px;">${title}</h3>`;
  });

  // H4見出し
  html = html.replace(/^#### (.+)$/gm, '<h4 style="color: #666; margin-top: 15px; margin-bottom: 8px;">$1</h4>');

  // 画像（Markdown形式をHTMLに変換）
  html = html.replace(/!\[(.*?)\]\((.*?)\)\n\*(.*?)\*/g, (match, alt, url, caption) => {
    return `<figure style="margin: 30px 0; text-align: center;">
      <img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
      <figcaption style="margin-top: 10px; font-size: 14px; color: #666; font-style: italic;">${caption}</figcaption>
    </figure>`;
  });

  // 太字
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #d32f2f;">$1</strong>');

  // イタリック（体験談など）
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // リスト
  html = html.replace(/^- (.+)$/gm, '<li style="margin: 8px 0; line-height: 1.8;">$1</li>');
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, '<ul style="padding-left: 25px; margin: 15px 0;">$&</ul>');

  // FAQの特殊処理（英語版）
  if (sectionTitle && (sectionTitle.includes('FAQ') || sectionTitle.includes('Question'))) {
    html = html.replace(/\*\*Q(\d+)?:?\s*(.+?)\*\*/g, '<p style="font-weight: bold; color: #4a90e2; margin-top: 20px; margin-bottom: 5px;">❓ Q: $2</p>');
    html = html.replace(/A:\s*(.+?)(?=\n\n|\n\*\*Q|$)/gs, '<p style="margin-left: 20px; color: #555; line-height: 1.8;">💡 A: $1</p>');
  }

  // 季節の評価（★）
  html = html.replace(/(★+)/g, '<span style="color: #ffa726; font-size: 18px;">$1</span>');

  // 段落
  html = html.replace(/\n\n/g, '</p>\n<p style="line-height: 1.8; margin: 15px 0;">');
  html = '<p style="line-height: 1.8; margin: 15px 0;">' + html + '</p>';

  // 空の<p>タグを削除
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '');
  html = html.replace(/<p[^>]*>\s*<ul/g, '<ul');
  html = html.replace(/<\/ul>\s*<\/p>/g, '</ul>');
  html = html.replace(/<p[^>]*>\s*<h[234]/g, '<h');
  html = html.replace(/<\/h[234]>\s*<\/p>/g, '</h>');
  html = html.replace(/<p[^>]*>\s*<figure/g, '<figure');
  html = html.replace(/<\/figure>\s*<\/p>/g, '</figure>');

  return html;
}

// 英語版フッター（診断リンクなし）
function addEnglishFooter() {
  return `
  <!-- Related Articles -->
  <div style="${styles.section}">
    <h2 style="color: #333; border-bottom: 2px solid #4a90e2; padding-bottom: 10px; margin-bottom: 20px;">
      📚 You May Also Like
    </h2>
    <p style="color: #666; font-size: 14px; font-style: italic;">
      Explore more sacred places and power spots across Japan in our Japan Power Spots series.
    </p>
  </div>

  <!-- Language Notice -->
  <div style="text-align: center; padding: 20px; background: #f0f7ff; margin: 30px 0; border-radius: 8px; border: 1px solid #cce5ff;">
    <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
      🌏 This article is part of our <strong>Japan Power Spots</strong> series for international visitors.<br>
      Planning your trip to Japan? Bookmark this page for your spiritual journey!
    </p>
  </div>`;
}

// Polylangの言語情報を取得
async function getPolylangLanguages(auth) {
  try {
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/pll/v1/languages`,
      {
        headers: { 'Authorization': `Basic ${auth}` }
      }
    );
    return response.data;
  } catch (error) {
    console.log('⚠️ Polylang API not available, trying alternative method...');
    return null;
  }
}

// 英語の言語IDを取得
async function getEnglishLanguageId(auth) {
  try {
    // まずPolylang REST APIを試す
    const languages = await getPolylangLanguages(auth);
    if (languages) {
      const english = languages.find(lang => lang.slug === 'en' || lang.locale === 'en_US');
      if (english) return english.term_id;
    }

    // 言語タクソノミーから取得を試す
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/language`,
      {
        headers: { 'Authorization': `Basic ${auth}` }
      }
    );
    const english = response.data.find(lang => lang.slug === 'en');
    if (english) return english.id;

    return null;
  } catch (error) {
    console.log('⚠️ Could not get language ID automatically');
    return null;
  }
}

// 日本語版の投稿からタクソノミーを取得
async function getJapanesePostTaxonomies(auth, postId) {
  try {
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/powerspot/${postId}`,
      {
        headers: { 'Authorization': `Basic ${auth}` }
      }
    );

    const post = response.data;
    return {
      powerspot_region: post.powerspot_region || [],
      powerspot_area: post.powerspot_area || [],
      powerspot_type: post.powerspot_type || [],
      powerspot_benefit: post.powerspot_benefit || []
    };
  } catch (error) {
    console.log('⚠️ Could not get Japanese post taxonomies');
    return null;
  }
}

async function postToWordPress(article, japanesePostId) {
  const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  const htmlContent = markdownToHtml(article.content);

  // 英語の言語タームIDを取得
  console.log('🌐 Setting language to English...');
  const langTermId = await getEnglishLanguageId(auth);

  // 基本の投稿データ
  const postData = {
    title: article.title,
    content: htmlContent,
    excerpt: article.excerpt || '',
    status: 'draft',
    lang: 'en'  // Polylang言語設定
  };

  // 言語タクソノミーを設定
  if (langTermId) {
    postData.language = [langTermId];
    console.log(`✅ Language term ID: ${langTermId}`);
  }

  // 日本語版のタクソノミーをコピー
  if (japanesePostId) {
    console.log('📋 Getting taxonomies from Japanese version...');
    const taxonomies = await getJapanesePostTaxonomies(auth, japanesePostId);
    if (taxonomies) {
      postData.powerspot_region = taxonomies.powerspot_region;
      postData.powerspot_area = taxonomies.powerspot_area;
      postData.powerspot_type = taxonomies.powerspot_type;
      postData.powerspot_benefit = taxonomies.powerspot_benefit;
      console.log('✅ Taxonomies copied from Japanese version');
      console.log(`   Region: ${taxonomies.powerspot_region.length} terms`);
      console.log(`   Area: ${taxonomies.powerspot_area.length} terms`);
      console.log(`   Type: ${taxonomies.powerspot_type.length} terms`);
      console.log(`   Benefit: ${taxonomies.powerspot_benefit.length} terms`);
      console.log('');
    }
  }

  try {
    console.log('📤 Posting English article to WordPress...\n');

    // powerspotカスタム投稿タイプとして投稿
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

    const newPostId = response.data.id;
    console.log('✅ Article posted successfully!\n');
    console.log(`Post ID: ${newPostId}`);
    console.log(`Title: ${response.data.title.rendered}`);
    console.log(`Status: ${response.data.status} (draft)`);
    console.log(`Preview URL: ${response.data.link}`);

    // Polylangで言語と翻訳を設定
    if (japanesePostId) {
      console.log('\n🔗 Setting up Polylang translation link...');
      await setPolylangTranslation(auth, newPostId, japanesePostId);
    } else {
      console.log('\n💡 To link with Japanese version, run:');
      console.log(`   node post-english-article.js ${markdownFile} [JAPANESE_POST_ID]`);
    }

    console.log(`\n💡 Please review and publish in WordPress admin`);
    console.log(`   ${WP_SITE_URL}/wp-admin/post.php?post=${newPostId}&action=edit`);

    return response.data;
  } catch (error) {
    // powerspotが失敗した場合、通常の投稿を試す
    if (error.response?.status === 404) {
      console.log('⚠️ powerspot post type not found, trying regular post...');
      postData.type = undefined;

      const response = await axios.post(
        `${WP_SITE_URL}/wp-json/wp/v2/posts`,
        postData,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Posted as regular post');
      console.log(`Post ID: ${response.data.id}`);
      return response.data;
    }

    console.error('❌ WordPress posting error:', error.response?.data || error.message);
    throw error;
  }
}

// Polylangの翻訳リンクを設定
async function setPolylangTranslation(auth, englishPostId, japanesePostId) {
  try {
    // 方法1: Polylang REST API (プラグインがREST APIをサポートしている場合)
    try {
      await axios.post(
        `${WP_SITE_URL}/wp-json/pll/v1/posts/${englishPostId}`,
        {
          lang: 'en',
          translations: {
            ja: parseInt(japanesePostId)
          }
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Translation link set via Polylang API');
      return;
    } catch (e) {
      // APIが利用できない場合は手動設定の案内
    }

    // 方法2: 投稿メタを直接設定
    try {
      // 英語投稿に言語を設定
      await axios.post(
        `${WP_SITE_URL}/wp-json/wp/v2/powerspot/${englishPostId}`,
        {
          meta: {
            _pll_lang: 'en'
          }
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (e) {
      // メタ設定が失敗した場合も続行
    }

    console.log('⚠️ Automatic translation linking not available.');
    console.log('');
    console.log('📝 Please manually link translations in WordPress:');
    console.log('   1. Go to WordPress admin');
    console.log(`   2. Edit the English post (ID: ${englishPostId})`);
    console.log('   3. In the "Languages" meta box, select "English"');
    console.log(`   4. In the "Translations" section, link to Japanese post (ID: ${japanesePostId})`);
    console.log('   5. Save the post');

  } catch (error) {
    console.log('⚠️ Could not set translation link automatically');
    console.log('   Please set it manually in WordPress admin');
  }
}

async function main() {
  try {
    console.log(`📖 Reading ${markdownFile}...\n`);

    const article = parseMarkdown(markdownFile);

    console.log(`Title: ${article.title}`);
    console.log(`Length: ${article.content.length} characters\n`);

    await postToWordPress(article, japanesePostId);

    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
