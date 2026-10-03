import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

const files = import.meta.glob<{ default: ImageMetadata }>("/src/assets/images/**/*.{jpg,jpeg,png,webp,avif}", { eager: true });

/** Keyed by path under src/assets/images (no extension), e.g. "products/pet-hinged/images/0" or "site/logo". */
const byPath: Record<string, ImageMetadata> = {};
for (const [file, mod] of Object.entries(files)) {
  byPath[file.replace("/src/assets/images/", "").replace(/\.[a-z]+$/i, "")] = mod.default;
}

/**
 * Resolve an image reference:
 * - a path saved by the admin, e.g. "../../assets/images/products/<slug>/images/0.jpg"
 * - or a site-design image name, e.g. "logo" → src/assets/images/site/logo.jpg
 * Throws at build time if missing, so broken images can't be published.
 */
export function img(ref: string): ImageMetadata {
  const key = ref.includes("/") ? ref.replace(/^.*assets\/images\//, "").replace(/\.[a-z]+$/i, "") : `site/${ref}`;
  const m = byPath[key];
  if (!m) throw new Error(`Image not found: ${ref}`);
  return m;
}

/** Optimised thumbnail URL for client-side rendering (quick-add, search, enquiry list). */
export async function thumbUrl(ref: string, width = 160): Promise<string> {
  const r = await getImage({ src: img(ref), width, format: "webp", quality: 70 });
  return r.src;
}
