import json
import os
import re
import urllib.parse
import csv

with open('public/images/image-attribution.json', 'r', encoding='utf-8') as f:
    attribution_data = json.load(f)

with open('src/utils/recipeImageCatalog.ts', 'r', encoding='utf-8') as f:
    catalog_text = f.read()

catalog_entries = {}
for entry in catalog_text.split('{'):
    canonical_match = re.search(r'"canonical":\s*"(.*?)"', entry)
    image_match = re.search(r'"image":\s*"(.*?)"', entry)
    if canonical_match and image_match:
        catalog_entries[image_match.group(1)] = canonical_match.group(1)

report = []
suspicious_count = 0
verified_count = 0
suspicious_files = []

for filename, meta in attribution_data.items():
    if filename == "default-food.webp": continue
    
    canonical_name = catalog_entries.get(filename, "Unknown")
    is_suspicious = False
    reason = ""
    
    source_url = meta.get('sourceUrl', '')
    url_filename = source_url.split('/')[-1]
    url_filename = urllib.parse.unquote(url_filename).lower()
    
    # 1. Flag explicit known bad file
    if filename == "paneer-bhurji.webp":
        is_suspicious = True
        reason = "Explicitly flagged by user as incorrect photograph"
        
    # 2. Flag if source URL suggests a platter/multiple dishes rather than a standalone dish
    elif ',' in url_filename and ('thali' in url_filename or 'platter' in url_filename or len(url_filename.split(',')) >= 2):
        is_suspicious = True
        reason = f"Source image appears to be a platter/multiple dishes: {url_filename}"
        
    # 3. Flag if the url filename has absolutely no words from the canonical name
    elif canonical_name != "Unknown" and "local://" not in source_url:
        canonical_words = set(re.findall(r'[a-z]+', canonical_name.lower()))
        url_words = set(re.findall(r'[a-z]+', url_filename))
        
        # Don't penalize for common small words
        canonical_words = {w for w in canonical_words if len(w) > 2 and w not in ['the', 'and', 'with', 'style', 'recipe', 'indian']}
        
        matched_words = canonical_words.intersection(url_words)
        
        if len(matched_words) == 0:
            is_suspicious = True
            reason = f"Source URL filename '{url_filename}' doesn't mention any main words from '{canonical_name}'"
            
    if is_suspicious:
        suspicious_count += 1
        suspicious_files.append(filename)
        status = "SUSPICIOUS"
    else:
        verified_count += 1
        status = "VERIFIED"
        
    report.append({
        "recipe": canonical_name,
        "filename": filename,
        "source": meta.get('source', ''),
        "license": meta.get('license', ''),
        "catalog_match": canonical_name != "Unknown",
        "status": status,
        "reason": reason
    })

print(f"Total: {len(report)}")
print(f"Verified: {verified_count}")
print(f"Suspicious: {suspicious_count}")
print("Suspicious files:", suspicious_files)

with open('tools/image-data-quality-report.json', 'w', encoding='utf-8') as f:
    json.dump(report, f, indent=2)

with open('tools/image-data-quality-report.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=["recipe", "filename", "source", "license", "catalog_match", "status", "reason"])
    writer.writeheader()
    writer.writerows(report)
    
with open('tools/suspicious_files.json', 'w', encoding='utf-8') as f:
    json.dump(suspicious_files, f)
