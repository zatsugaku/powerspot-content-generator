/**
 * パワースポット フィルターUI
 *
 * WordPress REST APIを使用したAJAXフィルタリング
 * 依存: なし（バニラJavaScript）
 */

(function() {
  'use strict';

  // 設定
  const CONFIG = {
    restBase: '/wp-json/wp/v2',
    postsPerPage: 12,
    taxonomies: {
      area: 'powerspot_area',
      benefit: 'powerspot_benefit',
      type: 'powerspot_type'
    }
  };

  // 状態管理
  let state = {
    filters: {
      area: '',
      benefit: '',
      type: ''
    },
    page: 1,
    loading: false,
    totalPages: 1,
    taxonomyData: {
      areas: [],
      benefits: [],
      types: []
    }
  };

  // DOM要素
  let elements = {};

  /**
   * 初期化
   */
  async function init() {
    // フィルターUIを挿入する場所を探す
    const container = document.querySelector('.ast-archive-description') ||
                      document.querySelector('#primary') ||
                      document.querySelector('main');

    if (!container) {
      console.warn('PowerspotFilter: コンテナが見つかりません');
      return;
    }

    // URLパラメータから初期値を取得
    const params = new URLSearchParams(window.location.search);
    state.filters.area = params.get('area') || '';
    state.filters.benefit = params.get('benefit') || '';
    state.filters.type = params.get('type') || '';
    state.page = parseInt(params.get('page')) || 1;

    // タクソノミーデータを取得
    await loadTaxonomies();

    // フィルターUIを作成
    createFilterUI(container);

    // 初期フィルターが設定されている場合は検索実行
    if (state.filters.area || state.filters.benefit || state.filters.type) {
      await filterPosts();
    }
  }

  /**
   * タクソノミーデータを読み込み
   */
  async function loadTaxonomies() {
    try {
      const [areas, benefits, types] = await Promise.all([
        fetch(`${CONFIG.restBase}/${CONFIG.taxonomies.area}?per_page=50&hide_empty=true`).then(r => r.json()),
        fetch(`${CONFIG.restBase}/${CONFIG.taxonomies.benefit}?per_page=50&hide_empty=true`).then(r => r.json()),
        fetch(`${CONFIG.restBase}/${CONFIG.taxonomies.type}?per_page=50&hide_empty=true`).then(r => r.json())
      ]);

      // 日本語版のみフィルタリング（-enを除外）
      state.taxonomyData.areas = areas.filter(t => !t.slug.includes('-en'));
      state.taxonomyData.benefits = benefits.filter(t => !t.slug.includes('-en') && !t.slug.includes('-ja'));
      state.taxonomyData.types = types.filter(t => !t.slug.includes('-en') && !t.slug.includes('-ja'));

    } catch (error) {
      console.error('タクソノミー読み込みエラー:', error);
    }
  }

  /**
   * フィルターUIを作成
   */
  function createFilterUI(container) {
    // フィルターHTML（ARIA属性追加でアクセシビリティ向上）
    const filterHTML = `
      <div class="powerspot-filter" id="powerspot-filter" role="search" aria-label="パワースポット検索フィルター">
        <div class="filter-header">
          <h3 class="filter-title" id="filter-title">パワースポットを絞り込む</h3>
        </div>
        <div class="filter-controls" role="group" aria-labelledby="filter-title">
          <div class="filter-group">
            <label for="filter-area" id="label-area">エリア</label>
            <select id="filter-area" class="filter-select" aria-labelledby="label-area" aria-describedby="filter-status">
              <option value="">すべてのエリア</option>
              ${state.taxonomyData.areas.map(a =>
                `<option value="${a.id}" ${state.filters.area == a.id ? 'selected' : ''}>${a.name} (${a.count})</option>`
              ).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label for="filter-benefit" id="label-benefit">ご利益</label>
            <select id="filter-benefit" class="filter-select" aria-labelledby="label-benefit" aria-describedby="filter-status">
              <option value="">すべてのご利益</option>
              ${state.taxonomyData.benefits.map(b =>
                `<option value="${b.id}" ${state.filters.benefit == b.id ? 'selected' : ''}>${b.name} (${b.count})</option>`
              ).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label for="filter-type" id="label-type">タイプ</label>
            <select id="filter-type" class="filter-select" aria-labelledby="label-type" aria-describedby="filter-status">
              <option value="">すべてのタイプ</option>
              ${state.taxonomyData.types.map(t =>
                `<option value="${t.id}" ${state.filters.type == t.id ? 'selected' : ''}>${t.name} (${t.count})</option>`
              ).join('')}
            </select>
          </div>

          <div class="filter-actions">
            <button type="button" id="filter-search" class="filter-button filter-button-primary" aria-label="選択した条件で絞り込む">
              <span class="filter-button-icon" aria-hidden="true">🔍</span>
              絞り込む
            </button>
            <button type="button" id="filter-reset" class="filter-button filter-button-secondary" aria-label="フィルターをリセット">
              リセット
            </button>
          </div>
        </div>

        <div id="filter-status" class="filter-status" style="display: none;" role="status" aria-live="polite" aria-atomic="true"></div>
      </div>

      <div id="powerspot-results" class="powerspot-results" style="display: none;" aria-label="検索結果">
        <div id="results-header" class="results-header"></div>
        <div id="results-grid" class="results-grid" role="list" aria-label="パワースポット一覧"></div>
        <div id="results-pagination" class="results-pagination" role="navigation" aria-label="ページネーション"></div>
      </div>
    `;

    // 既存のコンテンツの前に挿入
    const firstChild = container.querySelector('.ast-row') || container.firstChild;
    const filterContainer = document.createElement('div');
    filterContainer.innerHTML = filterHTML;

    if (firstChild) {
      container.insertBefore(filterContainer, firstChild);
    } else {
      container.appendChild(filterContainer);
    }

    // DOM要素への参照を保存
    elements = {
      filter: document.getElementById('powerspot-filter'),
      areaSelect: document.getElementById('filter-area'),
      benefitSelect: document.getElementById('filter-benefit'),
      typeSelect: document.getElementById('filter-type'),
      searchButton: document.getElementById('filter-search'),
      resetButton: document.getElementById('filter-reset'),
      status: document.getElementById('filter-status'),
      results: document.getElementById('powerspot-results'),
      resultsHeader: document.getElementById('results-header'),
      resultsGrid: document.getElementById('results-grid'),
      pagination: document.getElementById('results-pagination'),
      originalContent: container.querySelector('.ast-row')
    };

    // イベントリスナーを設定
    elements.searchButton.addEventListener('click', handleSearch);
    elements.resetButton.addEventListener('click', handleReset);

    // Enterキーでも検索
    [elements.areaSelect, elements.benefitSelect, elements.typeSelect].forEach(select => {
      select.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
      });
    });
  }

  /**
   * 検索ハンドラー
   */
  async function handleSearch() {
    state.filters.area = elements.areaSelect.value;
    state.filters.benefit = elements.benefitSelect.value;
    state.filters.type = elements.typeSelect.value;
    state.page = 1;

    await filterPosts();
  }

  /**
   * リセットハンドラー
   */
  function handleReset() {
    state.filters = { area: '', benefit: '', type: '' };
    state.page = 1;

    elements.areaSelect.value = '';
    elements.benefitSelect.value = '';
    elements.typeSelect.value = '';

    // 結果を非表示にして元のコンテンツを表示
    elements.results.style.display = 'none';
    elements.status.style.display = 'none';
    if (elements.originalContent) {
      elements.originalContent.style.display = '';
    }

    // URLをリセット
    updateURL();
  }

  /**
   * 投稿をフィルタリング
   */
  async function filterPosts() {
    if (state.loading) return;

    state.loading = true;
    showLoading();

    try {
      // クエリパラメータを構築
      const params = new URLSearchParams({
        per_page: CONFIG.postsPerPage,
        page: state.page,
        _embed: 'wp:featuredmedia,wp:term'
      });

      if (state.filters.area) {
        params.append(CONFIG.taxonomies.area, state.filters.area);
      }
      if (state.filters.benefit) {
        params.append(CONFIG.taxonomies.benefit, state.filters.benefit);
      }
      if (state.filters.type) {
        params.append(CONFIG.taxonomies.type, state.filters.type);
      }

      const response = await fetch(`${CONFIG.restBase}/powerspot?${params}`);

      if (!response.ok) throw new Error('API Error');

      const posts = await response.json();
      const totalPosts = parseInt(response.headers.get('X-WP-Total')) || 0;
      state.totalPages = parseInt(response.headers.get('X-WP-TotalPages')) || 1;

      // 結果を表示
      renderResults(posts, totalPosts);
      updateURL();

    } catch (error) {
      console.error('フィルターエラー:', error);
      showError('検索中にエラーが発生しました。');
    } finally {
      state.loading = false;
    }
  }

  /**
   * 結果を表示
   */
  function renderResults(posts, totalPosts) {
    // 元のコンテンツを非表示
    if (elements.originalContent) {
      elements.originalContent.style.display = 'none';
    }

    // ステータス表示
    const filterNames = [];
    if (state.filters.area) {
      const area = state.taxonomyData.areas.find(a => a.id == state.filters.area);
      if (area) filterNames.push(area.name);
    }
    if (state.filters.benefit) {
      const benefit = state.taxonomyData.benefits.find(b => b.id == state.filters.benefit);
      if (benefit) filterNames.push(benefit.name);
    }
    if (state.filters.type) {
      const type = state.taxonomyData.types.find(t => t.id == state.filters.type);
      if (type) filterNames.push(type.name);
    }

    elements.status.innerHTML = `
      <span class="status-text">
        ${filterNames.length > 0 ? `「${filterNames.join('」「')}」で絞り込み: ` : ''}
        <strong>${totalPosts}件</strong>のパワースポットが見つかりました
      </span>
    `;
    elements.status.style.display = 'block';

    // 結果がない場合
    if (posts.length === 0) {
      elements.resultsGrid.innerHTML = `
        <div class="no-results">
          <p>条件に一致するパワースポットが見つかりませんでした。</p>
          <p>別の条件で検索してみてください。</p>
        </div>
      `;
      elements.pagination.innerHTML = '';
      elements.results.style.display = 'block';
      return;
    }

    // 投稿カードを生成（ARIA role="listitem" 追加）
    elements.resultsGrid.innerHTML = posts.map((post, index) => {
      const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
      const imageUrl = featuredMedia?.media_details?.sizes?.medium?.source_url ||
                       featuredMedia?.source_url ||
                       '/wp-content/themes/astra/assets/images/placeholder.jpg';

      const terms = post._embedded?.['wp:term'] || [];
      const allTerms = terms.flat();
      const areaTerms = allTerms.filter(t => t.taxonomy === 'powerspot_area');
      const benefitTerms = allTerms.filter(t => t.taxonomy === 'powerspot_benefit');

      return `
        <article class="powerspot-card" role="listitem" aria-label="${post.title.rendered}">
          <a href="${post.link}" class="card-image-link" aria-hidden="true" tabindex="-1">
            <img src="${imageUrl}" alt="" class="card-image" loading="lazy">
          </a>
          <div class="card-content">
            <h2 class="card-title">
              <a href="${post.link}">${post.title.rendered}</a>
            </h2>
            ${areaTerms.length > 0 ? `
              <div class="card-meta" aria-label="所在地">
                <span class="meta-icon" aria-hidden="true">📍</span>
                ${areaTerms.map(t => t.name).join(', ')}
              </div>
            ` : ''}
            ${benefitTerms.length > 0 ? `
              <div class="card-tags" aria-label="ご利益">
                ${benefitTerms.slice(0, 3).map(t => `<span class="tag">${t.name}</span>`).join('')}
              </div>
            ` : ''}
            <a href="${post.link}" class="card-link" aria-label="${post.title.rendered}の詳細を見る">詳しく見る →</a>
          </div>
        </article>
      `;
    }).join('');

    // 構造化データ（schema.org ItemList）を生成
    renderStructuredData(posts, totalPosts);

    // ページネーション
    renderPagination();

    elements.results.style.display = 'block';
  }

  /**
   * ページネーションを表示
   */
  function renderPagination() {
    if (state.totalPages <= 1) {
      elements.pagination.innerHTML = '';
      return;
    }

    let paginationHTML = '<div class="pagination-inner">';

    // 前へ
    if (state.page > 1) {
      paginationHTML += `<button class="page-btn page-prev" data-page="${state.page - 1}">← 前へ</button>`;
    }

    // ページ番号
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(state.totalPages, state.page + 2);

    if (startPage > 1) {
      paginationHTML += `<button class="page-btn" data-page="1">1</button>`;
      if (startPage > 2) paginationHTML += `<span class="page-dots">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `<button class="page-btn ${i === state.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (endPage < state.totalPages) {
      if (endPage < state.totalPages - 1) paginationHTML += `<span class="page-dots">...</span>`;
      paginationHTML += `<button class="page-btn" data-page="${state.totalPages}">${state.totalPages}</button>`;
    }

    // 次へ
    if (state.page < state.totalPages) {
      paginationHTML += `<button class="page-btn page-next" data-page="${state.page + 1}">次へ →</button>`;
    }

    paginationHTML += '</div>';
    elements.pagination.innerHTML = paginationHTML;

    // イベントリスナー
    elements.pagination.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        state.page = parseInt(btn.dataset.page);
        await filterPosts();
        // ページトップにスクロール
        elements.filter.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /**
   * ローディング表示
   */
  function showLoading() {
    elements.status.innerHTML = '<span class="loading-spinner"></span> 検索中...';
    elements.status.style.display = 'block';
    elements.resultsGrid.innerHTML = '<div class="loading-placeholder"></div>';
  }

  /**
   * エラー表示
   */
  function showError(message) {
    elements.status.innerHTML = `<span class="error-message">⚠️ ${message}</span>`;
    elements.status.style.display = 'block';
  }

  /**
   * URLを更新
   */
  function updateURL() {
    const params = new URLSearchParams();

    if (state.filters.area) params.set('area', state.filters.area);
    if (state.filters.benefit) params.set('benefit', state.filters.benefit);
    if (state.filters.type) params.set('type', state.filters.type);
    if (state.page > 1) params.set('page', state.page);

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newURL);
  }

  /**
   * 構造化データ（schema.org ItemList）を生成・挿入
   * SEO向上のためのリッチスニペット対応
   */
  function renderStructuredData(posts, totalPosts) {
    // 既存の構造化データを削除
    const existingScript = document.getElementById('powerspot-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    if (posts.length === 0) return;

    // ItemListスキーマを構築
    const itemList = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'パワースポット検索結果',
      'description': `日本のパワースポット一覧（${totalPosts}件）`,
      'numberOfItems': totalPosts,
      'itemListElement': posts.map((post, index) => {
        const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
        const imageUrl = featuredMedia?.source_url || '';
        const terms = post._embedded?.['wp:term'] || [];
        const allTerms = terms.flat();
        const areaTerms = allTerms.filter(t => t.taxonomy === 'powerspot_area');

        return {
          '@type': 'ListItem',
          'position': (state.page - 1) * CONFIG.postsPerPage + index + 1,
          'item': {
            '@type': 'TouristAttraction',
            '@id': post.link,
            'name': post.title.rendered.replace(/<[^>]*>/g, ''),
            'url': post.link,
            'image': imageUrl || undefined,
            'address': areaTerms.length > 0 ? {
              '@type': 'PostalAddress',
              'addressRegion': areaTerms[0].name,
              'addressCountry': 'JP'
            } : undefined
          }
        };
      })
    };

    // JSON-LDスクリプトを挿入
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'powerspot-structured-data';
    script.textContent = JSON.stringify(itemList);
    document.head.appendChild(script);
  }

  // DOMContentLoaded で初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
