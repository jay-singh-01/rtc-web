import { gsap, ScrollTrigger, reducedMotion } from "./scroll";
import { $, $$ } from "./ui";

/** Fade/rise elements marked `data-reveal` as they enter the viewport, in staggered batches. */
function reveals() {
  if (reducedMotion) return;
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 90%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "expo.out", stagger: 0.07, overwrite: true }),
  });
}

/** Count up numbers: <span data-count-to="117" data-suffix="+">0</span> */
function counters() {
  $$("[data-count-to]").forEach((el) => {
    const to = Number(el.dataset.countTo);
    const suffix = el.dataset.suffix ?? "";
    if (reducedMotion) { el.textContent = to + suffix; return; }
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 95%", once: true,
      onEnter: () => gsap.to(o, { v: to, duration: 1.8, ease: "expo.out", onUpdate: () => (el.textContent = Math.round(o.v) + suffix) }),
    });
  });
}

/** Scroll-linked drift: data-parallax="0.15" (fraction of element height). */
function parallax() {
  if (reducedMotion) return;
  $$("[data-parallax]").forEach((el) => {
    const amt = Number(el.dataset.parallax) || 0.15;
    gsap.fromTo(el, { yPercent: -amt * 50 }, { yPercent: amt * 50, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } });
  });
}

/** Buttons that lean towards the cursor (desktop only). */
function magnetic() {
  if (reducedMotion || !matchMedia("(pointer: fine)").matches) return;
  $$("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "elastic.out(1, 0.4)" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.35);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
  });
}

/** 3D tilt on hover (desktop only): data-tilt */
function tilt() {
  if (reducedMotion || !matchMedia("(pointer: fine)").matches) return;
  $$("[data-tilt]").forEach((el) => {
    gsap.set(el, { transformPerspective: 800 });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 12);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
    });
    el.addEventListener("pointerleave", () => { rx(0); ry(0); });
  });
}

/** Sticky header: shadow once scrolled; on phones it hides while scrolling down and returns on scroll up. */
function header() {
  const h = $(".site-header");
  if (!h) return;
  let last = scrollY;
  // Pages with their own sticky toolbar keep the header pinned so the two don't collide.
  const keep = !!$("[data-listing-bar]");
  const onScroll = () => {
    const y = scrollY;
    h.toggleAttribute("data-scrolled", y > 8);
    const mobile = innerWidth < 1024 && !keep;
    if (mobile && y > 140 && y > last + 4) h.setAttribute("data-hidden", "");
    else if (y < last - 4 || y < 140) h.removeAttribute("data-hidden");
    last = y;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/** Morph the tapped product photo into the product page (cross-document view transition). */
function productMorph() {
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-product-link]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    $$("[style*='view-transition-name']").forEach((el) => (el.style.viewTransitionName = ""));
    const img = a.closest(".p-card")?.querySelector<HTMLElement>(".p-img-main") ?? a.querySelector<HTMLElement>("img");
    if (img) img.style.viewTransitionName = "product-hero";
  });
  // Coming back via the back button: clear stale names so the next transition is clean.
  addEventListener("pageshow", () => $$("[style*='view-transition-name']").forEach((el) => (el.style.viewTransitionName = "")));
}

/** Horizontal carousels: arrow buttons [data-scroll-row="id"][data-dir]. */
function carousels() {
  document.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-scroll-row]");
    if (!b) return;
    const row = document.getElementById(b.dataset.scrollRow!);
    row?.scrollBy({ left: Number(b.dataset.dir) * row.clientWidth * 0.85, behavior: "smooth" });
  });
}

export function initMotion() {
  header();
  productMorph();
  carousels();
  reveals();
  counters();
  parallax();
  magnetic();
  tilt();
  // Images loading late can shift layout — keep trigger positions accurate.
  addEventListener("load", () => ScrollTrigger.refresh());
}
