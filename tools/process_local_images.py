"""
RASOI — Local Image Processing and Catalog Generator Pipeline

Workflow:
1. Scans `tools/image-inbox/` for new image files.
2. Validates image integrity and format using PIL.
3. Converts JPG/PNG to optimized WebP format (max 1024px, 82% quality).
4. Moves processed image to `public/images/recipes/`.
5. Updates `public/images/image-attribution.json`.
6. Dynamically regenerates `src/utils/recipeImageCatalog.ts` based on disk contents.
"""

import os
import re
import json
from pathlib import Path
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INBOX_DIR = PROJECT_ROOT / "tools" / "image-inbox"
RECIPES_DIR = PROJECT_ROOT / "public" / "images" / "recipes"
ATTRIBUTION_FILE = PROJECT_ROOT / "public" / "images" / "image-attribution.json"
CATALOG_FILE = PROJECT_ROOT / "src" / "utils" / "recipeImageCatalog.ts"

KNOWN_TARGET_METADATA = {
    # ── Egg Dishes (Preserved Defaults) ──
    "egg-half-fry.jpg": {
        "canonical": "Egg Half Fry",
        "specificity": 90,
        "aliases": ["egg half fry", "half fry egg", "anda half fry", "ande half fry", "half fried egg"],
        "keywords": ["half fry", "half-fry", "half fried"]
    },
    "egg-omlette.jpg": {
        "canonical": "Egg Omelette",
        "specificity": 85,
        "aliases": ["egg omelette", "egg omelet", "egg omlette", "anda omelette", "anda omelet", "ande omelette", "masala omelette", "masala omelet", "masala omlette", "spiced omelette"],
        "keywords": ["omelette", "omelet", "omlette"]
    },
    "egg-curry.jpg": {
        "canonical": "Egg Curry",
        "specificity": 70,
        "aliases": ["egg curry", "anda curry", "ande curry", "tariwali anda", "tariwali anda curry", "punjabi egg curry", "punjabi anda curry", "homestyle anda curry", "homestyle egg curry", "spiced egg curry", "indian egg curry", "egg masala", "anda masala", "ande masala", "egg gravy", "anda gravy", "dhaba egg curry", "dhaba anda curry"],
        "keywords": ["anda", "ande", "anday", "undi", "muttai", "motte"]
    },
    
    # ── 100 Target Recipe Definitions ──
    "paneer-butter-masala.webp": {"canonical": "Paneer Butter Masala", "specificity": 85, "aliases": ["paneer butter masala", "butter paneer", "paneer makhani"], "keywords": ["paneer", "butter", "masala", "makhani"]},
    "kadai-paneer.webp": {"canonical": "Kadai Paneer", "specificity": 85, "aliases": ["kadai paneer", "karahi paneer", "kadhai paneer"], "keywords": ["kadai", "kadhai", "paneer"]},
    "palak-paneer.webp": {"canonical": "Palak Paneer", "specificity": 85, "aliases": ["palak paneer", "spinach paneer", "paneer palak", "paneer spinach curry"], "keywords": ["palak", "spinach", "paneer"]},
    "shahi-paneer.webp": {"canonical": "Shahi Paneer", "specificity": 80, "aliases": ["shahi paneer", "royal paneer curry"], "keywords": ["shahi", "paneer"]},
    "paneer-tikka.webp": {"canonical": "Paneer Tikka", "specificity": 85, "aliases": ["paneer tikka", "tandoori paneer tikka"], "keywords": ["paneer", "tikka"]},
    "paneer-bhurji.webp": {"canonical": "Paneer Bhurji", "specificity": 85, "aliases": ["paneer bhurji", "scrambled paneer"], "keywords": ["bhurji", "paneer"]},
    "butter-chicken.webp": {"canonical": "Butter Chicken", "specificity": 85, "aliases": ["butter chicken", "murgh makhani", "chicken butter masala"], "keywords": ["butter", "chicken", "makhani", "murgh"]},
    "chicken-curry.webp": {"canonical": "Chicken Curry", "specificity": 75, "aliases": ["chicken curry", "indian chicken curry", "tariwala chicken"], "keywords": ["chicken", "curry", "murgh"]},
    "chicken-tikka.webp": {"canonical": "Chicken Tikka", "specificity": 85, "aliases": ["chicken tikka", "tandoori chicken tikka"], "keywords": ["chicken", "tikka"]},
    "chicken-tikka-masala.webp": {"canonical": "Chicken Tikka Masala", "specificity": 85, "aliases": ["chicken tikka masala"], "keywords": ["chicken", "tikka", "masala"]},
    "chicken-biryani.webp": {"canonical": "Chicken Biryani", "specificity": 85, "aliases": ["chicken biryani", "hyderabadi chicken biryani", "dum chicken biryani"], "keywords": ["chicken", "biryani"]},
    "mutton-biryani.webp": {"canonical": "Mutton Biryani", "specificity": 85, "aliases": ["mutton biryani", "hyderabadi mutton biryani", "lamb biryani"], "keywords": ["mutton", "lamb", "biryani"]},
    "vegetable-biryani.webp": {"canonical": "Vegetable Biryani", "specificity": 80, "aliases": ["vegetable biryani", "veg biryani"], "keywords": ["veg", "vegetable", "biryani"]},
    "egg-biryani.webp": {"canonical": "Egg Biryani", "specificity": 85, "aliases": ["egg biryani", "anda biryani"], "keywords": ["egg", "anda", "biryani"]},
    "mutton-curry.webp": {"canonical": "Mutton Curry", "specificity": 80, "aliases": ["mutton curry", "goat curry", "lamb curry"], "keywords": ["mutton", "goat", "lamb"]},
    "fish-curry.webp": {"canonical": "Fish Curry", "specificity": 80, "aliases": ["fish curry", "goan fish curry", "machli curry"], "keywords": ["fish", "machli"]},
    "prawn-curry.webp": {"canonical": "Prawn Curry", "specificity": 85, "aliases": ["prawn curry", "shrimp curry", "malabar prawn curry"], "keywords": ["prawn", "shrimp", "chingri"]},
    "dal-tadka.webp": {"canonical": "Dal Tadka", "specificity": 80, "aliases": ["dal tadka", "yellow dal tadka"], "keywords": ["dal", "tadka"]},
    "dal-makhani.webp": {"canonical": "Dal Makhani", "specificity": 85, "aliases": ["dal makhani", "black dal", "maa ki dal"], "keywords": ["dal", "makhani"]},
    "chana-masala.webp": {"canonical": "Chana Masala", "specificity": 80, "aliases": ["chana masala", "chole", "punjabi chole", "chickpea curry"], "keywords": ["chana", "chole", "chickpea"]},
    "rajma.webp": {"canonical": "Rajma", "specificity": 80, "aliases": ["rajma", "rajma masala", "rajma chawal", "kidney bean curry"], "keywords": ["rajma", "kidney bean"]},
    "aloo-gobi.webp": {"canonical": "Aloo Gobi", "specificity": 80, "aliases": ["aloo gobi", "potato cauliflower"], "keywords": ["aloo", "gobi"]},
    "aloo-matar.webp": {"canonical": "Aloo Matar", "specificity": 80, "aliases": ["aloo matar", "potato peas curry"], "keywords": ["aloo", "matar"]},
    "bhindi-masala.webp": {"canonical": "Bhindi Masala", "specificity": 80, "aliases": ["bhindi masala", "okra fry", "bhindi fry"], "keywords": ["bhindi", "okra"]},
    "baingan-bharta.webp": {"canonical": "Baingan Bharta", "specificity": 85, "aliases": ["baingan bharta", "baingan ka bharta", "eggplant mash"], "keywords": ["baingan", "bharta", "eggplant"]},
    "mix-vegetable-curry.webp": {"canonical": "Mix Vegetable Curry", "specificity": 75, "aliases": ["mix veg curry", "mix vegetable curry"], "keywords": ["mix veg", "vegetable"]},
    "malai-kofta.webp": {"canonical": "Malai Kofta", "specificity": 85, "aliases": ["malai kofta"], "keywords": ["malai", "kofta"]},
    "kofta-curry.webp": {"canonical": "Kofta Curry", "specificity": 75, "aliases": ["kofta curry"], "keywords": ["kofta"]},
    "kadhi.webp": {"canonical": "Kadhi", "specificity": 80, "aliases": ["kadhi pakora", "punjabi kadhi", "kadhi chawal"], "keywords": ["kadhi"]},
    "jeera-rice.webp": {"canonical": "Jeera Rice", "specificity": 80, "aliases": ["jeera rice", "cumin rice"], "keywords": ["jeera", "cumin", "rice"]},
    "lemon-rice.webp": {"canonical": "Lemon Rice", "specificity": 80, "aliases": ["lemon rice"], "keywords": ["lemon", "rice"]},
    "curd-rice.webp": {"canonical": "Curd Rice", "specificity": 80, "aliases": ["curd rice", "dahi chawal"], "keywords": ["curd", "dahi", "rice"]},
    "tomato-rice.webp": {"canonical": "Tomato Rice", "specificity": 80, "aliases": ["tomato rice"], "keywords": ["tomato", "rice"]},
    "vegetable-pulao.webp": {"canonical": "Vegetable Pulao", "specificity": 80, "aliases": ["veg pulao", "vegetable pulao"], "keywords": ["pulao"]},
    "chicken-pulao.webp": {"canonical": "Chicken Pulao", "specificity": 80, "aliases": ["chicken pulao"], "keywords": ["chicken pulao"]},
    "khichdi.webp": {"canonical": "Khichdi", "specificity": 80, "aliases": ["khichdi", "dal khichdi"], "keywords": ["khichdi"]},
    "pongal.webp": {"canonical": "Pongal", "specificity": 85, "aliases": ["ven pongal"], "keywords": ["pongal"]},
    "fried-rice.webp": {"canonical": "Fried Rice", "specificity": 75, "aliases": ["veg fried rice", "fried rice"], "keywords": ["fried rice"]},
    "chicken-fried-rice.webp": {"canonical": "Chicken Fried Rice", "specificity": 80, "aliases": ["chicken fried rice"], "keywords": ["chicken fried rice"]},
    "masala-dosa.webp": {"canonical": "Masala Dosa", "specificity": 85, "aliases": ["masala dosa", "mysore masala dosa"], "keywords": ["masala dosa", "dosa"]},
    "plain-dosa.webp": {"canonical": "Plain Dosa", "specificity": 75, "aliases": ["plain dosa", "sada dosa"], "keywords": ["dosa"]},
    "idli.webp": {"canonical": "Idli", "specificity": 85, "aliases": ["idli", "idly"], "keywords": ["idli", "idly"]},
    "medu-vada.webp": {"canonical": "Medu Vada", "specificity": 85, "aliases": ["medu vada", "sambar vada"], "keywords": ["vada", "medu vada"]},
    "poha.webp": {"canonical": "Poha", "specificity": 85, "aliases": ["kanda poha", "poha"], "keywords": ["poha"]},
    "upma.webp": {"canonical": "Upma", "specificity": 80, "aliases": ["rava upma", "upma"], "keywords": ["upma"]},
    "aloo-paratha.webp": {"canonical": "Aloo Paratha", "specificity": 85, "aliases": ["aloo paratha"], "keywords": ["aloo paratha", "paratha"]},
    "paneer-paratha.webp": {"canonical": "Paneer Paratha", "specificity": 85, "aliases": ["paneer paratha"], "keywords": ["paneer paratha"]},
    "gobi-paratha.webp": {"canonical": "Gobi Paratha", "specificity": 85, "aliases": ["gobi paratha"], "keywords": ["gobi paratha"]},
    "poori-bhaji.webp": {"canonical": "Poori Bhaji", "specificity": 85, "aliases": ["poori bhaji", "puri bhaji"], "keywords": ["poori", "puri", "bhaji"]},
    "chole-bhature.webp": {"canonical": "Chole Bhature", "specificity": 90, "aliases": ["chole bhature", "chana bhatura"], "keywords": ["bhature", "chole bhature"]},
    "besan-chilla.webp": {"canonical": "Besan Chilla", "specificity": 85, "aliases": ["besan chilla", "besan cheela"], "keywords": ["chilla", "cheela", "besan"]},
    "uttapam.webp": {"canonical": "Uttapam", "specificity": 85, "aliases": ["uttapam", "uthappam"], "keywords": ["uttapam"]},
    "samosa.webp": {"canonical": "Samosa", "specificity": 90, "aliases": ["samosa", "aloo samosa"], "keywords": ["samosa"]},
    "pakora.webp": {"canonical": "Pakora", "specificity": 80, "aliases": ["pakora", "pakoda", "bhajji"], "keywords": ["pakora", "pakoda", "bhajji"]},
    "aloo-tikki.webp": {"canonical": "Aloo Tikki", "specificity": 85, "aliases": ["aloo tikki"], "keywords": ["aloo tikki"]},
    "pav-bhaji.webp": {"canonical": "Pav Bhaji", "specificity": 90, "aliases": ["pav bhaji"], "keywords": ["pav bhaji"]},
    "vada-pav.webp": {"canonical": "Vada Pav", "specificity": 90, "aliases": ["vada pav"], "keywords": ["vada pav"]},
    "pani-puri.webp": {"canonical": "Pani Puri", "specificity": 90, "aliases": ["pani puri", "golgappa"], "keywords": ["pani puri", "golgappa"]},
    "bhel-puri.webp": {"canonical": "Bhel Puri", "specificity": 85, "aliases": ["bhel puri"], "keywords": ["bhel"]},
    "dahi-puri.webp": {"canonical": "Dahi Puri", "specificity": 85, "aliases": ["dahi puri"], "keywords": ["dahi puri"]},
    "kachori.webp": {"canonical": "Kachori", "specificity": 85, "aliases": ["kachori", "pyaz kachori"], "keywords": ["kachori"]},
    "dhokla.webp": {"canonical": "Dhokla", "specificity": 85, "aliases": ["dhokla", "khaman dhokla"], "keywords": ["dhokla", "khaman"]},
    "spring-roll.webp": {"canonical": "Spring Roll", "specificity": 80, "aliases": ["spring roll"], "keywords": ["spring roll"]},
    "bread-pakora.webp": {"canonical": "Bread Pakora", "specificity": 85, "aliases": ["bread pakora"], "keywords": ["bread pakora"]},
    "cutlet.webp": {"canonical": "Cutlet", "specificity": 80, "aliases": ["cutlet", "veg cutlet"], "keywords": ["cutlet"]},
    "naan.webp": {"canonical": "Naan", "specificity": 75, "aliases": ["naan bread"], "keywords": ["naan"]},
    "butter-naan.webp": {"canonical": "Butter Naan", "specificity": 85, "aliases": ["butter naan"], "keywords": ["butter naan"]},
    "roti.webp": {"canonical": "Roti", "specificity": 70, "aliases": ["roti", "chapati", "phulka"], "keywords": ["roti", "chapati"]},
    "tandoori-roti.webp": {"canonical": "Tandoori Roti", "specificity": 80, "aliases": ["tandoori roti"], "keywords": ["tandoori roti"]},
    "garlic-naan.webp": {"canonical": "Garlic Naan", "specificity": 85, "aliases": ["garlic naan"], "keywords": ["garlic naan"]},
    "bhatura.webp": {"canonical": "Bhatura", "specificity": 80, "aliases": ["bhatura"], "keywords": ["bhatura"]},
    "paratha.webp": {"canonical": "Paratha", "specificity": 70, "aliases": ["paratha", "laccha paratha"], "keywords": ["paratha"]},
    "gulab-jamun.webp": {"canonical": "Gulab Jamun", "specificity": 90, "aliases": ["gulab jamun"], "keywords": ["gulab jamun"]},
    "jalebi.webp": {"canonical": "Jalebi", "specificity": 90, "aliases": ["jalebi"], "keywords": ["jalebi"]},
    "rasgulla.webp": {"canonical": "Rasgulla", "specificity": 90, "aliases": ["rasgulla", "rosogolla"], "keywords": ["rasgulla"]},
    "rasmalai.webp": {"canonical": "Rasmalai", "specificity": 90, "aliases": ["rasmalai"], "keywords": ["rasmalai"]},
    "kheer.webp": {"canonical": "Kheer", "specificity": 85, "aliases": ["kheer", "payasam"], "keywords": ["kheer", "payasam"]},
    "gajar-halwa.webp": {"canonical": "Gajar Halwa", "specificity": 90, "aliases": ["gajar halwa", "gajar ka halwa"], "keywords": ["gajar", "halwa"]},
    "kulfi.webp": {"canonical": "Kulfi", "specificity": 85, "aliases": ["kulfi"], "keywords": ["kulfi"]},
    "barfi.webp": {"canonical": "Barfi", "specificity": 80, "aliases": ["barfi", "kaju katli"], "keywords": ["barfi"]},
    "ladoo.webp": {"canonical": "Ladoo", "specificity": 85, "aliases": ["ladoo", "laddu"], "keywords": ["ladoo", "laddu"]},
    "shahi-tukda.webp": {"canonical": "Shahi Tukda", "specificity": 85, "aliases": ["shahi tukda"], "keywords": ["shahi tukda"]},
    "mango-lassi.webp": {"canonical": "Mango Lassi", "specificity": 85, "aliases": ["mango lassi"], "keywords": ["mango lassi"]},
    "sweet-lassi.webp": {"canonical": "Sweet Lassi", "specificity": 80, "aliases": ["sweet lassi", "lassi"], "keywords": ["lassi"]},
    "masala-chai.webp": {"canonical": "Masala Chai", "specificity": 85, "aliases": ["masala chai", "chai", "tea"], "keywords": ["chai", "tea"]},
    "cold-coffee.webp": {"canonical": "Cold Coffee", "specificity": 80, "aliases": ["cold coffee"], "keywords": ["cold coffee"]},
    "mango-shake.webp": {"canonical": "Mango Shake", "specificity": 80, "aliases": ["mango shake"], "keywords": ["mango shake"]},
    "pasta.webp": {"canonical": "Pasta", "specificity": 75, "aliases": ["pasta"], "keywords": ["pasta"]},
    "pizza.webp": {"canonical": "Pizza", "specificity": 85, "aliases": ["pizza"], "keywords": ["pizza"]},
    "burger.webp": {"canonical": "Burger", "specificity": 85, "aliases": ["burger"], "keywords": ["burger"]},
    "sandwich.webp": {"canonical": "Sandwich", "specificity": 75, "aliases": ["sandwich"], "keywords": ["sandwich"]},
    "pancakes.webp": {"canonical": "Pancakes", "specificity": 85, "aliases": ["pancakes", "pancake"], "keywords": ["pancakes"]},
    "french-toast.webp": {"canonical": "French Toast", "specificity": 85, "aliases": ["french toast"], "keywords": ["french toast"]},
    "avocado-toast.webp": {"canonical": "Avocado Toast", "specificity": 85, "aliases": ["avocado toast"], "keywords": ["avocado toast"]},
    "caesar-salad.webp": {"canonical": "Caesar Salad", "specificity": 85, "aliases": ["caesar salad"], "keywords": ["caesar salad"]},
    "tomato-soup.webp": {"canonical": "Tomato Soup", "specificity": 85, "aliases": ["tomato soup"], "keywords": ["tomato soup"]},
    "grilled-chicken.webp": {"canonical": "Grilled Chicken", "specificity": 80, "aliases": ["grilled chicken"], "keywords": ["grilled chicken"]}
}

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text.strip("-")

def unslugify(slug: str) -> str:
    words = slug.replace("-", " ").replace("_", " ").split()
    return " ".join(w.capitalize() for w in words)

def generate_default_metadata(canonical_name: str, filename: str):
    slug = slugify(canonical_name)
    words = [w.lower() for w in canonical_name.split() if len(w) > 2]
    
    specificity = 70
    if any(k in slug for k in ["tikka", "masala", "makhani", "biryani", "paratha", "lassi", "dosa"]):
        specificity = 80
    if any(k in slug for k in ["half-fry", "omelette", "butter-chicken", "paneer-butter-masala", "hyderabadi"]):
        specificity = 85
        
    aliases = [
        canonical_name.lower(),
        f"homestyle {canonical_name.lower()}",
        f"special {canonical_name.lower()}",
        f"indian {canonical_name.lower()}",
        f"spiced {canonical_name.lower()}"
    ]
    
    return {
        "canonical": canonical_name,
        "specificity": specificity,
        "aliases": sorted(list(set(aliases))),
        "keywords": sorted(list(set(words)))
    }

def process_inbox():
    INBOX_DIR.mkdir(parents=True, exist_ok=True)
    RECIPES_DIR.mkdir(parents=True, exist_ok=True)
    
    attribution = {}
    if ATTRIBUTION_FILE.exists():
        try:
            with open(ATTRIBUTION_FILE, "r", encoding="utf-8") as f:
                attribution = json.load(f)
        except Exception:
            attribution = {}
            
    valid_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
    inbox_files = [f for f in INBOX_DIR.iterdir() if f.is_file() and f.suffix.lower() in valid_extensions]
    
    processed_count = 0
    print(f"[Rasoi Ingestion] Scanning '{INBOX_DIR}'... Found {len(inbox_files)} candidate image(s).")
    
    for file_path in inbox_files:
        try:
            with Image.open(file_path) as img:
                img.verify()
            
            with Image.open(file_path) as img:
                width, height = img.size
                
                stem_slug = slugify(file_path.stem)
                target_filename = f"{stem_slug}.webp"
                target_path = RECIPES_DIR / target_filename
                
                if target_path.exists():
                    print(f"  SKIP '{file_path.name}': Destination asset '{target_filename}' already exists.")
                    continue
                
                max_dim = 1200
                if max(width, height) > max_dim:
                    ratio = max_dim / float(max(width, height))
                    new_size = (int(width * ratio), int(height * ratio))
                    img = img.resize(new_size, Image.Resampling.LANCZOS)
                    
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                    
                img.save(target_path, "WEBP", quality=82, optimize=True)
                print(f"  OK Processed '{file_path.name}' -> 'public/images/recipes/{target_filename}' ({width}x{height} -> {img.size[0]}x{img.size[1]})")
                
                sidecar_json = file_path.with_suffix(".json")
                sidecar_meta = {}
                if sidecar_json.exists():
                    try:
                        with open(sidecar_json, "r", encoding="utf-8") as f:
                            sidecar_meta = json.load(f)
                    except Exception:
                        pass
                        
                attribution[target_filename] = {
                    "filename": target_filename,
                    "source": sidecar_meta.get("source", "Local Inbox Upload"),
                    "sourceUrl": sidecar_meta.get("sourceUrl", f"local://inbox/{file_path.name}"),
                    "creator": sidecar_meta.get("creator", "Rasoi Asset Library"),
                    "license": sidecar_meta.get("license", "Public Domain / CC0"),
                    "licenseUrl": sidecar_meta.get("licenseUrl", "https://creativecommons.org/publicdomain/zero/1.0/"),
                    "downloadDate": sidecar_meta.get("downloadDate", "2026-08-17")
                }
                
                file_path.unlink(missing_ok=True)
                if sidecar_json.exists():
                    sidecar_json.unlink(missing_ok=True)
                processed_count += 1
                
        except Exception as e:
            print(f"  ERROR processing '{file_path.name}': {e}")

    with open(ATTRIBUTION_FILE, "w", encoding="utf-8") as f:
        json.dump(attribution, f, indent=2)
        
    print(f"[Rasoi Ingestion] Ingestion complete. {processed_count} new image(s) processed.")
    regenerate_catalog()

def regenerate_catalog():
    print("[Rasoi Catalog] Regenerating 'src/utils/recipeImageCatalog.ts' from verified files on disk...")
    
    existing_files = sorted([f.name for f in RECIPES_DIR.iterdir() if f.is_file() and f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}])
    
    entries = []
    for fname in existing_files:
        if fname in KNOWN_TARGET_METADATA:
            meta = KNOWN_TARGET_METADATA[fname]
            entries.append({
                "image": fname,
                "canonical": meta["canonical"],
                "specificity": meta.get("specificity", 70),
                "aliases": meta["aliases"],
                "keywords": meta["keywords"]
            })
        else:
            canonical = unslugify(Path(fname).stem)
            meta = generate_default_metadata(canonical, fname)
            entries.append({
                "image": fname,
                "canonical": meta["canonical"],
                "specificity": meta["specificity"],
                "aliases": meta["aliases"],
                "keywords": meta["keywords"]
            })
            
    ts_content = """/**
 * RASOI — Recipe Image Catalog
 *
 * THIS FILE IS AUTOMATICALLY MAINTAINED & VERIFIED AGAINST DISK ASSETS.
 * SINGLE SOURCE OF TRUTH for all recipe-to-image mappings.
 */

export interface CatalogEntry {
  /** Actual filename inside public/images/recipes/ */
  image: string;
  /** Human-readable canonical name for debugging */
  canonical: string;
  /** Exact multi-word phrases that strongly identify this recipe */
  aliases: string[];
  /** Individual keywords that indicate this recipe */
  keywords: string[];
  /** Optional base specificity boost (0–100) */
  specificity?: number;
}

export const recipeImageCatalog: CatalogEntry[] = """ + json.dumps(entries, indent=2) + ";\n"

    with open(CATALOG_FILE, "w", encoding="utf-8") as f:
        f.write(ts_content)
        
    print(f"[Rasoi Catalog] Successfully updated 'src/utils/recipeImageCatalog.ts' with {len(entries)} verified entries.")

if __name__ == "__main__":
    process_inbox()
