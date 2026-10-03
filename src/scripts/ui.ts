import { gsap, reducedMotion } from "./scroll";
import { UNITS } from "./store";
import { iconSvg } from "@/lib/icons";
import type { ClientProduct } from "@/types";

export const $ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
export const $$ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];
export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// ───────────────────────── Toast
let toastTimer = 0;
export function toast(msg: string, withAction = true) {
  const el = $("#toast");
  if (!el) return;
  $("#toast-msg", el)!.textContent = msg;
  $("#toast-action", el)!.hidden = !withAction;
  el.setAttribute("data-show", "");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.removeAttribute("data-show"), 3400);
}

// ───────────────────────── Fly-to-list
const visible = (el: HTMLElement) => !!el.offsetParent && el.getBoundingClientRect().width > 0;
export function flyToList(from: Element | null, src: string) {
  const target = $$("[data-list-target]").find(visible);
  if (!target) return;
  const bump = () => {
    gsap.fromTo(target, { scale: 1.45, rotate: -12 }, { scale: 1, rotate: 0, duration: 0.7, ease: "elastic.out(1.2, 0.4)" });
    $$("[data-list-count]").forEach((c) => gsap.fromTo(c, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "back.out(3)" }));
  };
  if (reducedMotion || !from) return bump();
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.min(110, Math.max(64, a.width * 0.6));
  const ghost = document.createElement("img");
  ghost.src = src;
  ghost.className = "fly-ghost";
  Object.assign(ghost.style, { width: `${size}px`, height: `${size}px`, left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px` });
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const tl = gsap.timeline({ onComplete: () => { ghost.remove(); bump(); } });
  tl.to(ghost, { scale: 1.15, duration: 0.18, ease: "power2.out" })
    .to(ghost, { x: dx, duration: 0.75, ease: "power1.inOut" }, ">")
    .to(ghost, { y: dy, duration: 0.75, ease: "back.in(1.6)" }, "<")
    .to(ghost, { scale: 0.18, rotate: 300, borderRadius: "50%", duration: 0.75, ease: "power2.in" }, "<")
    .to(ghost, { opacity: 0, duration: 0.12 }, ">-0.08");
}

// ───────────────────────── Option picker (shared markup with OptionPicker.astro)
export function pickerHTML(p: ClientProduct): string {
  const opt = p.o.length > 1
    ? `<fieldset class="mb-5"><legend class="label">Size / variant <span class="font-normal text-muted">· ${p.o.length} options</span></legend>
        <div class="grid grid-cols-2 gap-2" role="group">${p.o.map((o, i) => `<button type="button" class="chip-opt text-[13.5px] font-medium" data-opt="${esc(o)}" aria-pressed="${i === 0}">${esc(o)}</button>`).join("")}</div></fieldset>`
    : p.o.length === 1 ? `<input type="hidden" data-opt-fixed value="${esc(p.o[0])}">` : "";
  const colors = p.k.length
    ? `<fieldset class="mb-5"><legend class="label">${esc(p.kl ?? "Colour")}</legend><div class="flex flex-wrap gap-2">${p.k.map((k, i) => `<button type="button" class="chip-opt min-h-0 px-4 py-2 text-[13.5px] font-medium" data-color="${esc(k)}" aria-pressed="${i === 0}">${esc(k)}</button>`).join("")}</div></fieldset>`
    : "";
  return opt + colors + qtyHTML();
}

export function qtyHTML(): string {
  return `<fieldset><legend class="label">Quantity</legend>
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center rounded-full bg-cream ring-1 ring-line">
        <button type="button" class="grid size-12 place-items-center rounded-full active:scale-90 transition" data-step="-1" aria-label="Decrease">${iconSvg("minus")}</button>
        <input data-qty type="number" inputmode="numeric" min="1" value="1" aria-label="Quantity" class="w-14 bg-transparent text-center text-lg font-bold outline-none">
        <button type="button" class="grid size-12 place-items-center rounded-full active:scale-90 transition" data-step="1" aria-label="Increase">${iconSvg("plus")}</button>
      </div>
      <div class="flex rounded-full bg-cream p-1 ring-1 ring-line" role="group" aria-label="Unit">
        ${UNITS.map((u, i) => `<button type="button" class="rounded-full px-3.5 py-2 text-[13px] font-semibold transition aria-pressed:bg-ink aria-pressed:text-white" data-unit="${u}" aria-pressed="${i === 0}">${u}</button>`).join("")}
      </div>
    </div></fieldset>`;
}

export interface PickerValue { option: string; color: string; qty: number; unit: string; }

/** Wire up option/colour/unit toggles and the qty stepper inside `root`. Returns a reader. */
export function bindPicker(root: HTMLElement, onChange?: () => void): () => PickerValue {
  const press = (btn: HTMLElement, attr: string) => {
    $$(`[${attr}]`, root).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    gsap.fromTo(btn, { scale: 0.94 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
  };
  root.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const opt = t.closest<HTMLElement>("[data-opt]");
    if (opt) { press(opt, "data-opt"); onChange?.(); return; }
    const col = t.closest<HTMLElement>("[data-color]");
    if (col) { press(col, "data-color"); onChange?.(); return; }
    const unit = t.closest<HTMLElement>("[data-unit]");
    if (unit) { press(unit, "data-unit"); onChange?.(); return; }
    const step = t.closest<HTMLElement>("[data-step]");
    if (step) {
      const inp = $<HTMLInputElement>("[data-qty]", root)!;
      inp.value = String(Math.max(1, (parseInt(inp.value, 10) || 1) + Number(step.dataset.step)));
      gsap.fromTo(inp, { y: Number(step.dataset.step) > 0 ? 8 : -8, opacity: 0.3 }, { y: 0, opacity: 1, duration: 0.25 });
      onChange?.();
    }
  });
  root.addEventListener("change", () => onChange?.());
  return () => ({
    option: $("[data-opt][aria-pressed=true]", root)?.dataset.opt ?? $<HTMLInputElement>("[data-opt-fixed]", root)?.value ?? "",
    color: $("[data-color][aria-pressed=true]", root)?.dataset.color ?? "",
    qty: Math.max(1, parseInt($<HTMLInputElement>("[data-qty]", root)?.value ?? "1", 10) || 1),
    unit: $("[data-unit][aria-pressed=true]", root)?.dataset.unit ?? UNITS[0],
  });
}
