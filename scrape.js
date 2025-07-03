const fs = require('fs');
const https = require('https');
const xml2js = require('xml2js');

const url = 'https://www.tmd.go.th/rss/warning.xml';

console.time('DownloadRSS');

let didWrite = false;

const req = https.get(url, { timeout: 30000 }, (res) => {
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
        console.error('❌ XML parse error:', err.message);
        return;
      }

      try {
        const item = result.rss.channel?.[0]?.item?.[0];
        if (!item || !item.description?.[0] || !item.pubDate?.[0]) {
          console.error('❌ Missing expected fields in RSS');
          return;
        }

        const pubDateRaw = item.pubDate[0];
        const pubDate = new Date(pubDateRaw).toISOString();
        const alertText = item.description[0].trim();
        const timeScrap = new Date().toISOString();

        const json = {
          date: pubDate,
          time_scrap: timeScrap,
          alert: alertText
        };

        fs.writeFileSync('today.json', JSON.stringify(json, null, 2));
        didWrite = true;
        console.log('✅ today.json updated successfully');
      } catch (e) {
        console.error('❌ Failed to process RSS item:', e.message);
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

// ป้องกันการ commit ไฟล์เก่าในขั้นตอน Git
process.on('exit', () => {
  if (!didWrite) {
    console.log('🚫 No update. Skipping Git commit.');
    process.exitCode = 1; // บอก Actions ว่าไม่สำเร็จ
  }
});
