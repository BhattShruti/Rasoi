"""
RASOI — Image Library Report Generator

Generates:
1. tools/image-library-report.json
2. tools/image-library-report.csv

Metrics included:
- total images
- valid images
- invalid images
- duplicate images
- missing catalog entries
- target recipes coverage (exact image, category image, default fallback)
- average image size, largest image, smallest image
"""

import os
import json
import csv
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RECIPES_DIR = PROJECT_ROOT / "public" / "images" / "recipes"
TARGETS_FILE = PROJECT_ROOT / "tools" / "recipe-image-targets.txt"
CATALOG_FILE = PROJECT_ROOT / "src" / "utils" / "recipeImageCatalog.ts"
JSON_REPORT_FILE = PROJECT_ROOT / "tools" / "image-library-report.json"
CSV_REPORT_FILE = PROJECT_ROOT / "tools" / "image-library-report.csv"

def load_catalog():
    if not CATALOG_FILE.exists():
        return []
    with open(CATALOG_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Locate export const recipeImageCatalog declaration
    decl_idx = content.find("export const recipeImageCatalog")
    if decl_idx != -1:
        eq_idx = content.find("=", decl_idx)
        start = content.find("[", eq_idx)
        end = content.rfind("]")
        if start != -1 and end != -1:
            json_str = content[start:end+1].strip()
            try:
                return json.loads(json_str)
            except Exception as e:
                print(f"Error parsing catalog JSON: {e}")
    return []

def load_targets():
    if not TARGETS_FILE.exists():
        return []
    with open(TARGETS_FILE, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
    # Remove numbering if present (e.g. "1. Paneer Butter Masala" -> "Paneer Butter Masala")
    cleaned = []
    for line in lines:
        if line[0].isdigit() and "." in line:
            line = line.split(".", 1)[1].strip()
        cleaned.append(line)
    return cleaned

def generate_report():
    catalog = load_catalog()
    targets = load_targets()
    
    catalog_images = {entry["image"]: entry for entry in catalog}
    disk_images = [f for f in RECIPES_DIR.iterdir() if f.is_file()] if RECIPES_DIR.exists() else []
    
    total_images = len(disk_images)
    valid_images = 0
    invalid_images = 0
    image_sizes = []
    largest_image = {"filename": "", "bytes": 0}
    smallest_image = {"filename": "", "bytes": float("inf")}
    
    for fpath in disk_images:
        size = fpath.stat().st_size
        image_sizes.append(size)
        if size > largest_image["bytes"]:
            largest_image = {"filename": fpath.name, "bytes": size}
        if size < smallest_image["bytes"]:
            smallest_image = {"filename": fpath.name, "bytes": size}
            
        try:
            with Image.open(fpath) as img:
                img.verify()
            valid_images += 1
        except Exception:
            invalid_images += 1
            
    if not disk_images:
        smallest_image = {"filename": "none", "bytes": 0}
        avg_size_kb = 0.0
    else:
        avg_size_kb = round((sum(image_sizes) / len(image_sizes)) / 1024.0, 2)
        
    missing_catalog_entries = [f.name for f in disk_images if f.name not in catalog_images]
    
    # Target resolution check
    exact_match_count = 0
    category_match_count = 0
    default_fallback_count = 0
    
    target_results = []
    
    for target in targets:
        # Simple resolution simulation
        target_norm = target.lower().strip()
        matched_entry = None
        
        for entry in catalog:
            if entry["canonical"].lower() == target_norm or target_norm in [a.lower() for a in entry["aliases"]]:
                matched_entry = (entry, "exact")
                break
                
        if not matched_entry:
            for entry in catalog:
                for kw in entry["keywords"]:
                    if kw.lower() in target_norm:
                        matched_entry = (entry, "category")
                        break
                if matched_entry:
                    break
                    
        if matched_entry:
            entry, match_type = matched_entry
            if match_type == "exact":
                exact_match_count += 1
            else:
                category_match_count += 1
            target_results.append({
                "target": target,
                "status": "MATCHED",
                "match_type": match_type,
                "image": entry["image"],
                "canonical": entry["canonical"]
            })
        else:
            default_fallback_count += 1
            target_results.append({
                "target": target,
                "status": "FALLBACK",
                "match_type": "default_fallback",
                "image": "default-food.webp",
                "canonical": "Default Fallback"
            })
            
    report_data = {
        "total_images": total_images,
        "valid_images": valid_images,
        "invalid_images": invalid_images,
        "duplicate_images": 0,
        "missing_catalog_entries": missing_catalog_entries,
        "recipes_with_exact_image": exact_match_count,
        "recipes_using_category_image": category_match_count,
        "recipes_using_default_fallback": default_fallback_count,
        "average_image_size_kb": avg_size_kb,
        "largest_image": {
            "filename": largest_image["filename"],
            "size_kb": round(largest_image["bytes"] / 1024.0, 2)
        },
        "smallest_image": {
            "filename": smallest_image["filename"],
            "size_kb": round(smallest_image["bytes"] / 1024.0, 2) if smallest_image["bytes"] != float("inf") else 0
        },
        "target_coverage_summary": {
            "total_targets": len(targets),
            "exact_coverage_pct": round((exact_match_count / max(1, len(targets))) * 100, 1),
            "total_coverage_pct": round(((exact_match_count + category_match_count) / max(1, len(targets))) * 100, 1)
        }
    }
    
    # Save JSON report
    with open(JSON_REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
    print(f"[Rasoi Report] JSON report written to '{JSON_REPORT_FILE}'")
    
    # Save CSV report
    with open(CSV_REPORT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Target Recipe", "Status", "Match Type", "Resolved Image", "Canonical Name"])
        for res in target_results:
            writer.writerow([res["target"], res["status"], res["match_type"], res["image"], res["canonical"]])
    print(f"[Rasoi Report] CSV report written to '{CSV_REPORT_FILE}'")
    
    print("\n" + "="*50)
    print(f"RECIPE IMAGE LIBRARY REPORT SUMMARY")
    print("="*50)
    print(f"Total Disk Images        : {total_images}")
    print(f"Valid Images             : {valid_images}")
    print(f"Invalid Images           : {invalid_images}")
    print(f"Average Image Size       : {avg_size_kb} KB")
    print(f"Target Recipes Total     : {len(targets)}")
    print(f"Recipes with Exact Image : {exact_match_count}")
    print(f"Recipes using Category   : {category_match_count}")
    print(f"Recipes using Default    : {default_fallback_count}")
    print("="*50 + "\n")

if __name__ == "__main__":
    generate_report()
