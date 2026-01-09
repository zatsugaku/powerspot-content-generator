/**
 * パワースポット相性診断ウィジェット
 * k005.net専用 - 無料簡易診断
 *
 * ロジック: en_shindan_app の縁診断ロジックをベースに実装
 */

(function() {
  'use strict';

  // ==================== 定数定義 ====================

  // 12自然現象
  const PHENOMENA_MAP = {
    0: "春霞", 1: "夏雨", 2: "彩雲", 3: "朝日",
    4: "夕陽", 5: "秋風", 6: "冬陽", 7: "朧月",
    8: "霜夜", 9: "氷刃", 10: "春雷", 11: "豊穣"
  };

  // 12自然現象の説明
  const PHENOMENA_DESCRIPTIONS = {
    "春霞": "柔軟で適応力が高く、新しい環境にも馴染みやすい",
    "夏雨": "情熱的で、人との関わりを大切にする",
    "彩雲": "多彩な才能を持ち、創造性に富む",
    "朝日": "希望に満ち、前向きなエネルギーを持つ",
    "夕陽": "穏やかで、周囲に安心感を与える",
    "秋風": "変化を恐れず、新しいことに挑戦する",
    "冬陽": "内に秘めた温かさで、人を癒す力がある",
    "朧月": "直感力に優れ、神秘的な魅力を持つ",
    "霜夜": "冷静沈着で、物事を深く見通す",
    "氷刃": "決断力があり、明確な意志を持つ",
    "春雷": "行動力があり、周囲を動かす力がある",
    "豊穣": "包容力があり、多くの人を支える"
  };

  // 五行の定義
  const GOGYO = {
    '木': { key: 'WOOD', color: '#4CAF50', description: '成長・発展・創造のエネルギー' },
    '火': { key: 'FIRE', color: '#F44336', description: '情熱・活力・変革のエネルギー' },
    '土': { key: 'EARTH', color: '#FF9800', description: '安定・調和・育成のエネルギー' },
    '金': { key: 'METAL', color: '#9E9E9E', description: '決断・浄化・収穫のエネルギー' },
    '水': { key: 'WATER', color: '#2196F3', description: '知恵・柔軟・流動のエネルギー' }
  };

  const GOGYOU_MAP = ["木", "火", "土", "金", "水"];

  // 五行相生関係（生む関係）: 木→火→土→金→水→木
  const SOGYO = {
    '木': '火',
    '火': '土',
    '土': '金',
    '金': '水',
    '水': '木'
  };

  // 五行相剋関係（剋す関係）: 木→土→水→火→金→木
  const SOKOKU = {
    '木': '土',
    '火': '金',
    '土': '水',
    '金': '木',
    '水': '火'
  };

  // ==================== 60分類計算（縁診断ロジック） ====================

  /**
   * 60分類計算（生まれ持った縁）
   * @param {string} birthDateStr - 生年月日 (YYYY-MM-DD形式)
   * @returns {Object} 60分類情報
   */
  function calculateNaturalType(birthDateStr) {
    const date = new Date(birthDateStr);
    const baseDate = new Date('1900-01-01');

    // 1900年1月1日からの経過日数を計算
    const daysSinceBase = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));

    // 自然現象（12種類）を決定
    const phenomenaIndex = ((daysSinceBase % 12) + 12) % 12; // 負の数対応
    const phenomena = PHENOMENA_MAP[phenomenaIndex];

    // 五行（5種類）を決定
    const gogyouIndex = ((Math.floor(daysSinceBase / 60) % 5) + 5) % 5; // 負の数対応
    const element = GOGYOU_MAP[gogyouIndex];

    // 60分類名を生成
    const naturalType = `${element}の${phenomena}`;

    return {
      naturalType,      // "火の朧月" 等
      element,          // "火"
      phenomena,        // "朧月"
      phenomenaIndex,
      gogyouIndex,
      description: `${PHENOMENA_DESCRIPTIONS[phenomena]}。${GOGYO[element].description}を持っています。`
    };
  }

  // ==================== パワースポット相性計算 ====================

  /**
   * パワースポットとの相性を計算
   * @param {string} userElement - ユーザーの五行
   * @param {Object} powerspotAttributes - パワースポットの五行属性
   * @returns {Object} 相性情報
   */
  function calculateCompatibility(userElement, powerspotAttributes) {
    // パワースポットの主要五行を特定
    const elements = ['木', '火', '土', '金', '水'];

    // 最も強い属性を取得
    let maxElement = '土';
    let maxValue = 0;
    for (const elem of elements) {
      const value = powerspotAttributes[elem] || 0;
      if (value > maxValue) {
        maxValue = value;
        maxElement = elem;
      }
    }

    // 相性スコア計算
    let score = 3.0; // 基本スコア

    // 同じ五行: +1.0
    if (userElement === maxElement) {
      score += 1.0;
    }

    // 相生関係（自分が生む）: +0.8
    if (SOGYO[userElement] === maxElement) {
      score += 0.8;
    }

    // 相生関係（自分が生まれる）: +0.5
    if (SOGYO[maxElement] === userElement) {
      score += 0.5;
    }

    // 相剋関係（自分が剋す）: -0.3
    if (SOKOKU[userElement] === maxElement) {
      score -= 0.3;
    }

    // 相剋関係（自分が剋される）: -0.5
    if (SOKOKU[maxElement] === userElement) {
      score -= 0.5;
    }

    // パワースポットのベースエネルギーで調整
    const baseEnergy = powerspotAttributes['ベースエネルギー'] || 0.85;
    score += (baseEnergy - 0.85) * 2;

    // スコアを1-5に正規化
    score = Math.max(1, Math.min(5, score));

    // 相性タイプを判定
    let compatibilityType = '';
    if (userElement === maxElement) {
      compatibilityType = '同属性';
    } else if (SOGYO[userElement] === maxElement) {
      compatibilityType = '相生（生む）';
    } else if (SOGYO[maxElement] === userElement) {
      compatibilityType = '相生（生まれる）';
    } else if (SOKOKU[userElement] === maxElement) {
      compatibilityType = '相剋（剋す）';
    } else if (SOKOKU[maxElement] === userElement) {
      compatibilityType = '相剋（剋される）';
    } else {
      compatibilityType = '中立';
    }

    return {
      score: Math.round(score * 10) / 10,
      stars: Math.round(score),
      mainElement: maxElement,
      compatibilityType,
      userElement
    };
  }

  /**
   * 相性コメントを生成
   */
  function generateCompatibilityComment(enType, compatibility, powerspotName) {
    const userElement = enType.element;
    const spotElement = compatibility.mainElement;
    const score = compatibility.score;
    const type = compatibility.compatibilityType;

    if (score >= 4.5) {
      return `あなたの「${userElement}」の縁と${powerspotName}の「${spotElement}」のエネルギーは最高の相性です。人生の転機に訪れることで、大きな気づきが得られるでしょう。`;
    } else if (score >= 4.0) {
      if (type === '同属性') {
        return `同じ「${userElement}」のエネルギーを持つ${powerspotName}は、あなたの本来の力を増幅させます。自分らしさを取り戻したい時におすすめです。`;
      }
      return `あなたの「${userElement}」の縁と${powerspotName}の「${spotElement}」のパワーは非常に良い相性です。心身のリフレッシュに最適な場所です。`;
    } else if (score >= 3.5) {
      return `${powerspotName}の「${spotElement}」のエネルギーは、あなたの「${userElement}」の力を程よく刺激します。新しい発見があるかもしれません。`;
    } else if (score >= 3.0) {
      return `あなたと${powerspotName}の相性は標準的です。心を落ち着けて参拝することで、良いエネルギーを受け取れるでしょう。`;
    } else {
      return `${powerspotName}のエネルギーはあなたにとって少し強めかもしれません。早朝の静かな時間帯の参拝がおすすめです。`;
    }
  }

  /**
   * おすすめ参拝タイミングを生成
   */
  function generateTimingAdvice(enType) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let season, nextSeason;
    if (month >= 3 && month <= 5) {
      season = '春';
      nextSeason = '夏';
    } else if (month >= 6 && month <= 8) {
      season = '夏';
      nextSeason = '秋';
    } else if (month >= 9 && month <= 11) {
      season = '秋';
      nextSeason = '冬';
    } else {
      season = '冬';
      nextSeason = '春';
    }

    // 五行と季節の相性
    const seasonGogyo = {
      '春': '木',
      '夏': '火',
      '秋': '金',
      '冬': '水'
    };

    const userElement = enType.element;
    const currentSeasonElement = seasonGogyo[season];

    if (userElement === currentSeasonElement || SOGYO[currentSeasonElement] === userElement) {
      return `${year}年${season}は、あなたにとって特に良い参拝時期です。`;
    } else {
      return `${nextSeason}の参拝がおすすめです。午前中の早い時間帯だとより効果的です。`;
    }
  }

  // ==================== 診断実行 ====================

  /**
   * 診断を実行
   */
  function runDiagnosis(birthday, name, powerspotData) {
    // 60分類を計算（縁診断ロジック）
    const enType = calculateNaturalType(birthday);

    // パワースポットとの相性を計算
    const compatibility = calculateCompatibility(enType.element, powerspotData.attributes);

    // コメントとアドバイスを生成
    const comment = generateCompatibilityComment(enType, compatibility, powerspotData.name);
    const timing = generateTimingAdvice(enType);

    return {
      enType: enType,
      compatibility: compatibility,
      comment: comment,
      timing: timing
    };
  }

  // ==================== UI表示 ====================

  /**
   * 結果をHTMLで表示
   */
  function displayResult(result, container) {
    const starsHtml = '<span class="star-filled">★</span>'.repeat(result.compatibility.stars) +
                      '<span class="star-empty">☆</span>'.repeat(5 - result.compatibility.stars);
    const gogyoInfo = GOGYO[result.enType.element];

    container.innerHTML = `
      <div class="diagnosis-result">
        <div class="result-section entype-section">
          <h4>あなたの縁タイプ</h4>
          <div class="entype-badge" style="background: linear-gradient(135deg, ${gogyoInfo.color}, ${gogyoInfo.color}99)">
            <span class="entype-name">${result.enType.naturalType}</span>
          </div>
          <p class="entype-description">${result.enType.description}</p>
        </div>

        <div class="result-section compatibility-section">
          <h4>このパワースポットとの相性</h4>
          <div class="compatibility-score">
            <span class="stars">${starsHtml}</span>
            <span class="score-number">${result.compatibility.score.toFixed(1)}</span>
          </div>
          <p class="compatibility-comment">${result.comment}</p>
        </div>

        <div class="result-section timing-section">
          <h4>おすすめ参拝タイミング</h4>
          <p>${result.timing}</p>
        </div>

        <div class="result-section cta-section">
          <h4>あなたにピッタリのパワースポット18選</h4>
          <p>142箇所すべてとの相性を分析し、運命・金運・恋愛・健康・季節別にベストな18箇所を厳選します。</p>
          <a href="#detailed-diagnosis" class="cta-button">
            詳細診断を見る（¥980）
          </a>
        </div>
      </div>
    `;
  }

  /**
   * フォーム送信ハンドラ
   */
  function handleSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const container = form.closest('.powerspot-diagnosis-widget');
    const resultContainer = container.querySelector('.diagnosis-result-container');

    const birthday = form.querySelector('[name="birthday"]').value;
    const name = form.querySelector('[name="name"]')?.value || '';

    if (!birthday) {
      alert('生年月日を入力してください');
      return;
    }

    // パワースポットデータを取得（data属性から）
    const powerspotData = {
      name: container.dataset.powerspotName || 'このパワースポット',
      attributes: JSON.parse(container.dataset.powerspotAttributes || '{}')
    };

    // 診断実行
    const result = runDiagnosis(birthday, name, powerspotData);

    // 結果表示
    displayResult(result, resultContainer);
    resultContainer.style.display = 'block';

    // 結果までスクロール
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * 初期化
   */
  function init() {
    const widgets = document.querySelectorAll('.powerspot-diagnosis-widget');

    widgets.forEach(widget => {
      const form = widget.querySelector('.diagnosis-form');
      if (form) {
        form.addEventListener('submit', handleSubmit);
      }
    });
  }

  // DOMContentLoaded後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // グローバルに公開（テスト用）
  window.PowerspotDiagnosis = {
    runDiagnosis: runDiagnosis,
    calculateNaturalType: calculateNaturalType,
    calculateCompatibility: calculateCompatibility
  };

})();
