# RTC — rtcdisposal.in

Website for **Rajput Trading Company (RTC)**, a disposable food packaging store on Gunj Road, Raichur.
Customers browse products, add sizes to an **enquiry list** and send it on **WhatsApp** or by email. There are no prices, logins or payments.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | [Astro 7](https://astro.build) + TypeScript | Every page is pre-built HTML, so it's fast on budget phones and every product page can be indexed by Google |
| Styling | Tailwind CSS v4 | Tokens live in `src/styles/global.css` (`@theme`) |
| Motion | GSAP + ScrollTrigger, Lenis (desktop smooth scroll) | Splash, scroll reveals, fly-to-list, parallax, marquee skew |
| Page transitions | Native cross-document View Transitions | The product photo morphs from card to product page. Browsers without support navigate normally |
| Images | `astro:assets` + sharp | Catalogue JPGs are converted to responsive WebP at build time |
| Email | Nodemailer via one serverless route (`/api/enquiry`) | Uses the `smtp.rtcdisposal.in` mailbox. The password lives only in env vars |
| Admin | [Keystatic](https://keystatic.com) at `/keystatic` | Forms for products, catalogues and business details. Saves JSON + images into the repo |
| Hosting | Vercel (`@astrojs/vercel`) | Static pages on the CDN, plus functions for email and the admin |

Animations respect `prefers-reduced-motion`. The splash shows once per browser session and can be skipped with a tap.

## Project structure

```
RTC/
├── public/
│   ├── catalogues/<slug>/pdf.pdf   # downloadable catalogues (managed by the admin)
│   └── favicon.jpg
├── src/
│   ├── assets/images/
│   │   ├── products/<slug>/images/*.jpg   # product photos (managed by the admin)
│   │   ├── catalogues/<slug>/cover.jpg    # catalogue covers (managed by the admin)
│   │   └── site/                          # design images: logo, hero, category tiles
│   ├── content/              # ← all business data (edited through the admin)
│   │   ├── products/*.json   # one file per product
│   │   ├── catalogues/*.json # one file per PDF catalogue
│   │   ├── site.json         # name, phone, WhatsApp, email, address, hours
│   │   ├── site.ts           # derives display phone / WhatsApp links from site.json
│   │   └── taxonomy.ts       # categories, materials, industries (part of the design — code only)
│   ├── types/index.ts        # Product, Category, Material, EnquiryItem…
│   ├── lib/                  # shared by pages + browser scripts
│   │   ├── products.ts       # loads + validates src/content/products/*.json
│   │   ├── catalogues.ts     # loads catalogues, computes PDF sizes
│   │   ├── catalog.ts        # product helpers, search text, related products
│   │   ├── images.ts         # img("name") lookup + thumbnails
│   │   ├── icons.ts          # SVG icon set
│   │   └── enquiry-message.ts# WhatsApp/email message format
│   ├── layouts/BaseLayout.astro   # <head>, SEO, splash, header, footer, overlays
│   ├── components/
│   │   ├── layout/           # Header, BottomNav (phones), Footer, Overlays (sheets, toast)
│   │   ├── home/             # Hero, CategoryShowcase, ProductRail, EcoStack, Materials, HowItWorks, About, MarqueeBand
│   │   ├── product/          # ProductCard, OptionPicker, Listing (filters)
│   │   ├── splash/Splash.astro
│   │   ├── ui/Icon.astro
│   │   ├── CatalogueGrid.astro
│   │   └── VisitUs.astro
│   ├── scripts/              # browser code (TypeScript, bundled by Astro)
│   │   ├── main.ts           # entry on every page
│   │   ├── store.ts          # enquiry list (localStorage)
│   │   ├── sheets.ts         # bottom sheets / side panels, swipe-to-close
│   │   ├── enquiry.ts        # list → details → send → success
│   │   ├── quick-add.ts      # "+" on product cards
│   │   ├── search.ts         # instant search overlay
│   │   ├── motion.ts         # reveals, counters, parallax, magnetic, tilt, header
│   │   ├── splash.ts         # first-visit splash timeline
│   │   ├── scroll.ts         # GSAP + Lenis setup
│   │   ├── ui.ts             # toast, fly-to-list, option picker
│   │   ├── home.ts           # hero intro, word rotator, rails
│   │   ├── listing.ts        # product filters
│   │   └── product-page.ts   # product page add/WhatsApp/gallery
│   ├── pages/
│   │   ├── index.astro                 # /
│   │   ├── products/index.astro        # /products  (?q= &mat= &eco=1 &sort=)
│   │   ├── products/[slug].astro       # /products/bagasse-round-plate …
│   │   ├── category/[slug].astro       # /category/meal-trays …
│   │   ├── catalogues.astro  contact.astro  links.astro  404.astro
│   │   └── api/enquiry.ts              # POST — sends the enquiry email (server)
│   └── styles/global.css
├── keystatic.config.ts      # admin panel: forms for products, catalogues, business details
├── astro.config.mjs
└── .env.example
```

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site + Vercel function → .vercel/output
npm run check     # type-check (.astro + .ts)
```

Node 22 or 24 is recommended (Vercel runs Node 24).

## Admin panel (Keystatic)

Add or edit **products**, **PDF catalogues** and **business details** at `/keystatic`. You never need to touch code for these.

- **On your computer:** run `npm run dev` and open http://localhost:4321/keystatic. Changes are saved straight to the files in `src/content/`.
- **Online (after deploying):** open https://rtcdisposal.in/keystatic and sign in with GitHub. Each save is committed to
  `github.com/jay-singh-01/rtc-web`, and Vercel republishes the site in about a minute.

Tips:
- **Photos:** the first photo is the main one, and the second shows when someone hovers over the product card. Square photos look best.
- **Sizes / variants:** add one row per orderable size. The code and dimensions are optional.
- **Sort order:** lower numbers show first. Existing products use 10, 20, 30…, so you can slot a new product in between (for example 15).
- **Show on home page:** puts the product in the Bestsellers carousel.
- **Web address (slug):** this is the product's URL. Avoid changing it once the site is live, or old links will break.
- **Catalogues:** upload the PDF and a cover image (a screenshot of page 1 is fine). The file size is calculated automatically.

The build checks every entry. A product with no photo, no size, or an unknown category or material fails the build
with a clear message instead of publishing a broken page.

Categories and materials are part of the site's design (tiles, filters and icons), so they're edited in `src/content/taxonomy.ts`.

## Deploying (GitHub + Vercel)

**1. Push the code to GitHub**
1. On github.com (signed in as `jay-singh-01`), create a new **private** repository named `rtc-web`. Leave it empty: no README, no .gitignore.
2. In this folder, run:
   ```bash
   git push -u origin main
   ```
   The remote is already set to `https://github.com/jay-singh-01/rtc-web.git`. Git will open a browser window to sign in the first time.

**2. Deploy on Vercel**
1. On vercel.com (account `jay-singh-01`), go to **Add New → Project**, import `jay-singh-01/rtc-web` and click **Deploy**. The Astro framework is detected automatically.
2. Under **Settings → Environment Variables**, add the email settings from `.env.example` (`SMTP_PASSWORD` is the password for `mail@rtcdisposal.in`).
3. Under **Settings → Domains**, add `rtcdisposal.in` and `www.rtcdisposal.in`, then update DNS at your domain registrar as Vercel shows.
   **Change only the website's A/CNAME records and leave the MX records alone**, otherwise `@rtcdisposal.in` email stops working.

**3. Turn on the online admin (one time)**
1. Create a `.env` file in this folder containing `PUBLIC_KEYSTATIC_GITHUB=true`, then run `npm run dev` and open http://127.0.0.1:4321/keystatic.
2. Keystatic offers to **create a GitHub App**. Accept, name it something like `rtc-admin`, and install it on the `rtc-web` repository only.
3. Keystatic writes four values into `.env`: `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` and `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`. Copy them into Vercel's Environment Variables, then redeploy.
4. In the GitHub App settings (github.com → Settings → Developer settings → GitHub Apps → rtc-admin), add these **Callback URLs**:
   - `https://rtcdisposal.in/api/keystatic/github/oauth/callback`
   - `https://<your-project>.vercel.app/api/keystatic/github/oauth/callback`
5. Set `PUBLIC_KEYSTATIC_GITHUB=false` again in `.env`, so local edits go back to saving files directly.

Only people with write access to the GitHub repository can save changes in the online admin.

**4. Test**
Send an enquiry using "Send by email instead" and check the `rtcdisposal@gmail.com` inbox, including spam. Then add a test product in the online admin and confirm it appears on the site about a minute later.
