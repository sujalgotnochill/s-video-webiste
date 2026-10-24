# S. Video Creation — Official Website

This repository contains the official, bilingual (English & Hindi) website for **S. Video Creation**, a professional creative studio based in Katni, Madhya Pradesh.

The site is built with a static multi-page architecture targeting GitHub and Netlify hosting, strictly adhering to the requirements defined in [`PROJECT_RULES.md`](./PROJECT_RULES.md).

---

## Confirmed Business Scope

The website represents the 6 confirmed services offered by the business:
1. **Video editing** (documentaries, events, narrative)
2. **Reels & promotional videos** (short-form vertical content)
3. **Video mixing** (multi-camera switching, compositing)
4. **Data recovery** (camera cards, external storage, deleted video footage)
5. **Software sales** (video editing tools, plugins, creative utilities)
6. **Wedding & event video services** (cinematic highlights, ceremonial coverage)

---

## Tech Stack & Architecture

- **Markup:** HTML5 (semantic, accessible landmarks)
- **Styling:** Vanilla CSS3 with custom design tokens (`css/tokens.css`, `css/reset.css`, `css/layout.css`, `css/components.css`, `css/pages.css`)
- **Interactions:** Vanilla JavaScript (`js/main.js`)
- **Typography:** Latin & Devanagari font support (Google Fonts: *Plus Jakarta Sans* and *Noto Sans Devanagari*)
- **No dependencies:** Zero build tools, zero package dependencies, zero runtime frameworks.

---

## Local Development & Preview Instructions

Since the site is built with pure static HTML, CSS, and JavaScript, you can preview it immediately using any local web server:

### Option 1: Python 3 (Built-in)
```bash
# From the repository root:
python -m http.server 8000
```
Then visit: [http://localhost:8000](http://localhost:8000)

### Option 2: Node.js / npx
```bash
# Using serve
npx -y serve .
```

### Option 3: Direct Browser Preview
You can also open `index.html` directly in any modern browser.

---

## Current Status: Phase 1

- **Implemented:**
  - `index.html` (English homepage foundation with official brand icon in header and horizontal logo in footer)
  - `assets/images/brand/s-video-creation-icon.png` (Official brand icon integrated in header)
  - `assets/images/brand/s-video-creation-horizontal.png` (Official horizontal logo integrated in footer)
  - `css/tokens.css` (Design tokens: charcoal `#151515`, red `#E32636`, white `#FFFFFF`, grey `#929292`)
  - `css/reset.css` (Accessible reset, typography base, reduced-motion rules)
  - `css/layout.css` (Sticky glassmorphic header, mobile navigation drawer, containers, footer)
  - `css/components.css` (Buttons, service cards, portfolio placeholders, product cards)
  - `css/pages.css` (Hero section, services grid, portfolio grid, products, contact hub)
  - `js/main.js` (Accessible mobile navigation, keyboard controls, placeholder notices)
  - `README.md` (Project overview and preview instructions)

- **Unresolved Business Placeholders (Pending Owner Verification):**
  - Verified business telephone number.
  - Verified WhatsApp number and link.
  - Full studio address and operating hours in Katni, MP.
  - Genuine client portfolio video assets and previews.
  - Verified software inventory and price/licensing details.
  - Full Hindi translations (planned for Phase 6).

Refer to [`PROJECT_RULES.md`](./PROJECT_RULES.md) for full governance and content integrity rules.
