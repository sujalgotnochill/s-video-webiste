# S. Video Creation Website — Project Rules

**Project:** S. Video Creation Official Website  
**Specification version:** 1.0  
**Status:** Pre-development  
**Primary audience:** Local customers around Katni, Madhya Pradesh, and customers across India  
**Languages:** English and Hindi  
**Hosting target:** GitHub repository + Netlify  
**Initial architecture:** Static multi-page website

---

## 1. Project Objective

Build a professional, responsive, bilingual website for S. Video Creation that:

- Presents the business and its confirmed services.
- Showcases genuine portfolio work.
- Displays products and software that the business actually sells.
- Generates customer enquiries through WhatsApp and telephone calls.
- Supports local discovery and nationwide enquiries.
- Loads quickly on mobile devices and slower internet connections.
- Remains easy to maintain and extend.

This is a business website, not an ERP, billing application, e-commerce checkout system, or customer-management platform.

## 2. Confirmed Business Scope

The six confirmed service areas are:

1. Video editing
2. Reels and promotional videos
3. Video mixing
4. Data recovery
5. Software sales
6. Wedding and event video services

The website must also include:

- A visual portfolio.
- A products/software catalogue.
- An About page.
- A Contact page.
- English and Hindi content.
- Click-to-call and WhatsApp enquiry actions.

Do not add unconfirmed services or claim that every service is available nationwide. Confirm the delivery method and service area where relevant.

## 3. Business Facts and Content Integrity

Never invent or assume:

- Business address, phone number, WhatsApp number or opening hours.
- Years of experience, team size or number of customers.
- Customer reviews, testimonials, client names or project results.
- Prices, discounts, warranties or delivery timelines.
- Certifications, credentials or dealership/authorization status.
- Product availability or service capabilities.

Use the existing Google Business Profile as a starting point for business details. Treat those details as unverified until they have been checked and approved.

Use clearly marked placeholders during development when facts or assets are missing. Do not publish placeholders, fictional reviews, dummy phone numbers, or fabricated business information.

Use genuine portfolio media supplied or approved by the business. Confirm permission to publish third-party or customer work.

## 4. Sitemap and URL Structure

Implement these public-facing pages:

- `/` — Home
- `/services/` — Services overview
- `/services/video-editing/`
- `/services/reels-promotional-videos/`
- `/services/video-mixing/`
- `/services/data-recovery/`
- `/services/software-sales/`
- `/services/wedding-event-video/`
- `/portfolio/` — Portfolio
- `/products/` — Products and software
- `/about/` — About the business
- `/contact/` — Contact details

Provide corresponding Hindi pages under `/hi/`, including the Hindi homepage at `/hi/`.

Keep URLs readable, stable and consistent. Use a language switcher that links to the equivalent page in the other language when available.

Do not silently redirect every Hindi page to the Hindi homepage. Configure clean URLs and trailing-slash behavior consistently with the selected host.

## 5. Design System

The visual direction is a modern, premium creative studio.

Brand palette:

- Charcoal/near-black: `#151515`
- Red accent: `#E32636`
- White: `#FFFFFF`
- Neutral grey: `#929292`

These are initial design tokens, not a replacement for any official brand specifications subsequently supplied.

Design requirements:

- Strong headings and readable body typography.
- Reliable Latin and Devanagari font support.
- Clean layouts, consistent spacing and reusable components.
- Prominent but restrained red call-to-action buttons.
- Real portfolio images and video thumbnails wherever available.
- Subtle transitions rather than excessive animation.
- No autoplay-heavy video backgrounds.
- Accessible contrast, keyboard navigation and visible focus states.
- Mobile-first layouts and touch-friendly controls.
- Respect reduced-motion preferences.

Use the original business logo supplied by the owner. Do not create a replacement logo unless explicitly requested.

## 6. Technology and Architecture

Preferred stack:

- HTML5
- CSS3
- Vanilla JavaScript
- Git and GitHub
- Netlify hosting

Prefer a static, multi-page architecture. Do not introduce React, a backend, a database, a CMS, or a build framework unless a documented requirement justifies the added complexity and the owner approves it.

Keep content, styles and behavior organized. Reuse shared styles and components rather than duplicating entire page implementations.

Suggested organization:

- `assets/images/` — optimized images and thumbnails
- `assets/videos/` — only small media files suitable for repository storage
- `assets/icons/` — icons and approved brand artwork
- `assets/fonts/` — licensed local fonts, if needed
- `css/` — design tokens, base styles, layout and components
- `js/` — navigation, language switching and small interactions
- `services/`, `portfolio/`, `products/`, `about/`, `contact/` — public pages
- `hi/` — Hindi equivalents
- `PROJECT_RULES.md` — these rules
- `README.md` — setup, development and deployment instructions
- `robots.txt`, `sitemap.xml`, `404.html` — launch essentials
- `netlify.toml` — only the required, documented Netlify configuration

Adapt the exact structure when useful, but keep it understandable and avoid unnecessary abstractions.

## 7. Language Requirements

English and Hindi are first-class versions of the website.

- Provide complete, meaningful translations for published pages.
- Use natural Hindi rather than awkward literal translations.
- Preserve product names and official brand names accurately.
- Set the correct page language metadata.
- Add appropriate canonical and language-alternate metadata where applicable.
- Ensure the language switcher works on desktop and mobile.
- Do not display untranslated placeholder text in published pages.

If a translation is missing, flag it for review instead of claiming the page is complete.

## 8. Enquiry and Contact Requirements

Version one supports only:

- Click-to-call telephone links.
- WhatsApp enquiry links.
- Verified contact details and location information.
- Links to approved official social media accounts.

Do not add a contact form, chatbot, checkout, payment gateway, appointment system, or customer account feature.

Construct WhatsApp links using the verified business number and an appropriate URL-encoded message. Do not invent or guess the number.

Test all contact links on mobile and desktop. External links must point to verified destinations.

## 9. Products and Portfolio

Products/software:

- List only products confirmed as sold or offered by the business.
- Use accurate descriptions and approved product images.
- Show availability or pricing only when confirmed.
- Do not imply authorized dealership or licensing unless verified.
- Version one is an enquiry catalogue, not an online store.

Portfolio:

- Use genuine, owner-approved work samples.
- Optimize images and video previews.
- Provide meaningful captions and alternative text.
- Avoid loading large video files unnecessarily.
- Prefer efficient video embeds or click-to-play previews.
- Do not publish private customer material without permission.

## 10. SEO and Performance

Each public page should have:

- A unique, descriptive title.
- A useful meta description.
- Appropriate heading hierarchy.
- Descriptive image alternative text.
- Relevant internal links.
- Correct canonical URL where appropriate.
- Language metadata and alternates for translated pages.

Before launch:

- Generate and validate `sitemap.xml`.
- Configure `robots.txt` correctly.
- Add appropriate local-business structured data using verified facts.
- Keep business details consistent with the approved Google Business Profile.
- Optimize image sizes and formats.
- Lazy-load below-the-fold images where appropriate.
- Avoid unnecessary JavaScript and external dependencies.
- Check broken links and missing assets.
- Test mobile usability and page loading performance.

SEO work does not guarantee a particular ranking or amount of traffic.

## 11. Security and Privacy

- Do not commit passwords, access tokens, API keys or private credentials.
- Do not expose private customer information in source files.
- Use HTTPS on the published site.
- Load third-party resources only when needed.
- Avoid analytics or tracking unless explicitly approved.
- Do not add forms or data collection without a separately approved privacy and handling plan.

## 12. Coding Agent Rules — Codex and Antigravity

Both agents must follow this document.

Before making changes:

1. Inspect the existing repository and read this file.
2. Review the current implementation before modifying it.
3. Identify the exact files and behavior affected.
4. State any assumptions or missing information that could affect business accuracy.
5. Avoid overwriting existing work without understanding it.

During implementation:

- Work only within the approved project scope.
- Prefer small, coherent, reviewable changes.
- Preserve working functionality.
- Reuse the established design system.
- Do not introduce dependencies without a clear reason.
- Do not invent business content or fill missing facts with guesses.
- Do not redesign unrelated sections while fixing a specific issue.
- Do not create duplicate pages or styles when an existing shared implementation can be extended.
- Do not claim tests have passed unless they were actually run.

When switching agents:

- Use the same Git repository and read the latest project state.
- Do not let both agents edit the same files simultaneously.
- Review the diff before accepting changes.
- Create a Git checkpoint before substantial modifications.
- Resolve conflicts explicitly rather than blindly overwriting another agent's work.

## 13. Testing and Definition of Done

A feature is not complete simply because its code has been generated.

Before accepting a page or feature, verify:

- It renders correctly on desktop and mobile.
- Navigation and language switching work.
- All links and buttons have real destinations or actions.
- Contact details are verified.
- No placeholders or invented claims appear in published content.
- Images load correctly and have appropriate alternative text.
- The console has no known unresolved errors introduced by the change.
- There are no obvious broken layouts, missing assets or horizontal overflow.
- The page title and metadata are appropriate.
- The relevant test results are reported honestly.

Before launch, additionally test:

- All public routes and their Hindi equivalents.
- Direct URL access and refresh on Netlify.
- The custom 404 page.
- WhatsApp and telephone links.
- Portfolio embeds and image loading.
- Sitemap, robots.txt and canonical URLs.
- A clean deployment from the GitHub repository.
- The live website on an actual mobile browser.

## 14. Hosting and Deployment

- Keep the source code in GitHub.
- Develop and review locally before publishing.
- Use a Netlify preview deployment for review.
- Deploy production changes only after approval.
- Keep Git history and checkpoints for rollback.
- Use a custom domain only after the owner chooses and controls it.
- Verify HTTPS, DNS, redirects and public routes after connecting a domain.
- Check current hosting-plan limits before relying on free-tier services.

Do not publish directly from an unreviewed agent-generated change.

## 15. Explicitly Out of Scope for Version One

Unless the owner approves a new scope:

- Online checkout and payment processing.
- User login and customer accounts.
- Database or custom backend.
- Billing or ERP integration.
- Appointment or booking automation.
- Admin dashboard or CMS.
- Customer enquiry storage.
- Automatic claims about SEO rankings or business performance.

Future additions must be evaluated separately rather than built preemptively.

## 16. Implementation Order

1. Confirm assets and verified business details.
2. Establish the repository and project rules.
3. Build the shared design foundation and responsive navigation.
4. Implement and review the English homepage.
5. Build the remaining English pages.
6. Add and review Hindi equivalents.
7. Connect portfolio media, products, social links and contact actions.
8. Complete SEO, accessibility and performance checks.
9. Deploy a preview and review it on desktop and mobile.
10. Obtain owner approval before production launch.

**Final rule:** If a requirement, business fact or design decision is unclear, ask the owner or leave a clearly marked development placeholder. Do not guess, overbuild or modify unrelated working features.
