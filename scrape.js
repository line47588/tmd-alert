const fs = require("fs");
const https = require("https");
const { parseStringPromise } = require("xml2js");

(async () => {
  try {
    const url = "https://www.tmd.go.th/en/api/xml/storm-tracking";

    https.get(url, (res) => {
      let data = "";

      res.on("data", chunk => data += chunk);
      res.on("end", async () => {
        try {
          const xml = await parseStringPromise(data);
          const item = xml.rss.channel[0].item?.[0];

          const title = item.title?.[0]?.trim() || "❌ No title";
          const rawDesc = item.description?.[0]?.trim() || "";
          const desc = rawDesc.replace(/<!\[CDATA\[|\]\]>/g, "").trim();

          const result = {
            date: new Date().toISOString().split("T")[0],
            alert: `${title}\n${desc}`
          };

          fs.writeFileSync("today.json", JSON.stringify(result, null, 2), "utf8");
          console.log("✅ today.json created");
          console.log(result.alert);
        } catch (e) {
          console.error("❌ Failed to parse XML:", e);
          process.exit(1);
        }
      });
    }).on("error", (err) => {
      console.error("❌ Request failed:", err);
      process.exit(1);
    });

  } catch (err) {
    console.error("❌ Scraper crashed:", err);
    process.exit(1);
  }
})();
