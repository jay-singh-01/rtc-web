export type CategoryId =
  | "containers" | "meal-trays" | "plates-bowls" | "takeaway" | "cups"
  | "dessert" | "mitti" | "wooden" | "straws";

export type MaterialId =
  | "bagasse" | "cornstarch" | "pet" | "pp" | "paper" | "ps" | "clay" | "wood" | "aluminium";

/** [code, label, dimensions] — code and dimensions may be "" when the catalogue doesn't list them. */
export type ProductOption = [code: string, label: string, dims: string];

export interface Product {
  slug: string;
  name: string;
  category: CategoryId;
  material: MaterialId;
  images: string[];
  description: string;
  dimLabel?: string;
  options: ProductOption[];
  colors?: string[];
  colorLabel?: string;
  featured?: boolean;
}

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  blurb: string;
  image: string;
}

export interface Material {
  id: MaterialId;
  name: string;
  blurb: string;
  image: string;
  eco?: boolean;
  features?: { icon: IconName; label: string }[];
}

export interface Catalogue {
  slug: string;
  /** Public URL of the PDF, e.g. /catalogues/<slug>/pdf.pdf */
  pdf: string;
  /** Image reference (path saved by the admin). */
  cover: string;
  title: string;
  pages: number;
  size: string;
  description: string;
}

export type IconName =
  | "search" | "phone" | "mail" | "list" | "menu" | "close" | "leaf" | "pin" | "check" | "download"
  | "arrow" | "left" | "right" | "eye" | "plus" | "minus" | "trash" | "filter" | "award" | "shield"
  | "recycle" | "box" | "clock" | "microwave" | "snow" | "drop" | "flame" | "instagram" | "restaurant"
  | "event" | "cake" | "cafe" | "bag" | "fruit" | "printer" | "grid" | "globe" | "file" | "home"
  | "whatsapp" | "send" | "sparkle";

/** Item in the visitor's enquiry list (persisted in localStorage). */
export interface EnquiryItem {
  slug: string;
  option: string;
  color: string;
  qty: number;
  unit: string;
}

/** Compact product data shipped to the browser for quick-add and search. */
export interface ClientProduct {
  s: string;          // slug
  n: string;          // name
  c: CategoryId;
  m: MaterialId;
  i: string;          // thumbnail url
  o: string[];        // option labels incl. code
  k: string[];        // colours
  kl?: string;        // colour label
  t: string;          // search text
}
