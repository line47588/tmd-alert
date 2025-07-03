const fs = require('fs');
const https = require('https');
const xml2js = require('xml2js');

const url = 'https://www.tmd.go.th/rss/warning.xml';

console.time('DownloadRSS');

const req = https.get(url, { timeout: 10000 }, (res) => {
  if (res.statusCode !== 200) {
    console.error(`❌ Failed to fetch RSS. Status: ${res.statusCode}`);
    res.resume(); // free memory
    return;
  }

  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.timeEnd('DownloadRSS');

    xml2js.parseString(data, (err, result) => {
      if (err) {
        console.error('❌ XML parse error:', err);
        return;
      }

      try {
        const item = result.rss.channel[0].item[0];

        const pubDateRaw = item.pubDate?.[0] || null;
        const pubDate = pubDateRaw ? new Date(pubDateRaw).toISOString() : null;

        const alertText = item.description?.[0]?.trim() || '⚠️ No alert found';
        const timeScrap = new Date().toISOString();

        const json = {
          date: pubDate || '',        // จาก pubDate จริง
          time_scrap: timeScrap,      // เวลาที่ scrape
          alert: alertText
        };

        fs.writeFileSync('today.json', JSON.stringify(json, null, 2));
        console.log('✅ today.json updated successfully');
      } catch (e) {
        console.error('❌ Failed to process RSS item:', e);
      }
    });
  });
});

req.on('timeout', () => {
  console.error('⏱ Request timed out');
  req.abort();
});

req.on('error', (err) => {
  console.error('❌ Request error:', err.message);
});
