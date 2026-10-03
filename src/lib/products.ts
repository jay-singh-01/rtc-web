import type { CategoryId, MaterialId, Product } from "@/types";
import { categoryById, materialById } from "@/content/taxonomy";

/** Shape of src/content/products/<slug>.json, as written by the Keystatic admin. */
interface ProductEntry {
  name: string;
  category: CategoryId;
  material: MaterialId;
  description: string;
  images: string[];
  options: { label: string; code?: string; dims?: string }[];
  dimLabel?: string;
  colors?: string[];
  colorLabel?: string;
  featured?: boolean;
  sortOrder?: number;
}

const files = import.meta.glob<ProductEntry>("/src/content/products/*.json", { eager: true, import: "default" });

function toProduct(file: string, e: ProductEntry): Product {
  const slug = file.split("/").pop()!.replace(/\.json$/, "");
  const where = `src/content/products/${slug}.json`;
  if (!categoryById[e.category]) throw new Error(`${where}: unknown category "${e.category}"`);
  if (!materialById[e.material]) throw new Error(`${where}: unknown material "${e.material}"`);
  const images = (e.images ?? []).filter(Boolean);
  if (!images.length) throw new Error(`${where}: needs at least one photo`);
  const options = (e.options ?? []).filter((o) => o.label?.trim());
  if (!options.length) throw new Error(`${where}: needs at least one size / variant`);
  const colors = (e.colors ?? []).map((c) => c.trim()).filter(Boolean);
  return {
    slug,
    name: e.name.trim(),
    category: e.category,
    material: e.material,
    images,
    description: e.description.trim(),
    ...(e.dimLabel?.trim() ? { dimLabel: e.dimLabel.trim() } : {}),
    options: options.map((o) => [o.code?.trim() ?? "", o.label.trim(), o.dims?.trim() ?? ""]),
    ...(colors.length ? { colors } : {}),
    ...(e.colorLabel?.trim() ? { colorLabel: e.colorLabel.trim() } : {}),
    ...(e.featured ? { featured: true } : {}),
  };
}

/** All products, in admin "Sort order" (then name). */
export const products: Product[] = Object.entries(files)
  .map(([file, e]) => ({ p: toProduct(file, e), order: e.sortOrder ?? 9999 }))
  .sort((a, b) => a.order - b.order || a.p.name.localeCompare(b.p.name))
  .map((x) => x.p);
