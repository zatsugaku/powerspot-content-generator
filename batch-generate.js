#!/usr/bin/env node
// 複数のパワースポット記事を一括生成

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// 生成したいパワースポットのリスト
const powerspots = [
  "出雲大社",
  "厳島神社",
  "富士山",
  "熊野古道",
  "高千穂峡",
  "屋久島",
  "戸隠神社",
  "明治神宮",
  "金刀比羅宮",
  "太宰府天満宮"
];

async function generateArticles() {
  console.log(`🌸 ${powerspots.length}件のパワースポット記事を生成します\n`);

  for (let i = 0; i < powerspots.length; i++) {
    const spot = powerspots[i];
    console.log(`\n[${i + 1}/${powerspots.length}] ${spot} の記事を生成中...`);

    try {
      const { stdout, stderr } = await execPromise(`node generate-article.js "${spot}"`);
      console.log(stdout);
      if (stderr) console.error(stderr);

      // API制限を避けるため、少し待機（Anthropic APIの制限対策）
      if (i < powerspots.length - 1) {
        console.log('⏳ 5秒待機中...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`❌ ${spot} の生成に失敗:`, error.message);
      // エラーが出ても続行
      continue;
    }
  }

  console.log('\n\n🎉 すべての記事生成が完了しました！');
  console.log(`合計: ${powerspots.length}記事`);
  console.log('WordPress管理画面で確認してください: https://k005.net/wp-admin/');
}

generateArticles();
