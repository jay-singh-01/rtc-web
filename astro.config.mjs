// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import keystatic from "@keystatic/astro";
import tailwindcss from "@tailwindcss/vite";

// Every page is pre-rendered to static HTML at build time.
// On-demand (Vercel functions): /api/enquiry (email) and /keystatic + /api/keystatic (admin panel).
export default defineConfig({
  site: "https://rtcdisposal.in",
  output: "static",
  adapter: vercel(),
  integrations: [react(), keystatic(), sitemap({ filter: (page) => !page.includes("/keystatic") })],
  trailingSlash: "never",
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  image: { responsiveStyles: true },
  vite: { plugins: [tailwindcss()] },
});
