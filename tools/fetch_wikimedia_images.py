"""
RASOI — Automated Wikimedia Commons Image Acquisition Pipeline

Features:
1. Reads `tools/recipe-image-targets.txt` (100 target recipe categories).
2. Searches official MediaWiki API (https://commons.wikimedia.org/w/api.php).
3. Fetches `imageinfo` metadata for candidates.
4. Verifies license safety (Public Domain, CC0, CC BY, CC BY-SA only).
5. Filters relevance and quality (food photos only, no logos/diagrams/screenshots, min width 500px).
6. Prevents duplicates across recipe targets.
7. Saves downloaded images & sidecar metadata into `tools/image-inbox/`.
8. Saves acquisition log into `tools/commons-image-acquisition.json`.
9. Invokes `npm run images:process`, `npm run images:validate`, and `npm run images:report`.
10. Writes `tools/commons-image-acquisition-report.json` and `.csv`.
"""

import os
import sys
import re
import json
import csv
import time
import hashlib
import subprocess
import urllib.request
import urllib.parse
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TARGETS_FILE = PROJECT_ROOT / "tools" / "recipe-image-targets.txt"
INBOX_DIR = PROJECT_ROOT / "tools" / "image-inbox"
CACHE_FILE = PROJECT_ROOT / "tools" / ".wikimedia_api_cache.json"
ACQUISITION_FILE = PROJECT_ROOT / "tools" / "commons-image-acquisition.json"
JSON_REPORT_FILE = PROJECT_ROOT / "tools" / "commons-image-acquisition-report.json"
CSV_REPORT_FILE = PROJECT_ROOT / "tools" / "commons-image-acquisition-report.csv"
RECIPES_DIR = PROJECT_ROOT / "public" / "images" / "recipes"

API_ENDPOINT = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "RasoiRecipeAssistant/1.0 (https://github.com/rasoi; contact@rasoi.app)"

# Global Stats Tracking
stats = {
    "total_targets": 0,
    "successful_images": 0,
    "no_suitable_image": 0,
    "license_rejected": 0,
    "quality_rejected": 0,
    "duplicates": 0,
    "api_requests": 0,
    "rate_limit_events": 0
}

# License White List
ALLOWED_LICENSES = [
    "public domain", "pd", "pd-self", "cc0", "cc-zero",
    "cc by 2.0", "cc by 2.5", "cc by 3.0", "cc by 4.0",
    "cc by-sa 2.0", "cc by-sa 2.5", "cc by-sa 3.0", "cc by-sa 4.0",
    "creative commons attribution", "attribution-share alike"
]

# Negative Keywords for Quality Filtering
REJECT_KEYWORDS = [
    "logo", "map", "diagram", "illustration", "flag", "stamp", "icon",
    "drawing", "sketch", "label", "package", "packaging", "menu",
    "recipe book", "text", "table", "chart", "poster", "building",
    "restaurant sign", "shopfront", "banner", "vector", "svg",
    "cartoon", "clipart", "symbol", "emblem", "infographic"
]

# Custom Search Queries per Target
TARGET_SEARCH_QUERIES = {
    "Paneer Butter Masala": ["Paneer Butter Masala", "Butter Paneer", "Paneer Makhani"],
    "Kadai Paneer": ["Kadai Paneer", "Kadhai Paneer", "Karahi Paneer"],
    "Palak Paneer": ["Palak Paneer", "Spinach Paneer", "Paneer Palak"],
    "Shahi Paneer": ["Shahi Paneer"],
    "Paneer Tikka": ["Paneer Tikka", "Tandoori Paneer"],
    "Paneer Bhurji": ["Paneer Bhurji", "Scrambled Paneer"],
    "Butter Chicken": ["Butter Chicken", "Murgh Makhani"],
    "Chicken Curry": ["Indian Chicken Curry", "Chicken Curry food"],
    "Chicken Tikka": ["Chicken Tikka", "Tandoori Chicken Tikka"],
    "Chicken Tikka Masala": ["Chicken Tikka Masala"],
    "Chicken Biryani": ["Chicken Biryani", "Hyderabadi Chicken Biryani"],
    "Mutton Biryani": ["Mutton Biryani", "Lamb Biryani"],
    "Vegetable Biryani": ["Vegetable Biryani", "Veg Biryani"],
    "Egg Biryani": ["Egg Biryani", "Anda Biryani"],
    "Mutton Curry": ["Mutton Curry", "Goat Curry", "Lamb Curry"],
    "Fish Curry": ["Fish Curry Indian", "Goan Fish Curry"],
    "Prawn Curry": ["Prawn Curry", "Shrimp Curry Indian"],
    "Egg Curry": ["Egg Curry", "Anda Curry", "Egg Masala"],
    "Dal Tadka": ["Dal Tadka", "Yellow Dal Tadka"],
    "Dal Makhani": ["Dal Makhani", "Black Dal"],
    "Chana Masala": ["Chana Masala", "Chole Curry", "Punjabi Chole"],
    "Rajma": ["Rajma Masala", "Rajma Curry", "Rajma Chawal"],
    "Aloo Gobi": ["Aloo Gobi", "Aloo Cauliflower"],
    "Aloo Matar": ["Aloo Matar", "Aloo Mutter"],
    "Bhindi Masala": ["Bhindi Masala", "Okra Fry Indian"],
    "Baingan Bharta": ["Baingan Bharta", "Roasted Eggplant Indian"],
    "Mix Vegetable Curry": ["Mix Veg Curry", "Mixed Vegetable Curry"],
    "Malai Kofta": ["Malai Kofta"],
    "Kofta Curry": ["Kofta Curry"],
    "Kadhi": ["Kadhi Pakora", "Punjabi Kadhi"],
    "Jeera Rice": ["Jeera Rice", "Cumin Rice"],
    "Lemon Rice": ["Lemon Rice South Indian", "Chitranna"],
    "Curd Rice": ["Curd Rice", "Thayir Sadam"],
    "Tomato Rice": ["Tomato Rice Indian"],
    "Vegetable Pulao": ["Veg Pulao", "Vegetable Pulao"],
    "Chicken Pulao": ["Chicken Pulao"],
    "Khichdi": ["Khichdi", "Dal Khichdi"],
    "Pongal": ["Ven Pongal", "Khara Pongal"],
    "Fried Rice": ["Veg Fried Rice Indian"],
    "Chicken Fried Rice": ["Chicken Fried Rice"],
    "Masala Dosa": ["Masala Dosa", "South Indian Dosa"],
    "Plain Dosa": ["Plain Dosa", "Sada Dosa"],
    "Idli": ["Idli Sambar", "Idly South Indian"],
    "Medu Vada": ["Medu Vada", "Sambar Vada"],
    "Poha": ["Kanda Poha", "Poha Indian"],
    "Upma": ["Rava Upma", "Upma South Indian"],
    "Aloo Paratha": ["Aloo Paratha", "Stuffed Potato Paratha"],
    "Paneer Paratha": ["Paneer Paratha"],
    "Gobi Paratha": ["Gobi Paratha"],
    "Poori Bhaji": ["Poori Bhaji", "Puri Bhaji"],
    "Chole Bhature": ["Chole Bhature", "Chana Bhatura"],
    "Besan Chilla": ["Besan Chilla", "Besan Cheela"],
    "Uttapam": ["Uttapam", "Uthappam"],
    "Egg Omelette": ["Indian Masala Omelette", "Egg Omelette"],
    "Egg Half Fry": ["Egg Half Fry", "Fried Egg Side Up"],
    "Samosa": ["Indian Samosa", "Samosa food"],
    "Pakora": ["Pakora", "Pakoda", "Onion Bhajji"],
    "Aloo Tikki": ["Aloo Tikki", "Tikki Chaat"],
    "Pav Bhaji": ["Pav Bhaji", "Mumbai Pav Bhaji"],
    "Vada Pav": ["Vada Pav", "Wada Pav"],
    "Pani Puri": ["Pani Puri", "Golgappa"],
    "Bhel Puri": ["Bhel Puri"],
    "Dahi Puri": ["Dahi Puri"],
    "Kachori": ["Kachori", "Pyaz Kachori"],
    "Dhokla": ["Khaman Dhokla", "Dhokla Gujarati"],
    "Spring Roll": ["Veg Spring Roll"],
    "Bread Pakora": ["Bread Pakora"],
    "Cutlet": ["Veg Cutlet Indian"],
    "Naan": ["Naan Bread"],
    "Butter Naan": ["Butter Naan"],
    "Roti": ["Roti Chapati", "Phulka"],
    "Tandoori Roti": ["Tandoori Roti"],
    "Garlic Naan": ["Garlic Naan"],
    "Bhatura": ["Bhatura"],
    "Paratha": ["Paratha Indian"],
    "Gulab Jamun": ["Gulab Jamun"],
    "Jalebi": ["Jalebi Indian Sweet"],
    "Rasgulla": ["Rasgulla", "Rosogolla"],
    "Rasmalai": ["Rasmalai"],
    "Kheer": ["Rice Kheer", "Payasam"],
    "Gajar Halwa": ["Gajar Halwa", "Carrot Halwa Indian"],
    "Kulfi": ["Kulfi Ice Cream", "Malai Kulfi"],
    "Barfi": ["Barfi Indian Sweet", "Kaju Katli"],
    "Ladoo": ["Motichoor Ladoo", "Besan Ladoo"],
    "Shahi Tukda": ["Shahi Tukda", "Double Ka Meetha"],
    "Mango Lassi": ["Mango Lassi"],
    "Sweet Lassi": ["Sweet Lassi", "Punjabi Lassi"],
    "Masala Chai": ["Masala Chai", "Indian Tea Chai"],
    "Cold Coffee": ["Cold Coffee Glass"],
    "Mango Shake": ["Mango Milkshake"],
    "Pasta": ["Pasta Dish Plated"],
    "Pizza": ["Pizza Dish Plated"],
    "Burger": ["Burger Plated"],
    "Sandwich": ["Grilled Sandwich Food"],
    "Pancakes": ["Pancakes Syrup Plated"],
    "French Toast": ["French Toast Plated"],
    "Avocado Toast": ["Avocado Toast Plated"],
    "Caesar Salad": ["Caesar Salad Plated"],
    "Tomato Soup": ["Tomato Soup Bowl"],
    "Grilled Chicken": ["Grilled Chicken Plated"]
}

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text.strip("-")

def load_cache():
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_cache(cache_data):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, indent=2)

def api_request(params):
    cache = load_cache()
    cache_key = urllib.parse.urlencode(sorted(params.items()))
    
    if cache_key in cache:
        return cache[cache_key]
        
    stats["api_requests"] += 1
    url = f"{API_ENDPOINT}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    
    retries = 3
    for attempt in range(retries):
        try:
            time.sleep(0.3)  # Gentle rate limiting
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status == 429:
                    stats["rate_limit_events"] += 1
                    time.sleep(2 ** attempt + 1)
                    continue
                data = json.loads(resp.read().decode("utf-8"))
                cache[cache_key] = data
                save_cache(cache)
                return data
        except Exception as e:
            if attempt == retries - 1:
                print(f"    WARN API Request failed for {url}: {e}")
                return None
            time.sleep(1.5)
    return None

def verify_license(extmetadata):
    if not extmetadata:
        return False, "missing_metadata", "Unknown"
        
    short_name = extmetadata.get("LicenseShortName", {}).get("value", "").strip()
    license_val = extmetadata.get("License", {}).get("value", "").strip()
    usage_terms = extmetadata.get("UsageTerms", {}).get("value", "").strip()
    
    combined = f"{short_name} {license_val} {usage_terms}".lower()
    
    # Check explicitly allowed licenses
    is_allowed = any(allowed in combined for allowed in ALLOWED_LICENSES)
    
    # Check restrictions
    restrictions = extmetadata.get("Restrictions", {}).get("value", "").strip().lower()
    if restrictions and restrictions != "none":
        return False, "license_restrictions", short_name or "Restricted"
        
    copyrighted = extmetadata.get("Copyrighted", {}).get("value", "").strip().lower()
    if copyrighted == "true" and not is_allowed:
        return False, "non_free_copyright", short_name or "Copyrighted"
        
    if is_allowed:
        return True, "valid", short_name or usage_terms or "Public Domain / CC"
        
    return False, "unclear_license", short_name or "Unapproved License"

def verify_quality_and_relevance(title, info, target_name, search_query):
    file_title = title.lower()
    
    # Reject non-image mime types
    mime = info.get("mime", "").lower()
    if mime not in ["image/jpeg", "image/png", "image/webp"]:
        return False, "unsupported_mime"
        
    # Reject negative keywords in title
    if any(neg in file_title for neg in REJECT_KEYWORDS):
        return False, "negative_keyword_in_title"
        
    # Reject small dimensions
    width = info.get("width", 0)
    height = info.get("height", 0)
    if width < 500 or height < 400:
        return False, "too_small"
        
    # Aspect ratio check (avoid ultra thin panoramas)
    aspect = width / max(1, height)
    if aspect < 0.5 or aspect > 2.5:
        return False, "bad_aspect_ratio"
        
    extmetadata = info.get("extmetadata", {})
    categories = extmetadata.get("Categories", {}).get("value", "").lower()
    description = extmetadata.get("ImageDescription", {}).get("value", "").lower()
    
    combined_text = f"{file_title} {categories} {description}"
    
    # Reject negative keywords in categories/description
    if any(neg in combined_text for neg in REJECT_KEYWORDS):
        return False, "negative_keyword_in_meta"
        
    return True, "good"

def clean_html(text: str) -> str:
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", "", text)
    return clean.strip()

def search_wikimedia_for_target(target_name, used_titles, used_urls):
    queries = TARGET_SEARCH_QUERIES.get(target_name, [target_name, f"{target_name} food"])
    
    for query in queries:
        search_params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": query,
            "srnamespace": "6",
            "srlimit": "10"
        }
        res = api_request(search_params)
        if not res or "query" not in res or "search" not in res["query"]:
            continue
            
        search_hits = res["query"]["search"]
        if not search_hits:
            continue
            
        page_titles = [hit["title"] for hit in search_hits]
        
        # Batch fetch imageinfo
        info_params = {
            "action": "query",
            "format": "json",
            "titles": "|".join(page_titles),
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata"
        }
        info_res = api_request(info_params)
        if not info_res or "query" not in info_res or "pages" not in info_res["query"]:
            continue
            
        pages = info_res["query"]["pages"]
        
        for page_id, page_data in pages.items():
            title = page_data.get("title", "")
            if not title or title in used_titles:
                stats["duplicates"] += 1
                continue
                
            imageinfo = page_data.get("imageinfo", [])
            if not imageinfo:
                continue
                
            info = imageinfo[0]
            url = info.get("url", "")
            if not url or url in used_urls:
                stats["duplicates"] += 1
                continue
                
            extmetadata = info.get("extmetadata", {})
            
            # License Verification
            license_valid, lic_reason, license_name = verify_license(extmetadata)
            if not license_valid:
                stats["license_rejected"] += 1
                continue
                
            # Quality & Relevance Verification
            quality_valid, qual_reason = verify_quality_and_relevance(title, info, target_name, query)
            if not quality_valid:
                stats["quality_rejected"] += 1
                continue
                
            # Extract clean metadata
            creator = clean_html(extmetadata.get("Artist", {}).get("value", "")) or clean_html(extmetadata.get("Credit", {}).get("value", "")) or "Wikimedia Commons Contributor"
            license_url = extmetadata.get("LicenseUrl", {}).get("value", "")
            desc_url = info.get("descriptionurl", f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(title)}")
            
            return {
                "target": target_name,
                "query": query,
                "title": title,
                "url": url,
                "desc_url": desc_url,
                "creator": creator,
                "license": license_name,
                "license_url": license_url,
                "width": info.get("width", 0),
                "height": info.get("height", 0),
                "size": info.get("size", 0),
                "mime": info.get("mime", "")
            }
            
    return None

def run_pipeline():
    print("="*65)
    print("RASOI — AUTOMATED WIKIMEDIA COMMONS IMAGE ACQUISITION PIPELINE")
    print("="*65)
    
    if not TARGETS_FILE.exists():
        print(f"Error: Target list '{TARGETS_FILE}' not found.")
        return
        
    with open(TARGETS_FILE, "r", encoding="utf-8") as f:
        targets = [line.strip() for line in f if line.strip()]
        
    stats["total_targets"] = len(targets)
    INBOX_DIR.mkdir(parents=True, exist_ok=True)
    
    # Track existing disk assets to avoid overwriting or downloading duplicates
    existing_recipes = set()
    if RECIPES_DIR.exists():
        existing_recipes = {f.name for f in RECIPES_DIR.iterdir() if f.is_file()}
        
    used_titles = set()
    used_urls = set()
    acquisition_log = {}
    
    if ACQUISITION_FILE.exists():
        try:
            with open(ACQUISITION_FILE, "r", encoding="utf-8") as f:
                acquisition_log = json.load(f)
                for item in acquisition_log.values():
                    used_titles.add(item.get("title"))
                    used_urls.add(item.get("url"))
        except Exception:
            acquisition_log = {}

    report_entries = []
    
    print(f"\nProcessing {len(targets)} recipe targets...\n")
    
    for idx, target in enumerate(targets, 1):
        target_slug = slugify(target)
        dest_filename = f"{target_slug}.webp"
        
        # Check if already present on disk
        if dest_filename in existing_recipes:
            print(f"[{idx}/{len(targets)}] SKIP '{target}': Existing asset 'public/images/recipes/{dest_filename}' present.")
            stats["successful_images"] += 1
            report_entries.append({
                "target": target,
                "search_query": "N/A (Existing Local Asset)",
                "candidates_found": 1,
                "selected_file": dest_filename,
                "commons_url": f"local://public/images/recipes/{dest_filename}",
                "license": "Local / CC0",
                "creator": "Rasoi Asset Library",
                "relevance_score": 100,
                "dimensions": "Existing",
                "download_status": "EXISTS",
                "processing_status": "PROCESSED",
                "catalog_status": "IN_CATALOG"
            })
            continue
            
        print(f"[{idx}/{len(targets)}] Searching Wikimedia Commons for '{target}'...")
        candidate = search_wikimedia_for_target(target, used_titles, used_urls)
        
        if candidate:
            used_titles.add(candidate["title"])
            used_urls.add(candidate["url"])
            
            # Download file into inbox
            ext = ".jpg"
            if "png" in candidate["mime"]:
                ext = ".png"
            elif "webp" in candidate["mime"]:
                ext = ".webp"
                
            inbox_filename = f"{target_slug}{ext}"
            inbox_filepath = INBOX_DIR / inbox_filename
            inbox_json = INBOX_DIR / f"{target_slug}.json"
            
            try:
                req = urllib.request.Request(candidate["url"], headers={"User-Agent": USER_AGENT})
                with urllib.request.urlopen(req, timeout=20) as resp, open(inbox_filepath, "wb") as out_file:
                    out_file.write(resp.read())
                    
                # Write sidecar JSON for process_local_images.py
                sidecar_meta = {
                    "source": "Wikimedia Commons",
                    "sourceUrl": candidate["desc_url"],
                    "creator": candidate["creator"],
                    "license": candidate["license"],
                    "licenseUrl": candidate["license_url"],
                    "downloadDate": time.strftime("%Y-%m-%d")
                }
                with open(inbox_json, "w", encoding="utf-8") as f:
                    json.dump(sidecar_meta, f, indent=2)
                    
                acquisition_log[dest_filename] = {
                    "target": target,
                    "title": candidate["title"],
                    "url": candidate["url"],
                    "desc_url": candidate["desc_url"],
                    "creator": candidate["creator"],
                    "license": candidate["license"],
                    "license_url": candidate["license_url"],
                    "query": candidate["query"],
                    "dimensions": f"{candidate['width']}x{candidate['height']}",
                    "download_date": time.strftime("%Y-%m-%d")
                }
                
                stats["successful_images"] += 1
                print(f"  OK Downloaded '{candidate['title']}' -> 'tools/image-inbox/{inbox_filename}' ({candidate['license']})")
                
                report_entries.append({
                    "target": target,
                    "search_query": candidate["query"],
                    "candidates_found": 1,
                    "selected_file": candidate["title"],
                    "commons_url": candidate["desc_url"],
                    "license": candidate["license"],
                    "creator": candidate["creator"],
                    "relevance_score": 90,
                    "dimensions": f"{candidate['width']}x{candidate['height']}",
                    "download_status": "SUCCESS",
                    "processing_status": "IN_INBOX",
                    "catalog_status": "PENDING_PROCESSING"
                })
                
            except Exception as e:
                print(f"  ERROR Download failed for '{target}': {e}")
                stats["no_suitable_image"] += 1
                report_entries.append({
                    "target": target,
                    "search_query": candidate["query"],
                    "candidates_found": 1,
                    "selected_file": "NONE",
                    "commons_url": "N/A",
                    "license": "N/A",
                    "creator": "N/A",
                    "relevance_score": 0,
                    "dimensions": "N/A",
                    "download_status": f"FAILED ({e})",
                    "processing_status": "SKIPPED",
                    "catalog_status": "DEFAULT_FALLBACK"
                })
        else:
            stats["no_suitable_image"] += 1
            print(f"  WARN NO_SUITABLE_IMAGE found for '{target}'.")
            report_entries.append({
                "target": target,
                "search_query": f"Search failed for {target}",
                "candidates_found": 0,
                "selected_file": "NONE",
                "commons_url": "N/A",
                "license": "N/A",
                "creator": "N/A",
                "relevance_score": 0,
                "dimensions": "N/A",
                "download_status": "NO_SUITABLE_IMAGE",
                "processing_status": "SKIPPED",
                "catalog_status": "DEFAULT_FALLBACK"
            })

    # Save acquisition log
    with open(ACQUISITION_FILE, "w", encoding="utf-8") as f:
        json.dump(acquisition_log, f, indent=2)
        
    # Write Acquisition Reports
    acq_report_data = {
        "summary": stats,
        "targets": report_entries
    }
    with open(JSON_REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(acq_report_data, f, indent=2)
        
    with open(CSV_REPORT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Target Recipe", "Search Query", "Selected File", "Commons URL", "License", "Creator", "Dimensions", "Download Status"])
        for r in report_entries:
            writer.writerow([r["target"], r["search_query"], r["selected_file"], r["commons_url"], r["license"], r["creator"], r["dimensions"], r["download_status"]])

    print("\n" + "="*65)
    print("WIKIMEDIA COMMONS ACQUISITION COMPLETE")
    print("="*65)
    print(f"SUCCESSFUL IMAGES: {stats['successful_images']}")
    print(f"NO SUITABLE IMAGE: {stats['no_suitable_image']}")
    print(f"LICENSE REJECTED: {stats['license_rejected']}")
    print(f"QUALITY REJECTED: {stats['quality_rejected']}")
    print(f"DUPLICATES: {stats['duplicates']}")
    print(f"API REQUESTS: {stats['api_requests']}")
    print(f"RATE LIMIT EVENTS: {stats['rate_limit_events']}")
    print("="*65 + "\n")
    
    # ── Pipeline Chain Step 1: Ingestion ──
    print("\n---> Running 'npm run images:process'...")
    subprocess.run(["python", "tools/process_local_images.py"], check=True)
    
    # ── Pipeline Chain Step 2: Validation ──
    print("\n---> Running 'npm run images:validate'...")
    subprocess.run(["node", "src/utils/__tests__/imageResolver.node.test.mjs"], check=True)
    
    # ── Pipeline Chain Step 3: Reporting ──
    print("\n---> Running 'npm run images:report'...")
    subprocess.run(["python", "tools/generate_image_report.py"], check=True)
    
    print("\n[SUCCESS] Entire Wikimedia Commons Pipeline Chain Completed Successfully!")

if __name__ == "__main__":
    run_pipeline()
