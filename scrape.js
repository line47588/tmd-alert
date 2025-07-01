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
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // ✅ รอจนกว่าคำว่า "พายุ" ปรากฏบนหน้า
    await page.waitForFunction(() => {
      return [...document.querySelectorAll("h3")].some(el => el.innerText.includes("พายุ"));
    }, { timeout: 15000 });

    const result = await page.evaluate(() => {
      const heading = [...document.querySelectorAll("h3")].find(el => el.innerText.includes("พายุ"));
      const para = heading?.nextElementSibling;
      return {
        date: new Date().toISOString().split("T")[0],
        alert: (heading?.innerText || "❌ ไม่พบหัวข้อพายุ") + "\n" +
               (para?.innerText || "❌ ไม่พบเนื้อหา")
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
