const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.goto("https://www.tmd.go.th/weather_warning.php", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const result = await page.evaluate(() => {
      const paragraphs = [...document.querySelectorAll("div.tmd-main-content p")];
      const found = paragraphs.find(p => p.innerText.length > 100 && /ฝน|พายุ|ลมแรง/.test(p.innerText));

      return {
        date: new Date().toISOString().split("T")[0],
        alert: found ? found.innerText : "❌ ไม่พบข้อความเตือนภัย"
      };
    });

    console.log("📋 ข้อความ scrape:");
    console.log(JSON.stringify(result, null, 2));

    fs.writeFileSync("today.json", JSON.stringify(result, null, 2), "utf8");
    console.log("✅ today.json created");

    await browser.close();
  } catch (err) {
    console.error("❌ Scraper failed:");
    console.error(err);
    process.exit(1);
  }
})();
