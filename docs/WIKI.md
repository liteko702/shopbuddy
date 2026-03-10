# 🛒 ShopBuddy — Project Wiki

> **Your smart shopping companion — learn, decide, buy with confidence.**

**Live:** https://shopbuddy.kbot.uk
**GitHub:** https://github.com/liteko702/shopbuddy
**Port:** 3080 | **Stack:** Express + Vanilla JS | **Data:** JSON-driven

---

## 📋 Table of Contents

1. [What ShopBuddy Is](#what-shopbuddy-is)
2. [Current State](#current-state)
3. [Architecture](#architecture)
4. [How It Works — User Journey](#how-it-works--user-journey)
5. [Live Specialists](#live-specialists)
6. [Category Catalogue](#category-catalogue)
7. [How to Add a New Specialist](#how-to-add-a-new-specialist)
8. [Improvement Roadmap](#improvement-roadmap)
9. [Technical Debt](#technical-debt)
10. [Related Project: ElectricRates](#related-project-electricrates)

---

## What ShopBuddy Is

ShopBuddy is a **research-first shopping companion** that helps people make informed purchasing decisions on things they don't buy often — from robot vacuums to PCs to cars to skincare.

**The problem it solves:**
- People feel overwhelmed when buying expensive or technical products
- Jargon and specs make comparison hard
- You don't know what questions to ask
- Price comparison sites assume you already know what you want

**Our approach — the 4-phase journey:**
1. **Educate** — What matters when buying this product? What should you consider?
2. **Decode** — Jargon buster for every technical term you'll encounter
3. **Discover** — Guided questions to understand YOUR specific needs
4. **Decide** — Personalised recommendations with upgrade/downgrade options and buy links

---

## Current State

### What's Live ✅
| Feature | Status |
|---------|--------|
| Robot Vacuum specialist | ✅ Live — 8 products, 9 considerations, 13 jargon terms, 6 questions |
| Desktop PC specialist | ✅ Live — 8 builds (£350-£3500), 9 considerations, 17 jargon terms, 6 questions |
| Category catalogue | ✅ 70+ products across 10 groups |
| Search | ✅ Instant search across all categories with keyword matching |
| Photo upload | ⚠️ UI ready, AI identification not yet wired up |
| Light/Dark mode | ✅ Purple/grey/red light theme, persisted in localStorage |
| Recommendation engine | ✅ Scores products against user answers, shows top pick + upgrade + save option |
| Responsive design | ✅ Works on mobile and desktop |

### What's Planned 🔮
| Feature | Priority | Effort |
|---------|----------|--------|
| More specialists (see roadmap) | High | Medium per category |
| AI photo identification | High | Medium |
| Price scraping / live pricing | High | High |
| User accounts & saved comparisons | Medium | High |
| Price alerts | Medium | Medium |
| Community reviews / ratings | Medium | High |
| Affiliate links for revenue | Low | Low |
| Comparison mode (side-by-side) | Medium | Medium |
| Share results (URL or image) | Low | Low |
| PWA / installable app | Low | Low |

---

## Architecture

```
shopbuddy/
├── server.js                  # Express server, API routes, recommendation engine
├── public/
│   └── index.html             # Single-page app (vanilla JS, no framework)
├── data/
│   ├── catalogue.json         # Master list of all 70+ categories (grouped)
│   └── categories/
│       ├── robot-vacuum.json  # Full specialist data
│       └── desktop-pc.json    # Full specialist data
├── docs/
│   └── WIKI.md                # This file
└── package.json
```

### Key Design Decisions

1. **JSON-driven specialists** — Each category is a single JSON file. No code changes needed to add a new specialist. The server and frontend render any category generically.

2. **No framework** — Vanilla JS keeps it fast, simple, and dependency-free. The entire frontend is one HTML file.

3. **Generic recommendation engine** — Scores products by matching question impacts against product features. Works across categories by checking for both named properties (suction, GPU, RAM) and blob-searching the product data.

4. **Catalogue vs Categories** — The catalogue (`catalogue.json`) lists ALL products we want to cover (70+). Categories (`categories/*.json`) are the fully-built specialists. A category shows as "Coming Soon" until its specialist file exists.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | List all groups + items, with `live` boolean |
| GET | `/api/search?q=...` | Search across all catalogue items |
| GET | `/api/category/:id` | Get full specialist data for a category |
| POST | `/api/recommend/:id` | Get scored recommendations based on `{ answers }` |

---

## How It Works — User Journey

```
┌─────────────────────────────────────┐
│          🏠 Homepage                │
│  Search bar + Photo upload          │
│  10 category groups, 70+ items      │
│  Click a LIVE category to start     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Phase 1: 📚 Things to Consider    │
│  - What matters when buying this    │
│  - Each item rated by importance    │
│  - Practical recommendation per item│
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Phase 2: 📖 Jargon Buster         │
│  - Every technical term explained   │
│  - Plain English, no assumptions    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Phase 3: 🎯 Guided Questions      │
│  - 5-7 simple questions             │
│  - Each answer influences scoring   │
│  - Visual cards, one tap each       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Phase 4: 🏆 Recommendations       │
│  ⭐ Top Pick (best match)          │
│  ⬆️ Upgrade Option (spend more)    │
│  💰 Save Money (spend less)        │
│  📊 All products ranked by match % │
│  🔗 Buy links per product          │
└─────────────────────────────────────┘
```

---

## Live Specialists

### 🤖 Robot Vacuum
- **Products:** Roborock Q5 Pro+, Eufy X10 Pro Omni, Roborock Q Revo MaxV, Dreame L20 Ultra, Roborock S8 MaxV Ultra, iRobot Roomba Combo J9+, Ecovacs Deebot T30 Omni, Xiaomi X20+
- **Price range:** £230 — £1,100
- **Key differentiators scored:** suction (Pa), navigation (LiDAR/vSLAM), mopping type, self-emptying, obstacle avoidance, battery, mop lifting, mop washing
- **Questions:** Floor type, pets, home size, clutter level, hands-off preference, budget

### 🖥️ Desktop PC
- **Products:** Office Build, Entry Gaming, 1440p Sweet Spot, High-End, Ultimate 4K, CyberPower Pre-built, PCSpecialist Pre-built, Creative Workstation
- **Price range:** £350 — £3,500
- **Key differentiators scored:** GPU tier, CPU tier, RAM amount, storage, pre-built vs custom preference
- **Questions:** Primary use, gaming resolution, pre-built vs custom, multitasking level, storage needs, budget

---

## Category Catalogue

All 70+ categories organised into 10 groups:

| Group | Items | Examples |
|-------|-------|---------|
| 🏠 Home & Appliances | 12 | Robot vacuum, washing machine, air fryer, coffee machine, vacuum cleaner |
| 💻 Technology | 13 | Laptop, desktop PC, build your own PC, tablet, phone, TV, camera, headphones |
| 🪑 Furniture & Home | 8 | Sofa, mattress, desk, office chair, wardrobe |
| 🌿 Garden & Outdoors | 5 | Lawnmower, pressure washer, BBQ, hot tub |
| 🚗 Transport | 5 | Car, electric car, e-bike, e-scooter, dash cam |
| 💄 Health & Beauty | 5 | Skincare, electric toothbrush, hair dryer, shaver |
| 🍕 Food & Drink | 6 | Wine, whisky, coffee beans, tea, olive oil, chocolate |
| 🏋️ Sports & Fitness | 4 | Running shoes, gym equipment, bicycle, treadmill |
| 👶 Kids & Baby | 3 | Pushchair, car seat, toys |
| 🐾 Pets | 3 | Dog food, cat food, pet insurance |

---

## How to Add a New Specialist

Adding a new category requires **only one JSON file**. No code changes.

### 1. Create the file

```
data/categories/{category-id}.json
```

The `id` must match an existing entry in `catalogue.json`.

### 2. JSON Structure

```json
{
  "id": "washing-machine",
  "name": "Washing Machine",
  "icon": "🫧",
  "tagline": "Short description",
  "intro": "Longer intro paragraph explaining the category...",

  "thingsToConsider": [
    {
      "title": "Drum Size",
      "importance": "critical|important|moderate|nice-to-have|often-overlooked",
      "summary": "One-line summary",
      "detail": "Detailed explanation...",
      "recommendation": "What we recommend..."
    }
  ],

  "jargon": [
    { "term": "RPM", "meaning": "Revolutions per minute — how fast the drum spins..." }
  ],

  "questions": [
    {
      "id": "household_size",
      "question": "How many people in your household?",
      "options": [
        { "label": "1-2 people", "icon": "👤", "value": "small", "desc": "Small loads" },
        { "label": "3-4 people", "icon": "👨‍👩‍👧", "value": "medium", "desc": "Regular loads" }
      ],
      "impact": {
        "small": { "drum": -1 },
        "medium": { "drum": 1 }
      }
    }
  ],

  "products": [
    {
      "id": "unique-id",
      "name": "Product Name",
      "brand": "Brand",
      "tier": "budget|mid|premium|flagship",
      "price": 400,
      "priceRange": "£350-450",
      "rating": 4.5,
      "specs": { "drum": "9kg", "spin": "1400 RPM" },
      "features": ["Feature 1", "Feature 2"],
      "missing": ["Limitation 1"],
      "bestFor": "Who this is best for...",
      "buyLinks": [
        { "store": "Amazon", "url": "https://..." }
      ]
    }
  ],

  "tiers": {
    "budget": { "label": "Budget", "range": "Under £300", "icon": "💰", "description": "..." },
    "mid": { "label": "Mid-Range", "range": "£300-500", "icon": "⭐", "description": "..." },
    "premium": { "label": "Premium", "range": "£500-800", "icon": "💎", "description": "..." },
    "flagship": { "label": "Top-End", "range": "£800+", "icon": "👑", "description": "..." }
  }
}
```

### 3. Restart the server

```bash
pm2 restart shopbuddy
```

The category will immediately appear as "✓ Ready" in search and on the homepage.

---

## Improvement Roadmap

### Phase 1 — Content (Now → Next 2 weeks)
**Goal:** Get 10 specialists live to prove the platform works across product types.

**Priority categories to build:**
1. ☕ **Coffee Machine** — popular, good range of types and prices
2. 📺 **Television** — OLED vs QLED is a common confusion
3. 🫧 **Washing Machine** — everyone needs one, jargon-heavy
4. 📷 **Camera** — DSLR vs mirrorless, good educational content
5. 🛋️ **Sofa** — proves it works for non-tech products too
6. 🧴 **Skincare** — proves it works for consumables/personal care
7. 🚗 **Car** — biggest purchase most people make, complex decision
8. 💻 **Laptop** — very common need, overlaps with PC knowledge

### Phase 2 — Intelligence (2-4 weeks)
**Goal:** Make recommendations smarter and prices real.

| Feature | Description |
|---------|-------------|
| **Live price scraping** | Scrape Amazon, Currys, John Lewis for current prices. Show actual prices not ranges. Alert when prices drop. |
| **AI photo identification** | Use vision API to identify products from photos. "What is this?" → matched to a category and similar products. |
| **Smarter scoring** | Weight recent reviews, availability, price-to-feature ratio. Factor in "value for money" not just feature matching. |
| **Comparison mode** | Side-by-side comparison of 2-3 products with a diff view highlighting where they differ. |
| **"Why this?" explainer** | For each recommendation, show exactly which answers led to this pick and how changing one answer would change the result. |

### Phase 3 — User Experience (1-2 months)
**Goal:** Make it a tool people return to and share.

| Feature | Description |
|---------|-------------|
| **User accounts** | Save comparisons, get price alerts, track what you've researched. |
| **Share results** | Generate a shareable URL or image card of your recommendation. "My ShopBuddy pick" for social sharing. |
| **PWA** | Install as an app on phone. Works offline for education content. |
| **Community reviews** | Let users rate products and add tips. Builds trust and content. |
| **"I bought this" follow-up** | Ask users 3 months later: "How's it going?" Build real satisfaction data. |
| **Price history charts** | Show how prices have changed over time. "Wait for a sale" vs "buy now" advice. |

### Phase 4 — Business & Scale (2-4 months)
**Goal:** Make it sustainable and grow.

| Feature | Description |
|---------|-------------|
| **Affiliate links** | Amazon Associates, Currys affiliate programme. Earn commission on purchases. Transparent: "This link supports ShopBuddy." |
| **Specialist contributors** | Let experts contribute category data via a simple form/editor. Scale content without building everything ourselves. |
| **API for partners** | Let other apps embed ShopBuddy recommendations. |
| **Multi-country** | UK first, then expand pricing and availability to other markets. |
| **Newsletter** | "Best deals this week" email powered by price scraping. |

### Phase 5 — The Vision
**Goal:** ShopBuddy becomes THE place to research any purchase.

- **AI shopping assistant** — conversational interface: "I need a coffee machine for under £200 that makes cappuccinos" → instant recommendation with reasoning
- **Integration with ElectricRates** — link energy-hungry products to their running costs
- **Lifecycle tracking** — "Your washing machine is 7 years old. Here's what's changed since then."
- **Group decisions** — multiple people answer questions for a shared purchase (e.g. family car)
- **Trade-in value** — "Your current X is worth £Y on eBay. Upgrade for £Z net."

---

## Technical Debt

| Issue | Impact | Fix |
|-------|--------|-----|
| All data is static JSON | Prices go stale | Add scraping or manual update workflow |
| Single HTML file is getting large | Hard to maintain | Consider splitting into modules or using a lightweight framework |
| Recommendation engine is basic | Scoring can feel arbitrary | Add weighted normalisation, A/B test scoring weights |
| No tests | Can break scoring without knowing | Add API tests for recommendation edge cases |
| No analytics | Don't know what people search for | Add simple privacy-respecting analytics (Plausible/Umami) |
| No error handling on frontend | Crashes silently | Add try/catch and user-facing error states |
| Search is basic substring matching | Misses synonyms | Add fuzzy matching (Fuse.js) or tokenised search |

---

## Related Project: ElectricRates

**Live:** https://electricrates.kbot.uk
**GitHub:** https://github.com/liteko702/electricrates
**Port:** 3070

ElectricRates is the first "shopping buddy" built as a standalone app for electricity tariff comparison. It includes:
- Real March 2026 UK tariff data (20+ tariffs)
- Usage estimator wizard (property size, heating, appliances)
- Fixed vs Variable 12-month projection using Ofgem cap forecasts
- Supplier profiles with ratings
- Educational guides with pros/cons

**Future integration:** Link energy-hungry products in ShopBuddy (tumble dryer, EV, hot tub) to their ElectricRates running cost impact.

---

## Contributing

To add or improve a specialist:
1. Research the category thoroughly
2. Create/edit the JSON file following the structure above
3. Test locally: `node server.js` → visit `http://localhost:3080`
4. Commit and push

**Key principles:**
- **Be honest** — show limitations, not just features
- **Be practical** — recommendations people can actually act on
- **Be clear** — no jargon without explanation
- **Show value** — always include budget, mid, and premium options

---

*Last updated: March 2026*
*Created by: Meng Li Leong & Workshop Agent*
