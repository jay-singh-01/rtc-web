import type { ClientProduct, EnquiryItem } from "@/types";

const KEY = "rtc-enquiry-v2";
const CONTACT_KEY = "rtc-contact";
type Listener = (items: EnquiryItem[]) => void;
const listeners = new Set<Listener>();

function safeRead<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const enquiry = {
  items(): EnquiryItem[] {
    return safeRead<EnquiryItem[]>(KEY, []);
  },
  save(items: EnquiryItem[]) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* private mode */ }
    listeners.forEach((l) => l(items));
  },
  add(item: EnquiryItem) {
    const items = enquiry.items();
    const same = items.find((i) => i.slug === item.slug && i.option === item.option && i.color === item.color && i.unit === item.unit);
    if (same) same.qty += item.qty;
    else items.push(item);
    enquiry.save(items);
  },
  update(index: number, patch: Partial<EnquiryItem>) {
    const items = enquiry.items();
    if (!items[index]) return;
    items[index] = { ...items[index], ...patch, qty: Math.max(1, Math.min(99999, patch.qty ?? items[index].qty)) };
    enquiry.save(items);
  },
  remove(index: number) {
    const items = enquiry.items();
    items.splice(index, 1);
    enquiry.save(items);
  },
  clear() { enquiry.save([]); },
  subscribe(fn: Listener) { listeners.add(fn); return () => listeners.delete(fn); },
};

window.addEventListener("storage", (e) => {
  if (e.key === KEY) listeners.forEach((l) => l(enquiry.items()));
});

export const contactStore = {
  get: () => safeRead<Record<string, string>>(CONTACT_KEY, {}),
  set: (c: Record<string, string>) => { try { localStorage.setItem(CONTACT_KEY, JSON.stringify(c)); } catch { /* ignore */ } },
};

let catalog: Map<string, ClientProduct> | null = null;
/** Compact product data embedded by the layout (#rtc-products). */
export function products(): Map<string, ClientProduct> {
  if (!catalog) {
    const el = document.getElementById("rtc-products");
    const list: ClientProduct[] = el ? JSON.parse(el.textContent || "[]") : [];
    catalog = new Map(list.map((p) => [p.s, p]));
  }
  return catalog;
}

export const UNITS = ["Packets", "Cartons", "Pieces"] as const;
