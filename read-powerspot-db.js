const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '04_powerspot_database.json');

// ファイルを読み込む
const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

// キー名を取得（インデックスでアクセス）
const keys = Object.keys(data[0]);
console.log('キーインデックス:');
keys.forEach((key, i) => {
  console.log(`  [${i}]: ${key}`);
});

// データにアクセスする関数（インデックスベース）
function getSpotData(spot) {
  const keys = Object.keys(spot);
  return {
    region: spot[keys[0]],  // 地域
    name: spot[keys[1]],     // パワースポット名
    baseEnergy: spot[keys[2]], // ベースエネルギー
    elements: spot[keys[3]]  // 五行属性
  };
}

// 最初の10件を表示
console.log('\n最初の10件のパワースポット:');
data.slice(0, 10).forEach((spot, i) => {
  const {region, name, baseEnergy} = getSpotData(spot);
  console.log(`${i + 1}. ${region} - ${name} (エネルギー: ${baseEnergy})`);
});

// 地域別にグループ化
const byRegion = {};
data.forEach(spot => {
  const {region, name} = getSpotData(spot);
  if (!byRegion[region]) {
    byRegion[region] = [];
  }
  byRegion[region].push(name);
});

console.log('\n地域別の件数:');
Object.entries(byRegion)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 15)
  .forEach(([region, spots]) => {
    console.log(`  ${region}: ${spots.length}件`);
  });

console.log(`\n✅ 総パワースポット数: ${data.length}`);

// データを使いやすい形式で保存
const cleanData = data.map(spot => {
  const {region, name, baseEnergy, elements} = getSpotData(spot);
  return {
    region,
    name,
    baseEnergy,
    elements
  };
});

const outputFile = path.join(__dirname, 'powerspot_database_clean.json');
fs.writeFileSync(outputFile, JSON.stringify(cleanData, null, 2), 'utf-8');
console.log(`\n✅ クリーンデータ保存: ${outputFile}`);
