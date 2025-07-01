const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.goto("https://www.tmd.go.th/warning-and-events/warning-storm", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // ✅ รอ article ตัวแรกที่แสดงหลังโหลด
    await page.waitForSelector("article");

    const result = await page.evaluate(() => {
      const article = document.querySelector("article");
      const title = article?.querySelector("h3")?.innerText || "❌ ไม่พบหัวข้อ";
      const text = article?.querySelector("p")?.innerText || "❌ ไม่พบเนื้อหา";
      return {
        date: new Date().toISOString().split("T")[0],
        alert: title + "\n" + text
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
