import requests
import xml.etree.ElementTree as ET
import json
from datetime import date

def scrape_tmd_storm():
    url = "https://www.tmd.go.th/en/api/xml/storm-tracking"
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        root = ET.fromstring(r.content)

        # ดึง item ตัวแรก
        item = root.find(".//item")
        if item is not None:
            title = item.findtext("title", default="(no title)").strip()
            desc_raw = item.findtext("description", default="(no description)").strip()

            # ลบ CDATA ถ้ามี
            if desc_raw.startswith("<![CDATA["):
                desc = desc_raw.replace("<![CDATA[", "").replace("]]>", "").strip()
            else:
                desc = desc_raw

            alert = f"{title}\n{desc}"
        else:
            alert = "❌ No storm info found."

        # สร้าง JSON ไฟล์
        data = {
            "date": date.today().isoformat(),
            "alert": alert
        }

        with open("today.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("✅ today.json created:", alert)

    except Exception as e:
        print("❌ Error while fetching storm data:", e)

if __name__ == "__main__":
    scrape_tmd_storm()
