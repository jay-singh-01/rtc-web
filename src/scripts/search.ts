import { products } from "./store";
import { onSheetOpen } from "./sheets";
import { $, esc } from "./ui";
import { gsap } from "./scroll";
import { categoryById, materialById } from "@/content/taxonomy";
import { iconSvg } from "@/lib/icons";
import type { ClientProduct } from "@/types";

/** Forgiving search: every word must match (prefix-friendly), with simple plural handling. */
export function searchProducts(q: string, list: Iterable<ClientProduct> = products().values()): ClientProduct[] {
  const toks = q.toLowerCase().trim().split(/\s+/).filter(Boolean).map((t) => t.replace(/(es|s)$/, "") || t);
  if (!toks.length) return [];
  const out: { p: ClientProduct; score: number }[] = [];
  for (const p of list) {
    if (!toks.every((t) => p.t.includes(t))) continue;
    const name = p.n.toLowerCase();
    const score = toks.reduce((s, t) => s + (name.includes(t) ? 3 : 1) + (name.startsWith(t) ? 2 : 0), 0);
    out.push({ p, score });
  }
  return out.sort((a, b) => b.score - a.score).map((x) => x.p);
}

export function initSearch() {
  const sheet = $("#sheet-search");
  if (!sheet) return;
  const input = $<HTMLInputElement>("#search-input", sheet)!;
  const results = $("#search-results", sheet)!;
  const idle = $("#search-idle", sheet)!;

  const render = () => {
    const q = input.value.trim();
    idle.hidden = !!q;
    if (!q) { results.innerHTML = ""; return; }
    const hits = searchProducts(q).slice(0, 24);
    results.innerHTML = hits.length
      ? `<p class="px-5 pb-2 text-[12.5px] font-semibold uppercase tracking-wider text-muted">${hits.length}${hits.length === 24 ? "+" : ""} results</p>
         <ul class="px-3">${hits.map((p) => `<li><a href="/products/${p.s}" class="flex items-center gap-3.5 rounded-2xl p-2 transition hover:bg-cream active:bg-cream">
           <img src="${p.i}" alt="" class="size-14 flex-none rounded-xl bg-cream object-cover" loading="lazy">
           <span class="min-w-0 flex-1"><span class="block truncate font-semibold">${esc(p.n)}</span>
           <span class="block truncate text-[13px] text-muted">${esc(materialById[p.m].name)} · ${esc(categoryById[p.c].short)} · ${p.o.length} size${p.o.length === 1 ? "" : "s"}</span></span>
           ${iconSvg("right", "size-4 text-muted")}</a></li>`).join("")}</ul>
         <div class="p-5"><a href="/products?q=${encodeURIComponent(q)}" class="btn btn-ghost w-full">See all results ${iconSvg("arrow", "size-4")}</a></div>`
      : `<div class="px-6 py-12 text-center"><p class="text-lg font-semibold">No match for “${esc(q)}”</p>
         <p class="mt-1 text-[14.5px] text-muted">We stock more than what's listed online — just ask.</p>
         <a class="btn btn-wa mt-5" target="_blank" rel="noopener" href="https://wa.me/918618457240?text=${encodeURIComponent(`Hi RTC, do you have ${q}?`)}">${iconSvg("whatsapp", "size-5")} Ask on WhatsApp</a></div>`;
    gsap.from(results.querySelectorAll("li"), { y: 10, opacity: 0, duration: 0.3, stagger: 0.02, ease: "power2.out" });
  };

  let t = 0;
  input.addEventListener("input", () => { clearTimeout(t); t = window.setTimeout(render, 90); });
  $("#search-form", sheet)!.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) location.href = `/products?q=${encodeURIComponent(q)}`;
  });
  sheet.addEventListener("click", (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>("[data-search-chip]");
    if (chip) { input.value = chip.dataset.searchChip!; render(); input.focus(); }
  });
  onSheetOpen("sheet-search", () => setTimeout(() => input.focus(), 60));
}
