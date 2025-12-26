require('dotenv').config();
const axios = require('axios');

const auth = Buffer.from(process.env.WP_USERNAME + ':' + process.env.WP_APP_PASSWORD).toString('base64');

async function checkPosts() {
  try {
    // Get all powerspot posts (including drafts)
    const res = await axios.get(process.env.WP_SITE_URL + '/wp-json/wp/v2/powerspot?per_page=100&status=any', {
      headers: { Authorization: 'Basic ' + auth }
    });

    console.log('=== パワースポット投稿一覧 ===');
    console.log('総数:', res.data.length);
    console.log('');

    const byStatus = {};
    res.data.forEach(p => {
      if (!byStatus[p.status]) byStatus[p.status] = [];
      byStatus[p.status].push({ id: p.id, title: p.title.rendered, slug: p.slug, link: p.link });
    });

    Object.keys(byStatus).forEach(status => {
      console.log('【' + status + '】' + byStatus[status].length + '件');
      byStatus[status].forEach(p => {
        console.log('  ID:' + p.id + ' | ' + p.slug);
        console.log('    Title: ' + p.title);
        console.log('    URL: ' + p.link);
      });
      console.log('');
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkPosts();
