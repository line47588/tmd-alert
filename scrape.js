const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']  // ✅ สำคัญ!
    });

    const page = await browser.newPage();

    await page.goto("https://www.tmd.go.th/warning-and-events/warning-storm", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    const result = await page.evaluate(() => {
      const h3 = document.querySelector("h3");
      const p = document.querySelector("h3 + p");
      return {
        date: new Date().toISOString().split("T")[0],
        alert: (h3?.innerText || "❌ ไม่พบหัวข้อ") + "\n" + (p?.innerText || "❌ ไม่พบเนื้อหา")
      };
    });

    console.log("📋 ข้อความที่ scrape ได้:");
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
