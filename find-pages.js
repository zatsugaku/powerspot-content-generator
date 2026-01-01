require('dotenv').config();
const axios = require('axios');

const WP_SITE_URL = 'https://k005.net';
const WP_USERNAME = 'power';
const WP_APP_PASSWORD = 'Ml5H 2psf K1CK 3BLl fIcV ulQn';

const wpAuth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

const TARGET_PAGES = [
  { name: '諏訪大社', keywords: ['Suwa shrine', 'Nagano shrine'], altSearch: ['suwa', '諏訪'] },
  { name: '石鎚神社', keywords: ['Mount Ishizuchi', 'Shikoku mountain'], altSearch: ['ishizuchi', '石鎚'] },
  { name: '定山渓神社', keywords: ['Jozankei', 'Hokkaido shrine'], altSearch: ['jozankei', '定山渓'] },
  { name: '金剱宮', keywords: ['Japanese shrine', 'Ishikawa'], altSearch: ['kinken', '金剱'] },
  { name: '大崎八幡宮', keywords: ['Sendai shrine', 'Hachiman shrine'], altSearch: ['osaki', 'hachiman', '大崎'] },
  { name: '熱田神宮', keywords: ['Atsuta shrine', 'Nagoya shrine'], altSearch: ['atsuta', '熱田'] },
  { name: '北海道神宮', keywords: ['Hokkaido shrine', 'Sapporo shrine'], altSearch: ['hokkaido', '北海道'] },
  { name: '樽前山神社', keywords: ['Tomakomai shrine', 'Hokkaido'], altSearch: ['tarumae', '樽前'] }
];

async function findPages() {
  try {
    const response = await axios.get(
      `${WP_SITE_URL}/wp-json/wp/v2/pages?per_page=100&status=any`,
      {
        headers: {
          'Authorization': `Basic ${wpAuth}`
        }
      }
    );

    console.log('Found pages:\n');
    console.log('const PAGES = [');

    TARGET_PAGES.forEach(target => {
      // Try exact match first
      let found = response.data.filter(p =>
        p.title.rendered.includes(target.name)
      );

      // If not found, try alternative searches
      if (found.length === 0 && target.altSearch) {
        target.altSearch.forEach(alt => {
          const altFound = response.data.filter(p =>
            p.title.rendered.toLowerCase().includes(alt.toLowerCase()) ||
            p.slug.toLowerCase().includes(alt.toLowerCase())
          );
          if (altFound.length > 0) {
            found = altFound;
          }
        });
      }

      if (found.length > 0) {
        found.forEach(p => {
          const kw = JSON.stringify(target.keywords);
          console.log(`  { id: ${p.id}, slug: '${p.slug}', name: '${p.title.rendered}', keywords: ${kw} },`);
        });
      } else {
        console.log(`  // NOT FOUND: ${target.name}`);
      }
    });

    console.log('];\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

findPages();
