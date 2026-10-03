import { enquiry, products } from "./store";
import { $, $$, bindPicker, flyToList, toast } from "./ui";
import { site } from "@/content/site";

const picker = $("#pd-picker");
const slug = location.pathname.split("/").filter(Boolean).pop()?.replace(/\.html$/, "") ?? "";
const p = products().get(slug);

if (picker && p) {
  const read = bindPicker(picker, syncWa);

  function waText() {
    const v = read();
    return `Hi RTC, please share price & availability for:\n${p!.n}${v.option ? ` – ${v.option}` : ""}${v.color ? `, ${v.color}` : ""} × ${v.qty} ${v.unit}`;
  }
  function syncWa() {
    const href = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(waText())}`;
    $$<HTMLAnchorElement>("[data-pd-wa]").forEach((a) => (a.href = href));
  }
  syncWa();

  $$("[data-pd-add]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const v = read();
      enquiry.add({ slug: p.s, option: v.option, color: v.color, qty: v.qty, unit: v.unit });
      flyToList($("[data-gallery-track] img"), p.i);
      toast(`Added ${p.n}${v.option ? ` – ${v.option}` : ""}`);
    }),
  );
}

// Gallery: swipe track + dots/thumbnails stay in sync.
const track = $("[data-gallery-track]");
const thumbs = $$("[data-gallery-thumb]");
if (track && thumbs.length) {
  thumbs.forEach((t) =>
    t.addEventListener("click", () => track.scrollTo({ left: Number(t.dataset.galleryThumb) * track.clientWidth, behavior: "smooth" })),
  );
  track.addEventListener("scroll", () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    thumbs.forEach((t, j) => t.setAttribute("aria-current", String(i === j)));
  }, { passive: true });
}
