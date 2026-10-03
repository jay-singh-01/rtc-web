import { gsap, ScrollTrigger, reducedMotion } from "./scroll";
import { $, $$, esc } from "./ui";
import { materialById } from "@/content/taxonomy";
import { iconSvg } from "@/lib/icons";
import type { MaterialId } from "@/types";

/** Client-side filtering of the pre-rendered product grid (search, material, eco, sort). */
const grid = $("[data-listing-grid]");
if (grid) {
  const cards = $$("[data-index]", grid);
  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get("q") ?? "",
    mats: new Set((params.get("mat") ?? "").split(",").filter((m) => m in materialById) as MaterialId[]),
    eco: params.get("eco") === "1",
    sort: params.get("sort") ?? "popular",
  };
  const qInput = $<HTMLInputElement>("[data-listing-q]")!;
  qInput.value = state.q;

  const tokens = () => state.q.toLowerCase().split(/\s+/).filter(Boolean).map((t) => t.replace(/(es|s)$/, "") || t);
  const matches = (c: HTMLElement, ignoreMat = false) => {
    if (!ignoreMat && state.mats.size && !state.mats.has(c.dataset.mat as MaterialId)) return false;
    if (state.eco && c.dataset.eco !== "1") return false;
    const toks = tokens();
    return !toks.length || toks.every((t) => c.dataset.text!.includes(t));
  };

  const order: Record<string, (a: HTMLElement, b: HTMLElement) => number> = {
    popular: (a, b) => Number(a.dataset.index) - Number(b.dataset.index),
    az: (a, b) => a.dataset.name!.localeCompare(b.dataset.name!),
    za: (a, b) => b.dataset.name!.localeCompare(a.dataset.name!),
    eco: (a, b) => Number(b.dataset.eco) - Number(a.dataset.eco) || Number(a.dataset.index) - Number(b.dataset.index),
  };

  let first = true;
  function apply() {
    const shown = cards.filter((c) => matches(c));
    cards.forEach((c) => (c.hidden = !shown.includes(c)));
    [...cards].sort(order[state.sort] ?? order.popular).forEach((c) => grid!.appendChild(c));

    $("[data-listing-count]")!.textContent = String(shown.length);
    $("[data-filter-show]")!.textContent = String(shown.length);
    $("[data-listing-empty]")!.hidden = shown.length > 0;
    const ask = $<HTMLAnchorElement>("[data-listing-ask]");
    if (ask) ask.href = `https://wa.me/918618457240?text=${encodeURIComponent(`Hi RTC, do you have ${state.q || "this product"}?`)}`;

    // filter sheet state + counts
    $$("[data-filter-mat]").forEach((b) => {
      const id = b.dataset.filterMat as MaterialId;
      b.setAttribute("aria-pressed", String(state.mats.has(id)));
      const n = cards.filter((c) => c.dataset.mat === id && matches(c, true)).length;
      const el = $(`[data-mat-n="${id}"]`, b);
      if (el) el.textContent = String(n);
    });
    $("[data-filter-eco]")?.setAttribute("aria-pressed", String(state.eco));
    $$("[data-filter-sort]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filterSort === state.sort)));
    const nFilters = state.mats.size + (state.eco ? 1 : 0) + (state.sort !== "popular" ? 1 : 0);
    const badge = $("[data-filter-count]");
    if (badge) { badge.textContent = String(nFilters); badge.hidden = nFilters === 0; }

    // removable chips
    const chips: [string, string][] = [];
    if (state.q) chips.push(["q", `“${state.q}”`]);
    state.mats.forEach((m) => chips.push([`mat:${m}`, materialById[m].name]));
    if (state.eco) chips.push(["eco", "Eco-friendly"]);
    $("[data-active-filters]")!.innerHTML = chips
      .map(([k, l]) => `<button type="button" data-rm="${k}" class="inline-flex items-center gap-1.5 rounded-full bg-cream py-1.5 pr-2.5 pl-3.5 text-[13px] font-semibold ring-1 ring-line">${esc(l)} ${iconSvg("close", "size-3.5")}</button>`)
      .join("");

    // URL (shareable)
    const qs = new URLSearchParams();
    if (state.q) qs.set("q", state.q);
    if (state.mats.size) qs.set("mat", [...state.mats].join(","));
    if (state.eco) qs.set("eco", "1");
    if (state.sort !== "popular") qs.set("sort", state.sort);
    history.replaceState(history.state, "", location.pathname + (qs.size ? `?${qs}` : ""));

    // Make sure filtered-in cards are visible, with a quick stagger after the first render.
    if (!first) {
      gsap.killTweensOf(shown);
      gsap.set(shown, { opacity: 1, y: 0, scale: 1 });
      if (!reducedMotion) gsap.from(shown.slice(0, 8), { opacity: 0, y: 24, duration: 0.6, stagger: 0.04, ease: "expo.out" });
      ScrollTrigger.refresh();
    }
    first = false;
  }

  let t = 0;
  qInput.addEventListener("input", () => { clearTimeout(t); t = window.setTimeout(() => { state.q = qInput.value.trim(); apply(); }, 120); });
  qInput.addEventListener("keydown", (e) => { if (e.key === "Enter") qInput.blur(); });

  document.addEventListener("click", (e) => {
    const el = e.target as HTMLElement;
    const mat = el.closest<HTMLElement>("[data-filter-mat]");
    if (mat) { const id = mat.dataset.filterMat as MaterialId; state.mats.has(id) ? state.mats.delete(id) : state.mats.add(id); apply(); return; }
    if (el.closest("[data-filter-eco]")) { state.eco = !state.eco; apply(); return; }
    const sort = el.closest<HTMLElement>("[data-filter-sort]");
    if (sort) { state.sort = sort.dataset.filterSort!; apply(); return; }
    if (el.closest("[data-filter-reset]")) { state.q = ""; qInput.value = ""; state.mats.clear(); state.eco = false; state.sort = "popular"; apply(); return; }
    const rm = el.closest<HTMLElement>("[data-rm]");
    if (rm) {
      const [k, v] = rm.dataset.rm!.split(":");
      if (k === "q") { state.q = ""; qInput.value = ""; }
      if (k === "mat") state.mats.delete(v as MaterialId);
      if (k === "eco") state.eco = false;
      apply();
    }
  });

  // Headline reflects material/eco/search context on the all-products page.
  if (location.pathname === "/products" || location.pathname === "/products/") {
    const title = $("[data-listing-title]"), blurb = $("[data-listing-blurb]");
    if (state.mats.size === 1) { const m = materialById[[...state.mats][0]]; title!.textContent = `${m.name} products`; blurb!.textContent = m.blurb; }
    else if (state.eco) { title!.textContent = "Eco-friendly packaging"; blurb!.textContent = "Compostable and biodegradable sugarcane, cornstarch, paper, wood and clay products."; }
    else if (state.q) title!.textContent = `Results for “${state.q}”`;
  }

  apply();
}
