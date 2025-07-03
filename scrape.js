const fs = require('fs');
const https = require('https');
const xml2js = require('xml2js');

const url = 'https://www.tmd.go.th/en/api/xml/storm-tracking';

console.time('DownloadRSS');

let didWrite = false;

const req = https.get(url, { timeout: 10000 }, (res) => {
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
        const description = item.description?.[0]?.trim();

        if (!pubDateRaw || !description) {
          console.error('❌ Missing pubDate or description');
          process.exit(1);
          return;
        }

        const pubDate = new Date(pubDateRaw).toISOString();
        const timeScrap = new Date().toISOString();

        const json = {
          date: pubDate,
          time_scrap: timeScrap,
          alert: description
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
