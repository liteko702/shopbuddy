# 🛒 ShopBuddy — Project Wiki

> Your smart shopping companion — learn, decide, buy with confidence.

| | |
|---|---|
| **Live** | https://shopbuddy.kbot.uk |
| **GitHub** | https://github.com/liteko702/shopbuddy |
| **Wiki** | https://shopbuddy.kbot.uk/wiki |
| **Port** | 3080 |
| **Stack** | Node.js + Express + Vanilla JS |
| **Owner** | Meng Li Leong |
| **Status** | 🟢 Live |

---

## What It Does

ShopBuddy helps people make confident purchasing decisions on things they don't buy often. Instead of overwhelming you with specs, it educates you, decodes jargon, asks the right questions, and gives you a personalised recommendation with upgrade and save options.

**The 4-phase journey:**

| Phase | What Happens |
|-------|-------------|
| 1️⃣ Educate | What matters when buying this? Key considerations with importance ratings |
| 2️⃣ Decode | Plain-English jargon buster for every technical term |
| 3️⃣ Discover | Guided questions to understand YOUR specific needs |
| 4️⃣ Decide | Top pick + upgrade option + save option, all scored against your answers |

---

## Current State

### Live Features

| Feature | Status | Detail |
|---------|--------|--------|
| 🤖 Robot Vacuum specialist | ✅ Live | 8 products, 9 considerations, 13 jargon terms, 6 questions |
| 🖥️ Desktop PC specialist | ✅ Live | 8 builds (£350–£3,500), 17 jargon terms, parts lists, 8 retailers |
| 🗂️ Category catalogue | ✅ Live | 64+ categories across 10 groups |
| 🔍 Search | ✅ Live | Instant keyword search across all categories |
| 🔥 Trending section | ✅ Live | Amazon Spring Deals, popular products, new launches |
| 💡 Quick picks | ✅ Live | 8 inspiration scenarios (new home, gaming setup, WFH, etc.) |
| 🎨 Light/dark mode | ✅ Live | Purple/grey/red light theme, persisted in localStorage |
| 🏆 Recommendation engine | ✅ Live | Scores products against answers, shows top + upgrade + save |
| 📸 Photo upload UI | ⚠️ UI only | Button exists, AI identification not yet connected |
| 📄 Wiki page | ✅ Live | /wiki serves this file as styled HTML |

### Not Yet Built

| Feature | Priority | Notes |
|---------|----------|-------|
| More specialists | 🔴 High | See roadmap — coffee machine, TV, washing machine next |
| AI photo identification | 🔴 High | Vision API to identify products from photos |
| Live price scraping | 🔴 High | Prices in JSON go stale. Need Amazon/Currys/JL scrape |
| Comparison mode | 🟡 Medium | Side-by-side diff of 2–3 products |
| Price alerts | 🟡 Medium | Notify when a product drops below a target price |
| User accounts | 🟡 Medium | Save comparisons, track research |
| Share results | 🟢 Low | Shareable URL or image card of your recommendation |
| Community reviews | 🟢 Low | User-submitted ratings and tips |
| PWA | 🟢 Low | Install as phone app, works offline |

---

## Codebase Structure

```
shopbuddy/
├── server.js                       # Express server, APIs, recommendation engine (202 lines)
├── public/
│   ├── index.html                  # Page structure (69 lines)
│   ├── css/
│   │   └── style.css               # All styling (199 lines)
│   └── js/
│       └── app.js                  # All frontend logic (568 lines)
├── data/
│   ├── catalogue.json              # All 64+ categories grouped
│   ├── trending.json               # Trending products + quick picks (manually curated)
│   └── categories/
│       ├── robot-vacuum.json       # ✅ Live specialist
│       └── desktop-pc.json         # ✅ Live specialist
└── docs/
    └── WIKI.md                     # This file
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | All groups + items. Each item has `live: true/false` |
| GET | `/api/search?q=...` | Search across all catalogue items |
| GET | `/api/category/:id` | Full specialist data for a live category |
| GET | `/api/trending` | Trending products + quick picks data |
| POST | `/api/recommend/:id` | Scored recommendations. Body: `{ answers: { questionId: value } }` |
| GET | `/wiki` | Renders this wiki as a web page |

---

## Recommendation Engine

The engine in `server.js` scores each product against the user's answers:

| Score Factor | How it works |
|-------------|-------------|
| Budget match | +30 for exact tier match, +15 for adjacent tier |
| Build preference | +10 for pre-built or custom match (PC-specific) |
| Feature impacts | Each question has an `impact` map: `{ answer: { featureName: weight } }` |
| Feature detection | Checks named properties (suction, gpu, ram) AND blob-searches JSON |

**Response shape:**
```json
{
  "topPick": { ...product, score, matchReasons, matchPercent },
  "upgrade": { ...product } or null,
  "savingOption": { ...product } or null,
  "allRanked": [ ...all products sorted by score ]
}
```

---

## How to Add a New Specialist

One JSON file. No code changes needed.

### Step 1 — Create the file
```
data/categories/{id}.json
```
The `id` must match an existing entry in `catalogue.json`.

### Step 2 — JSON structure

```json
{
  "id": "coffee-machine",
  "name": "Coffee Machine",
  "icon": "☕",
  "tagline": "Bean-to-cup, pod, or filter — find your perfect brew",
  "intro": "Longer intro paragraph...",

  "thingsToConsider": [
    {
      "title": "Coffee Type",
      "importance": "critical",
      "summary": "Espresso, filter, pod — each needs a different machine",
      "detail": "Full explanation...",
      "recommendation": "What we suggest..."
    }
  ],

  "jargon": [
    { "term": "Bar pressure", "meaning": "How hard the machine pushes water through coffee grounds..." }
  ],

  "questions": [
    {
      "id": "coffee_type",
      "question": "What kind of coffee do you drink?",
      "options": [
        { "label": "Espresso / Cappuccino", "icon": "☕", "value": "espresso", "desc": "Strong, concentrated shots" },
        { "label": "Filter / Americano", "icon": "🫗", "value": "filter", "desc": "Larger, milder cups" }
      ],
      "impact": {
        "espresso": { "pressure": 3, "grinder": 2 },
        "filter": { "pressure": -1 }
      }
    }
  ],

  "products": [
    {
      "id": "delonghi-dedica",
      "name": "De'Longhi Dedica Arte",
      "brand": "De'Longhi",
      "tier": "budget",
      "price": 130,
      "priceRange": "£110–150",
      "rating": 4.3,
      "specs": { "type": "Pump espresso", "bar": 15, "grinder": "none" },
      "features": ["Compact design", "Fast heat-up", "Milk frother"],
      "missing": ["No built-in grinder"],
      "bestFor": "Espresso lovers on a budget who buy pre-ground coffee",
      "buyLinks": [
        { "store": "Amazon", "url": "https://amazon.co.uk/..." },
        { "store": "John Lewis", "url": "https://johnlewis.com/..." }
      ]
    }
  ],

  "tiers": {
    "budget":   { "label": "Budget",    "range": "Under £150",  "icon": "💰", "description": "Solid everyday coffee at a fair price" },
    "mid":      { "label": "Mid-Range", "range": "£150–350",    "icon": "⭐", "description": "Real cafe quality at home" },
    "premium":  { "label": "Premium",   "range": "£350–700",    "icon": "💎", "description": "Barista-grade results" },
    "flagship": { "label": "Top-End",   "range": "£700+",       "icon": "👑", "description": "The best money can buy" }
  }
}
```

### Step 3 — Restart
```bash
pm2 restart shopbuddy
```

The category immediately shows as **✓ Ready** on the homepage.

---

## Category Catalogue

64+ categories across 10 groups. 2 live, rest show as "Coming Soon".

| Group | Count | Live | Coming Soon Examples |
|-------|-------|------|----------------------|
| 🏠 Home & Appliances | 12 | Robot Vacuum | Washing machine, air fryer, coffee machine, oven, dishwasher |
| 💻 Technology | 13 | Desktop PC | Laptop, tablet, phone, TV, camera, headphones, router |
| 🪑 Furniture & Home | 8 | — | Sofa, mattress, desk, office chair, wardrobe |
| 🌿 Garden & Outdoors | 5 | — | Lawnmower, pressure washer, BBQ, hot tub |
| 🚗 Transport | 5 | — | Car, electric car, e-bike, e-scooter |
| 💄 Health & Beauty | 5 | — | Skincare, electric toothbrush, hair dryer, shaver |
| 🍕 Food & Drink | 6 | — | Wine, coffee beans, whisky, olive oil |
| 🏋️ Sports & Fitness | 4 | — | Running shoes, gym equipment, bicycle, treadmill |
| 👶 Kids & Baby | 3 | — | Pushchair, car seat, toys |
| 🐾 Pets | 3 | — | Dog food, cat food, pet insurance |

---

## Roadmap

### 🔴 Phase 1 — More Specialists (Do Now)

Goal: get to 10 live categories. Each one proves the platform works for a different product type.

| # | Category | Why First | Est. Effort |
|---|----------|-----------|-------------|
| 1 | ☕ Coffee Machine | Popular, good price range, great jargon to bust | 2–3 hours |
| 2 | 📺 Television | OLED vs QLED confusion is universal | 2–3 hours |
| 3 | 🫧 Washing Machine | Everyone needs one, very jargon-heavy | 2–3 hours |
| 4 | 💻 Laptop | Huge audience, overlaps with PC knowledge | 3–4 hours |
| 5 | 🛋️ Sofa | Proves it works for non-tech products | 2 hours |
| 6 | 🚗 Car | Biggest purchase most people make | 4–5 hours |
| 7 | 📷 Camera | DSLR vs mirrorless is a classic pain point | 2–3 hours |
| 8 | 🧴 Skincare | Proves it works for personal care / consumables | 2 hours |

### 🟡 Phase 2 — Smarter Recommendations

| Task | Description | Effort |
|------|-------------|--------|
| Live price scraping | Scrape Amazon, Currys, JL for real prices. Show deals, alert on drops. | High |
| AI photo identification | Vision API: snap a photo → identify product → find matching buddy | Medium |
| Comparison mode | Side-by-side diff of 2–3 products | Medium |
| "Why this?" explainer | Show which answers led to each pick. Teach the user. | Medium |
| Smarter scoring | Weight reviews, value-for-money, availability. Not just features. | Medium |

### 🟢 Phase 3 — User Experience

| Task | Description | Effort |
|------|-------------|--------|
| User accounts | Save comparisons, get price alerts, track research history | High |
| Share results | Shareable URL or image card of your recommendation | Low |
| PWA | Installable phone app, offline education content | Low |
| Price history charts | "Wait for a sale" vs "buy now" advice | Medium |
| Community reviews | User ratings and tips per product | High |

### 🔵 Phase 4 — Business & Scale

| Task | Description | Effort |
|------|-------------|--------|
| Affiliate links | Amazon Associates + Currys programme. Transparent labelling. | Low |
| ElectricRates integration | Energy-hungry products show running cost impact | Medium |
| Multi-country | UK first, then expand | High |
| AI chat interface | "I need a coffee machine under £200 for cappuccinos" → instant result | High |

---

## Technical Debt

| Issue | Impact | Suggested Fix |
|-------|--------|---------------|
| Static JSON prices | Prices go stale within weeks | Add scraping workflow or manual update process |
| No frontend error handling | Silent failures confuse users | Add try/catch + user-facing error states |
| No analytics | Can't see what people search for | Add Plausible or Umami (privacy-respecting) |
| Basic substring search | Misses synonyms ("hoover" vs "vacuum") | Add Fuse.js for fuzzy matching |
| No automated tests | Scoring can break silently | Add API tests for recommendation edge cases |
| trending.json is manual | Goes stale | Automate from search trends API |

---

## Deployment

```bash
# Running on pm2
pm2 restart shopbuddy
pm2 logs shopbuddy

# Caddy reverse proxy
# Domain: shopbuddy.kbot.uk → localhost:3080
```

---

*Last updated: March 2026 | Owner: Meng Li Leong*
