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

  let data = [];
  res.on('data', chunk => data.push(chunk));
  res.on('end', () => {
    console.timeEnd('DownloadRSS');

    try {
      const buffer = Buffer.concat(data);
      const xml = buffer.toString(); // UTF-8 โดยตรง

      xml2js.parseString(xml, (err, result) => {
        if (err) {
          console.error('❌ XML parse error:', err.message);
          process.exit(1);
          return;
        }

        const channel = result.rss.channel[0];
        const pubDateRaw = channel.pubDate?.[0];
        const item = channel.item?.[0];

        let title = item.title?.[0]?.trim() || '';
        try {
          title = decodeURIComponent(escape(title)); // ฟื้นข้อความหากเพี้ยน
        } catch (e) {
          console.warn('⚠️ Failed to decode title. Fallback to raw.');
        }

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
      });
    } catch (e) {
      console.error('❌ Failed to decode or parse XML:', e.message);
      process.exit(1);
    }
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
