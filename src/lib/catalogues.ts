import fs from "node:fs";
import path from "node:path";
import type { Catalogue } from "@/types";

/** Shape of src/content/catalogues/<slug>.json, as written by the Keystatic admin. */
interface CatalogueEntry {
  title: string;
  description?: string;
  pdf: string;
  cover: string;
  pages: number;
  sortOrder?: number;
}

const files = import.meta.glob<CatalogueEntry>("/src/content/catalogues/*.json", { eager: true, import: "default" });

const fileSize = (url: string) => {
  try {
    const bytes = fs.statSync(path.join(process.cwd(), "public", url)).size;
    return bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1).replace(/\.0$/, "")} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`;
  } catch {
    throw new Error(`Catalogue PDF not found: public${url}`);
  }
};

/** PDF catalogues (server/build-time only — reads file sizes from disk). */
export const catalogues: Catalogue[] = Object.entries(files)
  .map(([file, e]) => ({
    slug: file.split("/").pop()!.replace(/\.json$/, ""),
    title: e.title.trim(),
    description: e.description?.trim() ?? "",
    pdf: e.pdf,
    cover: e.cover,
    pages: e.pages,
    size: fileSize(e.pdf),
    order: e.sortOrder ?? 99,
  }))
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
  .map(({ order: _order, ...c }) => c);

/** Friendly filename for downloads (the stored file is always named pdf.pdf). */
export const downloadName = (c: Catalogue) => `RTC - ${c.title}.pdf`;
