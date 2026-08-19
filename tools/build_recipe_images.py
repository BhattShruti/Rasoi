#!/usr/bin/env python3
"""
RASOI — Automated Recipe Image Library Pipeline
================================================
Phases: Discover → Score → License-check → Download → Validate → Optimize → Catalog → Report

Usage:
    python tools/build_recipe_images.py

Options (env vars):
    DRY_RUN=1           Discover and score but do not download anything.
    FORCE=1             Reprocess recipes that already have images.
    MIN_SCORE=0.35      Override minimum relevance score (0.0–1.0).
    MAX_CANDIDATES=8    Candidates to fetch per recipe from Openverse.

Requires: Python 3.10+, Pillow (already installed), requests (already installed).
"""

import json
import os
import re
import sys
import time
import hashlib
import csv
import shutil
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import quote_plus

import requests
from PIL import Image, UnidentifiedImageError

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
IMAGES_DIR   = PROJECT_ROOT / "public" / "images" / "recipes"
DEFAULT_IMG  = PROJECT_ROOT / "public" / "images" / "default-food.webp"
CATALOG_FILE = PROJECT_ROOT / "src" / "utils" / "recipeImageCatalog.ts"
TARGETS_FILE = SCRIPT_DIR / "recipe-image-targets.txt"
REPORT_JSON  = SCRIPT_DIR / "image-selection-report.json"
REPORT_CSV   = SCRIPT_DIR / "image-selection-report.csv"
ATTR_JSON    = PROJECT_ROOT / "public" / "images" / "image-attribution.json"
LICENSE_MD   = PROJECT_ROOT / "docs" / "IMAGE_LICENSES.md"


# ─────────────────────────────────────────────────────────────────────────────
# IMAGE PROVIDER ABSTRACTION
# ─────────────────────────────────────────────────────────────────────────────

class ImageProviderBase:
    """Base class for image providers.

    Subclasses must implement `search(query: str, max_results: int) -> list[dict]`
    returning a list of candidate dicts matching the Openverse format used later in the pipeline.
    """

    def search(self, query: str, max_results: int):
        raise NotImplementedError

class OpenverseProvider(ImageProviderBase):
    def __init__(self, api_base: str = OPENVERSE_API):
        self.api_base = api_base

    def search(self, query: str, max_results: int):
        params = {
            "q": query,
            "page_size": max_results,
            "license": ",".join(PERMITTED_LICENSES),
        }
        resp = requests.get(self.api_base, params=params, headers=HTTP_HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        return data.get("results", [])

class PixabayProvider(ImageProviderBase):
    """Pixabay image provider.

    Uses Pixabay API (https://pixabay.com/api/docs/). Requires API key via PIXABAY_API_KEY env var.
    Returns dicts compatible with the pipeline's expected fields (url, license, creator, creator_url).
    """

    API_URL = "https://pixabay.com/api/"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("PIXABAY_API_KEY")
        if not self.api_key:
            raise RuntimeError("PIXABAY_API_KEY environment variable not set for PixabayProvider")

    def search(self, query: str, max_results: int):
        params = {
            "key": self.api_key,
            "q": query,
            "image_type": "photo",
            "per_page": max_results,
            "safesearch": "true",
            "order": "popular",
        }
        resp = requests.get(self.API_URL, params=params, headers=HTTP_HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        # Transform Pixabay response to match Openverse-like dicts
        candidates = []
        for hit in data.get("hits", []):
            # Pixabay provides fields: largeImageURL, webformatURL, tags, user, user_id, pageURL, license
            # License may be "cc0", "by", etc.
            candidates.append({
                "url": hit.get("largeImageURL") or hit.get("webformatURL"),
                "license": hit.get("license"),
                "creator": hit.get("user"),
                "creator_url": hit.get("pageURL"),
                "title": hit.get("tags"),  # tags as a comma separated string
            })
        return candidates

# Choose provider based on env var IMAGE_PROVIDER (default: openverse)
IMAGE_PROVIDER_NAME = os.getenv("IMAGE_PROVIDER", "openverse").lower()
if IMAGE_PROVIDER_NAME == "pixabay":
    provider = PixabayProvider()
else:
    provider = OpenverseProvider()

# Replace direct Openverse calls later with provider.search(...)

DRY_RUN        = os.environ.get("DRY_RUN", "0") == "1"
FORCE          = os.environ.get("FORCE", "0") == "1"
MIN_SCORE      = float(os.environ.get("MIN_SCORE", "0.35"))
MAX_CANDIDATES = int(os.environ.get("MAX_CANDIDATES", "8"))

# Output image target: 800×600 WebP at quality 88
OUT_MAX_W  = 800
OUT_MAX_H  = 600
OUT_QUAL   = 88
OUT_FORMAT = "WEBP"
OUT_EXT    = ".webp"

# Permitted licenses (must explicitly permit commercial reuse + redistribution)
PERMITTED_LICENSES = {"cc0", "pdm", "by", "by-sa"}

# Request headers — identify ourselves politely
HTTP_HEADERS = {
    "User-Agent": "RasoiImagePipeline/1.0 (educational project; contact: rasoi-dev)",
    "Accept":     "image/*, application/json",
}

REQUEST_TIMEOUT    = 20   # seconds
RATE_LIMIT_DELAY   = 0.4  # seconds between Openverse queries
DOWNLOAD_DELAY     = 0.6  # seconds between image downloads
MAX_IMG_SIZE_MB    = 25   # reject absurdly large downloads
MIN_IMG_DIMENSION  = 200  # reject tiny thumbnails

# ─────────────────────────────────────────────────────────────────────────────
# STATUS CODES
# ─────────────────────────────────────────────────────────────────────────────
STATUS_APPROVED        = "APPROVED"
STATUS_EXISTING        = "EXISTING"       # already had a curated image
STATUS_NO_IMAGE        = "NO_GOOD_IMAGE_FOUND"
STATUS_DOWNLOAD_FAILED = "DOWNLOAD_FAILED"
STATUS_LICENSE_UNCLEAR = "LICENSE_UNCLEAR"
STATUS_DUPLICATE       = "DUPLICATE_REJECTED"
STATUS_SKIPPED         = "SKIPPED"        # DRY_RUN or already exists + not FORCE


# ─────────────────────────────────────────────────────────────────────────────
# RECIPE → CATALOG METADATA
# Each entry: canonical, filename_stem, aliases, keywords, specificity,
#             search_queries (ordered list to try in Openverse)
# ─────────────────────────────────────────────────────────────────────────────
RECIPE_METADATA = [

    # ── EGG (already have curated images — PRESERVE) ─────────────────────────
    {
        "canonical":       "Egg Half Fry",
        "filename_stem":   "egg-half-fry",
        "existing_file":   "egg-half-fry.jpg",   # do not overwrite
        "specificity":     90,
        "aliases": ["egg half fry", "half fry egg", "anda half fry", "ande half fry", "half fried egg"],
        "keywords": ["half fry", "half fried"],
        "search_queries":  ["egg half fry"],
    },
    {
        "canonical":       "Egg Omelette",
        "filename_stem":   "egg-omlette",
        "existing_file":   "egg-omlette.jpg",
        "specificity":     85,
        "aliases": ["egg omelette", "egg omelet", "egg omlette", "anda omelette",
                    "masala omelette", "masala omelet", "masala omlette", "spiced omelette"],
        "keywords": ["omelette", "omelet", "omlette"],
        "search_queries":  ["egg omelette indian", "masala omelette"],
    },
    {
        "canonical":       "Egg Curry",
        "filename_stem":   "egg-curry",
        "existing_file":   "egg-curry.jpg",
        "specificity":     70,
        "aliases": ["egg curry", "anda curry", "ande curry", "tariwali anda",
                    "punjabi egg curry", "homestyle egg curry", "egg masala", "dhaba egg curry"],
        "keywords": ["anda", "ande", "anday", "undi", "muttai", "motte"],
        "search_queries":  ["egg curry indian"],
    },

    # ── EGG DISHES ────────────────────────────────────────────────────────────
    {
        "canonical":     "Egg Bhurji",
        "filename_stem": "egg-bhurji",
        "specificity":   75,
        "aliases": ["egg bhurji", "anda bhurji", "ande bhurji", "scrambled egg indian",
                    "indian scrambled eggs", "masala egg bhurji"],
        "keywords": ["bhurji"],
        "search_queries": ["egg bhurji", "anda bhurji"],
    },
    {
        "canonical":     "Egg Biryani",
        "filename_stem": "egg-biryani",
        "specificity":   80,
        "aliases": ["egg biryani", "anda biryani", "egg dum biryani"],
        "keywords": ["egg biryani"],
        "search_queries": ["egg biryani", "anda biryani"],
    },

    # ── PANEER ────────────────────────────────────────────────────────────────
    {
        "canonical":     "Paneer Butter Masala",
        "filename_stem": "paneer-butter-masala",
        "specificity":   85,
        "aliases": ["paneer butter masala", "butter paneer", "paneer makhani",
                    "creamy paneer butter masala", "restaurant style paneer butter masala",
                    "punjabi paneer butter masala", "shahi paneer butter masala"],
        "keywords": ["paneer butter", "butter masala"],
        "search_queries": ["paneer butter masala", "butter paneer"],
    },
    {
        "canonical":     "Kadai Paneer",
        "filename_stem": "kadai-paneer",
        "specificity":   85,
        "aliases": ["kadai paneer", "karahi paneer", "kadhai paneer",
                    "restaurant style kadai paneer", "punjabi kadai paneer"],
        "keywords": ["kadai paneer", "karahi paneer"],
        "search_queries": ["kadai paneer", "kadhai paneer"],
    },
    {
        "canonical":     "Palak Paneer",
        "filename_stem": "palak-paneer",
        "specificity":   85,
        "aliases": ["palak paneer", "saag paneer", "spinach paneer curry",
                    "creamy palak paneer", "restaurant style palak paneer"],
        "keywords": ["palak paneer", "saag paneer"],
        "search_queries": ["palak paneer", "saag paneer"],
    },
    {
        "canonical":     "Shahi Paneer",
        "filename_stem": "shahi-paneer",
        "specificity":   82,
        "aliases": ["shahi paneer", "mughlai paneer", "royal paneer curry",
                    "creamy shahi paneer", "paneer in white gravy"],
        "keywords": ["shahi paneer"],
        "search_queries": ["shahi paneer", "mughlai paneer"],
    },
    {
        "canonical":     "Paneer Tikka",
        "filename_stem": "paneer-tikka",
        "specificity":   82,
        "aliases": ["paneer tikka", "tandoori paneer tikka", "paneer tikka masala",
                    "grilled paneer tikka", "restaurant style paneer tikka"],
        "keywords": ["paneer tikka"],
        "search_queries": ["paneer tikka", "tandoori paneer tikka"],
    },
    {
        "canonical":     "Malai Kofta",
        "filename_stem": "malai-kofta",
        "specificity":   80,
        "aliases": ["malai kofta", "paneer kofta", "malai kofta curry",
                    "restaurant style malai kofta", "creamy malai kofta"],
        "keywords": ["malai kofta"],
        "search_queries": ["malai kofta", "paneer kofta curry"],
    },

    # ── CHICKEN ───────────────────────────────────────────────────────────────
    {
        "canonical":     "Butter Chicken",
        "filename_stem": "butter-chicken",
        "specificity":   88,
        "aliases": ["butter chicken", "murgh makhani", "chicken makhani",
                    "restaurant style butter chicken", "punjabi butter chicken",
                    "creamy butter chicken"],
        "keywords": ["butter chicken", "murgh makhani", "chicken makhani"],
        "search_queries": ["butter chicken", "murgh makhani"],
    },
    {
        "canonical":     "Chicken Biryani",
        "filename_stem": "chicken-biryani",
        "specificity":   88,
        "aliases": ["chicken biryani", "hyderabadi chicken biryani",
                    "dum chicken biryani", "spicy chicken biryani",
                    "restaurant style chicken biryani"],
        "keywords": ["chicken biryani"],
        "search_queries": ["chicken biryani", "hyderabadi chicken biryani"],
    },
    {
        "canonical":     "Chicken Curry",
        "filename_stem": "chicken-curry",
        "specificity":   75,
        "aliases": ["chicken curry", "indian chicken curry", "homestyle chicken curry",
                    "chicken gravy", "chicken masala curry", "murgh curry"],
        "keywords": ["chicken curry", "murgh curry"],
        "search_queries": ["chicken curry indian", "indian chicken curry"],
    },
    {
        "canonical":     "Chicken Tikka",
        "filename_stem": "chicken-tikka",
        "specificity":   82,
        "aliases": ["chicken tikka", "tandoori chicken tikka", "grilled chicken tikka",
                    "restaurant style chicken tikka"],
        "keywords": ["chicken tikka"],
        "search_queries": ["chicken tikka", "tandoori chicken tikka"],
    },
    {
        "canonical":     "Tandoori Chicken",
        "filename_stem": "tandoori-chicken",
        "specificity":   82,
        "aliases": ["tandoori chicken", "clay oven chicken", "whole tandoori chicken",
                    "restaurant style tandoori chicken"],
        "keywords": ["tandoori chicken"],
        "search_queries": ["tandoori chicken", "tandoori murgh"],
    },
    {
        "canonical":     "Chicken Kebab",
        "filename_stem": "chicken-kebab",
        "specificity":   80,
        "aliases": ["chicken kebab", "chicken seekh kebab", "chicken shish kebab",
                    "minced chicken kebab", "grilled chicken kebab"],
        "keywords": ["chicken kebab", "seekh kebab"],
        "search_queries": ["chicken seekh kebab", "chicken kebab india"],
    },

    # ── MUTTON ────────────────────────────────────────────────────────────────
    {
        "canonical":     "Mutton Curry",
        "filename_stem": "mutton-curry",
        "specificity":   78,
        "aliases": ["mutton curry", "lamb curry", "goat curry",
                    "indian mutton curry", "homestyle mutton curry",
                    "mutton gravy", "rogan josh"],
        "keywords": ["mutton curry", "lamb curry", "rogan josh"],
        "search_queries": ["mutton curry indian", "lamb curry indian"],
    },
    {
        "canonical":     "Mutton Biryani",
        "filename_stem": "mutton-biryani",
        "specificity":   85,
        "aliases": ["mutton biryani", "lamb biryani", "hyderabadi mutton biryani",
                    "dum mutton biryani"],
        "keywords": ["mutton biryani", "lamb biryani"],
        "search_queries": ["mutton biryani", "lamb biryani indian"],
    },

    # ── DAL ───────────────────────────────────────────────────────────────────
    {
        "canonical":     "Dal Tadka",
        "filename_stem": "dal-tadka",
        "specificity":   82,
        "aliases": ["dal tadka", "dal tarka", "yellow dal tadka",
                    "toor dal tadka", "restaurant style dal tadka",
                    "dhaba dal tadka", "punjabi dal tadka"],
        "keywords": ["dal tadka", "daal tadka"],
        "search_queries": ["dal tadka", "yellow dal tadka"],
    },
    {
        "canonical":     "Dal Makhani",
        "filename_stem": "dal-makhani",
        "specificity":   82,
        "aliases": ["dal makhani", "daal makhani", "black dal makhani",
                    "restaurant style dal makhani", "creamy dal makhani",
                    "punjabi dal makhani"],
        "keywords": ["dal makhani", "daal makhani"],
        "search_queries": ["dal makhani", "black dal indian"],
    },

    # ── LEGUMES ───────────────────────────────────────────────────────────────
    {
        "canonical":     "Chole",
        "filename_stem": "chole",
        "specificity":   80,
        "aliases": ["chole", "chana masala", "chhole", "punjabi chole",
                    "chole masala", "chickpea curry", "chana curry",
                    "restaurant style chole"],
        "keywords": ["chole", "chana masala", "chhole"],
        "search_queries": ["chole masala", "chana masala curry"],
    },
    {
        "canonical":     "Rajma",
        "filename_stem": "rajma",
        "specificity":   80,
        "aliases": ["rajma", "rajma curry", "rajma masala",
                    "kidney bean curry", "punjabi rajma",
                    "homestyle rajma", "rajma chawal"],
        "keywords": ["rajma", "kidney bean curry"],
        "search_queries": ["rajma curry", "rajma masala indian"],
    },

    # ── VEGETABLE CURRIES ─────────────────────────────────────────────────────
    {
        "canonical":     "Aloo Gobi",
        "filename_stem": "aloo-gobi",
        "specificity":   80,
        "aliases": ["aloo gobi", "aloo gobhi", "potato cauliflower curry",
                    "dry aloo gobi", "punjabi aloo gobi"],
        "keywords": ["aloo gobi", "aloo gobhi"],
        "search_queries": ["aloo gobi", "potato cauliflower curry"],
    },
    {
        "canonical":     "Bhindi Masala",
        "filename_stem": "bhindi-masala",
        "specificity":   80,
        "aliases": ["bhindi masala", "okra masala", "bhindi sabzi",
                    "stuffed bhindi", "kurkuri bhindi"],
        "keywords": ["bhindi masala", "okra masala"],
        "search_queries": ["bhindi masala", "okra curry indian"],
    },
    {
        "canonical":     "Baingan Bharta",
        "filename_stem": "baingan-bharta",
        "specificity":   80,
        "aliases": ["baingan bharta", "eggplant bharta", "smoky baingan bharta",
                    "roasted eggplant curry", "baigan bharta"],
        "keywords": ["baingan bharta", "eggplant bharta"],
        "search_queries": ["baingan bharta", "eggplant bharta india"],
    },
    {
        "canonical":     "Jeera Aloo",
        "filename_stem": "jeera-aloo",
        "specificity":   78,
        "aliases": ["jeera aloo", "cumin potato", "jeera aloo sabzi",
                    "cumin spiced potato"],
        "keywords": ["jeera aloo"],
        "search_queries": ["jeera aloo", "cumin potato sabzi"],
    },
    {
        "canonical":     "Veg Korma",
        "filename_stem": "veg-korma",
        "specificity":   78,
        "aliases": ["veg korma", "vegetable korma", "mixed veg korma",
                    "navratan korma", "creamy veg korma"],
        "keywords": ["veg korma", "vegetable korma"],
        "search_queries": ["vegetable korma", "navratan korma"],
    },

    # ── RICE ──────────────────────────────────────────────────────────────────
    {
        "canonical":     "Veg Biryani",
        "filename_stem": "veg-biryani",
        "specificity":   82,
        "aliases": ["veg biryani", "vegetable biryani", "dum veg biryani",
                    "mixed veg biryani", "restaurant style veg biryani"],
        "keywords": ["veg biryani", "vegetable biryani"],
        "search_queries": ["vegetable biryani", "veg dum biryani"],
    },
    {
        "canonical":     "Jeera Rice",
        "filename_stem": "jeera-rice",
        "specificity":   78,
        "aliases": ["jeera rice", "cumin rice", "jeera chawal", "zeera rice"],
        "keywords": ["jeera rice", "cumin rice"],
        "search_queries": ["jeera rice", "cumin rice indian"],
    },
    {
        "canonical":     "Fried Rice",
        "filename_stem": "fried-rice",
        "specificity":   70,
        "aliases": ["fried rice", "veg fried rice", "vegetable fried rice",
                    "indian chinese fried rice", "egg fried rice"],
        "keywords": ["fried rice"],
        "search_queries": ["veg fried rice indian style", "fried rice"],
    },
    {
        "canonical":     "Vegetable Pulao",
        "filename_stem": "vegetable-pulao",
        "specificity":   78,
        "aliases": ["vegetable pulao", "veg pulao", "mixed veg pulao",
                    "pilaf", "vegetable pilaf"],
        "keywords": ["vegetable pulao", "veg pulao"],
        "search_queries": ["vegetable pulao", "veg pulao"],
    },
    {
        "canonical":     "Lemon Rice",
        "filename_stem": "lemon-rice",
        "specificity":   78,
        "aliases": ["lemon rice", "chitranna", "nimmakaya annam",
                    "south indian lemon rice"],
        "keywords": ["lemon rice"],
        "search_queries": ["lemon rice south indian", "chitranna"],
    },
    {
        "canonical":     "Curd Rice",
        "filename_stem": "curd-rice",
        "specificity":   78,
        "aliases": ["curd rice", "thayir sadam", "dahi chawal",
                    "south indian curd rice"],
        "keywords": ["curd rice", "thayir sadam"],
        "search_queries": ["curd rice", "thayir sadam south indian"],
    },
    {
        "canonical":     "Tamarind Rice",
        "filename_stem": "tamarind-rice",
        "specificity":   78,
        "aliases": ["tamarind rice", "puliyodharai", "puliyogare",
                    "south indian tamarind rice"],
        "keywords": ["tamarind rice", "puliyodharai"],
        "search_queries": ["tamarind rice", "puliyodharai south indian"],
    },

    # ── SOUTH INDIAN ──────────────────────────────────────────────────────────
    {
        "canonical":     "Masala Dosa",
        "filename_stem": "masala-dosa",
        "specificity":   88,
        "aliases": ["masala dosa", "crispy masala dosa", "south indian masala dosa",
                    "restaurant style masala dosa"],
        "keywords": ["masala dosa"],
        "search_queries": ["masala dosa", "crispy dosa"],
    },
    {
        "canonical":     "Idli",
        "filename_stem": "idli",
        "specificity":   80,
        "aliases": ["idli", "soft idli", "steamed idli", "south indian idli",
                    "idli sambar"],
        "keywords": ["idli"],
        "search_queries": ["idli south indian", "soft idli sambar"],
    },
    {
        "canonical":     "Medu Vada",
        "filename_stem": "medu-vada",
        "specificity":   82,
        "aliases": ["medu vada", "medhu vada", "urad dal vada",
                    "south indian vada", "crispy vada"],
        "keywords": ["medu vada", "medhu vada"],
        "search_queries": ["medu vada", "south indian urad dal vada"],
    },
    {
        "canonical":     "Sambar",
        "filename_stem": "sambar",
        "specificity":   78,
        "aliases": ["sambar", "south indian sambar", "vegetable sambar",
                    "tiffin sambar", "idli sambar"],
        "keywords": ["sambar"],
        "search_queries": ["sambar south indian", "vegetable sambar"],
    },
    {
        "canonical":     "Rasam",
        "filename_stem": "rasam",
        "specificity":   78,
        "aliases": ["rasam", "pepper rasam", "tomato rasam",
                    "south indian rasam"],
        "keywords": ["rasam"],
        "search_queries": ["rasam south indian", "pepper rasam"],
    },
    {
        "canonical":     "Avial",
        "filename_stem": "avial",
        "specificity":   80,
        "aliases": ["avial", "aviyal", "mixed vegetable coconut curry",
                    "kerala avial"],
        "keywords": ["avial", "aviyal"],
        "search_queries": ["avial kerala", "aviyal south indian"],
    },

    # ── BREAKFAST / SNACKS ────────────────────────────────────────────────────
    {
        "canonical":     "Poha",
        "filename_stem": "poha",
        "specificity":   80,
        "aliases": ["poha", "kanda poha", "indori poha", "batata poha",
                    "flattened rice poha"],
        "keywords": ["poha"],
        "search_queries": ["poha breakfast", "kanda poha indian"],
    },
    {
        "canonical":     "Upma",
        "filename_stem": "upma",
        "specificity":   78,
        "aliases": ["upma", "rava upma", "sooji upma", "vegetable upma",
                    "south indian upma"],
        "keywords": ["upma"],
        "search_queries": ["upma breakfast", "rava upma"],
    },
    {
        "canonical":     "Aloo Paratha",
        "filename_stem": "aloo-paratha",
        "specificity":   85,
        "aliases": ["aloo paratha", "stuffed potato paratha",
                    "punjabi aloo paratha", "breakfast aloo paratha"],
        "keywords": ["aloo paratha"],
        "search_queries": ["aloo paratha", "stuffed potato paratha punjabi"],
    },
    {
        "canonical":     "Paneer Paratha",
        "filename_stem": "paneer-paratha",
        "specificity":   83,
        "aliases": ["paneer paratha", "stuffed paneer paratha",
                    "punjabi paneer paratha"],
        "keywords": ["paneer paratha"],
        "search_queries": ["paneer paratha", "stuffed paneer paratha"],
    },
    {
        "canonical":     "Poori",
        "filename_stem": "poori",
        "specificity":   78,
        "aliases": ["poori", "puri", "deep fried bread", "poori bhaji",
                    "puri bhaji"],
        "keywords": ["poori", "puri"],
        "search_queries": ["poori bhaji indian", "puri indian bread"],
    },
    {
        "canonical":     "Naan",
        "filename_stem": "naan",
        "specificity":   75,
        "aliases": ["naan", "plain naan", "garlic naan", "tandoori naan",
                    "indian flatbread"],
        "keywords": ["naan"],
        "search_queries": ["naan indian bread", "garlic naan"],
    },
    {
        "canonical":     "Butter Naan",
        "filename_stem": "butter-naan",
        "specificity":   78,
        "aliases": ["butter naan", "buttered naan", "restaurant butter naan"],
        "keywords": ["butter naan"],
        "search_queries": ["butter naan", "buttered naan indian"],
    },
    {
        "canonical":     "Roti",
        "filename_stem": "roti",
        "specificity":   70,
        "aliases": ["roti", "chapati", "chapatti", "phulka",
                    "whole wheat roti"],
        "keywords": ["roti", "chapati"],
        "search_queries": ["roti chapati indian", "indian flatbread chapati"],
    },
    {
        "canonical":     "Besan Chilla",
        "filename_stem": "besan-chilla",
        "specificity":   80,
        "aliases": ["besan chilla", "besan cheela", "gram flour crepe",
                    "chickpea flour pancake", "vegetable chilla"],
        "keywords": ["besan chilla", "besan cheela"],
        "search_queries": ["besan chilla", "besan cheela indian breakfast"],
    },

    # ── STREET FOOD / SNACKS ─────────────────────────────────────────────────
    {
        "canonical":     "Samosa",
        "filename_stem": "samosa",
        "specificity":   85,
        "aliases": ["samosa", "aloo samosa", "punjabi samosa",
                    "crispy samosa", "vegetable samosa"],
        "keywords": ["samosa"],
        "search_queries": ["samosa indian", "aloo samosa"],
    },
    {
        "canonical":     "Aloo Tikki",
        "filename_stem": "aloo-tikki",
        "specificity":   82,
        "aliases": ["aloo tikki", "potato patty", "aloo tikki chaat",
                    "crispy aloo tikki"],
        "keywords": ["aloo tikki"],
        "search_queries": ["aloo tikki", "potato tikki chaat"],
    },
    {
        "canonical":     "Pav Bhaji",
        "filename_stem": "pav-bhaji",
        "specificity":   85,
        "aliases": ["pav bhaji", "pav bhaaji", "mumbai pav bhaji",
                    "street style pav bhaji"],
        "keywords": ["pav bhaji"],
        "search_queries": ["pav bhaji", "mumbai pav bhaji"],
    },
    {
        "canonical":     "Pakora",
        "filename_stem": "pakora",
        "specificity":   78,
        "aliases": ["pakora", "pakoda", "bhajiya", "vegetable pakora",
                    "onion pakora", "fritters"],
        "keywords": ["pakora", "pakoda"],
        "search_queries": ["pakora indian", "vegetable pakora fritters"],
    },
    {
        "canonical":     "Vada Pav",
        "filename_stem": "vada-pav",
        "specificity":   85,
        "aliases": ["vada pav", "wadapav", "mumbai street food",
                    "batata vada pav"],
        "keywords": ["vada pav"],
        "search_queries": ["vada pav mumbai", "batata vada pav street food"],
    },
    {
        "canonical":     "Pani Puri",
        "filename_stem": "pani-puri",
        "specificity":   85,
        "aliases": ["pani puri", "golgappa", "puchka", "phuchka",
                    "street food pani puri"],
        "keywords": ["pani puri", "golgappa", "puchka"],
        "search_queries": ["pani puri", "golgappa indian street food"],
    },
    {
        "canonical":     "Dhokla",
        "filename_stem": "dhokla",
        "specificity":   85,
        "aliases": ["dhokla", "khaman dhokla", "gujarati dhokla",
                    "steamed dhokla"],
        "keywords": ["dhokla"],
        "search_queries": ["dhokla gujarati", "khaman dhokla"],
    },
    {
        "canonical":     "Kachori",
        "filename_stem": "kachori",
        "specificity":   82,
        "aliases": ["kachori", "kachori chaat", "dal kachori",
                    "raj kachori", "pyaz kachori"],
        "keywords": ["kachori"],
        "search_queries": ["kachori indian", "dal kachori"],
    },

    # ── SWEETS / DESSERTS ─────────────────────────────────────────────────────
    {
        "canonical":     "Gulab Jamun",
        "filename_stem": "gulab-jamun",
        "specificity":   88,
        "aliases": ["gulab jamun", "gulab jamun dessert", "indian dessert gulab jamun",
                    "soft gulab jamun"],
        "keywords": ["gulab jamun"],
        "search_queries": ["gulab jamun", "indian dessert gulab jamun"],
    },
    {
        "canonical":     "Jalebi",
        "filename_stem": "jalebi",
        "specificity":   85,
        "aliases": ["jalebi", "crispy jalebi", "indian jalebi", "hot jalebi"],
        "keywords": ["jalebi"],
        "search_queries": ["jalebi indian sweet", "crispy jalebi"],
    },
    {
        "canonical":     "Kheer",
        "filename_stem": "kheer",
        "specificity":   82,
        "aliases": ["kheer", "rice kheer", "chawal ki kheer",
                    "payasam", "rice pudding indian"],
        "keywords": ["kheer", "payasam"],
        "search_queries": ["kheer rice pudding indian", "payasam"],
    },
    {
        "canonical":     "Gajar Halwa",
        "filename_stem": "gajar-halwa",
        "specificity":   85,
        "aliases": ["gajar halwa", "carrot halwa", "gajrela",
                    "gajar ka halwa", "carrot pudding"],
        "keywords": ["gajar halwa", "carrot halwa"],
        "search_queries": ["gajar halwa", "carrot halwa indian"],
    },
    {
        "canonical":     "Rasmalai",
        "filename_stem": "rasmalai",
        "specificity":   85,
        "aliases": ["rasmalai", "ras malai", "rasmalai dessert",
                    "soft rasmalai", "bengali rasmalai"],
        "keywords": ["rasmalai", "ras malai"],
        "search_queries": ["rasmalai", "ras malai bengali sweet"],
    },
    {
        "canonical":     "Rasgulla",
        "filename_stem": "rasgulla",
        "specificity":   85,
        "aliases": ["rasgulla", "rosogolla", "bengali rasgulla",
                    "spongy rasgulla"],
        "keywords": ["rasgulla", "rosogolla"],
        "search_queries": ["rasgulla", "rosogolla bengali sweet"],
    },

    # ── DRINKS ────────────────────────────────────────────────────────────────
    {
        "canonical":     "Mango Lassi",
        "filename_stem": "mango-lassi",
        "specificity":   85,
        "aliases": ["mango lassi", "sweet mango lassi", "punjabi mango lassi",
                    "mango yogurt drink", "aam lassi"],
        "keywords": ["mango lassi", "aam lassi"],
        "search_queries": ["mango lassi", "sweet mango lassi drink"],
    },
    {
        "canonical":     "Masala Chai",
        "filename_stem": "masala-chai",
        "specificity":   80,
        "aliases": ["masala chai", "spiced tea", "indian chai", "masala tea",
                    "ginger tea", "adrak chai"],
        "keywords": ["masala chai", "masala tea"],
        "search_queries": ["masala chai", "indian spiced tea"],
    },
    {
        "canonical":     "Lassi",
        "filename_stem": "lassi",
        "specificity":   72,
        "aliases": ["lassi", "plain lassi", "sweet lassi", "punjabi lassi",
                    "dahi lassi"],
        "keywords": ["lassi"],
        "search_queries": ["lassi drink indian", "sweet lassi"],
    },
    {
        "canonical":     "Fruit Raita",
        "filename_stem": "fruit-raita",
        "specificity":   78,
        "aliases": ["fruit raita", "mixed fruit raita", "boondi raita",
                    "vegetable raita"],
        "keywords": ["fruit raita", "boondi raita"],
        "search_queries": ["fruit raita", "raita indian"],
    },

    # ── SOUPS ─────────────────────────────────────────────────────────────────
    {
        "canonical":     "Tomato Soup",
        "filename_stem": "tomato-soup",
        "specificity":   72,
        "aliases": ["tomato soup", "indian tomato soup", "cream of tomato soup",
                    "restaurant style tomato soup"],
        "keywords": ["tomato soup"],
        "search_queries": ["tomato soup indian", "cream of tomato soup"],
    },
    {
        "canonical":     "Palak Soup",
        "filename_stem": "palak-soup",
        "specificity":   78,
        "aliases": ["palak soup", "spinach soup", "cream of spinach soup",
                    "spinach cream soup"],
        "keywords": ["palak soup", "spinach soup"],
        "search_queries": ["palak soup spinach cream", "spinach soup indian"],
    },
    {
        "canonical":     "Sweet Corn Soup",
        "filename_stem": "sweet-corn-soup",
        "specificity":   78,
        "aliases": ["sweet corn soup", "cream of corn soup",
                    "chinese corn soup indian style"],
        "keywords": ["sweet corn soup", "corn soup"],
        "search_queries": ["sweet corn soup indian", "cream corn soup"],
    },

    # ── NOODLES ───────────────────────────────────────────────────────────────
    {
        "canonical":     "Hakka Noodles",
        "filename_stem": "hakka-noodles",
        "specificity":   82,
        "aliases": ["hakka noodles", "veg hakka noodles", "indian chinese noodles",
                    "restaurant style hakka noodles"],
        "keywords": ["hakka noodles"],
        "search_queries": ["hakka noodles indian chinese", "veg hakka noodles"],
    },

    # ── SEAFOOD ───────────────────────────────────────────────────────────────
    {
        "canonical":     "Fish Curry",
        "filename_stem": "fish-curry",
        "specificity":   78,
        "aliases": ["fish curry", "indian fish curry", "spicy fish curry",
                    "bengali fish curry", "fish masala"],
        "keywords": ["fish curry"],
        "search_queries": ["fish curry indian", "spicy fish curry"],
    },
    {
        "canonical":     "Malabar Prawn Curry",
        "filename_stem": "malabar-prawn-curry",
        "specificity":   85,
        "aliases": ["malabar prawn curry", "kerala prawn curry",
                    "coconut prawn curry", "shrimp curry kerala"],
        "keywords": ["prawn curry", "shrimp curry", "malabar prawn"],
        "search_queries": ["malabar prawn curry", "kerala prawn coconut curry"],
    },
    {
        "canonical":     "Goan Fish Curry",
        "filename_stem": "goan-fish-curry",
        "specificity":   85,
        "aliases": ["goan fish curry", "goa fish curry", "goan fish masala",
                    "goa seafood curry"],
        "keywords": ["goan fish curry", "goa fish"],
        "search_queries": ["goan fish curry", "goa fish curry"],
    },

    # ── VEGETABLE UPMA ────────────────────────────────────────────────────────
    {
        "canonical":     "Vegetable Upma",
        "filename_stem": "vegetable-upma",
        "specificity":   80,
        "aliases": ["vegetable upma", "veg upma", "semolina upma with vegetables"],
        "keywords": ["vegetable upma", "veg upma"],
        "search_queries": ["vegetable upma", "veg rava upma"],
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def log(msg: str):
    print(f"  {msg}", flush=True)

def log_section(title: str):
    print(f"\n{'─' * 60}", flush=True)
    print(f"  {title}", flush=True)
    print(f"{'─' * 60}", flush=True)

def slugify(text: str) -> str:
    """Convert text to lowercase-hyphenated slug."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text.strip())
    return text

def file_hash(path: Path) -> str:
    """MD5 hash of a file's contents."""
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

def is_permitted_license(license_code: str) -> bool:
    if not license_code:
        return False
    return license_code.lower().strip() in PERMITTED_LICENSES


# ─────────────────────────────────────────────────────────────────────────────
# OPENVERSE SEARCH
# ─────────────────────────────────────────────────────────────────────────────

def openverse_search(query: str, page_size: int = MAX_CANDIDATES) -> list[dict]:
    """Search Openverse for images matching query. Returns raw result list."""
    params = {
        "q":            query,
        "license_type": "commercial,modification",
        "page_size":    page_size,
        "mature":       "false",
    }
    try:
        resp = requests.get(
            OPENVERSE_API, params=params,
            headers=HTTP_HEADERS, timeout=REQUEST_TIMEOUT
        )
        if resp.status_code == 200:
            return resp.json().get("results", [])
        elif resp.status_code == 429:
            log(f"    ⚠ Rate limited by Openverse — waiting 5 s …")
            time.sleep(5)
            return []
        else:
            log(f"    ⚠ Openverse returned HTTP {resp.status_code}")
            return []
    except Exception as e:
        log(f"    ⚠ Openverse request failed: {e}")
        return []


# ─────────────────────────────────────────────────────────────────────────────
# RELEVANCE SCORING
# ─────────────────────────────────────────────────────────────────────────────

def score_candidate(candidate: dict, meta: dict) -> float:
    """
    Score an Openverse candidate for relevance to the target recipe.
    Returns 0.0 – 1.0.
    """
    title   = (candidate.get("title") or "").lower()
    tags    = [t.get("name", "").lower() for t in (candidate.get("tags") or [])]
    all_text = title + " " + " ".join(tags)

    canonical_lower = meta["canonical"].lower()
    score = 0.0

    # 1. Title is the exact canonical name → very high
    if canonical_lower == title:
        score += 0.6

    # 2. Canonical name contained in title
    elif canonical_lower in title:
        score += 0.45

    # 3. All words of canonical name appear in title
    elif all(w in title for w in canonical_lower.split()):
        score += 0.35

    # 4. Most words of canonical name appear in title (>= 60% match)
    else:
        canonical_words = canonical_lower.split()
        matched = sum(1 for w in canonical_words if w in title)
        ratio = matched / len(canonical_words) if canonical_words else 0
        if ratio >= 0.6:
            score += 0.25 * ratio
        elif ratio >= 0.4:
            score += 0.10 * ratio

    # 5. Specific alias phrases in title
    for alias in meta.get("aliases", []):
        if alias.lower() in title:
            score += 0.20
            break

    # 6. Keywords in title
    for kw in meta.get("keywords", []):
        if kw.lower() in title:
            score += 0.08

    # 7. Food-related tags boost
    food_tags = {"food", "cooking", "dish", "meal", "indian", "cuisine", "recipe"}
    tag_hits  = sum(1 for t in tags if t in food_tags)
    score    += min(tag_hits * 0.03, 0.12)

    # 8. PENALTY: Generic unrelated terms in title
    generic_terms = {"people", "person", "portrait", "landscape", "nature",
                     "building", "city", "flower", "animal", "car"}
    if any(t in title for t in generic_terms):
        score -= 0.30

    # 9. Image size quality boost (prefer larger originals)
    h = candidate.get("height") or 0
    w = candidate.get("width")  or 0
    if h >= 600 and w >= 800:
        score += 0.05

    return max(0.0, min(score, 1.0))


# ─────────────────────────────────────────────────────────────────────────────
# DOWNLOAD + VALIDATE + OPTIMIZE
# ─────────────────────────────────────────────────────────────────────────────

def download_image(url: str, dest: Path) -> bool:
    """Download image URL to dest path. Returns True on success."""
    try:
        with requests.get(url, headers=HTTP_HEADERS,
                          stream=True, timeout=REQUEST_TIMEOUT,
                          allow_redirects=True) as resp:
            if resp.status_code != 200:
                log(f"    ✗ HTTP {resp.status_code} downloading {url}")
                return False

            # Sanity: must be image content-type
            ct = resp.headers.get("Content-Type", "")
            if "text/html" in ct or "text/plain" in ct:
                log(f"    ✗ Got HTML/text instead of image from {url}")
                return False

            total = 0
            with open(dest, "wb") as f:
                for chunk in resp.iter_content(65536):
                    f.write(chunk)
                    total += len(chunk)
                    if total > MAX_IMG_SIZE_MB * 1024 * 1024:
                        log(f"    ✗ File too large (>{MAX_IMG_SIZE_MB} MB), aborting")
                        return False
        return True
    except Exception as e:
        log(f"    ✗ Download error: {e}")
        return False


def validate_and_optimize(src: Path, dest: Path) -> bool:
    """
    Validate src is a decodable image with reasonable dimensions.
    Optimize and save as WebP to dest.
    Returns True on success.
    """
    try:
        with Image.open(src) as img:
            w, h = img.size
            if w < MIN_IMG_DIMENSION or h < MIN_IMG_DIMENSION:
                log(f"    ✗ Image too small ({w}×{h}), rejecting")
                return False

            # Convert to RGB (handle RGBA/P/CMYK etc.)
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")

            # Resize if needed (maintain aspect ratio)
            if w > OUT_MAX_W or h > OUT_MAX_H:
                img.thumbnail((OUT_MAX_W, OUT_MAX_H), Image.LANCZOS)

            img.save(dest, format=OUT_FORMAT, quality=OUT_QUAL, method=6)
        return True
    except UnidentifiedImageError:
        log(f"    ✗ Cannot decode image (not a valid image file)")
        return False
    except Exception as e:
        log(f"    ✗ Optimization error: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# CATALOG UPDATE
# ─────────────────────────────────────────────────────────────────────────────

def build_catalog_entry_ts(meta: dict, filename: str) -> str:
    """Return a TypeScript catalog entry string for insertion."""
    canonical  = meta["canonical"]
    specificity = meta.get("specificity", 70)
    aliases_ts  = "\n".join(f"      '{a}'," for a in meta.get("aliases", []))
    keywords_ts = "\n".join(f"      '{k}'," for k in meta.get("keywords", []))
    return f"""
  // ── {canonical.upper()} ──────────────────────────────────────────────────
  {{
    image: '{filename}',
    canonical: '{canonical}',
    specificity: {specificity},
    aliases: [
{aliases_ts}
    ],
    keywords: [
{keywords_ts}
    ],
  }},
"""


def update_catalog(approved_entries: list[dict]):
    """
    Append new catalog entries to recipeImageCatalog.ts.
    Never duplicates entries whose image filename already appears in the file.
    """
    with open(CATALOG_FILE, "r", encoding="utf-8") as f:
        existing_content = f.read()

    # Find all image filenames already in catalog
    existing_images = set(re.findall(r"image:\s*'([^']+)'", existing_content))

    new_blocks = []
    for entry in approved_entries:
        if entry["filename"] in existing_images:
            log(f"    ℹ  Catalog entry for '{entry['filename']}' already exists, skipping")
            continue
        ts_block = build_catalog_entry_ts(entry["meta"], entry["filename"])
        new_blocks.append(ts_block)

    if not new_blocks:
        log("    ℹ  No new catalog entries to add")
        return

    # Insert before the closing ]; of recipeImageCatalog
    insertion = "\n".join(new_blocks)
    updated = existing_content.replace(
        "\n  // ─────────────────────────────────────────────────────────────────────────\n  // FUTURE ENTRIES",
        insertion + "\n  // ─────────────────────────────────────────────────────────────────────────\n  // FUTURE ENTRIES"
    )

    # Fallback: if comment marker not found, inject before closing ];
    if updated == existing_content:
        updated = existing_content.replace("\n];\n", insertion + "\n];\n", 1)

    with open(CATALOG_FILE, "w", encoding="utf-8") as f:
        f.write(updated)

    log(f"    ✅ Added {len(new_blocks)} new entries to recipeImageCatalog.ts")


# ─────────────────────────────────────────────────────────────────────────────
# REPORT GENERATION
# ─────────────────────────────────────────────────────────────────────────────

def save_reports(report_rows: list[dict]):
    # JSON
    with open(REPORT_JSON, "w", encoding="utf-8") as f:
        json.dump(report_rows, f, indent=2, ensure_ascii=False)

    # CSV
    fieldnames = ["recipe", "status", "filename", "relevance_score",
                  "license", "source", "creator", "openverse_id", "notes"]
    with open(REPORT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(report_rows)

    log(f"    📄 Reports saved → {REPORT_JSON.name}, {REPORT_CSV.name}")


def save_attribution(attribution_entries: list[dict]):
    ATTR_JSON.parent.mkdir(parents=True, exist_ok=True)

    # Load existing if present
    existing = []
    if ATTR_JSON.exists():
        with open(ATTR_JSON, "r", encoding="utf-8") as f:
            existing = json.load(f)

    # Deduplicate by filename
    existing_filenames = {e.get("filename") for e in existing}
    new_entries = [e for e in attribution_entries
                   if e.get("filename") not in existing_filenames]
    combined = existing + new_entries

    with open(ATTR_JSON, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)

    log(f"    📄 Attribution manifest → {ATTR_JSON}")


def save_license_md(attribution_entries: list[dict]):
    lines = [
        "# Rasoi — Recipe Image Licenses\n",
        "All recipe images are sourced from [Openverse](https://openverse.org/) and",
        "are used under Creative Commons or Public Domain licenses.\n",
        "| Recipe | File | License | Creator | Source |",
        "|--------|------|---------|---------|--------|",
    ]
    for e in attribution_entries:
        recipe  = e.get("recipe", "")
        fname   = e.get("filename", "")
        lic     = e.get("license", "")
        creator = e.get("creator", "")
        src_url = e.get("sourceUrl", "")
        lines.append(f"| {recipe} | `{fname}` | {lic} | {creator} | [{src_url[:50]}]({src_url}) |")

    lines += [
        "",
        "## Attribution Requirement",
        "",
        "CC BY and CC BY-SA images require attribution when reproduced.",
        "See `public/images/image-attribution.json` for complete per-image attribution.",
        "",
        "_Generated by `tools/build_recipe_images.py`_",
    ]
    LICENSE_MD.parent.mkdir(parents=True, exist_ok=True)
    with open(LICENSE_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    log(f"    📄 License doc → {LICENSE_MD}")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "═" * 60)
    print("  RASOI — Recipe Image Library Pipeline")
    print(f"  Mode: {'DRY RUN' if DRY_RUN else 'LIVE'} | Min score: {MIN_SCORE}")
    print("═" * 60)

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # Track downloaded file hashes for duplicate detection
    downloaded_hashes: dict[str, str] = {}  # hash → recipe canonical

    report_rows       : list[dict] = []
    attribution_entries: list[dict] = []
    approved_catalog  : list[dict] = []  # entries for catalog update

    stats = {
        "total":           len(RECIPE_METADATA),
        "existing":        0,
        "approved":        0,
        "no_image":        0,
        "download_failed": 0,
        "license_unclear": 0,
        "duplicate":       0,
        "skipped":         0,
    }

    for meta in RECIPE_METADATA:
        canonical   = meta["canonical"]
        stem        = meta["filename_stem"]
        out_file    = IMAGES_DIR / (stem + OUT_EXT)

        log_section(canonical)

        # ── Preserve existing curated images ──────────────────────────────────
        existing_file = meta.get("existing_file")
        if existing_file:
            existing_path = IMAGES_DIR / existing_file
            if existing_path.exists():
                log(f"✅ Existing curated image preserved: {existing_file}")
                stats["existing"] += 1
                report_rows.append({
                    "recipe": canonical, "status": STATUS_EXISTING,
                    "filename": existing_file, "relevance_score": 1.0,
                    "license": "curated", "source": "local",
                    "creator": "", "openverse_id": "",
                    "notes": "Pre-existing curated image",
                })
                continue

        # ── Already have this WebP and not forcing ─────────────────────────────
        if out_file.exists() and not FORCE:
            log(f"⏭  Already exists: {out_file.name} (use FORCE=1 to reprocess)")
            stats["skipped"] += 1
            report_rows.append({
                "recipe": canonical, "status": STATUS_SKIPPED,
                "filename": out_file.name, "relevance_score": "–",
                "license": "–", "source": "–", "creator": "–",
                "openverse_id": "–", "notes": "Already downloaded",
            })
            continue

        # ── Search Openverse ──────────────────────────────────────────────────
        all_candidates: list[tuple[float, dict]] = []

        for query in meta.get("search_queries", [canonical]):
            log(f"  🔍 Searching: '{query}'")
            results = openverse_search(query)
            time.sleep(RATE_LIMIT_DELAY)

            for r in results:
                score = score_candidate(r, meta)
                all_candidates.append((score, r))

        if not all_candidates:
            log(f"  ✗ No candidates returned from Openverse")
            stats["no_image"] += 1
            report_rows.append({
                "recipe": canonical, "status": STATUS_NO_IMAGE,
                "filename": "", "relevance_score": 0,
                "license": "", "source": "", "creator": "",
                "openverse_id": "", "notes": "No Openverse results",
            })
            continue

        # Deduplicate candidates by Openverse ID, keep highest score
        seen_ids: dict[str, float] = {}
        deduped: list[tuple[float, dict]] = []
        for score, cand in all_candidates:
            cid = cand.get("id", "")
            if cid not in seen_ids or score > seen_ids[cid]:
                seen_ids[cid] = score
                deduped = [(s, c) for (s, c) in deduped if c.get("id") != cid]
                deduped.append((score, cand))

        # Sort by descending score
        deduped.sort(key=lambda x: x[0], reverse=True)

        log(f"  📊 Top candidates (showing top 5):")
        for i, (sc, c) in enumerate(deduped[:5]):
            log(f"     [{i+1}] score={sc:.2f}  license={c.get('license','')}  "
                f"title={c.get('title','')[:55]}")

        # ── Select best valid candidate ────────────────────────────────────────
        selected_score: Optional[float] = None
        selected_cand: Optional[dict]   = None

        for score, cand in deduped:
            if score < MIN_SCORE:
                log(f"  ⚠ Best remaining score {score:.2f} < threshold {MIN_SCORE}. Stopping.")
                break

            # License check
            lic = cand.get("license", "")
            if not is_permitted_license(lic):
                log(f"  ⚠ Skipping — license '{lic}' not in permitted set")
                stats["license_unclear"] += 1
                continue

            # URL check
            img_url = cand.get("url", "")
            if not img_url or not img_url.startswith("http"):
                log(f"  ⚠ Skipping — no valid URL")
                continue

            selected_score = score
            selected_cand  = cand
            break

        if not selected_cand:
            log(f"  ✗ No candidate passed relevance + license checks")
            stats["no_image"] += 1
            report_rows.append({
                "recipe": canonical, "status": STATUS_NO_IMAGE,
                "filename": "", "relevance_score": round(deduped[0][0], 3) if deduped else 0,
                "license": "", "source": "", "creator": "",
                "openverse_id": "", "notes": "Threshold or license not met",
            })
            continue

        log(f"  ✅ Selected: score={selected_score:.2f} | "
            f"license={selected_cand.get('license')} | "
            f"title={selected_cand.get('title','')[:50]}")

        if DRY_RUN:
            log("  [DRY RUN] Would download → skipping actual download")
            stats["skipped"] += 1
            report_rows.append({
                "recipe": canonical, "status": STATUS_SKIPPED,
                "filename": out_file.name, "relevance_score": round(selected_score, 3),
                "license": selected_cand.get("license",""),
                "source": selected_cand.get("provider",""),
                "creator": selected_cand.get("creator",""),
                "openverse_id": selected_cand.get("id",""),
                "notes": "DRY_RUN — not downloaded",
            })
            continue

        # ── Download ──────────────────────────────────────────────────────────
        img_url  = selected_cand["url"]
        tmp_path = IMAGES_DIR / f"_tmp_{stem}"

        log(f"  ⬇  Downloading …")
        dl_ok = download_image(img_url, tmp_path)
        time.sleep(DOWNLOAD_DELAY)

        if not dl_ok:
            tmp_path.unlink(missing_ok=True)
            stats["download_failed"] += 1
            report_rows.append({
                "recipe": canonical, "status": STATUS_DOWNLOAD_FAILED,
                "filename": "", "relevance_score": round(selected_score, 3),
                "license": selected_cand.get("license",""),
                "source": selected_cand.get("provider",""),
                "creator": selected_cand.get("creator",""),
                "openverse_id": selected_cand.get("id",""),
                "notes": "Download failed",
            })
            continue

        # ── Duplicate detection ────────────────────────────────────────────────
        h = file_hash(tmp_path)
        if h in downloaded_hashes:
            dup_recipe = downloaded_hashes[h]
            log(f"  ✗ DUPLICATE detected — same file as '{dup_recipe}', rejecting")
            tmp_path.unlink(missing_ok=True)
            stats["duplicate"] += 1
            report_rows.append({
                "recipe": canonical, "status": STATUS_DUPLICATE,
                "filename": "", "relevance_score": round(selected_score, 3),
                "license": selected_cand.get("license",""),
                "source": selected_cand.get("provider",""),
                "creator": selected_cand.get("creator",""),
                "openverse_id": selected_cand.get("id",""),
                "notes": f"Duplicate of '{dup_recipe}'",
            })
            continue

        # ── Validate + Optimize ────────────────────────────────────────────────
        log(f"  🔧 Validating and optimizing …")
        ok = validate_and_optimize(tmp_path, out_file)
        tmp_path.unlink(missing_ok=True)

        if not ok:
            stats["download_failed"] += 1
            report_rows.append({
                "recipe": canonical, "status": STATUS_DOWNLOAD_FAILED,
                "filename": "", "relevance_score": round(selected_score, 3),
                "license": selected_cand.get("license",""),
                "source": selected_cand.get("provider",""),
                "creator": selected_cand.get("creator",""),
                "openverse_id": selected_cand.get("id",""),
                "notes": "Validation/optimization failed",
            })
            continue

        # ── Success ────────────────────────────────────────────────────────────
        downloaded_hashes[h] = canonical
        stats["approved"] += 1
        sz_kb = out_file.stat().st_size // 1024

        log(f"  ✅ Saved: {out_file.name} ({sz_kb} KB)")

        report_rows.append({
            "recipe": canonical, "status": STATUS_APPROVED,
            "filename": out_file.name, "relevance_score": round(selected_score, 3),
            "license": selected_cand.get("license",""),
            "source": selected_cand.get("provider",""),
            "creator": selected_cand.get("creator",""),
            "openverse_id": selected_cand.get("id",""),
            "notes": selected_cand.get("title","")[:80],
        })

        attribution_entries.append({
            "recipe":         canonical,
            "filename":       out_file.name,
            "source":         selected_cand.get("provider",""),
            "sourceUrl":      selected_cand.get("foreign_landing_url",""),
            "creator":        selected_cand.get("creator",""),
            "creatorUrl":     selected_cand.get("creator_url",""),
            "license":        selected_cand.get("license",""),
            "licenseUrl":     selected_cand.get("license_url",""),
            "attribution":    selected_cand.get("attribution",""),
            "downloadedAt":   datetime.now(timezone.utc).isoformat(),
            "originalImageUrl": selected_cand.get("url",""),
            "openverseId":    selected_cand.get("id",""),
        })

        approved_catalog.append({
            "meta":     meta,
            "filename": out_file.name,
        })

    # ── Save outputs ──────────────────────────────────────────────────────────
    log_section("Saving outputs …")
    save_reports(report_rows)
    if attribution_entries:
        save_attribution(attribution_entries)
        save_license_md(attribution_entries)

    # ── Update catalog ─────────────────────────────────────────────────────────
    if approved_catalog and not DRY_RUN:
        log_section("Updating recipeImageCatalog.ts …")
        update_catalog(approved_catalog)

    # ── Final summary ─────────────────────────────────────────────────────────
    print("\n" + "═" * 60)
    print("  PIPELINE COMPLETE")
    print("═" * 60)
    print(f"  Total targets      : {stats['total']}")
    print(f"  Existing (preserved): {stats['existing']}")
    print(f"  New approved       : {stats['approved']}")
    print(f"  No suitable image  : {stats['no_image']}")
    print(f"  Download failures  : {stats['download_failed']}")
    print(f"  License rejected   : {stats['license_unclear']}")
    print(f"  Duplicates rejected: {stats['duplicate']}")
    print(f"  Skipped (exists)   : {stats['skipped']}")
    total_images = stats['existing'] + stats['approved']
    print(f"\n  Total local images : {total_images}")
    print(f"  Images dir         : {IMAGES_DIR}")
    print(f"  Catalog            : {CATALOG_FILE.name}")
    print(f"  Reports            : {REPORT_JSON.name}, {REPORT_CSV.name}")
    if attribution_entries:
        print(f"  Attribution        : {ATTR_JSON.name}")
    print("═" * 60)


if __name__ == "__main__":
    main()
