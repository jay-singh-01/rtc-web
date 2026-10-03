import { contactStore, enquiry, products } from "./store";
import { onSheetOpen } from "./sheets";
import { $, $$, esc } from "./ui";
import { gsap, reducedMotion } from "./scroll";
import { iconSvg } from "@/lib/icons";
import { enquiryText, PHONE_RE, type EnquiryContact, type EnquiryLine } from "@/lib/enquiry-message";
import { site } from "@/content/site";

type Step = "list" | "details" | "done";
let step: Step = "list";
let doneName = "";
let lastWaHref = "";

const lines = (): EnquiryLine[] =>
  enquiry.items().map((it) => ({
    product: products().get(it.slug)?.n ?? it.slug,
    option: [it.option, it.color].filter(Boolean).join(", "),
    qty: it.qty,
    unit: it.unit,
  }));

function updateCounts() {
  const n = enquiry.items().length;
  $$("[data-list-count]").forEach((el) => {
    el.textContent = String(n);
    el.toggleAttribute("hidden", n === 0);
  });
}

function render() {
  const body = $("#eq-body"), foot = $("#eq-foot"), title = $("#eq-title");
  if (!body || !foot || !title) return;
  const items = enquiry.items();
  if (step !== "done" && !items.length) step = "list";

  if (step === "done") {
    title.textContent = "Enquiry sent";
    body.innerHTML = `
      <div class="flex flex-col items-center px-6 py-14 text-center">
        <div class="relative mb-6 grid size-24 place-items-center rounded-full bg-eco text-white" id="eq-tick">
          <svg viewBox="0 0 24 24" class="size-12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1" id="eq-tick-path"/></svg>
        </div>
        <h3 class="text-2xl">Thank you${doneName ? `, ${esc(doneName)}` : ""}!</h3>
        <p class="mt-2 max-w-xs text-muted">We've received your enquiry and will get back to you with prices shortly.</p>
      </div>`;
    foot.innerHTML = `${lastWaHref ? `<a href="${lastWaHref}" target="_blank" rel="noopener" class="mb-2.5 block text-center text-[13.5px] font-semibold text-wa-600 underline underline-offset-4">WhatsApp didn't open? Tap here</a>` : ""}<a href="/products" class="btn btn-ink w-full">Continue browsing</a>`;
    celebrate();
    return;
  }

  if (!items.length) {
    title.textContent = "Your enquiry list";
    body.innerHTML = `
      <div class="flex flex-col items-center px-6 py-16 text-center">
        <div class="mb-5 grid size-20 place-items-center rounded-3xl bg-cream text-muted">${iconSvg("list", "size-9", 1.5)}</div>
        <h3 class="text-xl">Your list is empty</h3>
        <p class="mt-2 max-w-xs text-[14.5px] text-muted">Add the products and sizes you need, then send the list to us on WhatsApp for a quick quote.</p>
      </div>`;
    foot.innerHTML = `<a href="/products" class="btn btn-brand w-full">Browse products ${iconSvg("arrow", "size-5")}</a>`;
    return;
  }

  if (step === "list") {
    title.innerHTML = `Your enquiry list <span class="ml-1 rounded-full bg-brand-50 px-2 py-0.5 align-middle text-sm font-bold text-brand-600">${items.length}</span>`;
    body.innerHTML = `<ul class="divide-y divide-line px-5">${items.map((it, i) => {
      const p = products().get(it.slug);
      return `<li class="flex gap-3.5 py-4" data-i="${i}">
        <a href="/products/${esc(it.slug)}" class="flex-none"><img src="${p?.i ?? ""}" alt="" class="size-[72px] rounded-2xl bg-cream object-cover"></a>
        <div class="min-w-0 flex-1">
          <p class="font-semibold leading-snug">${esc(p?.n ?? it.slug)}</p>
          <p class="mt-0.5 truncate text-[13px] text-muted">${esc([it.option, it.color].filter(Boolean).join(" · ") || "Standard")}</p>
          <div class="mt-2.5 flex items-center gap-2">
            <div class="flex items-center rounded-full bg-cream ring-1 ring-line">
              <button type="button" class="grid size-9 place-items-center" data-eq-step="-1" aria-label="Decrease">${iconSvg("minus", "size-4")}</button>
              <input type="number" inputmode="numeric" min="1" value="${it.qty}" data-eq-qty aria-label="Quantity" class="w-12 bg-transparent text-center font-bold outline-none">
              <button type="button" class="grid size-9 place-items-center" data-eq-step="1" aria-label="Increase">${iconSvg("plus", "size-4")}</button>
            </div>
            <span class="text-[13px] text-muted">${esc(it.unit)}</span>
          </div>
        </div>
        <button type="button" class="grid size-10 flex-none place-items-center rounded-full text-muted transition hover:bg-cream hover:text-ink" data-eq-del aria-label="Remove">${iconSvg("trash", "size-[18px]")}</button>
      </li>`;
    }).join("")}</ul>
    <div class="px-5 pb-4"><button type="button" class="text-[13px] font-medium text-muted underline underline-offset-4" data-eq-clear>Clear list</button></div>`;
    foot.innerHTML = `
      <button type="button" class="btn btn-brand w-full py-4 text-base" data-eq-next>Continue · ${items.length} item${items.length > 1 ? "s" : ""} ${iconSvg("arrow", "size-5")}</button>
      <p class="mt-2.5 text-center text-[12.5px] text-muted">No payment or sign-up needed — we'll reply with prices.</p>`;
    return;
  }

  // details
  const c = contactStore.get();
  title.textContent = "Where should we reply?";
  body.innerHTML = `
    <form id="eq-form" class="grid gap-4 px-5 pb-4 pt-1" novalidate>
      <button type="button" class="inline-flex w-fit items-center gap-1 text-[13.5px] font-semibold text-muted" data-eq-back>${iconSvg("left", "size-4")} Back to list</button>
      <div><label class="label" for="eq-name">Your name *</label><input class="field" id="eq-name" name="name" autocomplete="name" required value="${esc(c.name ?? "")}" data-autofocus></div>
      <div><label class="label" for="eq-phone">Phone / WhatsApp *</label><input class="field" id="eq-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required value="${esc(c.phone ?? "")}"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="label" for="eq-business">Business</label><input class="field" id="eq-business" name="business" autocomplete="organization" value="${esc(c.business ?? "")}"></div>
        <div><label class="label" for="eq-city">City</label><input class="field" id="eq-city" name="city" autocomplete="address-level2" value="${esc(c.city ?? "Raichur")}"></div>
      </div>
      <div><label class="label" for="eq-email">Email <span class="font-normal text-muted">(optional)</span></label><input class="field" id="eq-email" name="email" type="email" autocomplete="email" value="${esc(c.email ?? "")}"></div>
      <div><label class="label" for="eq-note">Anything else?</label><textarea class="field min-h-20 resize-y" id="eq-note" name="note" placeholder="Delivery date, custom printing, etc."></textarea></div>
      <input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="absolute -left-[9999px]">
      <p id="eq-status" class="hidden rounded-2xl px-4 py-3 text-[14px]" role="status"></p>
    </form>`;
  foot.innerHTML = `
    <div class="grid gap-2.5">
      <button type="button" class="btn btn-wa w-full py-4 text-base" data-eq-wa>${iconSvg("whatsapp", "size-5")} Send on WhatsApp</button>
      <button type="button" class="btn btn-ghost w-full" data-eq-mail>${iconSvg("mail", "size-5")} Send by email instead</button>
    </div>`;
}

function status(msg: string, kind: "err" | "ok") {
  const el = $("#eq-status");
  if (!el) return;
  el.className = `rounded-2xl px-4 py-3 text-[14px] ${kind === "err" ? "bg-red-50 text-red-700" : "bg-eco-50 text-eco"}`;
  el.innerHTML = msg;
}

function readContact(): EnquiryContact | null {
  const f = $<HTMLFormElement>("#eq-form");
  if (!f) return null;
  const get = (k: string) => (f.elements.namedItem(k) as HTMLInputElement | null)?.value.trim() ?? "";
  const c: EnquiryContact = { name: get("name"), phone: get("phone"), business: get("business"), city: get("city"), email: get("email"), note: get("note") };
  let err = "";
  if (!c.name) err = "Please enter your name.";
  else if (!PHONE_RE.test(c.phone)) err = "Please enter a valid phone number.";
  else if (c.email && !/^\S+@\S+\.\S+$/.test(c.email)) err = "Please check your email address, or leave it blank.";
  if (err) {
    status(err, "err");
    const bad = !c.name ? "#eq-name" : !PHONE_RE.test(c.phone) ? "#eq-phone" : "#eq-email";
    const input = $(bad);
    input?.focus();
    if (input) gsap.fromTo(input, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
    return null;
  }
  const { note: _n, ...keep } = c;
  contactStore.set(keep as Record<string, string>);
  return c;
}

function finish(name: string) {
  doneName = name;
  enquiry.clear();
  step = "done";
  render();
}

async function sendEmail(c: EnquiryContact): Promise<boolean> {
  try {
    const res = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, items: lines(), website: ($('#eq-form [name="website"]') as HTMLInputElement | null)?.value ?? "" }),
    });
    return res.ok && (await res.json()).ok === true;
  } catch {
    return false;
  }
}

function celebrate() {
  const path = $("#eq-tick-path");
  const tick = $("#eq-tick");
  if (!tick || !path) return;
  if (reducedMotion) { path.style.strokeDashoffset = "0"; return; }
  gsap.fromTo(tick, { scale: 0 }, { scale: 1, duration: 0.6, ease: "back.out(2.2)" });
  gsap.to(path, { strokeDashoffset: 0, duration: 0.5, delay: 0.3, ease: "power2.out" });
  const colors = ["#f26a1b", "#fdb515", "#23845a", "#17130f", "#c9965f"];
  for (let i = 0; i < 36; i++) {
    const s = document.createElement("span");
    const size = 6 + Math.random() * 8;
    Object.assign(s.style, { position: "absolute", left: "50%", top: "50%", width: `${size}px`, height: `${size * (Math.random() > 0.5 ? 1 : 0.5)}px`, background: colors[i % colors.length], borderRadius: Math.random() > 0.6 ? "50%" : "2px", pointerEvents: "none" });
    tick.appendChild(s);
    const ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 110;
    gsap.fromTo(s, { x: 0, y: 0, rotate: 0, opacity: 1 }, {
      x: Math.cos(ang) * dist, y: Math.sin(ang) * dist + 60, rotate: Math.random() * 540, opacity: 0,
      duration: 1.1 + Math.random() * 0.6, delay: 0.25, ease: "power3.out", onComplete: () => s.remove(),
    });
  }
}

export function initEnquiry() {
  updateCounts();
  enquiry.subscribe(() => { updateCounts(); if (step !== "details") render(); });
  onSheetOpen("sheet-enquiry", () => { if (step === "done") step = "list"; render(); });

  const sheet = $("#sheet-enquiry");
  if (!sheet) return;
  sheet.addEventListener("click", async (e) => {
    const t = e.target as HTMLElement;
    const row = t.closest<HTMLElement>("[data-i]");
    if (row) {
      const i = Number(row.dataset.i);
      if (t.closest("[data-eq-del]")) {
        gsap.to(row, { x: 60, opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.35, ease: "power2.in", onComplete: () => enquiry.remove(i) });
        return;
      }
      const s = t.closest<HTMLElement>("[data-eq-step]");
      if (s) { enquiry.update(i, { qty: enquiry.items()[i].qty + Number(s.dataset.eqStep) }); return; }
    }
    if (t.closest("[data-eq-clear]") && confirm("Remove all items from your enquiry list?")) enquiry.clear();
    if (t.closest("[data-eq-next]")) { step = "details"; render(); $<HTMLElement>("#eq-name")?.focus(); }
    if (t.closest("[data-eq-back]")) { step = "list"; render(); }
    if (t.closest("[data-eq-wa]")) {
      const c = readContact();
      if (!c) return;
      lastWaHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(enquiryText(lines(), c))}`;
      window.open(lastWaHref, "_blank", "noopener");
      finish(c.name);
    }
    const mailBtn = t.closest<HTMLButtonElement>("[data-eq-mail]");
    if (mailBtn) {
      const c = readContact();
      if (!c) return;
      mailBtn.disabled = true;
      mailBtn.innerHTML = `<span class="size-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink"></span> Sending…`;
      if (await sendEmail(c)) { lastWaHref = ""; finish(c.name); }
      else {
        mailBtn.disabled = false;
        mailBtn.innerHTML = `${iconSvg("mail", "size-5")} Send by email instead`;
        status(`Email couldn't be sent right now. Please tap <b>Send on WhatsApp</b> or call <a class="underline" href="tel:+91${site.phone}">${site.phoneDisplay}</a>.`, "err");
      }
    }
  });
  sheet.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.matches("[data-eq-qty]")) enquiry.update(Number(t.closest<HTMLElement>("[data-i]")!.dataset.i), { qty: parseInt(t.value, 10) || 1 });
  });
}
