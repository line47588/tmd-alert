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

    // ✅ ดึงทุก <p> ในส่วนหลัก
    const result = await page.evaluate(() => {
      const paragraphs = [...document.querySelectorAll("div.tmd-main-content p")];
      const allText = paragraphs.map(p => p.innerText.trim()).filter(p => p.length > 0);
      
      return {
        date: new Date().toISOString().split("T")[0],
        alert: allText.slice(0, 5).join("\n---\n")  // ดึง 5 ย่อหน้าแรกพร้อมแบ่ง
      };
    });

    console.log("📋 Debug ข้อความที่ดึงได้:");
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
