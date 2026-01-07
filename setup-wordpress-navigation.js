/**
 * WordPress ナビゲーションメニュー自動設定スクリプト
 *
 * 使い方:
 *   node setup-wordpress-navigation.js           # メニューを設定
 *   node setup-wordpress-navigation.js --dry-run # 実行内容を確認（変更なし）
 */

const axios = require('axios');
require('dotenv').config();

const WP_SITE_URL = process.env.WP_SITE_URL || 'https://k005.net';
const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');
const headers = { Authorization: 'Basic ' + auth };

const DRY_RUN = process.argv.includes('--dry-run');

// メニュー構造定義
const MENU_STRUCTURE = [
  {
    title: 'トップ',
    url: '/',
    children: []
  },
  {
    title: 'エリアから探す',
    url: '#',
    children: [
      { title: '北海道', url: '/powerspot_area/%e5%8c%97%e6%b5%b7%e9%81%93/' },
      { title: '東北', url: '/powerspot_area/%e6%9d%b1%e5%8c%97/' },
      { title: '関東', url: '/powerspot_area/kanto/' },
      { title: '中部', url: '/powerspot_area/%e4%b8%ad%e9%83%a8/' },
      { title: '近畿', url: '/powerspot_area/%e8%bf%91%e7%95%bf/' },
      { title: '中国', url: '/powerspot_area/%e4%b8%ad%e5%9b%bd/' },
      { title: '四国', url: '/powerspot_area/%e5%9b%9b%e5%9b%bd/' },
      { title: '九州', url: '/powerspot_area/%e4%b9%9d%e5%b7%9e/' },
      { title: '沖縄', url: '/powerspot_area/%e6%b2%96%e7%b8%84/' },
    ]
  },
  {
    title: 'ご利益から探す',
    url: '#',
    children: [
      { title: '縁結び・恋愛運', url: '/powerspot_benefit/love-marriage/' },
      { title: '厄除け・開運', url: '/powerspot_benefit/fortune/' },
      { title: '商売繁盛', url: '/powerspot_benefit/business/' },
      { title: '心願成就', url: '/powerspot_benefit/wish-fulfillment/' },
      { title: '家内安全', url: '/powerspot_benefit/family-safety/' },
      { title: '健康・病気平癒', url: '/powerspot_benefit/health/' },
      { title: '金運・仕事運', url: '/powerspot_benefit/money-career/' },
    ]
  },
  {
    title: 'タイプ別',
    url: '#',
    children: [
      { title: '神社', url: '/powerspot_type/shrine/' },
      { title: '寺院', url: '/powerspot_type/temple/' },
      { title: '山・自然', url: '/powerspot_type/nature/' },
      { title: '湖・海', url: '/powerspot_type/lake-sea/' },
    ]
  },
  {
    title: 'パワースポット一覧',
    url: '/powerspot/',
    children: []
  }
];

async function getExistingMenuItems(menuId) {
  const res = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/menu-items?menus=${menuId}&per_page=100`, { headers });
  return res.data;
}

async function deleteMenuItem(itemId) {
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] 削除: メニューアイテム ID:${itemId}`);
    return;
  }
  await axios.delete(`${WP_SITE_URL}/wp-json/wp/v2/menu-items/${itemId}?force=true`, { headers });
  console.log(`  削除: メニューアイテム ID:${itemId}`);
}

async function createMenuItem(menuId, title, url, parentId = 0, order = 0) {
  const data = {
    title: title,
    url: url.startsWith('/') ? WP_SITE_URL + url : url,
    status: 'publish',
    menus: menuId,
    parent: parentId,
    menu_order: order,
    type: 'custom'
  };

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] 追加: ${parentId ? '  └ ' : ''}${title} → ${data.url}`);
    return { id: 'dry-run-' + order };
  }

  const res = await axios.post(`${WP_SITE_URL}/wp-json/wp/v2/menu-items`, data, { headers });
  console.log(`  追加: ${parentId ? '  └ ' : ''}${title} → ${data.url} (ID:${res.data.id})`);
  return res.data;
}

async function setupMenu() {
  console.log('=== メニュー設定開始 ===\n');

  // 1. Get existing menu
  const menus = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/menus`, { headers });
  if (menus.data.length === 0) {
    console.log('メニューが存在しません。新規作成が必要です。');
    return;
  }

  const mainMenu = menus.data.find(m => m.slug === 'main-menu') || menus.data[0];
  console.log(`対象メニュー: ${mainMenu.name} (ID: ${mainMenu.id})\n`);

  // 2. Delete existing items
  console.log('--- 既存アイテムを削除 ---');
  const existingItems = await getExistingMenuItems(mainMenu.id);
  for (const item of existingItems) {
    await deleteMenuItem(item.id);
  }
  console.log(`  ${existingItems.length}件削除\n`);

  // 3. Create new menu structure
  console.log('--- 新しいメニューを作成 ---');
  let order = 1;

  for (const item of MENU_STRUCTURE) {
    const parentItem = await createMenuItem(mainMenu.id, item.title, item.url, 0, order);
    order++;

    for (const child of item.children) {
      await createMenuItem(mainMenu.id, child.title, child.url, parentItem.id, order);
      order++;
    }
  }

  console.log('\n✅ メニュー設定完了');
}

async function setupSearchWidget() {
  console.log('\n=== 検索ウィジェット設定 ===\n');

  // Check if search widget exists in header
  const sidebars = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/sidebars`, { headers });
  const headerSidebar = sidebars.data.find(s => s.id === 'header-widget');

  if (!headerSidebar) {
    console.log('ヘッダーウィジェットエリアが見つかりません');
    return;
  }

  // Check existing widgets
  const widgets = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/widgets`, { headers });
  const headerWidgets = widgets.data.filter(w => w.sidebar === 'header-widget');
  const hasSearch = headerWidgets.some(w => w.id_base === 'search');

  if (hasSearch) {
    console.log('検索ウィジェットは既に設定されています');
    return;
  }

  if (DRY_RUN) {
    console.log('[DRY-RUN] 検索ウィジェットをヘッダーに追加');
    return;
  }

  // Add search widget
  try {
    const searchWidget = await axios.post(`${WP_SITE_URL}/wp-json/wp/v2/widgets`, {
      id_base: 'search',
      sidebar: 'header-widget',
      instance: {
        raw: {
          title: ''
        }
      }
    }, { headers });
    console.log('✅ 検索ウィジェットを追加しました (ID: ' + searchWidget.data.id + ')');
  } catch (e) {
    console.log('検索ウィジェット追加エラー:', e.response?.data?.message || e.message);
    console.log('→ WordPress管理画面から手動で追加してください');
  }
}

async function checkTOCPlugin() {
  console.log('\n=== TOCプラグイン確認 ===\n');

  try {
    const plugins = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/plugins`, { headers });
    const tocPlugin = plugins.data.find(p =>
      p.plugin.includes('easy-table-of-contents') ||
      p.plugin.includes('table-of-contents')
    );

    if (tocPlugin) {
      console.log('TOCプラグイン検出: ' + tocPlugin.name);
      console.log('ステータス: ' + tocPlugin.status);
    } else {
      console.log('TOCプラグインは未インストールです');
      console.log('→ WordPress管理画面から「Easy Table of Contents」をインストールしてください');
    }
  } catch (e) {
    console.log('プラグイン一覧取得エラー:', e.response?.data?.message || e.message);
  }
}

async function main() {
  console.log('WordPress ナビゲーション設定スクリプト');
  console.log('=====================================');
  console.log(`モード: ${DRY_RUN ? 'DRY-RUN（変更なし）' : '実行'}`);
  console.log(`対象: ${WP_SITE_URL}\n`);

  try {
    await setupMenu();
    await setupSearchWidget();
    await checkTOCPlugin();

    console.log('\n=====================================');
    console.log('設定完了');
    if (DRY_RUN) {
      console.log('\n実際に適用するには: node setup-wordpress-navigation.js');
    }
  } catch (e) {
    console.error('エラー:', e.response?.data || e.message);
  }
}

main();
