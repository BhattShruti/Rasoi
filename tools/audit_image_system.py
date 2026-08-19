"""
RASOI — Image & Catalog Integrity Audit Script

Scans `public/images/recipes/` and `src/utils/recipeImageCatalog.ts`
Generates `tools/image-integrity-report.json`
"""

import os
import json
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RECIPES_DIR = PROJECT_ROOT / "public" / "images" / "recipes"
CATALOG_FILE = PROJECT_ROOT / "src" / "utils" / "recipeImageCatalog.ts"
REPORT_FILE = PROJECT_ROOT / "tools" / "image-integrity-report.json"

def load_catalog():
    if not CATALOG_FILE.exists():
        return []
    with open(CATALOG_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    decl_idx = content.find("export const recipeImageCatalog")
    if decl_idx != -1:
        eq_idx = content.find("=", decl_idx)
        start = content.find("[", eq_idx)
        end = content.rfind("]")
        if start != -1 and end != -1:
            try:
                return json.loads(content[start:end+1].strip())
            except Exception as e:
                print(f"Error parsing catalog: {e}")
    return []

def audit_images():
    catalog = load_catalog()
    catalog_map = {entry["image"]: entry for entry in catalog}
    
    disk_files = sorted([f for f in RECIPES_DIR.iterdir() if f.is_file()]) if RECIPES_DIR.exists() else []
    
    report_entries = []
    seen_hashes = {}
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0
    unknown_count = 0
    stale_catalog_entries = 0
    
    disk_filenames = {f.name for f in disk_files}
    
    # Audit catalog for stale entries
    stale_entries = [entry["image"] for entry in catalog if entry["image"] not in disk_filenames]
    stale_catalog_entries = len(stale_entries)
    
    for fpath in disk_files:
        filename = fpath.name
        exists = True
        valid = False
        width, height = 0, 0
        fmt = fpath.suffix.upper().replace(".", "")
        intended_recipe = "Unknown"
        status = "UNKNOWN"
        
        if filename in catalog_map:
            intended_recipe = catalog_map[filename]["canonical"]
            
        try:
            with Image.open(fpath) as img:
                img.verify()
            with Image.open(fpath) as img:
                width, height = img.size
                fmt = img.format or fmt
            valid = True
            
            # Simple content duplicate check by dimensions and file size
            file_sig = (fpath.stat().st_size, width, height)
            if file_sig in seen_hashes:
                status = "DUPLICATE"
                duplicate_count += 1
            else:
                seen_hashes[file_sig] = filename
                if filename in catalog_map:
                    status = "VALID"
                    valid_count += 1
                else:
                    status = "UNKNOWN"
                    unknown_count += 1
                    
        except Exception:
            status = "INVALID"
            invalid_count += 1
            
        report_entries.append({
            "filename": filename,
            "exists": exists,
            "valid": valid,
            "width": width,
            "height": height,
            "format": fmt,
            "intendedRecipe": intended_recipe,
            "status": status
        })
        
    audit_summary = {
        "total_disk_images": len(disk_files),
        "valid_images": valid_count,
        "invalid_images": invalid_count,
        "duplicate_images": duplicate_count,
        "unknown_images": unknown_count,
        "stale_catalog_entries": stale_catalog_entries,
        "stale_filenames": stale_entries,
        "inventory": report_entries
    }
    
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(audit_summary, f, indent=2)
        
    print("="*60)
    print("RASOI IMAGE & CATALOG INTEGRITY AUDIT SUMMARY")
    print("="*60)
    print(f"Total Disk Images        : {len(disk_files)}")
    print(f"Valid Recipe Images      : {valid_count}")
    print(f"Invalid Images           : {invalid_count}")
    print(f"Duplicate Content Images : {duplicate_count}")
    print(f"Unknown Images           : {unknown_count}")
    print(f"Stale Catalog Entries    : {stale_catalog_entries}")
    print("="*60)

if __name__ == "__main__":
    audit_images()
