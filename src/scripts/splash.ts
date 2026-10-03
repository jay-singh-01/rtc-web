import { gsap } from "./scroll";

let isReady = false;
function markReady() {
  if (isReady) return;
  isReady = true;
  window.dispatchEvent(new Event("rtc:ready"));
}
/** Run once the splash has cleared (or immediately if it already has / wasn't shown). */
export function onReady(fn: () => void) {
  if (isReady) fn();
  else window.addEventListener("rtc:ready", fn, { once: true });
}

/**
 * First-visit splash: packaging items drop into a kraft box, the flaps fold shut,
 * the RTC logo stamps on, and the curtain lifts to reveal the page.
 * Shown once per browser session; tap/press any key to skip. Fires `rtc:ready` when done.
 */
export function runSplash() {
  const root = document.documentElement;
  const el = document.getElementById("splash");
  if (!el || root.classList.contains("no-splash")) {
    // Let hero animations start on the next frame.
    requestAnimationFrame(markReady);
    return;
  }
  try { sessionStorage.setItem("rtc-splash", "1"); } catch { /* ignore */ }

  const q = (s: string) => el.querySelectorAll(s);
  gsap.set(q("[data-sp-item]"), { y: -320, opacity: 0, rotate: () => gsap.utils.random(-40, 40) });
  gsap.set(q("[data-sp-letter]"), { yPercent: 120, opacity: 0 });
  // Flaps start folded open, hinged on the box rim.
  gsap.set("#sp-flap-l", { rotate: -38, transformOrigin: "0% 100%" });
  gsap.set("#sp-flap-r", { rotate: 38, transformOrigin: "100% 100%" });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: () => { el.remove(); document.getElementById("sp-curtain-2")?.remove(); root.classList.add("no-splash"); } });
  tl.from("#sp-box", { scale: 0.6, y: 40, opacity: 0, duration: 0.55, ease: "back.out(2)" })
    .from("#sp-flap-l", { rotate: 0, duration: 0.4, ease: "back.out(3)" }, "-=0.25")
    .from("#sp-flap-r", { rotate: 0, duration: 0.4, ease: "back.out(3)" }, "<")
    .to(q("[data-sp-item]"), { y: 0, opacity: 1, rotate: 0, duration: 0.55, ease: "bounce.out", stagger: 0.14 }, "-=0.15")
    .to("#sp-flap-l", { rotate: 0, scaleY: -0.32, duration: 0.28, ease: "power2.in" }, "+=0.05")
    .to("#sp-flap-r", { rotate: 0, scaleY: -0.32, duration: 0.28, ease: "power2.in" }, "-=0.14")
    .to("#sp-box", { scaleY: 0.9, scaleX: 1.06, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: "50% 100%" })
    .fromTo("#sp-logo", { scale: 3.2, rotate: -25, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, rotate: -6, opacity: 1, duration: 0.32, ease: "power4.in" })
    .to("#sp-box", { x: 6, duration: 0.05, yoyo: true, repeat: 3 })
    .to(q("[data-sp-letter]"), { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.018, ease: "expo.out" }, "-=0.15")
    .from("#sp-tag", { opacity: 0, y: 10, duration: 0.4 }, "-=0.3")
    .to("#sp-stage", { scale: 0.92, opacity: 0, duration: 0.45, ease: "power2.in" }, "+=0.35")
    .to(el, { yPercent: -100, borderBottomLeftRadius: "50% 18%", borderBottomRightRadius: "50% 18%", duration: 0.9, ease: "expo.inOut" }, "<0.1")
    .to("#sp-curtain-2", { yPercent: -100, borderBottomLeftRadius: "50% 14%", borderBottomRightRadius: "50% 14%", duration: 0.9, ease: "expo.inOut" }, "<0.14")
    .add(() => { root.classList.remove("splash-active"); markReady(); }, "<0.2");

  const skip = () => { if (tl.progress() < 0.8) tl.progress(0.8); };
  el.addEventListener("click", skip);
  addEventListener("keydown", skip, { once: true });
}
