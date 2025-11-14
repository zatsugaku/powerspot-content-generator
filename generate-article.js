#!/usr/bin/env node
// パワースポット記事自動生成スクリプト
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

// 環境変数の読み込み
const WP_SITE_URL = process.env.WP_SITE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const EN_SHINDAN_URL = process.env.EN_SHINDAN_URL;

// Claude APIクライアント
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// コマンドライン引数からパワースポット名を取得
const powerspotName = process.argv[2];

if (!powerspotName) {
  console.error('❌ パワースポット名を指定してください');
  console.log('使用例: node generate-article.js "伊勢神宮"');
  process.exit(1);
}

console.log(`🌸 ${powerspotName} の記事を生成しています...\n`);

async function generateArticle(spotName) {
  const prompt = `あなたは日本のパワースポット専門ライターです。以下のパワースポットについて、SEO最適化された詳細な紹介記事を日本語で作成してください。

パワースポット名: ${spotName}

以下の構成で2000文字以上の記事を作成してください：

# ${spotName}のパワースポット完全ガイド

## 基本情報
- 正式名称
- 所在地（都道府県・市町村）
- 創建年・歴史
- 祭神・本尊

## パワースポットとしての特徴
- エネルギーの種類（浄化、活性化、癒しなど）
- スピリチュアルな意味
- パワースポットとして知られる理由

## ご利益
- 主なご利益（金運、恋愛運、健康運、仕事運、学業など）
- 具体的な効果
- 訪れた人の体験談（一般的な内容）

## 見どころ
- 境内・敷地内の主要スポット
- 特に強いパワーを感じる場所
- 見逃せないポイント

## アクセス方法
- 最寄り駅・バス停
- 車でのアクセス
- 所要時間の目安

## 訪問のベストタイミング
- おすすめの時期・時間帯
- 混雑を避けるコツ

## まとめ
記事の総括と、以下のCTAを必ず含める：
「全国には様々なパワースポットがありますが、あなたに最も合ったパワースポットを見つけることが大切です。五行思想に基づく【縁診断】で、あなたの特性に合ったパワースポットを見つけてみませんか？」

---

重要な要件：
1. 事実に基づいた正確な情報を提供
2. SEOキーワード: ${spotName}、パワースポット、ご利益、アクセス
3. 読みやすい文章（見出し、箇条書きを活用）
4. ポジティブで魅力的な表現
5. 2000文字以上

JSON形式で以下のフォーマットで返してください：
{
  "title": "SEO最適化されたタイトル（50文字以内）",
  "meta_description": "メタディスクリプション（120文字以内）",
  "content": "本文（HTML形式、見出しは<h2>、<h3>を使用）",
  "excerpt": "記事の要約（200文字以内）",
  "tags": ["タグ1", "タグ2", "タグ3"]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;

    // JSON部分を抽出（```json ... ``` の場合に対応）
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const article = JSON.parse(jsonText);

    console.log('✅ 記事生成完了\n');
    console.log(`タイトル: ${article.title}`);
    console.log(`文字数: ${article.content.replace(/<[^>]*>/g, '').length}文字\n`);

    return article;
  } catch (error) {
    console.error('❌ 記事生成エラー:', error.message);
    throw error;
  }
}

async function postToWordPress(article) {
  const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  const postData = {
    title: article.title,
    content: article.content + `\n\n<p><a href="${EN_SHINDAN_URL}" target="_blank" rel="noopener">→ あなたに合ったパワースポットを縁診断で見つける</a></p>`,
    excerpt: article.excerpt,
    status: 'draft' // 最初は下書きとして保存
    // タグは文字列配列ではなくID配列が必要なため、後で手動設定
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
    console.log(`ステータス: ${response.data.status} (下書き)`);
    console.log(`プレビューURL: ${response.data.link}`);
    console.log(`\n💡 WordPressの管理画面で確認・公開してください`);

    return response.data;
  } catch (error) {
    console.error('❌ WordPress投稿エラー:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  try {
    // 記事生成
    const article = await generateArticle(powerspotName);

    // WordPressに投稿
    const post = await postToWordPress(article);

    console.log('\n🎉 完了しました！');
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

main();
