const https = require('https');
require('dotenv').config();

const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');

// SEO meta for each English article
const seoData = {
  'hakone-jinja-en': {
    id: 2616,
    title: 'Hakone Shrine 2026: Lakeside Torii, Best Photos & Spiritual Guide',
    desc: 'Visit Hakone Shrine on Lake Ashi with our complete 2026 guide. Famous floating torii, dragon worship, access from Tokyo, best photo spots, and spiritual benefits explained.'
  },
  'enoshima-jinja-en': {
    id: 2614,
    title: 'Enoshima Shrine 2026: Island Temple, Benten Goddess & Day Trip Guide',
    desc: 'Explore Enoshima Shrine with our 2026 guide. Sacred island near Tokyo, goddess Benzaiten, dragon legends, sea cave, best routes, and tips for couples seeking luck in love.'
  },
  'tojinbo-en': {
    id: 2612,
    title: 'Tojinbo Cliffs 2026: Dramatic Views, Legends & Visitor Guide',
    desc: "Experience Tojinbo's towering sea cliffs with our 2026 guide. Columnar basalt formations, tragic legends, sunset views, boat tours, and nearby Awara Onsen hot springs."
  },
  'kawaguchiko-en': {
    id: 2610,
    title: 'Lake Kawaguchi 2026: Mt. Fuji Views, Shrines & Complete Guide',
    desc: 'Visit Lake Kawaguchi with our 2026 guide. Best Mt. Fuji photo spots, lakeside shrines, seasonal flowers, hot springs, and day trip tips from Tokyo.'
  },
  'kamui-kotan-en': {
    id: 2608,
    title: 'Kamui Kotan 2026: Ainu Sacred Site & Hokkaido Nature Guide',
    desc: 'Discover Kamui Kotan in Hokkaido with our 2026 guide. Sacred Ainu canyon, dramatic rock formations, indigenous legends, hiking trails, and spiritual significance explained.'
  },
  'chitose-jinja-en': {
    id: 2606,
    title: 'Chitose Shrine 2026: Near New Chitose Airport Power Spot Guide',
    desc: "Visit Chitose Shrine near Hokkaido's main airport. Perfect for travelers seeking blessings before flights. History, access, prayers for safe travel, and local tips."
  },
  'sounkyo-en': {
    id: 2604,
    title: 'Sounkyo Gorge 2026: Hokkaido Canyon, Waterfalls & Onsen Guide',
    desc: 'Explore Sounkyo Gorge in Hokkaido with our 2026 guide. Dramatic cliffs, Ginga and Ryusei waterfalls, ropeway views, hot springs, and seasonal hiking trails.'
  },
  'osorezan-en': {
    id: 2585,
    title: "Mount Osore 2026: Japan's Gateway to the Afterlife Guide",
    desc: "Visit Mount Osorezan, one of Japan's most sacred sites. Volcanic landscape, itako spirit mediums, Buddhist temple, lake views, and spiritual purification rituals explained."
  },
  'shikina-gu-en': {
    id: 2583,
    title: 'Shikina-gu Shrine 2026: Okinawa Royal Garden & Power Spot Guide',
    desc: 'Explore Shikina-gu Shrine in Naha, Okinawa. UNESCO World Heritage royal garden, sacred spring, Ryukyu Kingdom history, and peaceful retreat from the city.'
  },
  'yutoku-inari-jinja-en': {
    id: 2581,
    title: "Yutoku Inari Shrine 2026: Saga's Grand Fox Shrine Guide",
    desc: "Visit Yutoku Inari, one of Japan's top three Inari shrines. Stunning hillside architecture, 300+ years of history, business success prayers, and seasonal festivals."
  },
  'seimei-jinja-en': {
    id: 2579,
    title: "Seimei Shrine 2026: Kyoto's Legendary Onmyoji Temple Guide",
    desc: 'Visit Seimei Shrine in Kyoto, dedicated to famous onmyoji Abe no Seimei. Star pentagram, mystical legends, fortune telling, and protection from evil spirits.'
  },
  'sado-kinzan-en': {
    id: 2577,
    title: 'Sado Gold Mine 2026: UNESCO World Heritage & History Guide',
    desc: 'Explore Sado Kinzan Gold Mine on Sado Island. UNESCO heritage site, 400 years of mining history, underground tunnels, gold panning experience, and access by ferry.'
  },
  'itsukushima-jinja-en': {
    id: 2575,
    title: "Itsukushima Shrine 2026: Miyajima's Floating Torii Guide",
    desc: 'Visit Itsukushima Shrine and its iconic floating torii gate. UNESCO World Heritage, tide timing guide, deer encounters, momiji manju, and overnight stay tips.'
  },
  'suwa-taisha-en': {
    id: 2573,
    title: "Suwa Taisha 2026: Nagano's Ancient Four-Shrine Complex Guide",
    desc: "Explore Suwa Taisha's four sacred shrines in Nagano. Japan's oldest shrine, Onbashira festival, samurai connections, lakeside views, and spiritual energy spots."
  },
  'ishizuchi-jinja-en': {
    id: 2571,
    title: "Ishizuchi Shrine 2026: Western Japan's Highest Peak Guide",
    desc: "Climb to Ishizuchi Shrine atop Shikoku's highest mountain. Chain climbing routes, yamabushi traditions, sunrise views, and spiritual mountain pilgrimage guide."
  },
  'mitake-jinja-en': {
    id: 2569,
    title: "Musashi Mitake Shrine 2026: Tokyo's Mountain Power Spot Guide",
    desc: "Visit Mitake Shrine on Mount Mitake, Tokyo's most accessible mountain shrine. Wolf worship, hiking trails, cable car, and spiritual retreat just 90 minutes from Shinjuku."
  },
  'tsukubasan-jinja-en': {
    id: 2567,
    title: 'Tsukubasan Shrine 2026: Sacred Twin Peaks & Hiking Guide',
    desc: 'Explore Tsukubasan Shrine on Mount Tsukuba. Twin peak legends, easy hiking trails, ropeway access, matchmaking blessings, and stunning Kanto Plain views.'
  },
  'nachi-falls-en': {
    id: 2565,
    title: "Nachi Falls 2026: Japan's Tallest Waterfall & Shrine Guide",
    desc: "Visit Nachi Falls, Japan's highest single-drop waterfall at 133m. Kumano Nachi Taisha shrine, pagoda viewpoint, pilgrimage trails, and spiritual purification rituals."
  },
  'usa-jingu-en': {
    id: 2563,
    title: 'Usa Jingu 2026: Origin of All Hachiman Shrines Guide',
    desc: 'Visit Usa Jingu, the head shrine of 40,000+ Hachiman shrines across Japan. Ancient history, unique worship style, vermillion buildings, and samurai connections.'
  },
  'miho-jinja-en': {
    id: 2561,
    title: "Miho Shrine 2026: Izumo's Maritime Deity & Fishing Guide",
    desc: 'Visit Miho Shrine in Shimane, dedicated to Ebisu the fishing god. Dramatic coastal setting, fishing village charm, and connection to nearby Izumo Taisha.'
  },
  'oyamazumi-jinja-en': {
    id: 2559,
    title: "Oyamazumi Shrine 2026: Japan's Best Samurai Armor Collection",
    desc: "Visit Oyamazumi Shrine on Omishima Island. Houses 80% of Japan's designated national treasure armor, 2,600-year-old sacred camphor tree, and Shimanami Kaido cycling stop."
  },
  'okinogu-en': {
    id: 2557,
    title: "Okinogu Shrine 2026: Okinawa's Mysterious Ocean Power Spot",
    desc: 'Discover Okinogu Shrine, a hidden gem in Okinawa. Oceanfront sacred site, local worship traditions, quiet atmosphere away from tourist crowds, and coral reef views.'
  },
  'sumiyoshi-taisha-en': {
    id: 2555,
    title: "Sumiyoshi Taisha 2026: Osaka's Iconic Arched Bridge Shrine",
    desc: "Visit Sumiyoshi Taisha, Osaka's most important shrine. Famous curved bridge, unique Sumiyoshi-zukuri architecture, maritime deity worship, and New Year traditions."
  },
  'jozankei-jinja-en': {
    id: 2549,
    title: "Jozankei Shrine 2026: Sapporo's Hot Spring Valley Guide",
    desc: "Visit Jozankei Shrine in Hokkaido's premier hot spring resort. Forest shrine, kappa legends, autumn foliage, onsen hopping, and easy access from Sapporo."
  },
  'kinkengu-en': {
    id: 2551,
    title: "Kinkengu Shrine 2026: Kanazawa's Wealth & Fortune Guide",
    desc: 'Visit Kinkengu Shrine for financial blessings in Kanazawa. Gold-themed amulets, money-washing ritual, business success prayers, and Kenrokuen Garden nearby.'
  },
  'osaki-hachimangu-en': {
    id: 2540,
    title: "Osaki Hachimangu 2026: Sendai's National Treasure Shrine Guide",
    desc: "Visit Osaki Hachimangu, a National Treasure shrine built by Date Masamune. Stunning black lacquer buildings, samurai history, and Sendai's spiritual heart."
  },
  'atsuta-jingu-en': {
    id: 2538,
    title: 'Atsuta Jingu 2026: Home of the Sacred Sword Kusanagi Guide',
    desc: "Visit Atsuta Jingu in Nagoya, housing Japan's imperial sword Kusanagi. Second only to Ise, ancient forest, powerful energy, and samurai tournament traditions."
  },
  'hokkaido-jingu-en': {
    id: 2536,
    title: "Hokkaido Jingu 2026: Sapporo's Premier Shrine & Cherry Blossom",
    desc: 'Visit Hokkaido Jingu in Maruyama Park, Sapporo. Pioneer deity worship, famous cherry blossoms, wild squirrels, New Year celebrations, and easy subway access.'
  },
  'tarumaesan-jinja-en': {
    id: 2534,
    title: 'Tarumaesan Shrine 2026: Volcano Summit Sacred Site Guide',
    desc: "Climb to Tarumaesan Shrine atop an active volcano near Lake Shikotsu. Dramatic crater views, rare lava dome worship, hiking routes, and Hokkaido's raw natural power."
  },
  'akan-lake-en': {
    id: 2525,
    title: "Lake Akan 2026: Marimo Moss Balls & Ainu Culture Guide",
    desc: 'Visit Lake Akan in Hokkaido. Famous marimo moss balls, Ainu kotan village, hot springs, forest walks, and pristine caldera lake scenery in Akan National Park.'
  },
  'matsushima-en': {
    id: 2471,
    title: "Matsushima 2026: Japan's Top Three Views & Temple Guide",
    desc: "Visit Matsushima Bay, one of Japan's three most scenic views. 260 pine-covered islands, Zuiganji Temple, oyster cuisine, boat cruises, and Date clan history."
  },
  'chusonji-konjikido-en': {
    id: 2468,
    title: "Chusonji Konjikido 2026: Hiraizumi's Golden Hall Guide",
    desc: "Visit Chusonji's legendary Golden Hall in Hiraizumi. UNESCO World Heritage, Pure Land Buddhist art, gold-covered interior, Fujiwara clan legacy, and peaceful forest walks."
  },
  'haguro-san-en': {
    id: 2467,
    title: 'Mount Haguro 2026: Five-Story Pagoda & Yamabushi Trail Guide',
    desc: "Climb Mount Haguro's 2,446 stone steps through ancient cedar forest. National Treasure pagoda, Dewa Sanzan pilgrimage, yamabushi culture, and spiritual rebirth rituals."
  },
  'kotohira-gu-2': {
    id: 2445,
    title: "Kotohira-gu 2026: 1,368 Steps to Shikoku's Sacred Summit",
    desc: 'Climb to Kotohira-gu (Konpira-san) in Kagawa. Famous 1,368-step approach, maritime deity worship, Kabuki theater, udon noodles, and sweeping Sanuki Plain views.'
  },
  'mount-aso-2': {
    id: 2448,
    title: "Mount Aso 2026: World's Largest Caldera & Volcano Guide",
    desc: "Experience Mount Aso's active volcano in Kumamoto. World's largest caldera, Nakadake crater viewing, grassland drives, hot springs, and volcanic landscape hiking."
  },
  'izumo-taisha-2': {
    id: 2446,
    title: "Izumo Taisha 2026: Japan's Matchmaking Shrine Guide",
    desc: "Visit Izumo Taisha, Japan's most powerful shrine for relationships. Giant shimenawa rope, unique worship style, gathering of gods in October, and marriage blessings."
  },
  'nikko-toshogu-2': {
    id: 2447,
    title: "Nikko Toshogu 2026: Shogun's Ornate Mausoleum Guide",
    desc: 'Visit Nikko Toshogu, the lavish mausoleum of Tokugawa Ieyasu. UNESCO World Heritage, see-no-evil monkeys, sleeping cat, gold decorations, and stunning mountain setting.'
  },
  'sefa-utaki-2': {
    id: 2444,
    title: "Sefa Utaki 2026: Okinawa's Most Sacred Spiritual Site",
    desc: 'Visit Sefa Utaki, the holiest site in Okinawan spirituality. UNESCO World Heritage, Ryukyu Kingdom rituals, triangular rock formations, and powerful feminine energy.'
  },
  'fushimi-inari-taisha-2': {
    id: 2443,
    title: 'Fushimi Inari 2026: 10,000 Red Torii Gates Hiking Guide',
    desc: "Explore Fushimi Inari's famous vermillion gates in Kyoto. Complete hiking trail guide, fox statues, best photo times, mountain summit views, and business success prayers."
  }
};

// Function to update SEO meta via Rank Math API
function updateSEO(slug, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      objectID: data.id,
      objectType: 'post',
      meta: {
        'rank_math_title': data.title,
        'rank_math_description': data.desc,
        'rank_math_focus_keyword': slug.replace('-en', '').replace(/-2$/, '').replace(/-/g, ' ')
      }
    });

    const options = {
      hostname: 'k005.net',
      path: '/wp-json/rankmath/v1/updateMeta',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Basic ' + auth
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ slug, status: res.statusCode }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Process all
async function processAll() {
  const entries = Object.entries(seoData);
  console.log('Processing', entries.length, 'articles...');

  let success = 0;
  for (const [slug, data] of entries) {
    try {
      const result = await updateSEO(slug, data);
      if (result.status === 200) {
        success++;
        process.stdout.write('.');
      } else {
        process.stdout.write('x');
      }
    } catch(e) {
      process.stdout.write('!');
    }
  }
  console.log('');
  console.log('Done:', success, '/', entries.length, 'successful');
}

processAll();
