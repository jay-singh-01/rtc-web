import type { ClientProduct, Product, ProductOption } from "@/types";
import { products } from "@/lib/products";
import { categoryById, materialById } from "@/content/taxonomy";
import { thumbUrl } from "@/lib/images";

export const optionLabel = (o: ProductOption) => (o[0] ? `${o[1]} (${o[0]})` : o[1]);

export const isEco = (p: Product) => !!materialById[p.material].eco;

export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);

export const productsInCategory = (id: string) => products.filter((p) => p.category === id);

export function searchText(p: Product): string {
  return [
    p.name, p.description, categoryById[p.category].name, materialById[p.material].name,
    ...p.options.flat(), ...(p.colors ?? []),
  ].join(" ").toLowerCase();
}

/** Products related by category first, then material. */
export function relatedProducts(p: Product, limit = 10): Product[] {
  return products
    .filter((x) => x.slug !== p.slug && (x.category === p.category || x.material === p.material))
    .sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category))
    .slice(0, limit);
}

/** Popular first (featured), then eco-friendly, then catalogue order. */
export const sortedProducts = (list: Product[] = products) =>
  [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));

let clientCache: ClientProduct[] | null = null;
/** Compact product list embedded in every page for quick-add, search and the enquiry list. */
export async function clientProducts(): Promise<ClientProduct[]> {
  if (clientCache) return clientCache;
  clientCache = await Promise.all(
    products.map(async (p) => ({
      s: p.slug,
      n: p.name,
      c: p.category,
      m: p.material,
      i: await thumbUrl(p.images[0], 200),
      o: p.options.map(optionLabel),
      k: p.colors ?? [],
      ...(p.colorLabel ? { kl: p.colorLabel } : {}),
      t: searchText(p),
    })),
  );
  return clientCache;
}
