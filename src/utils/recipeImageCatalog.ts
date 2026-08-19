/**
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

export const recipeImageCatalog: CatalogEntry[] = [
  {
    "image": "aloo-gobi.webp",
    "canonical": "Aloo Gobi",
    "specificity": 80,
    "aliases": [
      "aloo gobi",
      "potato cauliflower"
    ],
    "keywords": [
      "aloo",
      "gobi"
    ]
  },
  {
    "image": "aloo-matar.webp",
    "canonical": "Aloo Matar",
    "specificity": 80,
    "aliases": [
      "aloo matar",
      "potato peas curry"
    ],
    "keywords": [
      "aloo",
      "matar"
    ]
  },
  {
    "image": "aloo-paratha.webp",
    "canonical": "Aloo Paratha",
    "specificity": 85,
    "aliases": [
      "aloo paratha"
    ],
    "keywords": [
      "aloo paratha",
      "paratha"
    ]
  },
  {
    "image": "aloo-tikki.webp",
    "canonical": "Aloo Tikki",
    "specificity": 85,
    "aliases": [
      "aloo tikki"
    ],
    "keywords": [
      "aloo tikki"
    ]
  },
  {
    "image": "baingan-bharta.webp",
    "canonical": "Baingan Bharta",
    "specificity": 85,
    "aliases": [
      "baingan bharta",
      "baingan ka bharta",
      "eggplant mash"
    ],
    "keywords": [
      "baingan",
      "bharta",
      "eggplant"
    ]
  },
  {
    "image": "besan-chilla.webp",
    "canonical": "Besan Chilla",
    "specificity": 85,
    "aliases": [
      "besan chilla",
      "besan cheela"
    ],
    "keywords": [
      "chilla",
      "cheela",
      "besan"
    ]
  },
  {
    "image": "bhel-puri.webp",
    "canonical": "Bhel Puri",
    "specificity": 85,
    "aliases": [
      "bhel puri"
    ],
    "keywords": [
      "bhel"
    ]
  },
  {
    "image": "bhindi-masala.webp",
    "canonical": "Bhindi Masala",
    "specificity": 80,
    "aliases": [
      "bhindi masala",
      "okra fry",
      "bhindi fry"
    ],
    "keywords": [
      "bhindi",
      "okra"
    ]
  },
  {
    "image": "bread-pakora.webp",
    "canonical": "Bread Pakora",
    "specificity": 85,
    "aliases": [
      "bread pakora"
    ],
    "keywords": [
      "bread pakora"
    ]
  },
  {
    "image": "butter-naan.webp",
    "canonical": "Butter Naan",
    "specificity": 85,
    "aliases": [
      "butter naan"
    ],
    "keywords": [
      "butter naan"
    ]
  },
  {
    "image": "caesar-salad.webp",
    "canonical": "Caesar Salad",
    "specificity": 85,
    "aliases": [
      "caesar salad"
    ],
    "keywords": [
      "caesar salad"
    ]
  },
  {
    "image": "chana-masala.webp",
    "canonical": "Chana Masala",
    "specificity": 80,
    "aliases": [
      "chana masala",
      "chole",
      "punjabi chole",
      "chickpea curry"
    ],
    "keywords": [
      "chana",
      "chole",
      "chickpea"
    ]
  },
  {
    "image": "chicken-biryani.webp",
    "canonical": "Chicken Biryani",
    "specificity": 85,
    "aliases": [
      "chicken biryani",
      "hyderabadi chicken biryani",
      "dum chicken biryani"
    ],
    "keywords": [
      "chicken",
      "biryani"
    ]
  },
  {
    "image": "chicken-curry.webp",
    "canonical": "Chicken Curry",
    "specificity": 75,
    "aliases": [
      "chicken curry",
      "indian chicken curry",
      "tariwala chicken"
    ],
    "keywords": [
      "chicken",
      "curry",
      "murgh"
    ]
  },
  {
    "image": "chicken-fried-rice.webp",
    "canonical": "Chicken Fried Rice",
    "specificity": 80,
    "aliases": [
      "chicken fried rice"
    ],
    "keywords": [
      "chicken fried rice"
    ]
  },
  {
    "image": "chicken-pulao.webp",
    "canonical": "Chicken Pulao",
    "specificity": 80,
    "aliases": [
      "chicken pulao"
    ],
    "keywords": [
      "chicken pulao"
    ]
  },
  {
    "image": "chicken-tikka-masala.webp",
    "canonical": "Chicken Tikka Masala",
    "specificity": 85,
    "aliases": [
      "chicken tikka masala"
    ],
    "keywords": [
      "chicken",
      "tikka",
      "masala"
    ]
  },
  {
    "image": "chicken-tikka.webp",
    "canonical": "Chicken Tikka",
    "specificity": 85,
    "aliases": [
      "chicken tikka",
      "tandoori chicken tikka"
    ],
    "keywords": [
      "chicken",
      "tikka"
    ]
  },
  {
    "image": "chole-bhature.webp",
    "canonical": "Chole Bhature",
    "specificity": 90,
    "aliases": [
      "chole bhature",
      "chana bhatura"
    ],
    "keywords": [
      "bhature",
      "chole bhature"
    ]
  },
  {
    "image": "cold-coffee.webp",
    "canonical": "Cold Coffee",
    "specificity": 80,
    "aliases": [
      "cold coffee"
    ],
    "keywords": [
      "cold coffee"
    ]
  },
  {
    "image": "curd-rice.webp",
    "canonical": "Curd Rice",
    "specificity": 80,
    "aliases": [
      "curd rice",
      "dahi chawal"
    ],
    "keywords": [
      "curd",
      "dahi",
      "rice"
    ]
  },
  {
    "image": "dahi-puri.webp",
    "canonical": "Dahi Puri",
    "specificity": 85,
    "aliases": [
      "dahi puri"
    ],
    "keywords": [
      "dahi puri"
    ]
  },
  {
    "image": "dal-makhani.webp",
    "canonical": "Dal Makhani",
    "specificity": 85,
    "aliases": [
      "dal makhani",
      "black dal",
      "maa ki dal"
    ],
    "keywords": [
      "dal",
      "makhani"
    ]
  },
  {
    "image": "dhokla.webp",
    "canonical": "Dhokla",
    "specificity": 85,
    "aliases": [
      "dhokla",
      "khaman dhokla"
    ],
    "keywords": [
      "dhokla",
      "khaman"
    ]
  },
  {
    "image": "egg-biryani.webp",
    "canonical": "Egg Biryani",
    "specificity": 85,
    "aliases": [
      "egg biryani",
      "anda biryani"
    ],
    "keywords": [
      "egg",
      "anda",
      "biryani"
    ]
  },
  {
    "image": "egg-curry.jpg",
    "canonical": "Egg Curry",
    "specificity": 70,
    "aliases": [
      "egg curry",
      "anda curry",
      "ande curry",
      "tariwali anda",
      "tariwali anda curry",
      "punjabi egg curry",
      "punjabi anda curry",
      "homestyle anda curry",
      "homestyle egg curry",
      "spiced egg curry",
      "indian egg curry",
      "egg masala",
      "anda masala",
      "ande masala",
      "egg gravy",
      "anda gravy",
      "dhaba egg curry",
      "dhaba anda curry"
    ],
    "keywords": [
      "anda",
      "ande",
      "anday",
      "undi",
      "muttai",
      "motte"
    ]
  },
  {
    "image": "egg-half-fry.jpg",
    "canonical": "Egg Half Fry",
    "specificity": 90,
    "aliases": [
      "egg half fry",
      "half fry egg",
      "anda half fry",
      "ande half fry",
      "half fried egg"
    ],
    "keywords": [
      "half fry",
      "half-fry",
      "half fried"
    ]
  },
  {
    "image": "egg-omlette.jpg",
    "canonical": "Egg Omelette",
    "specificity": 85,
    "aliases": [
      "egg omelette",
      "egg omelet",
      "egg omlette",
      "anda omelette",
      "anda omelet",
      "ande omelette",
      "masala omelette",
      "masala omelet",
      "masala omlette",
      "spiced omelette"
    ],
    "keywords": [
      "omelette",
      "omelet",
      "omlette"
    ]
  },
  {
    "image": "fish-curry.webp",
    "canonical": "Fish Curry",
    "specificity": 80,
    "aliases": [
      "fish curry",
      "goan fish curry",
      "machli curry"
    ],
    "keywords": [
      "fish",
      "machli"
    ]
  },
  {
    "image": "french-toast.webp",
    "canonical": "French Toast",
    "specificity": 85,
    "aliases": [
      "french toast"
    ],
    "keywords": [
      "french toast"
    ]
  },
  {
    "image": "fried-rice.webp",
    "canonical": "Fried Rice",
    "specificity": 75,
    "aliases": [
      "veg fried rice",
      "fried rice"
    ],
    "keywords": [
      "fried rice"
    ]
  },
  {
    "image": "gajar-halwa.webp",
    "canonical": "Gajar Halwa",
    "specificity": 90,
    "aliases": [
      "gajar halwa",
      "gajar ka halwa"
    ],
    "keywords": [
      "gajar",
      "halwa"
    ]
  },
  {
    "image": "garlic-naan.webp",
    "canonical": "Garlic Naan",
    "specificity": 85,
    "aliases": [
      "garlic naan"
    ],
    "keywords": [
      "garlic naan"
    ]
  },
  {
    "image": "gobi-paratha.webp",
    "canonical": "Gobi Paratha",
    "specificity": 85,
    "aliases": [
      "gobi paratha"
    ],
    "keywords": [
      "gobi paratha"
    ]
  },
  {
    "image": "grilled-chicken.webp",
    "canonical": "Grilled Chicken",
    "specificity": 80,
    "aliases": [
      "grilled chicken"
    ],
    "keywords": [
      "grilled chicken"
    ]
  },
  {
    "image": "gulab-jamun.webp",
    "canonical": "Gulab Jamun",
    "specificity": 90,
    "aliases": [
      "gulab jamun"
    ],
    "keywords": [
      "gulab jamun"
    ]
  },
  {
    "image": "idli.webp",
    "canonical": "Idli",
    "specificity": 85,
    "aliases": [
      "idli",
      "idly"
    ],
    "keywords": [
      "idli",
      "idly"
    ]
  },
  {
    "image": "jeera-rice.webp",
    "canonical": "Jeera Rice",
    "specificity": 80,
    "aliases": [
      "jeera rice",
      "cumin rice"
    ],
    "keywords": [
      "jeera",
      "cumin",
      "rice"
    ]
  },
  {
    "image": "kachori.webp",
    "canonical": "Kachori",
    "specificity": 85,
    "aliases": [
      "kachori",
      "pyaz kachori"
    ],
    "keywords": [
      "kachori"
    ]
  },
  {
    "image": "kadhi.webp",
    "canonical": "Kadhi",
    "specificity": 80,
    "aliases": [
      "kadhi pakora",
      "punjabi kadhi",
      "kadhi chawal"
    ],
    "keywords": [
      "kadhi"
    ]
  },
  {
    "image": "kheer.webp",
    "canonical": "Kheer",
    "specificity": 85,
    "aliases": [
      "kheer",
      "payasam"
    ],
    "keywords": [
      "kheer",
      "payasam"
    ]
  },
  {
    "image": "kofta-curry.webp",
    "canonical": "Kofta Curry",
    "specificity": 75,
    "aliases": [
      "kofta curry"
    ],
    "keywords": [
      "kofta"
    ]
  },
  {
    "image": "kulfi.webp",
    "canonical": "Kulfi",
    "specificity": 85,
    "aliases": [
      "kulfi"
    ],
    "keywords": [
      "kulfi"
    ]
  },
  {
    "image": "ladoo.webp",
    "canonical": "Ladoo",
    "specificity": 85,
    "aliases": [
      "ladoo",
      "laddu"
    ],
    "keywords": [
      "ladoo",
      "laddu"
    ]
  },
  {
    "image": "malai-kofta.webp",
    "canonical": "Malai Kofta",
    "specificity": 85,
    "aliases": [
      "malai kofta"
    ],
    "keywords": [
      "malai",
      "kofta"
    ]
  },
  {
    "image": "mango-lassi.webp",
    "canonical": "Mango Lassi",
    "specificity": 85,
    "aliases": [
      "mango lassi"
    ],
    "keywords": [
      "mango lassi"
    ]
  },
  {
    "image": "mango-shake.webp",
    "canonical": "Mango Shake",
    "specificity": 80,
    "aliases": [
      "mango shake"
    ],
    "keywords": [
      "mango shake"
    ]
  },
  {
    "image": "masala-chai.webp",
    "canonical": "Masala Chai",
    "specificity": 85,
    "aliases": [
      "masala chai",
      "chai",
      "tea"
    ],
    "keywords": [
      "chai",
      "tea"
    ]
  },
  {
    "image": "masala-dosa.webp",
    "canonical": "Masala Dosa",
    "specificity": 85,
    "aliases": [
      "masala dosa",
      "mysore masala dosa"
    ],
    "keywords": [
      "masala dosa",
      "dosa"
    ]
  },
  {
    "image": "medu-vada.webp",
    "canonical": "Medu Vada",
    "specificity": 85,
    "aliases": [
      "medu vada",
      "sambar vada"
    ],
    "keywords": [
      "vada",
      "medu vada"
    ]
  },
  {
    "image": "mutton-biryani.webp",
    "canonical": "Mutton Biryani",
    "specificity": 85,
    "aliases": [
      "mutton biryani",
      "hyderabadi mutton biryani",
      "lamb biryani"
    ],
    "keywords": [
      "mutton",
      "lamb",
      "biryani"
    ]
  },
  {
    "image": "mutton-curry.webp",
    "canonical": "Mutton Curry",
    "specificity": 80,
    "aliases": [
      "mutton curry",
      "goat curry",
      "lamb curry"
    ],
    "keywords": [
      "mutton",
      "goat",
      "lamb"
    ]
  },
  {
    "image": "pakora.webp",
    "canonical": "Pakora",
    "specificity": 80,
    "aliases": [
      "pakora",
      "pakoda",
      "bhajji"
    ],
    "keywords": [
      "pakora",
      "pakoda",
      "bhajji"
    ]
  },
  {
    "image": "palak-paneer.webp",
    "canonical": "Palak Paneer",
    "specificity": 85,
    "aliases": [
      "palak paneer",
      "spinach paneer",
      "paneer palak",
      "paneer spinach curry"
    ],
    "keywords": [
      "palak",
      "spinach",
      "paneer"
    ]
  },
  {
    "image": "pancakes.webp",
    "canonical": "Pancakes",
    "specificity": 85,
    "aliases": [
      "pancakes",
      "pancake"
    ],
    "keywords": [
      "pancakes"
    ]
  },
  {
    "image": "paneer-butter-masala.webp",
    "canonical": "Paneer Butter Masala",
    "specificity": 85,
    "aliases": [
      "paneer butter masala",
      "butter paneer",
      "paneer makhani"
    ],
    "keywords": [
      "paneer",
      "butter",
      "masala",
      "makhani"
    ]
  },
  {
    "image": "paneer-paratha.webp",
    "canonical": "Paneer Paratha",
    "specificity": 85,
    "aliases": [
      "paneer paratha"
    ],
    "keywords": [
      "paneer paratha"
    ]
  },
  {
    "image": "pani-puri.webp",
    "canonical": "Pani Puri",
    "specificity": 90,
    "aliases": [
      "pani puri",
      "golgappa"
    ],
    "keywords": [
      "pani puri",
      "golgappa"
    ]
  },
  {
    "image": "paratha.webp",
    "canonical": "Paratha",
    "specificity": 70,
    "aliases": [
      "paratha",
      "laccha paratha"
    ],
    "keywords": [
      "paratha"
    ]
  },
  {
    "image": "pav-bhaji.webp",
    "canonical": "Pav Bhaji",
    "specificity": 90,
    "aliases": [
      "pav bhaji"
    ],
    "keywords": [
      "pav bhaji"
    ]
  },
  {
    "image": "plain-dosa.webp",
    "canonical": "Plain Dosa",
    "specificity": 75,
    "aliases": [
      "plain dosa",
      "sada dosa"
    ],
    "keywords": [
      "dosa"
    ]
  },
  {
    "image": "poha.webp",
    "canonical": "Poha",
    "specificity": 85,
    "aliases": [
      "kanda poha",
      "poha"
    ],
    "keywords": [
      "poha"
    ]
  },
  {
    "image": "pongal.webp",
    "canonical": "Pongal",
    "specificity": 85,
    "aliases": [
      "ven pongal"
    ],
    "keywords": [
      "pongal"
    ]
  },
  {
    "image": "poori-bhaji.webp",
    "canonical": "Poori Bhaji",
    "specificity": 85,
    "aliases": [
      "poori bhaji",
      "puri bhaji"
    ],
    "keywords": [
      "poori",
      "puri",
      "bhaji"
    ]
  },
  {
    "image": "prawn-curry.webp",
    "canonical": "Prawn Curry",
    "specificity": 85,
    "aliases": [
      "prawn curry",
      "shrimp curry",
      "malabar prawn curry"
    ],
    "keywords": [
      "prawn",
      "shrimp",
      "chingri"
    ]
  },
  {
    "image": "rajma.webp",
    "canonical": "Rajma",
    "specificity": 80,
    "aliases": [
      "rajma",
      "rajma masala",
      "rajma chawal",
      "kidney bean curry"
    ],
    "keywords": [
      "rajma",
      "kidney bean"
    ]
  },
  {
    "image": "rasgulla.webp",
    "canonical": "Rasgulla",
    "specificity": 90,
    "aliases": [
      "rasgulla",
      "rosogolla"
    ],
    "keywords": [
      "rasgulla"
    ]
  },
  {
    "image": "rasmalai.webp",
    "canonical": "Rasmalai",
    "specificity": 90,
    "aliases": [
      "rasmalai"
    ],
    "keywords": [
      "rasmalai"
    ]
  },
  {
    "image": "samosa.webp",
    "canonical": "Samosa",
    "specificity": 90,
    "aliases": [
      "samosa",
      "aloo samosa"
    ],
    "keywords": [
      "samosa"
    ]
  },
  {
    "image": "sandwich.webp",
    "canonical": "Sandwich",
    "specificity": 75,
    "aliases": [
      "sandwich"
    ],
    "keywords": [
      "sandwich"
    ]
  },
  {
    "image": "shahi-paneer.webp",
    "canonical": "Shahi Paneer",
    "specificity": 80,
    "aliases": [
      "shahi paneer",
      "royal paneer curry"
    ],
    "keywords": [
      "shahi",
      "paneer"
    ]
  },
  {
    "image": "shahi-tukda.webp",
    "canonical": "Shahi Tukda",
    "specificity": 85,
    "aliases": [
      "shahi tukda"
    ],
    "keywords": [
      "shahi tukda"
    ]
  },
  {
    "image": "sweet-lassi.webp",
    "canonical": "Sweet Lassi",
    "specificity": 80,
    "aliases": [
      "sweet lassi",
      "lassi"
    ],
    "keywords": [
      "lassi"
    ]
  },
  {
    "image": "tandoori-roti.webp",
    "canonical": "Tandoori Roti",
    "specificity": 80,
    "aliases": [
      "tandoori roti"
    ],
    "keywords": [
      "tandoori roti"
    ]
  },
  {
    "image": "tomato-rice.webp",
    "canonical": "Tomato Rice",
    "specificity": 80,
    "aliases": [
      "tomato rice"
    ],
    "keywords": [
      "tomato",
      "rice"
    ]
  },
  {
    "image": "upma.webp",
    "canonical": "Upma",
    "specificity": 80,
    "aliases": [
      "rava upma",
      "upma"
    ],
    "keywords": [
      "upma"
    ]
  },
  {
    "image": "uttapam.webp",
    "canonical": "Uttapam",
    "specificity": 85,
    "aliases": [
      "uttapam",
      "uthappam"
    ],
    "keywords": [
      "uttapam"
    ]
  },
  {
    "image": "vada-pav.webp",
    "canonical": "Vada Pav",
    "specificity": 90,
    "aliases": [
      "vada pav"
    ],
    "keywords": [
      "vada pav"
    ]
  },
  {
    "image": "vegetable-biryani.webp",
    "canonical": "Vegetable Biryani",
    "specificity": 80,
    "aliases": [
      "vegetable biryani",
      "veg biryani"
    ],
    "keywords": [
      "veg",
      "vegetable",
      "biryani"
    ]
  },
  {
    "image": "vegetable-pulao.webp",
    "canonical": "Vegetable Pulao",
    "specificity": 80,
    "aliases": [
      "veg pulao",
      "vegetable pulao"
    ],
    "keywords": [
      "pulao"
    ]
  }
];
