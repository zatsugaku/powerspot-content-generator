#!/usr/bin/env node
// 記事に画像を自動挿入するスクリプト

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const markdownFile = process.argv[2];
const imageMode = process.argv[3] || 'placeholder'; // placeholder | urls | upload

if (!markdownFile) {
  console.error('❌ Markdownファイルを指定してください');
  console.log('使用例: node add-images-to-article.js articles/伊勢神宮.md [mode]');
  console.log('\nモード:');
  console.log('  placeholder - プレースホルダー画像を挿入（デフォルト）');
  console.log('  urls        - 画像URLリストから挿入');
  console.log('  upload      - WordPress メディアライブラリにアップロード');
  process.exit(1);
}

// 画像挿入位置の候補
const imageSections = [
  { section: '## このスポットの魅力', count: 2, keywords: ['境内', '建築', '自然'] },
  { section: '## ベストな訪問時期', count: 1, keywords: ['季節', '景観'] },
  { section: '## 参拝・見学ガイド', count: 1, keywords: ['参拝', '作法'] },
  { section: '## 周辺情報', count: 2, keywords: ['グルメ', 'お土産', '観光'] }
];

// プレースホルダー画像サービス
const placeholderServices = {
  unsplash: (width, height, keywords) =>
    `https://source.unsplash.com/${width}x${height}/?${keywords}`,
  picsum: (width, height) =>
    `https://picsum.photos/${width}/${height}`,
  placeholder: (width, height, text) =>
    `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(text)}`
};

function parseMarkdown(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function extractTitle(markdown) {
  const match = markdown.match(/^# (.+)$/m);
  return match ? match[1].split('|')[0].trim() : 'パワースポット';
}

function insertPlaceholderImages(markdown, spotName) {
  let result = markdown;

  imageSections.forEach(({ section, count, keywords }) => {
    // セクションを見つける
    const sectionIndex = result.indexOf(section);
    if (sectionIndex === -1) return;

    // セクションの終わりを見つける（次の##まで、またはファイル末尾）
    const nextSectionIndex = result.indexOf('\n##', sectionIndex + section.length);
    const sectionEnd = nextSectionIndex === -1 ? result.length : nextSectionIndex;

    const sectionContent = result.substring(sectionIndex, sectionEnd);

    // セクション内の段落を分割（### 見出しの後に挿入）
    const h3Index = sectionContent.indexOf('\n###');

    if (h3Index !== -1) {
      // ### 見出しが見つかった場合、その後の最初の段落の後に挿入
      const afterH3 = sectionContent.substring(h3Index);
      const nextParagraphEnd = afterH3.indexOf('\n\n', 10);

      if (nextParagraphEnd !== -1) {
        const insertPosition = sectionIndex + h3Index + nextParagraphEnd;

        // 画像を挿入
        let imagesToInsert = '';
        for (let i = 0; i < count && i < keywords.length; i++) {
          const keyword = keywords[i];
          const imageUrl = placeholderServices.unsplash(800, 600, `${spotName},${keyword},shrine,temple,japan`);
          imagesToInsert += `\n\n![${spotName}の${keyword}](${imageUrl})\n*${spotName}の${keyword}*`;
        }

        result = result.slice(0, insertPosition) + imagesToInsert + result.slice(insertPosition);
      }
    } else {
      // ### 見出しがない場合、セクション見出しの後の最初の段落の後に挿入
      const firstParagraphEnd = sectionContent.indexOf('\n\n', section.length + 10);

      if (firstParagraphEnd !== -1) {
        const insertPosition = sectionIndex + firstParagraphEnd;

        let imagesToInsert = '';
        for (let i = 0; i < count && i < keywords.length; i++) {
          const keyword = keywords[i];
          const imageUrl = placeholderServices.unsplash(800, 600, `${spotName},${keyword},shrine,temple,japan`);
          imagesToInsert += `\n\n![${spotName}の${keyword}](${imageUrl})\n*${spotName}の${keyword}*`;
        }

        result = result.slice(0, insertPosition) + imagesToInsert + result.slice(insertPosition);
      }
    }
  });

  return result;
}

function insertImageUrls(markdown, imageUrls) {
  // ユーザーが提供した画像URLリストから挿入
  let result = markdown;
  let urlIndex = 0;

  imageSections.forEach(({ section, count }) => {
    const sectionRegex = new RegExp(`(${section}[\\s\\S]*?)(?=##|$)`, 'i');
    const match = result.match(sectionRegex);

    if (match && urlIndex < imageUrls.length) {
      const sectionContent = match[1];
      const paragraphs = sectionContent.split('\n\n');

      if (paragraphs.length >= 2) {
        for (let i = 0; i < count && urlIndex < imageUrls.length; i++) {
          const imageUrl = imageUrls[urlIndex];
          const imageMarkdown = `\n\n![画像${urlIndex + 1}](${imageUrl})\n\n`;

          const insertPosition = paragraphs[0].length + section.length;
          result = result.slice(0, result.indexOf(sectionContent) + insertPosition) +
                   imageMarkdown +
                   result.slice(result.indexOf(sectionContent) + insertPosition);

          urlIndex++;
        }
      }
    }
  });

  return result;
}

function generateImageUrlsTemplate(spotName) {
  // 画像URLテンプレートファイルを生成
  const templatePath = markdownFile.replace('.md', '-images.json');
  const template = {
    spotName: spotName,
    images: [
      {
        section: "メイン画像（アイキャッチ）",
        url: "https://example.com/images/main.jpg",
        alt: `${spotName}の全景`,
        caption: `${spotName}の美しい景観`
      },
      {
        section: "このスポットの魅力",
        url: "https://example.com/images/attraction1.jpg",
        alt: `${spotName}の境内`,
        caption: "荘厳な雰囲気が漂う境内"
      },
      {
        section: "このスポットの魅力",
        url: "https://example.com/images/attraction2.jpg",
        alt: `${spotName}の建築`,
        caption: "伝統的な建築様式"
      },
      {
        section: "ベストな訪問時期",
        url: "https://example.com/images/season.jpg",
        alt: `${spotName}の四季`,
        caption: "季節ごとに異なる表情を見せる"
      },
      {
        section: "参拝・見学ガイド",
        url: "https://example.com/images/guide.jpg",
        alt: `${spotName}の参拝風景`,
        caption: "正しい参拝作法"
      },
      {
        section: "周辺情報",
        url: "https://example.com/images/gourmet.jpg",
        alt: `${spotName}周辺のグルメ`,
        caption: "地元で人気のグルメスポット"
      }
    ],
    instructions: "上記のURLを実際の画像URLに置き換えてから、以下のコマンドを実行してください：\nnode add-images-to-article.js " + markdownFile + " urls"
  };

  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2), 'utf-8');
  console.log(`\n📝 画像URLテンプレートを生成しました: ${templatePath}`);
  console.log(`\n次のステップ:`);
  console.log(`1. ${templatePath} を開く`);
  console.log(`2. 各画像のURLを実際の画像URLに置き換える`);
  console.log(`3. 以下のコマンドを実行:`);
  console.log(`   node add-images-to-article.js ${markdownFile} urls\n`);
}

async function main() {
  console.log(`\n📖 ${markdownFile} を読み込んでいます...\n`);

  const markdown = parseMarkdown(markdownFile);
  const spotName = extractTitle(markdown);

  console.log(`スポット名: ${spotName}`);
  console.log(`モード: ${imageMode}\n`);

  if (imageMode === 'placeholder') {
    // プレースホルダー画像を挿入
    console.log('🖼️  プレースホルダー画像を挿入中...');
    const updatedMarkdown = insertPlaceholderImages(markdown, spotName);

    const outputFile = markdownFile.replace('.md', '-with-images.md');
    fs.writeFileSync(outputFile, updatedMarkdown, 'utf-8');

    console.log(`\n✅ 画像付き記事を生成しました: ${outputFile}`);
    console.log(`\n⚠️  注意: プレースホルダー画像はUnsplashからランダムに取得されます。`);
    console.log(`   実際の画像に置き換えることを推奨します。`);
    console.log(`\n💡 画像URLテンプレートを生成する場合:`);
    console.log(`   node add-images-to-article.js ${markdownFile} template\n`);

  } else if (imageMode === 'template') {
    // 画像URLテンプレートを生成
    generateImageUrlsTemplate(spotName);

  } else if (imageMode === 'urls') {
    // 画像URLファイルから読み込んで挿入
    const imageUrlFile = markdownFile.replace('.md', '-images.json');

    if (!fs.existsSync(imageUrlFile)) {
      console.error(`❌ 画像URLファイルが見つかりません: ${imageUrlFile}`);
      console.log(`\n💡 まず画像URLテンプレートを生成してください:`);
      console.log(`   node add-images-to-article.js ${markdownFile} template\n`);
      process.exit(1);
    }

    const imageData = JSON.parse(fs.readFileSync(imageUrlFile, 'utf-8'));
    const imageUrls = imageData.images.map(img => img.url);

    console.log('🖼️  画像URLから挿入中...');
    const updatedMarkdown = insertImageUrls(markdown, imageUrls);

    const outputFile = markdownFile.replace('.md', '-with-images.md');
    fs.writeFileSync(outputFile, updatedMarkdown, 'utf-8');

    console.log(`\n✅ 画像付き記事を生成しました: ${outputFile}`);
    console.log(`   画像数: ${imageUrls.length}枚\n`);

  } else if (imageMode === 'upload') {
    console.log('🚧 WordPress メディアライブラリへのアップロード機能は未実装です。');
    console.log('💡 現在は以下のいずれかをご利用ください:');
    console.log('   - placeholder: プレースホルダー画像');
    console.log('   - template: 画像URLテンプレート生成');
    console.log('   - urls: 画像URLファイルから挿入\n');

  } else {
    console.error(`❌ 不明なモード: ${imageMode}`);
    console.log('利用可能なモード: placeholder, template, urls, upload\n');
    process.exit(1);
  }
}

main().catch(console.error);
