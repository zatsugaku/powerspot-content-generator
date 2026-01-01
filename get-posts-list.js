require('dotenv').config();
const axios = require('axios');

const auth = Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString('base64');

axios.get('https://k005.net/wp-json/wp/v2/powerspot?per_page=100', {
  headers: { 'Authorization': `Basic ${auth}` }
}).then(res => {
  const posts = res.data.slice(30, 45);  // 31-45番目
  console.log('対象投稿一覧 (31-45番目):');
  console.log('='.repeat(60));
  posts.forEach((p, i) => {
    console.log(`${i+31}. ID:${p.id} - ${p.title.rendered} (${p.slug})`);
  });
  console.log('='.repeat(60));
  console.log(`合計: ${posts.length}件`);
}).catch(err => {
  console.error('エラー:', err.response?.data || err.message);
});
