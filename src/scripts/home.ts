import { gsap, ScrollTrigger, reducedMotion } from "./scroll";
import { onReady } from "./splash";
import { $, $$ } from "./ui";

function heroIntro() {
  const words = $$("[data-hero-word]");
  const fades = $$("[data-hero-fade]");
  const floats = $$("[data-float-card]");
  if (reducedMotion) return startRotator();
  const tl = gsap.timeline({ defaults: { ease: "expo.out" }, onComplete: startRotator });
  tl.to(words, { y: 0, yPercent: 0, rotate: 0, opacity: 1, duration: 1.1, stagger: 0.08 })
    .to(fades, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08 }, "-=0.8")
    .fromTo(floats, { opacity: 0, scale: 0.4, y: 60 }, { opacity: 1, scale: 1, y: 0, duration: 1.1, stagger: 0.08, ease: "back.out(1.6)" }, "-=1.1");
}

function startRotator() {
  const rot = $("[data-rotator]");
  if (!rot) return;
  const items = [...rot.children] as HTMLElement[];
  if (reducedMotion || items.length < 2) return;
  let i = 0;
  gsap.set(items, { y: 0, yPercent: 110 });
  gsap.set(items[0], { yPercent: 0 });
  rot.setAttribute("data-ready", "");
  setInterval(() => {
    const cur = items[i];
    i = (i + 1) % items.length;
    const next = items[i];
    gsap.to(cur, { yPercent: -110, duration: 0.7, ease: "expo.inOut" });
    gsap.fromTo(next, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "expo.inOut" });
  }, 2200);
}

/** Floating hero cards drift with the pointer (desktop) and scroll (everywhere). */
function heroDepth() {
  if (reducedMotion) return;
  const visual = $("[data-hero-visual]");
  if (!visual) return;
  const cards = $$("[data-float-card]", visual).map((el) => ({
    el, d: Number(el.dataset.depth) || 1,
    x: gsap.quickTo(el, "x", { duration: 1, ease: "power3.out" }),
    y: gsap.quickTo(el, "y", { duration: 1, ease: "power3.out" }),
  }));
  if (matchMedia("(pointer: fine)").matches) {
    addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      cards.forEach((c) => { c.x(nx * 28 * c.d); c.y(ny * 22 * c.d); });
    });
  }
  gsap.to(visual, { yPercent: 12, scale: 0.94, ease: "none", scrollTrigger: { trigger: visual, start: "top top+=80", end: "bottom top", scrub: true } });
}

/** Giant marquee words lean in the direction of scrolling, harder the faster you scroll. */
function velocitySkew() {
  if (reducedMotion) return;
  const els = $$("[data-velocity-skew]");
  if (!els.length) return;
  const skew = els.map((el) => gsap.quickTo(el, "skewX", { duration: 0.6, ease: "power3.out" }));
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = gsap.utils.clamp(-14, 14, self.getVelocity() / -260);
      skew.forEach((s) => s(v));
    },
  });
  ScrollTrigger.addEventListener("scrollEnd", () => skew.forEach((s) => s(0)));
}

function railTabs() {
  $$("[data-rail]").forEach((rail) => {
    rail.addEventListener("click", (e) => {
      const tab = (e.target as HTMLElement).closest<HTMLElement>("[data-rail-tab]");
      if (!tab) return;
      const cat = tab.dataset.railTab!;
      $$("[data-rail-tab]", rail).forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      const items = $$("[data-rail-item]", rail);
      items.forEach((it) => (it.hidden = cat !== "all" && it.dataset.railItem !== cat));
      const shown = items.filter((it) => !it.hidden);
      $("[id$='-row']", rail)?.scrollTo({ left: 0 });
      gsap.set(shown.map((s) => s.firstElementChild), { opacity: 1, y: 0, scale: 1 });
      if (!reducedMotion) gsap.from(shown.slice(0, 6), { opacity: 0, x: 40, duration: 0.6, stagger: 0.05, ease: "expo.out" });
    });
  });
}

function stepsLine() {
  const line = $("[data-steps-line]");
  if (!line) return;
  if (reducedMotion) { line.style.transform = "scaleX(1)"; return; }
  gsap.to(line, { scaleX: 1, ease: "none", scrollTrigger: { trigger: "[data-steps]", start: "top 70%", end: "center 50%", scrub: true } });
}

onReady(heroIntro);
heroDepth();
velocitySkew();
railTabs();
stepsLine();
