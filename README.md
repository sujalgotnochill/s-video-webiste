# S. Video Creation — Official Website

This repository contains the official website for **S. Video Creation** ("The Edit Station"), a creative media and video production studio located in Katni, Madhya Pradesh.

The site is built with a lightweight, accessible, static multi-page architecture targeting GitHub and Netlify hosting, adhering strictly to the specifications in [`PROJECT_RULES.md`](./PROJECT_RULES.md).

---

## Confirmed Business Details

All contact and location details have been verified and integrated into the site:

- **Business Name:** S. Video Creation
- **Studio Identity:** The Edit Station &bull; Katni
- **Telephone:** [+91 94251 58458](tel:+919425158458)
- **WhatsApp:** [+91 94251 58458](https://wa.me/919425158458)
- **Studio Address:** Shopping Complex, Gole Bazar, Katni, Madhya Pradesh 483501, India
- **Google Maps Location:** [S. Video Creation on Google Maps](https://www.google.com/maps/dir//S.+Video+Creation,+Shopping+Complex,+Gole+Bazar,+Katni,+Madhya+Pradesh+483501/@23.8358482,80.3967757,17z)
- **Primary Audience:** Local clients in Katni and surrounding regions in Madhya Pradesh, with remote digital services (editing, mixing, software consultation) available across India.

---

## Confirmed Business Scope

### 1. Six Core Service Verticals
1. **Video Editing:** Event summaries, YouTube content, documentary, and creative narrative cutting.
2. **Reels & Promotional Videos:** High-impact short-form vertical video (9:16) for Instagram, branding, and announcements.
3. **Video Mixing:** Multi-camera live switching, ceremony mixing, and event post-production.
4. **Data Recovery:** Diagnostic media recovery for camera SD cards, external hard drives, SSDs, and pen drives (handled in-studio).
5. **Software Sales:** Genuine creative video editing and album design software suites.
6. **Wedding & Event Video:** Comprehensive ceremonial coverage, cinematic teasers, and family event documentation.

### 2. Products & Creative Equipment (Enquiry Catalogue)
- **Video Editing Software:** EDIUS 11, EDIUS X, Adobe Premiere Pro, Monarch SmartCut Pro (specialized software).
- **Album Design Software:** Album Express (associated with Dgflick), Album Guru AI, JUMBO PACK+, ALBUM XPRESS PACK+.
- **Live-Streaming & Production Gear:** Live-streaming hardware, video mixers/switchers, capture devices, accessories, and production hardware.
- **Editing Workstations:** Laptops and desktop computer workstations for video editing, mixing, and studio workflows.

*Note: In accordance with `PROJECT_RULES.md`, the products section operates as an enquiry and consultation catalogue, not an online checkout store. Availability, license terms, and hardware configurations are confirmed upon direct enquiry.*

---

## Implemented Pages & Routes

The website consists of 12 fully implemented, standalone static HTML pages:

| Page | URL Path | Description |
|------|----------|-------------|
| **Home** | `/` (`index.html`) | Full studio introduction, service highlights, portfolio preview, products scope, studio about section, and contact hub. |
| **Services Overview** | `/services/` | Central hub linking to all 6 service verticals with workflow details and advisory notices. |
| **Video Editing** | `/services/video-editing/` | Specialized video editing service details, workflows, and FAQs. |
| **Reels & Promo Videos** | `/services/reels-promotional-videos/` | Short-form vertical video production details and formats. |
| **Video Mixing** | `/services/video-mixing/` | Multi-camera mixing, ceremonial post-production, and live-switching details. |
| **Data Recovery** | `/services/data-recovery/` | Storage media diagnostic recovery service (with media integrity disclaimer). |
| **Software Sales** | `/services/software-sales/` | Consultation and sales for creative editing and album software. |
| **Wedding & Event Video** | `/services/wedding-event-video/` | Ceremonial and wedding video production packages and deliverables. |
| **Portfolio** | `/portfolio/` | Creative showcase with interactive category filtering (All, Wedding & Events, Reels & Promos, Video Mixing). |
| **Products Catalogue** | `/products/` | Product and equipment showcase with sticky category navigation and direct WhatsApp enquiries. |
| **About Page** | `/about/` | Dedicated studio profile, core pillars, 6 confirmed service areas, products scope, and portfolio links. |
| **Contact Page** | `/contact/` | Dedicated contact hub with verified telephone, WhatsApp, studio address in Katni, and Google Maps directions. |
| **Custom 404** | `/404.html` | Accessible, branded error page with recovery navigation links. |

*Desktop and mobile navigation seamlessly reach dedicated pages across all routes, with in-page scroll navigation preserved on the homepage.*

---

## Tech Stack & Architecture

- **Markup:** Semantic HTML5 with landmark regions (`header`, `main`, `nav`, `section`, `footer`) and accessibility features (`aria-current`, `aria-expanded`, skip links).
- **Styling:** Vanilla CSS3 organized into a design token architecture:
  - `css/tokens.css` — Color tokens (`#151515`, `#E32636`, `#929292`, `#FFFFFF`), typography, spacing, transitions, and shadows.
  - `css/reset.css` — Modern CSS reset, base font-size, reduced-motion preferences, scroll padding.
  - `css/layout.css` — Sticky glassmorphic header, mobile navigation drawer, containers, and footer.
  - `css/components.css` — Reusable cards, buttons, badges, advisory boxes, and breadcrumbs.
  - `css/pages.css` — Dedicated layout styles for hero sections, grids, portfolio split layout, and products catalogue.
- **Interactions:** Vanilla JavaScript (`js/main.js`):
  - IntersectionObserver + focal-point scroll-spy navigation for desktop and mobile nav highlighting.
  - Accessible mobile drawer toggle with ESC key dismissal and outside click detection.
  - Portfolio category filtering (instant DOM filtering with zero reload).
  - Products sticky category quick-jump navigation.
  - Automatic `prefers-reduced-motion` detection.
- **Zero Dependencies:** No React, no build system, no node modules required to run.

---

## Launch Essentials

- `robots.txt` — Grants full crawler access and links to the XML sitemap.
- `sitemap.xml` — Valid XML sitemap indexing all 10 verified routes using the temporary deployment URL `https://svideocreation.netlify.app/`.
- `404.html` — Custom error page matching studio branding with direct links back to all key pages.
- `netlify.toml` — Static deployment configuration with security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) and asset caching rules.

---

## Local Development & Preview Instructions

Since the site consists entirely of standard HTML, CSS, and JavaScript files, it can be previewed immediately:

### Option 1: Python (Built-in)
```bash
# From the repository root (F:\S video Website\s-video-webiste\):
python -m http.server 8080
```
Then navigate to: [http://localhost:8080](http://localhost:8080)

### Option 2: Node.js / npx
```bash
npx -y serve .
```

### Option 3: Direct File Preview
Open `index.html` directly in any modern desktop or mobile browser.

---

## Outstanding Work & Next Phases

In accordance with `PROJECT_RULES.md`, the following items remain for subsequent phases:

1. **Phase 6 — Hindi Translations (`/hi/`):**
   Full, natural Devanagari Hindi pages for the homepage, services, portfolio, products, about, and contact once translations are confirmed. The language switcher currently indicates Hindi is planned for Phase 6.
2. **Dedicated `/about/` and `/contact/` Standalone Pages (Completed in Stage 5):**
   Fully built and integrated into the site architecture with dedicated navigation, mobile drawer support, and accurate studio facts.
3. **Customer Media Asset Delivery:**
   Portfolio and service previews currently use tasteful SVG and CSS presentation cards. Real customer video samples and video thumbnails can be dropped in once supplied and approved by the owner.
4. **Production Domain Finalization:**
   The site is currently configured for Netlify preview deployment (`https://svideocreation.netlify.app/`). Connecting a custom domain (e.g. `svideocreation.com` or `svideocreation.in`) awaits owner registration and approval.
