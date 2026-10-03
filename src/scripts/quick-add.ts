import { enquiry, products } from "./store";
import { closeSheet, onSheetOpen, openSheet } from "./sheets";
import { $, bindPicker, esc, flyToList, pickerHTML, toast } from "./ui";
import { categoryById, materialById } from "@/content/taxonomy";
import { iconSvg } from "@/lib/icons";

/** Quick-add: any `[data-quick="slug"]` button opens a sheet to pick size/qty and add to the list. */
export function initQuickAdd() {
  let fromEl: Element | null = null;

  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-quick]");
    if (!btn) return;
    e.preventDefault();
    const p = products().get(btn.dataset.quick!);
    if (!p) return;
    fromEl = btn.closest(".p-card")?.querySelector("img") ?? btn;

    // Products with a single option and no colours go straight in — one tap.
    if (p.o.length <= 1 && !p.k.length) {
      enquiry.add({ slug: p.s, option: p.o[0] ?? "", color: "", qty: 1, unit: "Packets" });
      flyToList(fromEl, p.i);
      toast(`Added ${p.n}`);
      return;
    }
    openSheet("sheet-quick", btn);
    const sheet = $("#sheet-quick")!;
    const m = materialById[p.m];
    $("#qa-content", sheet)!.innerHTML = `
      <div class="flex gap-4">
        <img src="${p.i}" alt="" class="size-24 flex-none rounded-2xl bg-cream object-cover">
        <div class="min-w-0">
          <div class="mb-1.5 flex flex-wrap gap-1.5">${m.eco ? `<span class="pill pill-eco">${iconSvg("leaf", "size-3")} Eco</span>` : ""}<span class="pill pill-soft">${esc(m.name)}</span></div>
          <h3 class="text-xl leading-tight">${esc(p.n)}</h3>
          <a href="/products/${p.s}" class="mt-1 inline-flex items-center gap-1 text-[13.5px] font-semibold text-brand-600">Full details ${iconSvg("arrow", "size-4")}</a>
        </div>
      </div>
      <p class="sr-only">${esc(categoryById[p.c].name)}</p>
      <div class="mt-6" id="qa-picker">${pickerHTML(p)}</div>`;
    const read = bindPicker($("#qa-picker", sheet)!);
    const add = $<HTMLButtonElement>("#qa-add", sheet)!;
    add.onclick = () => {
      const v = read();
      enquiry.add({ slug: p.s, option: v.option, color: v.color, qty: v.qty, unit: v.unit });
      const thumb = $("#qa-content img", sheet);
      const rect = thumb?.getBoundingClientRect();
      closeSheet();
      // Fly from where the thumbnail was (sheet is sliding away), falling back to the card image.
      flyToList(rect && rect.width ? { getBoundingClientRect: () => rect } as Element : fromEl, p.i);
      toast(`Added ${p.n}${v.option ? ` – ${v.option}` : ""}`);
    };
  });

  onSheetOpen("sheet-quick", () => { /* content rendered above */ });
}
