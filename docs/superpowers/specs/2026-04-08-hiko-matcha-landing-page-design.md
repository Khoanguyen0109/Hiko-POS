# The Hiko Matcha — Landing Page Design Spec

**Date:** 2026-04-08  
**Status:** Approved  
**Project:** Standalone marketing landing page (separate from POS system)

---

## 1. Overview

A single-page marketing website for **The Hiko Matcha**, a beverage store selling matcha, coffee, and tea. The goal is to drive foot traffic, grow the store's social media community, and showcase the menu — all in one premium, fast-loading page.

**Primary contacts exposed on page:**
- Zalo OA (chat/orders)
- Facebook Page (community)
- Google Maps embed (location)

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Astro (latest) | Zero-JS by default, best-in-class performance and SEO, component-based |
| Styling | Tailwind CSS v4 | Utility-first, no custom CSS files, rapid development |
| Content | `src/content/menu.json` | Menu items stored as JSON, easy to edit without touching components |
| CMS (optional) | Decap CMS | Git-based, `/admin` web editor, no server needed, free |
| Images | Astro `<Image>` component | Auto-compresses to WebP, lazy loads, responsive srcset |
| Map | Google Maps iframe embed | Free, no API key required for embed |
| Hosting | Cloudflare Pages | Free tier, global CDN, custom domain + HTTPS auto |
| Deploy | GitHub → Cloudflare Pages CI | Push to main branch → auto-build and deploy (~30s) |
| Analytics | Cloudflare Web Analytics | Free, cookieless, GDPR-friendly |
| SEO extras | `@astrojs/sitemap` + JSON-LD | Auto sitemap, local business structured data |

---

## 3. Visual Design

### Color Palette

| Name | Hex | Usage |
|---|---|---|
| Off-white | `#FAFAF7` | Page background |
| Matcha green | `#4A7C59` | Primary accent, buttons, headings highlight |
| Warm cream | `#F5EFE6` | Section alternating backgrounds |
| Charcoal | `#1C1C1C` | Body text |
| Light green | `#E8F0EB` | Card backgrounds, subtle fills |

### Typography

| Role | Font | Source |
|---|---|---|
| Headings | Cormorant Garamond | Google Fonts (elegant serif, premium feel) |
| Body / UI | Inter | Google Fonts (clean sans-serif, readable) |

### Motion
- Subtle fade-in + slide-up on scroll for section entries (CSS `@keyframes` + `IntersectionObserver`, no JS library)
- No heavy animations — performance first

---

## 4. Page Sections

Sections render in this scroll order on a single `index.astro` page.

### 4.1 Navbar
- Sticky top, transparent over hero → solid white on scroll
- Left: logo (SVG or text wordmark)
- Right: anchor links — Menu · About · Find Us · (Zalo CTA button)
- Mobile: hamburger menu, full-screen overlay

### 4.2 Hero
- Full-viewport-height section
- Background: full-bleed photo (best drink photo, provided by owner)
- Overlay: subtle dark gradient for text legibility
- Content (centered):
  - Store name: `The Hiko Matcha` (Cormorant Garamond, large)
  - Tagline: `Pure matcha. Pure moments.` (editable in config)
  - Two CTA buttons: **Find Us** (scroll to Contact) | **Chat on Zalo** (Zalo deep link)

### 4.3 About
- 2-column layout (text left, photo right) on desktop, stacked on mobile
- Heading: `Our Story`
- Short brand paragraph (2–4 sentences, written by owner)
- Optional: 3 icon + stat items (e.g., "Est. 2024", "3 drink categories", "Made fresh daily")

### 4.4 Menu
- Section heading: `Our Menu`
- Tab switcher: **Matcha** | **Coffee** | **Tea**
- Each tab shows a grid of drink cards (2 columns mobile, 3–4 desktop)
- Each card:
  - Drink photo (owner-provided)
  - Name
  - Short description (1 line)
  - Price (VND)
  - Optional "Most Popular" badge (flag in `menu.json`)
- Data source: `src/content/menu.json`

```json
// src/content/menu.json structure
{
  "categories": [
    {
      "id": "matcha",
      "label": "Matcha",
      "items": [
        {
          "name": "Matcha Latte",
          "description": "Ceremonial grade matcha with steamed milk",
          "price": 65000,
          "image": "/images/menu/matcha-latte.jpg",
          "popular": true
        }
      ]
    }
  ]
}
```

### 4.5 Gallery
- Uniform 3-column grid (desktop), 2-column (tablet), 1-column (mobile) of 6 atmosphere photos
- Photos: owner-provided (store interior, drinks, barista, outdoor)
- Lightbox on click using minimal vanilla JS (no library — ~20 lines)
- Heading: `The Hiko Experience`

### 4.6 Contact & Find Us
- Two-column layout: map left, info right
- **Google Maps embed** (iframe, exact store pin)
- **Info block:**
  - Address (full Vietnamese address)
  - Opening hours (table format)
  - Phone number (tel: link)
- **Social CTA buttons** (large, prominent):
  - Zalo button: teal `#0068FF`, Zalo icon SVG, text "Chat on Zalo"  → `https://zalo.me/[phone]`
  - Facebook button: blue `#1877F2`, Facebook icon SVG, text "Follow on Facebook" → page URL
- Subtext: `"Nhắn tin Zalo để đặt hàng & đặt bàn"`

### 4.7 Footer
- Logo + tagline
- Quick links (anchor links to sections)
- Social icons: Zalo, Facebook
- Copyright: `© 2026 The Hiko Matcha`

---

## 5. SEO Configuration

### Meta tags (in `Base.astro` layout)
```
title: "The Hiko Matcha | Matcha · Coffee · Tea — [City]"
description: "The Hiko Matcha phục vụ matcha, cà phê và trà cao cấp tại [City]. Ghé thăm chúng tôi tại [Address] hoặc nhắn tin qua Zalo."
og:image: hero photo (1200×630)
og:type: website
```

### JSON-LD Local Business structured data
```json
{
  "@type": "CafeOrCoffeeShop",
  "name": "The Hiko Matcha",
  "servesCuisine": ["Matcha", "Coffee", "Tea"],
  "address": { ... },
  "openingHours": [ ... ],
  "url": "https://thehikomatcha.com",
  "sameAs": ["[facebook-url]", "https://zalo.me/[phone]"]
}
```

### Keywords to naturally include in page copy
- `matcha [city]`, `quán matcha [city]`, `trà matcha ngon`, `matcha latte [city]`, `the hiko matcha`

---

## 6. Hosting & Deployment

### Setup steps (one-time)
1. Create GitHub repo: `hiko-matcha-landing`
2. Connect repo to Cloudflare Pages (free account)
3. Cloudflare build settings: framework = Astro, build command = `npm run build`, output = `dist`
4. Connect custom domain in Cloudflare Pages → update DNS nameservers to Cloudflare
5. HTTPS is automatic

### Ongoing deploy flow
```
Edit files → git push → Cloudflare auto-builds → live in ~30 seconds
```

### Domain recommendation
- Register `thehikomatcha.com` on Namecheap or Google Domains (~$12–15/year)
- Point nameservers to Cloudflare for CDN + free SSL

---

## 7. Optional CMS (Decap CMS)

If non-technical staff need to update menu prices or descriptions without editing code:

- Add `public/admin/config.yml` and `public/admin/index.html` (Decap CMS setup)
- Staff visits `https://thehikomatcha.com/admin`
- Authenticates via GitHub OAuth
- Can edit `menu.json` through a visual form — changes commit to GitHub, auto-deploy fires

This is optional and can be added after initial launch.

---

## 8. Marketing Strategy Summary

### Platform priorities
1. **Zalo OA** — primary channel for orders, reservations, and broadcasts in Vietnam
2. **Facebook Page** — brand discovery, boosted posts, local community
3. **Google Business Profile** — local search ranking (setup separately, free)

### Content cadence
| Content | Platform | Frequency |
|---|---|---|
| Drink photo | Facebook + Zalo | 3×/week |
| "Menu of the day" story | Facebook Story | Daily |
| Behind-the-scenes Reel | Facebook | 1×/week |
| Seasonal promotion broadcast | Zalo OA | Monthly |
| Matcha education post | Facebook | 1×/week |

### 30-Day launch plan
- **Week 1:** Share link to 50 contacts via Zalo personal, post on Facebook
- **Week 2:** Complete Google Business Profile, collect first 10 Google reviews, post in local food groups
- **Week 3:** Boost best drink photo on Facebook (₫100,000/day, local targeting, age 18–35)
- **Week 4:** Place Zalo QR code at counter to convert offline customers to followers

### Analytics setup
- Cloudflare Web Analytics (page visits, click-throughs)
- Google Search Console (search ranking, impressions)
- Facebook Page Insights (post reach, engagement)

---

## 9. Out of Scope

- Online ordering / payment (handled by POS system separately)
- User accounts or loyalty program on this page
- Blog or news section (can be added later)
- Multi-language toggle (Vietnamese is primary; English text in headings for brand feel)

---

## 10. Open Questions (to resolve before build)

- [ ] Final store address and Google Maps pin URL
- [ ] Zalo OA phone number or OA ID
- [ ] Facebook page URL
- [ ] Opening hours
- [ ] Tagline preference: `"Pure matcha. Pure moments."` or owner's own wording
- [ ] Number of menu items per category (to size the grid correctly)
- [ ] Preferred domain name (e.g., `thehikomatcha.com`)
