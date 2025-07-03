const fs = require('fs');
const https = require('https');
const xml2js = require('xml2js');

const url = 'https://www.tmd.go.th/rss/warning.xml'; // เปลี่ยน URL ให้ตรงของจริง

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    xml2js.parseString(data, (err, result) => {
      if (err) return console.error('❌ XML parse error:', err);

      const item = result.rss.channel[0].item[0];
      const pubDateRaw = item.pubDate[0]; // เช่น "Sun, 15 Jun 2025 22:34:47 +07:00"
      const pubDate = new Date(pubDateRaw);
      const pubDateStr = pubDate.toISOString(); // ISO 8601 format

      const alertText = item.description[0].trim();
      const timeScrap = new Date().toISOString(); // เวลาที่ scrape

      const json = {
        date: pubDateStr,   // เวลาจากกรมอุตุ
        time_scrap: timeScrap, // เวลาที่ scrape
        alert: alertText
      };

      fs.writeFileSync('today.json', JSON.stringify(json, null, 2));
      console.log('✅ today.json updated:', json);
    });
  });
});
