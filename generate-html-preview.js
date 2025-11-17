#!/usr/bin/env node
// Markdownファイルからスタイル付きHTMLプレビューを生成

require('dotenv').config();
const fs = require('fs');

const markdownFile = process.argv[2];

if (!markdownFile) {
  console.error('❌ Markdownファイルを指定してください');
  console.log('使用例: node generate-html-preview.js articles/izumo-taisha.md');
  process.exit(1);
}

// Markdownファイルを読み込む
function parseMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'タイトルなし';
  const body = content.replace(/^# .+$/m, '').trim();

  return { title, content: body };
}

// インラインCSSスタイル
const styles = {
  section: 'background: #f9f9f9; border-left: 4px solid #4a90e2; padding: 20px; margin: 30px 0; border-radius: 8px;',
  infoBox: 'background: #fff; border: 2px solid #e0e0e0; padding: 20px; margin: 20px 0; border-radius: 8px;',
  reviewBox: 'background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px; font-style: italic;',
  ctaBox: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; margin: 40px 0; border-radius: 12px; text-align: center;',
  ctaButton: 'display: inline-block; background: white; color: #667eea; padding: 15px 40px; margin: 20px 0; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);'
};

// Markdownをスタイル付きHTMLに変換
function markdownToHtml(markdown) {
  let sections = markdown.split(/(?=^## )/gm);
  let html = '';

  sections.forEach((section) => {
    if (!section.trim()) return;

    const titleMatch = section.match(/^## (.+)$/m);
    const sectionTitle = titleMatch ? titleMatch[1] : '';
    const sectionContent = section.replace(/^## .+$/m, '').trim();

    let sectionStyle = styles.section;
    let sectionClass = 'powerspot-section';

    if (sectionTitle.includes('基本情報') || sectionTitle.includes('アクセス')) {
      sectionStyle = styles.infoBox;
      sectionClass = 'info-section';
    } else if (sectionTitle.includes('口コミ') || sectionTitle.includes('体験談')) {
      sectionClass = 'review-section';
    }

    html += `<div class="${sectionClass}" style="${sectionStyle}">`;

    if (sectionTitle) {
      html += `<h2 style="color: #333; border-bottom: 2px solid #4a90e2; padding-bottom: 10px; margin-bottom: 20px;">${sectionTitle}</h2>`;
    }

    html += convertContent(sectionContent, sectionTitle);
    html += '</div>';
  });

  // 記事下部にCTAを追加
  html += addFooterCTA();

  return html;
}

function convertContent(content, sectionTitle) {
  let html = content;

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

  html = html.replace(/^#### (.+)$/gm, '<h4 style="color: #666; margin-top: 15px; margin-bottom: 8px;">$1</h4>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #d32f2f;">$1</strong>');
  html = html.replace(/^- (.+)$/gm, '<li style="margin: 8px 0; line-height: 1.8;">$1</li>');
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, '<ul style="padding-left: 25px; margin: 15px 0;">$&</ul>');

  if (sectionTitle && (sectionTitle.includes('口コミ') || sectionTitle.includes('体験談'))) {
    html = html.replace(/\*\*「(.+?)」\*\*（(.+?)）/g, (match, quote, author) => {
      return `<div style="${styles.reviewBox}">
        <p style="font-size: 16px; color: #333; margin-bottom: 10px;">"${quote}"</p>
        <p style="text-align: right; color: #666; font-size: 14px;">— ${author}</p>
      </div>`;
    });
  }

  if (sectionTitle && sectionTitle.includes('よくある質問')) {
    html = html.replace(/\*\*Q: (.+?)\*\*/g, '<p style="font-weight: bold; color: #4a90e2; margin-top: 20px; margin-bottom: 5px;">❓ Q: $1</p>');
    html = html.replace(/A: (.+?)(?=\n|$)/g, '<p style="margin-left: 20px; color: #555; line-height: 1.8;">💡 A: $1</p>');
  }

  html = html.replace(/おすすめ度:\s*(★+)/g, '<span style="color: #ffa726; font-size: 18px;">おすすめ度: $1</span>');

  html = html.replace(/\n\n/g, '</p>\n<p style="line-height: 1.8; margin: 15px 0;">');
  html = '<p style="line-height: 1.8; margin: 15px 0;">' + html + '</p>';

  html = html.replace(/<p[^>]*>\s*<\/p>/g, '');
  html = html.replace(/<p[^>]*>\s*<ul/g, '<ul');
  html = html.replace(/<\/ul>\s*<\/p>/g, '</ul>');
  html = html.replace(/<p[^>]*>\s*<h[234]/g, '<h');
  html = html.replace(/<\/h[234]>\s*<\/p>/g, '</h>');

  return html;
}

// 記事下部に控えめなCTAを追加
function addFooterCTA() {
  const diagnosisUrl = process.env.EN_SHINDAN_URL || '#';
  return `
  <!-- 控えめな診断リンク -->
  <div style="text-align: center; padding: 30px; background: #f9f9f9; margin: 40px 0; border-radius: 8px; border: 1px solid #e0e0e0;">
    <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.8;">
      💡 あなたに最適なパワースポットを知りたい方は
      <a href="${diagnosisUrl}" target="_blank" rel="noopener" style="color: #4a90e2; font-weight: bold; text-decoration: none; border-bottom: 1px solid #4a90e2;">無料の相性診断</a>をお試しください（3分で完了）
    </p>
  </div>

  <!-- 関連記事プレースホルダー -->
  <div style="${styles.section}">
    <h2 style="color: #333; border-bottom: 2px solid #4a90e2; padding-bottom: 10px; margin-bottom: 20px;">
      📚 この記事を読んだ方におすすめ
    </h2>
    <p style="color: #666; font-size: 14px; font-style: italic;">
      ※ ここに関連記事が表示されます（WordPress管理画面で設定）
    </p>
  </div>`;
}

function main() {
  try {
    console.log(`📖 ${markdownFile} を読み込んでいます...\n`);

    const article = parseMarkdown(markdownFile);
    const htmlContent = markdownToHtml(article.content);

    const fullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #fff;
      color: #333;
      line-height: 1.8;
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #4a90e2;
      padding-bottom: 15px;
      margin-bottom: 30px;
      font-size: 32px;
    }
    a {
      color: #4a90e2;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  ${htmlContent}
</body>
</html>`;

    const outputFile = markdownFile.replace('.md', '-preview.html');
    fs.writeFileSync(outputFile, fullHtml);

    console.log(`✅ HTMLプレビューを生成しました！\n`);
    console.log(`ファイル: ${outputFile}`);
    console.log(`\nブラウザで開いて確認してください。`);
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

main();
