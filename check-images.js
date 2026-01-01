const fs = require('fs');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const json = JSON.parse(data);
    const content = json.content.rendered;
    const imgRegex = /<img[^>]+src="([^"]+)"/g;
    let match;

    console.log('Post ID:', json.id);
    console.log('Title:', json.title.rendered);
    console.log('Images:');

    while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];
      const filename = src.split('/').pop();
      console.log('-', filename, '|', src);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
});
