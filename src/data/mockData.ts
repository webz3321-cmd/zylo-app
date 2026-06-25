import { Product, Coupon } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Aether Chronograph 41",
    tagline: "Precision horology fused with architectural obsidian steel.",
    description: "An elegant, masterfully engineered luxury automatic chronograph. Featuring an anti-reflective double-domed sapphire crystal, Swiss cal. 12 mechanical movement, and an exquisite brushed black ceramic bezel. Hand-assembled in our private atelier.",
    price: 4800,
    originalPrice: 5600,
    images: [
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800"
    ],
    category: "Timepieces",
    subCategory: "Chronographs",
    rating: 4.9,
    ratingCount: 42,
    isFeatured: true,
    isNew: true,
    isTrending: true,
    features: [
      "Swiss self-winding automatic movement with 72-hour power reserve",
      "Surgical-grade 316L black titanium watch casing",
      "Scratch-resistant double-dome sapphire crystal glass",
      "100m water resistance (10 ATM) with screw-down crown"
    ],
    specs: {
      "Case Diameter": "41mm",
      "Movement": "Swiss Caliber 12 Automatic",
      "Strap Material": "Genuine Saffiano Leather / Titanium Link",
      "Bezel": "Black Brushed Ceramic",
      "Warranty": "5 Year International Guarantee"
    },
    variants: [
      { id: "v1-1", name: "Obsidian Titanium", type: "color", value: "#1a1a1a", stock: 12 },
      { id: "v1-2", name: "Royal Gold Link", type: "color", value: "#d4af37", additionalPrice: 450, stock: 5 }
    ]
  },
  {
    id: "prod-2",
    name: "Santal Impérial Extrait",
    tagline: "An evocative sensory tapestry of smoky sandalwood and white musk.",
    description: "A mesmerizing and deeply intimate olfactive experience. Rich cardamom and spicy saffron open into an opulent heart of raw Florentine iris, cedarwood, and smoky Indian Mysore sandalwood. Anchored by luxurious white musk and dry amber.",
    price: 320,
    originalPrice: 380,
    images: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800"
    ],
    category: "Fragrances",
    subCategory: "Maison Parfum",
    rating: 4.8,
    ratingCount: 89,
    isFeatured: true,
    isNew: false,
    isBestSeller: true,
    features: [
      "Extrait de Parfum concentration (32% precious fragrance oils)",
      "Unisex blend created by master perfumer Antoine Lie",
      "Sustainably harvested Indian Mysore sandalwood",
      "Handcrafted heavy crystal decanter with magnetic cap"
    ],
    specs: {
      "Concentration": "Extrait de Parfum",
      "Scent Family": "Woody Oriental",
      "Top Notes": "Cardamom, Saffron, Black Pepper",
      "Heart Notes": "Florentine Iris, Cedarwood, Vetiver",
      "Base Notes": "Mysore Sandalwood, White Musk, Liquid Amber"
    },
    variants: [
      { id: "v2-1", name: "100ml Decanter", type: "volume", value: "100ml", stock: 24 },
      { id: "v2-2", name: "50ml Travel Spray", type: "volume", value: "50ml", additionalPrice: -140, stock: 15 }
    ]
  },
  {
    id: "prod-3",
    name: "Aura Saffiano Travel Valise",
    tagline: "Understated elegance, masterfully tailored for the global traveler.",
    description: "An iconic silhouette crafted from our signature Saffiano cross-grain Italian leather. Resistant to scratches, rain, and travel wear. Featuring robust solid-brass hardware with 24k gold plating, hand-stitched rolled leather handles, and an optional monogrammed leather tag.",
    price: 1850,
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=800"
    ],
    category: "Leather Goods",
    subCategory: "Luggage",
    rating: 4.7,
    ratingCount: 19,
    isFeatured: true,
    isNew: true,
    features: [
      "Hand-selected full-grain Italian Saffiano calf leather",
      "Reinforced base corners with protective metal studs",
      "Suede-lined main compartment with organized pocket arrays",
      "Solid brass lock and key set in custom leather sheath"
    ],
    specs: {
      "Dimensions": "50cm x 28cm x 22cm (Carry-on compliant)",
      "Weight": "1.8 kg",
      "Hardware": "24k Gold Plated Solid Brass",
      "Lining": "Genuine Italian Micro-suede"
    },
    variants: [
      { id: "v3-1", name: "Cognac Tan", type: "color", value: "#b87333", stock: 8 },
      { id: "v3-2", name: "Midnight Onyx", type: "color", value: "#0d0d0d", stock: 11 }
    ]
  },
  {
    id: "prod-4",
    name: "Monaco Acetate Aviators",
    tagline: "Sculpted Italian acetate paired with hand-polished 18k gold frames.",
    description: "Inspired by the sun-drenched coastal terraces of Monte Carlo. These limited-edition sunglasses feature premium Japanese nylon lenses, an ultra-light surgical titanium core, and beautiful 18k yellow gold filigree embellishments along the temples.",
    price: 450,
    originalPrice: 495,
    images: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800"
    ],
    category: "Accessories",
    subCategory: "Eyewear",
    rating: 4.9,
    ratingCount: 56,
    isFeatured: false,
    isNew: true,
    isBestSeller: true,
    features: [
      "100% UVA/UVB protection with premium polar-filter coating",
      "Handcrafted bio-acetate frame derived from organic wood pulp",
      "Multi-layered anti-reflective interior lens treatment",
      "Durable 7-barrel hinges for flawless fluid movement"
    ],
    specs: {
      "Frame Size": "54-18-145 (Medium)",
      "Lens Technology": "Polarized Nylon HD+",
      "Frame Material": "Bio-Acetate & Titanium Corey",
      "Included Accessories": "Leather embossed magnetic hard case, microfibre luxury cloth"
    },
    variants: [
      { id: "v4-1", name: "Tortoiseshell / 18k Gold", type: "color", value: "#3b2f2f", stock: 15 },
      { id: "v4-2", name: "Obsidian Black / Platinum", type: "color", value: "#1c1c1c", stock: 20 }
    ]
  },
  {
    id: "prod-5",
    name: "Classic Chronograph Minimalist",
    tagline: "Epitome of Bauhaus minimalism and high-precision quartz.",
    description: "A beautifully understated dress watch that radiates pure confidence. Designed with a clean, unembellished enamel dial, a slim 7.5mm case profile, and structured sapphire crystal. Paired with a supple Milanese mesh strap.",
    price: 850,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=800"
    ],
    category: "Timepieces",
    subCategory: "Dress Watches",
    rating: 4.6,
    ratingCount: 31,
    isFeatured: false,
    isNew: false,
    features: [
      "High-precision Swiss quartz caliber movement",
      "Ultra-slim 316L hypoallergenic stainless steel casing",
      "Milanese surgical-steel mesh strap with security clasp",
      "Quick-change strap mechanism for ultimate versatility"
    ],
    specs: {
      "Case Diameter": "38mm",
      "Case Thickness": "7.5mm",
      "Movement": "Swiss Quartz Caliber 5",
      "Dial Color": "Porcelain White",
      "Strap Width": "20mm"
    },
    variants: [
      { id: "v5-1", name: "Sterling Silver Mesh", type: "color", value: "#c0c0c0", stock: 30 },
      { id: "v5-2", name: "Rose Gold Edition", type: "color", value: "#b76e79", additionalPrice: 120, stock: 14 }
    ]
  },
  {
    id: "prod-6",
    name: "Oud Noir Élixir",
    tagline: "Mysterious, dark, and intoxicatingly precious oud wood blend.",
    description: "A dark masterpiece revolving around one of the most expensive raw ingredients in perfumery: agarwood (Oud). Blended masterfully with dry incense, smoky tobacco leaves, sweet Madagascar vanilla beans, and crisp dark cedar.",
    price: 360,
    originalPrice: 420,
    images: [
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800"
    ],
    category: "Fragrances",
    subCategory: "Maison Parfum",
    rating: 4.9,
    ratingCount: 114,
    isFeatured: true,
    isNew: true,
    isTrending: true,
    features: [
      "Extremely high concentration of natural organic agarwood oil",
      "Aromatic longevity of over 12+ hours on the skin",
      "Includes a heavy engraved display pedestal",
      "Signed batch certificates of artisanal distillation"
    ],
    specs: {
      "Oud Source": "Sustainably distilled Cambodian Oud",
      "Longevity": "Exceptional (12-16 hours)",
      "Sillage": "Strong / Magnetic",
      "Olfactive pyramid": "Agarwood, Incense, Cedar, Tobacco, Madagascar Vanilla"
    },
    variants: [
      { id: "v6-1", name: "100ml Bottle", type: "volume", value: "100ml", stock: 8 },
      { id: "v6-2", name: "15ml Purse Spray", type: "volume", value: "15ml", additionalPrice: -260, stock: 40 }
    ]
  },
  {
    id: "prod-7",
    name: "Saffiano Folio Cardholder",
    tagline: "Sleek, minimalist security encased in gorgeous textured leather.",
    description: "Our signature slim wallet, redesigned for the modern card carrier. Carries up to 6 credit cards, dual boarding passes, and custom notes in its velvet-lined central partition. Includes advanced RFID blocking layers woven into the silk lining.",
    price: 240,
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800"
    ],
    category: "Leather Goods",
    subCategory: "Accessories",
    rating: 4.5,
    ratingCount: 47,
    isFeatured: false,
    isNew: false,
    features: [
      "RFID signal blocking security layer built-in",
      "Hand-painted edge lacquering (4 separate layers)",
      "Six curved slots for frictionless card extraction",
      "Gold embossed royal brand crest on front"
    ],
    specs: {
      "Dimensions": "10.2cm x 7.3cm x 0.4cm",
      "Weight": "32 grams",
      "Capacity": "6 Cards & Flat Bills",
      "Sourcing": "Artisan tannery in Florence, Italy"
    },
    variants: [
      { id: "v7-1", name: "British Racing Green", type: "color", value: "#004225", stock: 18 },
      { id: "v7-2", name: "Cognac Tan", type: "color", value: "#b87333", stock: 25 },
      { id: "v7-3", name: "Nero Black", type: "color", value: "#0a0a0a", stock: 40 }
    ]
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: "LUXURY10",
    discountType: "percentage",
    value: 10,
    expiryDate: "2026-12-31",
    isActive: true
  },
  {
    code: "ZYLOGIFT100",
    discountType: "fixed",
    value: 100,
    minSpend: 500,
    expiryDate: "2026-12-31",
    isActive: true
  },
  {
    code: "ROYALTY",
    discountType: "percentage",
    value: 20,
    minSpend: 1500,
    expiryDate: "2026-09-30",
    isActive: true
  }
];
