#!/usr/bin/env node
// Markdownファイルを読み込んで、デザインを整えたHTMLでWordPressに投稿

require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const EN_SHINDAN_URL = process.env.EN_SHINDAN_URL;

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

  // 画像（Markdown形式をHTMLに変換）
  html = html.replace(/!\[(.*?)\]\((.*?)\)\n\*(.*?)\*/g, (match, alt, url, caption) => {
    return `<figure style="margin: 30px 0; text-align: center;">
      <img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
      <figcaption style="margin-top: 10px; font-size: 14px; color: #666; font-style: italic;">${caption}</figcaption>
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

async function postToWordPress(article) {
  const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  const htmlContent = markdownToHtml(article.content);

  const postData = {
    title: article.title,
    content: htmlContent,
    excerpt: article.excerpt || '',
    status: 'draft'
  };

  try {
    console.log('📤 WordPressに投稿中...\n');

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

    console.log('✅ 投稿成功！\n');
    console.log(`投稿ID: ${response.data.id}`);
    console.log(`タイトル: ${response.data.title.rendered}`);
    console.log(`ステータス: ${response.data.status} (下書き)`);
    console.log(`プレビューURL: ${response.data.link}`);
    console.log(`\n💡 WordPress管理画面で確認・公開してください`);

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

    await postToWordPress(article);

    console.log('\n🎉 完了しました！');
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

main();
