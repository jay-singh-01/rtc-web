/**
 * Sheet manager — every overlay (enquiry list, quick-add, search, menu, filters) is a `.sheet`
 * element with an id. Open with `openSheet(id)` or any `[data-sheet-open="id"]` trigger.
 * Mobile: bottom sheet with swipe-down to close. Desktop: side/center panel.
 */
import { lenis } from "./scroll";

const backdrop = () => document.getElementById("sheet-backdrop")!;
let current: HTMLElement | null = null;
let returnFocus: HTMLElement | null = null;
const openHandlers = new Map<string, (el: HTMLElement, trigger?: HTMLElement) => void>();

export function onSheetOpen(id: string, fn: (el: HTMLElement, trigger?: HTMLElement) => void) {
  openHandlers.set(id, fn);
}

export function openSheet(id: string, trigger?: HTMLElement) {
  const el = document.getElementById(id);
  if (!el) return;
  if (current && current !== el) closeSheet(false);
  returnFocus = (document.activeElement as HTMLElement) ?? null;
  openHandlers.get(id)?.(el, trigger);
  document.getElementById("toast")?.removeAttribute("data-show");
  el.style.transform = "";
  el.setAttribute("data-open", "");
  el.setAttribute("aria-hidden", "false");
  el.removeAttribute("inert");
  backdrop().setAttribute("data-open", "");
  document.documentElement.style.overflow = "hidden";
  lenis?.stop();
  current = el;
  requestAnimationFrame(() => {
    const target = el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>("button, a, input");
    target?.focus({ preventScroll: true });
  });
}

export function closeSheet(restoreFocus = true) {
  if (!current) return;
  current.removeAttribute("data-open");
  current.setAttribute("aria-hidden", "true");
  current.setAttribute("inert", "");
  current.style.transform = "";
  backdrop().removeAttribute("data-open");
  document.documentElement.style.overflow = "";
  lenis?.start();
  current = null;
  if (restoreFocus) returnFocus?.focus?.({ preventScroll: true });
}

export const isOpen = (id: string) => current?.id === id;

export function initSheets() {
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const opener = t.closest<HTMLElement>("[data-sheet-open]");
    if (opener) { e.preventDefault(); openSheet(opener.dataset.sheetOpen!, opener); return; }
    if (t.closest("[data-sheet-close]") || t.id === "sheet-backdrop") closeSheet();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet();
    // Ctrl/⌘ + K opens search
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSheet("sheet-search"); }
  });

  // Swipe down to dismiss (mobile bottom sheets): drag from handle/header area, or anywhere when scrolled to top.
  let startY = 0, dy = 0, dragging = false, sheet: HTMLElement | null = null;
  document.addEventListener("touchstart", (e) => {
    const s = (e.target as HTMLElement).closest<HTMLElement>(".sheet[data-open]");
    if (!s || window.innerWidth >= 768) return;
    const body = s.querySelector<HTMLElement>(".sheet-body");
    const inBody = body?.contains(e.target as Node);
    if (inBody && body!.scrollTop > 0) return;
    if ((e.target as HTMLElement).closest("input, textarea, select, .snap-row")) return;
    sheet = s; startY = e.touches[0].clientY; dy = 0; dragging = true;
    s.style.transition = "none";
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (!dragging || !sheet) return;
    dy = Math.max(0, e.touches[0].clientY - startY);
    sheet.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  document.addEventListener("touchend", () => {
    if (!dragging || !sheet) return;
    sheet.style.transition = "";
    if (dy > 110) closeSheet();
    else sheet.style.transform = "";
    dragging = false; sheet = null;
  });
}
