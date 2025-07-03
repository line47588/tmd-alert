const fs = require('fs');
const https = require('https');
const xml2js = require('xml2js');

const url = 'https://www.tmd.go.th/en/api/xml/storm-tracking';

console.time('DownloadRSS');

let didWrite = false;

const req = https.get(url, { timeout: 30000 }, (res) => {
  if (res.statusCode !== 200) {
    console.error(`❌ Failed to fetch RSS. Status: ${res.statusCode}`);
    process.exit(1);
    return;
  }

  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.timeEnd('DownloadRSS');

    xml2js.parseString(data, (err, result) => {
      if (err) {
        console.error('❌ XML parse error:', err.message);
        process.exit(1);
        return;
      }

      try {
        const channel = result.rss.channel[0];
        const pubDateRaw = channel.pubDate?.[0];
        const item = channel.item?.[0];
        const title = item.title?.[0]?.trim();

        if (!pubDateRaw || !title) {
          console.error('❌ Missing pubDate or title');
          process.exit(1);
          return;
        }

        const pubDate = new Date(pubDateRaw);
        const dateStr = pubDate.toISOString().slice(0, 10); // yyyy-mm-dd
        const timeScrap = new Date().toISOString();

        const json = {
          date: dateStr,
          title: title,
          time_scrap: timeScrap
        };

        fs.writeFileSync('today.json', JSON.stringify(json, null, 2));
        didWrite = true;
        console.log('✅ today.json updated successfully');
      } catch (e) {
        console.error('❌ Failed to process RSS data:', e.message);
        process.exit(1);
      }
    });
  });
});

req.on('timeout', () => {
  console.error('⏱ Request timed out');
  req.abort();
  process.exit(1);
});

req.on('error', (err) => {
  console.error('❌ Request error:', err.message);
  process.exit(1);
});
