#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// データベース読み込み
function loadDatabase() {
  const dbFile = path.join(__dirname, '04_powerspot_database.json');
  const data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));

  // キーインデックスでアクセス
  return data.map(spot => {
    const keys = Object.keys(spot);
    return {
      region: spot[keys[0]],
      name: spot[keys[1]],
      baseEnergy: spot[keys[2]],
      elements: spot[keys[3]]
    };
  });
}

// エネルギー値でソート
function sortByEnergy(powerspots) {
  return powerspots.sort((a, b) => b.baseEnergy - a.baseEnergy);
}

// 記事生成プロンプトを作成
function createArticlePrompt(powerspot) {
  return `instructions/ARTICLE_GENERATION_MASTER.md の指示に完全に従って、パワースポット記事を作成してください。

【基本情報】
- スポット名: ${powerspot.name}
- 所在地: ${powerspot.region}
- ベースエネルギー: ${powerspot.baseEnergy}

必ず以下を守ってください：
- 文字数: 4,500-5,000字
- 五行理論には一切触れない
- すべての必須セクションを含める
- 具体的な数字・時刻を豊富に
- タイトル形式: ${powerspot.name} | ${powerspot.region}のパワースポット完全ガイド【アクセス・ご利益・周辺情報】

【記事構成】
1. タイトル
2. 導入部（300-400字）
3. このスポットの魅力（800-1,000字）
4. ご利益・期待できる効果（500-700字）
5. ベストな訪問時期（600-800字）
6. 参拝・見学ガイド（700-900字）
7. スポットの基本情報（300-400字）
8. 周辺情報（800-1,000字）
9. 訪問者の口コミ・体験談（300-400字）
10. よくある質問（200-300字）
11. まとめ（400-500字）

最後に以下の診断誘導文を追加：
---
💡 **あなたに最適なパワースポットを知りたい方へ**

このスポット以外にも、日本全国には様々なパワースポットがあります。
あなた自身に最も合うパワースポットを知りたい方は、無料の相性診断をお試しください（3分で完了）。

→ [無料で縁プロファイル診断を受ける](${process.env.EN_SHINDAN_URL || 'https://your-app-url.com'})
`;
}

// メイン処理
async function main() {
  console.log('🔄 パワースポットデータベース読み込み中...');
  const powerspots = loadDatabase();
  console.log(`✅ ${powerspots.length}件のパワースポットを読み込みました`);

  // エネルギー値でソート
  const sorted = sortByEnergy(powerspots);

  console.log('\n📊 トップ10（エネルギー値順）:');
  sorted.slice(0, 10).forEach((spot, i) => {
    console.log(`${i + 1}. ${spot.name}（${spot.region}）- エネルギー: ${spot.baseEnergy}`);
  });

  // コマンドライン引数で件数を指定
  const count = parseInt(process.argv[2]) || 1;
  const startIndex = parseInt(process.argv[3]) || 0;

  console.log(`\n📝 ${startIndex + 1}番目から${count}件の記事を生成します...`);

  const articlesDir = path.join(__dirname, 'articles');
  if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir);
  }

  for (let i = startIndex; i < Math.min(startIndex + count, sorted.length); i++) {
    const powerspot = sorted[i];
    console.log(`\n--- ${i + 1}/${sorted.length}: ${powerspot.name} ---`);

    // 記事ファイル名を生成（既に存在する場合はスキップ）
    const filename = `${powerspot.name.replace(/[\/\\:*?"<>|]/g, '_')}.md`;
    const filepath = path.join(articlesDir, filename);

    if (fs.existsSync(filepath)) {
      console.log(`⏭️  既に存在するためスキップ: ${filename}`);
      continue;
    }

    console.log(`🤔 記事生成プロンプトを表示します:`);
    const prompt = createArticlePrompt(powerspot);
    console.log('---');
    console.log(prompt);
    console.log('---');
    console.log('\n⚠️  このスクリプトは記事を自動生成しません。');
    console.log('👉 上記のプロンプトをClaude Codeに貼り付けて記事を生成してください。');
    console.log(`💾 生成された記事は ${filename} として保存してください。\n`);

    // 最初の1件のみプロンプトを表示
    if (i === startIndex) {
      break;
    }
  }

  console.log('\n✅ 処理完了');
}

main().catch(console.error);
