/**
 * MANGAALAM Perfumes — Product Catalog Data Store
 * All names and bottle imagery are mapped directly from the official 50ml and 20ml catalogs.
 * Standardized pricing:
 * - 6 perfumes, 50 ml: ₹799 each
 * - 5 perfumes, 20 ml: ₹449 each
 * 
 * Scent notes marked with '[Brand specification pending]' indicate editable placeholders 
 * awaiting definitive formula cards from the brand creator Mrs. Manisha Mehta.
 */

export const BRAND_INFO = {
  name: "MANGAALAM",
  tagline: "MANGAALAM – Khushboo Jo Dil Mein Bas Jaye.",
  foundedYear: 2026,
  founder: "Mrs. Manisha Mehta",
  founderAge: 61,
  storyHeadline: "Crafted with Passion. Rooted in Memory.",
  storyOverview: "MANGAALAM is an Indian fragrance brand established in 2026, built on the belief that fragrance is an emotion, a memory and an expression of individuality. Founded by Mrs. Manisha Mehta, a passionate 61-year-old working woman, the brand reflects her belief that the joy of working and creating has no age limit. Its thoughtfully curated collection includes unisex fragrances, selected fragrances for men and women, and car fragrances for everyday journeys. MANGAALAM aims to make memorable fragrance experiences accessible to everyone.",
  closingQuote: "Some fragrances are not just smelled; they are remembered.",
  logoUrl: "/assets/brand/mangaalam-logo.jpg",
  logoWebp: "/assets/brand/mangaalam-logo-800.webp",
  logoThumb: "/assets/brand/mangaalam-logo-400.webp"
};

export const PRODUCTS = [
  // ----------------------------------------------------
  // 50 ML COLLECTION (₹799)
  // ----------------------------------------------------
  {
    id: "blue-haven-50",
    name: "BLUE HAVEN",
    slug: "blue-haven-50ml",
    size: "50 ml",
    volumeMl: 50,
    price: 799,
    formattedPrice: "₹799",
    category: "50ml",
    type: "Vaporisateur Apparel Fragrance",
    aura: "Aquatic · Refreshing · Oceanic",
    accentColor: "#0284c7",
    cardBg: "from-sky-950/40 to-slate-900/60",
    images: {
      bottle: "/assets/products/50ml/blue-haven-bottle.webp",
      box: "/assets/products/50ml/blue-haven-box.webp",
      square: "/assets/products/50ml/blue-haven-square.webp"
    },
    notes: {
      top: "Marine Air, Bergamot, Crisp Citrus",
      heart: "Aquatic Lotus, Blue Sage, Sea Salt",
      base: "Coastal Cedar, Driftwood, Sheer Amber",
      status: "Editable placeholder [Detailed olfactory pyramid to be confirmed by brand]"
    },
    mood: "Evoking sun-drenched coastal mornings and endless clear horizons.",
    isSignature: true,
    orbitIndex: 0
  },
  {
    id: "opulent-50",
    name: "OPULENT",
    slug: "opulent-50ml",
    size: "50 ml",
    volumeMl: 50,
    price: 799,
    formattedPrice: "₹799",
    category: "50ml",
    type: "Vaporisateur Apparel Fragrance",
    aura: "Floral · Velvety · Sophisticated",
    accentColor: "#db2777",
    cardBg: "from-pink-950/40 to-slate-900/60",
    images: {
      bottle: "/assets/products/50ml/opulent-bottle.webp",
      box: "/assets/products/50ml/opulent-box.webp",
      square: "/assets/products/50ml/opulent-square.webp"
    },
    notes: {
      top: "Sweet Petals, Pink Peppercorn, Mandarin",
      heart: "Damask Rose, Velvet Peony, Indian Jasmine",
      base: "White Musk, Warm Bourbon Vanilla, Cashmeran",
      status: "Editable placeholder [Detailed olfactory pyramid to be confirmed by brand]"
    },
    mood: "A grand bouquet of regal blossoms wrapped in soft pearls and golden luxury.",
    isSignature: true,
    orbitIndex: 1
  },
  {
    id: "elvora-50",
    name: "ELVORA",
    slug: "elvora-50ml",
    size: "50 ml",
    volumeMl: 50,
    price: 799,
    formattedPrice: "₹799",
    category: "50ml",
    type: "Vaporisateur Apparel Fragrance",
    aura: "Verdant · Botanical · Majestic",
    accentColor: "#15803d",
    cardBg: "from-emerald-950/50 to-slate-900/60",
    images: {
      bottle: "/assets/products/50ml/elvora-box.webp",
      box: "/assets/products/50ml/elvora-box.webp",
      square: "/assets/products/50ml/elvora-square.webp"
    },
    notes: {
      top: "Crushed Green Leaves, Neroli, Cardamom",
      heart: "Lotus Blossom, Crisp Fig, Green Tea",
      base: "Sandalwood, Earthy Vetiver, Forest Cedar",
      status: "Editable placeholder [Detailed olfactory pyramid to be confirmed by brand]"
    },
    mood: "Deep emerald serenity inspired by dewy monsoon leaves and timeless gardens.",
    isSignature: true,
    orbitIndex: 2
  },
  {
    id: "forever-50",
    name: "FOREVER",
    slug: "forever-50ml",
    size: "50 ml",
    volumeMl: 50,
    price: 799,
    formattedPrice: "₹799",
    category: "50ml",
    type: "Eau De Parfum",
    aura: "Rich · Romantic · Timeless",
    accentColor: "#991b1b",
    cardBg: "from-rose-950/50 to-slate-900/60",
    images: {
      bottle: "/assets/products/50ml/forever-bottle.webp",
      box: "/assets/products/50ml/forever-box.webp",
      square: "/assets/products/50ml/forever-square.webp"
    },
    notes: {
      top: "Golden Saffron, Ripe Plum, Spiced Rose",
      heart: "Turkish Rose Absolute, Amber Resin, Myrrh",
      base: "Precious Woods, Royal Patchouli, Madagascar Vanilla",
      status: "Editable placeholder [Detailed olfactory pyramid to be confirmed by brand]"
    },
    mood: "An enduring romantic tribute woven with crimson silk and lingering warmth.",
    isSignature: true,
    orbitIndex: 3
  },
  {
    id: "horizon-50",
    name: "HORIZON",
    slug: "horizon-50ml",
    size: "50 ml",
    volumeMl: 50,
    price: 799,
    formattedPrice: "₹799",
    category: "50ml",
    type: "Vaporisateur Apparel Fragrance",
    aura: "Twilight · Smoky Amber · Daring",
    accentColor: "#ea580c",
    cardBg: "from-amber-950/50 to-slate-900/60",
    images: {
      bottle: "/assets/products/50ml/horizon-bottle.webp",
      box: "/assets/products/50ml/horizon-box.webp",
      square: "/assets/products/50ml/horizon-square.webp"
    },
    notes: {
      top: "Smoked Citrus, Black Pepper, Bergamot",
      heart: "Dusk Violet, Dry Vetiver, Nutmeg",
      base: "Ambergris, Charred Cedarwood, Dark Musk",
      status: "Editable placeholder [Detailed olfactory pyramid to be confirmed by brand]"
    },
    mood: "Capturing that golden-hour sunset where the mountain sky merges with night.",
    isSignature: true,
    orbitIndex: 4
  },
  {
    id: "charming-50",
    name: "CHARMING",
    slug: "charming-50ml",
    size: "50 ml",
    volumeMl: 50,
    price: 799,
    formattedPrice: "₹799",
    category: "50ml",
    type: "Vaporisateur Apparel Fragrance",
    aura: "Radiant · Solar Flora · Magnetic",
    accentColor: "#ca8a04",
    cardBg: "from-yellow-950/40 to-slate-900/60",
    images: {
      bottle: "/assets/products/50ml/charming-bottle.webp",
      box: "/assets/products/50ml/charming-box.webp",
      square: "/assets/products/50ml/charming-square.webp"
    },
    notes: {
      top: "Sparkling Tangerine, Sunny Neroli, Cassis",
      heart: "Golden Ylang-Ylang, Solar Jasmine, Yellow Freesia",
      base: "Warm Amber, Cashmere Musk, Golden Benzoin",
      status: "Editable placeholder [Detailed olfactory pyramid to be confirmed by brand]"
    },
    mood: "Pure liquid sunshine that illuminates every room with warmth and charm.",
    isSignature: true,
    orbitIndex: 5
  },

  // ----------------------------------------------------
  // 20 ML COLLECTION (₹449)
  // ----------------------------------------------------
  {
    id: "blue-haven-20",
    name: "BLUE HAVEN",
    slug: "blue-haven-20ml",
    size: "20 ml",
    volumeMl: 20,
    price: 449,
    formattedPrice: "₹449",
    category: "20ml",
    type: "Vaporisateur Travel Fragrance",
    aura: "Aquatic · Portable Spark · Marine",
    accentColor: "#0284c7",
    cardBg: "from-sky-950/30 to-slate-900/50",
    images: {
      bottle: "/assets/products/20ml/blue-haven-20ml.webp",
      square: "/assets/products/20ml/blue-haven-square.webp"
    },
    notes: {
      top: "Crisp Marine Breeze, Zesty Lemon",
      heart: "Cool Water Lily, Aquatic Freshness",
      base: "Light Cedar, Clean White Musk",
      status: "Editable placeholder [Detailed olfactory pyramid to be confirmed by brand]"
    },
    mood: "Pocket luxury for instant invigoration on journeys near and far.",
    isSignature: false
  },
  {
    id: "charming-20",
    name: "CHARMING",
    slug: "charming-20ml",
    size: "20 ml",
    volumeMl: 20,
    price: 449,
    formattedPrice: "₹449",
    category: "20ml",
    type: "Vaporisateur Travel Fragrance",
    aura: "Luminous · Warm Spark · Floral",
    accentColor: "#ca8a04",
    cardBg: "from-yellow-950/30 to-slate-900/50",
    images: {
      bottle: "/assets/products/20ml/charming-20ml.webp",
      square: "/assets/products/20ml/charming-square.webp"
    },
    notes: {
      top: "Bright Mandora, Sunny Orange Blossom",
      heart: "Gentle Marigold, Golden Petals",
      base: "Silky Musk, Honeyed Amber",
      status: "Editable placeholder [Detailed olfactory pyramid to be confirmed by brand]"
    },
    mood: "A pocketful of radiant sunshine crafted for daily grace.",
    isSignature: false
  },
  {
    id: "elvora-20",
    name: "ELVORA",
    slug: "elvora-20ml",
    size: "20 ml",
    volumeMl: 20,
    price: 449,
    formattedPrice: "₹449",
    category: "20ml",
    type: "Vaporisateur Travel Fragrance",
    aura: "Verdant · Green Canopy · Crisp",
    accentColor: "#15803d",
    cardBg: "from-emerald-950/40 to-slate-900/50",
    images: {
      bottle: "/assets/products/20ml/elvora-20ml.webp",
      square: "/assets/products/20ml/elvora-square.webp"
    },
    notes: {
      top: "Dewy Foliage, Bergamot Rind",
      heart: "Crushed Herbal Greenery, Lotus",
      base: "Sheer Sandalwood, Clean Moss",
      status: "Editable placeholder [Detailed olfactory pyramid to be confirmed by brand]"
    },
    mood: "A crisp breath of morning forest designed to refresh your presence.",
    isSignature: false
  },
  {
    id: "flora-20",
    name: "FLORA",
    slug: "flora-20ml",
    size: "20 ml",
    volumeMl: 20,
    price: 449,
    formattedPrice: "₹449",
    category: "20ml",
    type: "Vaporisateur Travel Fragrance",
    aura: "Blossom · Powdery Pearl · Graceful",
    accentColor: "#f43f5e",
    cardBg: "from-pink-950/30 to-slate-900/50",
    images: {
      bottle: "/assets/products/20ml/flora-20ml.webp",
      square: "/assets/products/20ml/flora-square.webp"
    },
    notes: {
      top: "Lychee Dew, Pink Petals",
      heart: "Soft Peony, Wild Rose Water",
      base: "Powder Iris, Cashmere Softness",
      status: "Editable placeholder [Detailed olfactory pyramid to be confirmed by brand]"
    },
    mood: "Delicate and ethereal like petals floating on morning water.",
    isSignature: false
  },
  {
    id: "horizon-20",
    name: "HORIZON",
    slug: "horizon-20ml",
    size: "20 ml",
    volumeMl: 20,
    price: 449,
    formattedPrice: "₹449",
    category: "20ml",
    type: "Vaporisateur Travel Fragrance",
    aura: "Dusk · Ember · Mountain Twilight",
    accentColor: "#ea580c",
    cardBg: "from-amber-950/30 to-slate-900/50",
    images: {
      bottle: "/assets/products/20ml/horizon-20ml.webp",
      square: "/assets/products/20ml/horizon-square.webp"
    },
    notes: {
      top: "Smoky Zest, Pink Peppercorn",
      heart: "Night Jasmine, Clove Bud",
      base: "Warm Ambergris, Dark Cedar",
      status: "Editable placeholder [Detailed olfactory pyramid to be confirmed by brand]"
    },
    mood: "A bold, dusk-inspired scent that accompanies personal breakthroughs.",
    isSignature: false
  }
];

export const CATEGORIES = [
  { id: "all", label: "All Fragrances", count: PRODUCTS.length },
  { id: "50ml", label: "50 ml · ₹799 (Signature Collection)", count: 6 },
  { id: "20ml", label: "20 ml · ₹449 (Travel Collection)", count: 5 }
];
