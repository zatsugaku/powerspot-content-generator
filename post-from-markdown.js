#!/usr/bin/env node
// Markdownファイルを読み込んでWordPressに投稿

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
  console.log('使用例: node post-from-markdown.js articles/ise-jingu.md');
  process.exit(1);
}

// Markdownファイルを読み込む
function parseMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Front matter（メタデータ）を抽出
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontMatterMatch) {
    console.error('❌ Front matterが見つかりません。以下の形式で記述してください:');
    console.log('---');
    console.log('title: 記事タイトル');
    console.log('excerpt: 記事の要約');
    console.log('---');
    console.log('\n本文...');
    process.exit(1);
  }

  const frontMatter = frontMatterMatch[1];
  const body = frontMatterMatch[2];

  // Front matterをパース
  const meta = {};
  frontMatter.split('\n').forEach(line => {
    const match = line.match(/^(.+?):\s*(.+)$/);
    if (match) {
      meta[match[1].trim()] = match[2].trim();
    }
  });

  return {
    title: meta.title || 'タイトルなし',
    excerpt: meta.excerpt || '',
    content: body.trim()
  };
}

// MarkdownをHTMLに変換（簡易版）
function markdownToHtml(markdown) {
  let html = markdown;

  // 見出し
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 太字
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // リスト
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // 段落
  html = html.replace(/\n\n/g, '</p>\n<p>');
  html = '<p>' + html + '</p>';

  // 空の<p>タグを削除
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

async function postToWordPress(article) {
  const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  const htmlContent = markdownToHtml(article.content);

  const postData = {
    title: article.title,
    content: htmlContent + `\n\n<p><a href="${EN_SHINDAN_URL}" target="_blank" rel="noopener">→ あなたに合ったパワースポットを縁診断で見つける</a></p>`,
    excerpt: article.excerpt,
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
