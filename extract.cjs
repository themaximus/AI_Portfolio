const fs = require('fs');
const html = fs.readFileSync('uiverse.html', 'utf8');
const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
if (match) {
  const data = JSON.parse(match[1]);
  fs.writeFileSync('uiverse.json', JSON.stringify(data, null, 2));
  console.log('Parsed __NEXT_DATA__');
} else {
  console.log('No __NEXT_DATA__ found');
}
