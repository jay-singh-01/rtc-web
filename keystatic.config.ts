import { collection, config, fields, singleton } from "@keystatic/core";
import { categories, materials } from "./src/content/taxonomy";

/**
 * Admin panel at /keystatic.
 * - Local dev (`npm run dev`): edits files on this computer directly.
 * - Production (Vercel): signs in with GitHub and commits changes to github.com/jay-singh-01/rtc-web; Vercel then redeploys.
 */
// Set PUBLIC_KEYSTATIC_GITHUB=true in .env to use GitHub mode locally (needed once, to create the GitHub App).
const useGitHub = import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_GITHUB === "true";

export default config({
  storage: useGitHub ? { kind: "github", repo: "jay-singh-01/rtc-web" } : { kind: "local" },

  ui: {
    brand: { name: "RTC Admin" },
    navigation: {
      Catalogue: ["products", "catalogues"],
      Settings: ["site"],
    },
  },

  collections: {
    products: collection({
      label: "Products",
      slugField: "name",
      path: "src/content/products/*",
      format: { data: "json" },
      columns: ["name", "category", "material", "sortOrder"],
      entryLayout: "form",
      schema: {
        name: fields.slug({
          name: { label: "Product name", validation: { isRequired: true, length: { min: 2 } } },
          slug: { label: "Web address (slug)", description: "Used in the page URL: /products/<slug>. Avoid changing it after launch." },
        }),
        category: fields.select({
          label: "Category",
          options: categories.map((c) => ({ label: c.name, value: c.id })),
          defaultValue: "containers",
        }),
        material: fields.select({
          label: "Material",
          options: materials.map((m) => ({ label: m.name, value: m.id })),
          defaultValue: "pet",
        }),
        description: fields.text({
          label: "Description",
          multiline: true,
          validation: { isRequired: true, length: { min: 10 } },
        }),
        images: fields.array(
          fields.image({
            label: "Photo",
            directory: "src/assets/images/products",
            publicPath: "../../assets/images/products/",
            validation: { isRequired: true },
          }),
          {
            label: "Photos",
            description: "First photo is the main one. The second shows on hover in product cards. Square photos look best.",
            itemLabel: (p) => p.value?.filename ?? "Photo",
            validation: { length: { min: 1 } },
          },
        ),
        options: fields.array(
          fields.object({
            label: fields.text({ label: "Size / description", validation: { isRequired: true }, description: "e.g. 500 ml, 3 CP meal tray, 10\" round plate" }),
            code: fields.text({ label: "Product code", description: "Optional, e.g. DA07 or 1421" }),
            dims: fields.text({ label: "Dimensions", description: "Optional, e.g. 115/130/35 or 260 × 20" }),
          }),
          {
            label: "Sizes / variants",
            itemLabel: (p) => [p.fields.label.value, p.fields.code.value].filter(Boolean).join(" · ") || "New size",
            validation: { length: { min: 1 } },
          },
        ),
        dimLabel: fields.text({ label: "Dimensions column label", description: "Optional, e.g. L/W/H, D/H, Dia × H mm" }),
        colors: fields.array(fields.text({ label: "Option" }), {
          label: "Colours / designs",
          description: "Optional extra choice shown as chips (e.g. Black, White).",
          itemLabel: (p) => p.value || "Option",
        }),
        colorLabel: fields.text({ label: "Heading for the colours list", description: "Optional, defaults to “Colour” (e.g. Type, Design)." }),
        featured: fields.checkbox({ label: "Show on home page (Bestsellers)", defaultValue: false }),
        sortOrder: fields.integer({
          label: "Sort order",
          description: "Lower numbers appear first in listings. New products default to the end.",
          defaultValue: 9999,
          validation: { isRequired: true },
        }),
      },
    }),

    catalogues: collection({
      label: "PDF catalogues",
      slugField: "title",
      path: "src/content/catalogues/*",
      format: { data: "json" },
      columns: ["title", "pages", "sortOrder"],
      schema: {
        title: fields.slug({ name: { label: "Title", validation: { isRequired: true } } }),
        description: fields.text({ label: "Short description", multiline: true }),
        pdf: fields.file({
          label: "PDF file",
          directory: "public/catalogues",
          publicPath: "/catalogues/",
          validation: { isRequired: true },
        }),
        cover: fields.image({
          label: "Cover image",
          description: "A picture of the first page (a screenshot is fine). Portrait works best.",
          directory: "src/assets/images/catalogues",
          publicPath: "../../assets/images/catalogues/",
          validation: { isRequired: true },
        }),
        pages: fields.integer({ label: "Number of pages", validation: { isRequired: true, min: 1 } }),
        sortOrder: fields.integer({ label: "Sort order", defaultValue: 99, validation: { isRequired: true } }),
      },
    }),
  },

  singletons: {
    site: singleton({
      label: "Business details",
      path: "src/content/site",
      format: { data: "json" },
      schema: {
        name: fields.text({ label: "Business name", validation: { isRequired: true } }),
        short: fields.text({ label: "Short name", validation: { isRequired: true } }),
        tagline: fields.text({ label: "Tagline", validation: { isRequired: true } }),
        description: fields.text({ label: "Search engine description", multiline: true, validation: { isRequired: true } }),
        phone: fields.text({ label: "Phone (10 digits)", validation: { isRequired: true, length: { min: 10, max: 10 } } }),
        whatsapp: fields.text({ label: "WhatsApp number (10 digits)", validation: { isRequired: true, length: { min: 10, max: 10 } } }),
        email: fields.text({ label: "Email", validation: { isRequired: true } }),
        instagram: fields.text({ label: "Instagram username (without @)" }),
        address: fields.object({
          line1: fields.text({ label: "Address line 1" }),
          line2: fields.text({ label: "Address line 2" }),
          city: fields.text({ label: "City" }),
          state: fields.text({ label: "State" }),
          pin: fields.text({ label: "PIN code" }),
        }, { label: "Address" }),
        mapQuery: fields.text({ label: "Google Maps search text", description: "What the map should search for." }),
        hours: fields.text({ label: "Store hours", description: "e.g. Mon – Sat, 9:30 AM – 8:30 PM. Leave empty to hide." }),
      },
    }),
  },
});
