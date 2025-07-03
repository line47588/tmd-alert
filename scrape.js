const fs = require('fs');
const https = require('https');
const xml2js = require('xml2js');

const url = 'https://www.tmd.go.th/rss/warning.xml';

console.time('DownloadRSS');

const req = https.get(url, { timeout: 10000 }, (res) => {
  if (res.statusCode !== 200) {
    console.error(`❌ Failed to fetch RSS. Status: ${res.statusCode}`);
    res.resume(); // consume response to free up memory
    return;
  }

  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.timeEnd('DownloadRSS');

    xml2js.parseString(data, (err, result) => {
      if (err) return console.error('❌ XML parse error:', err);

      try {
        const item = result.rss.channel[0].item[0];
        const pubDateRaw = item.pubDate[0]; // ex: "Sun, 15 Jun 2025 22:34:47 +07:00"
        const pubDate = new Date(pubDateRaw);
        const pubDateStr = pubDate.toISOString();

        const alertText = item.description[0].trim();
        const timeScrap = new Date().toISOString();

        const json = {
          date: pubDateStr,
          time_scrap: timeScrap,
          alert: alertText
        };

        fs.writeFileSync('today.json', JSON.stringify(json, null, 2));
        console.log('✅ today.json updated successfully');
      } catch (e) {
        console.error('❌ Failed to extract data from RSS:', e);
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
