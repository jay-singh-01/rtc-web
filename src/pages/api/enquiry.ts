import type { APIRoute } from "astro";
import nodemailer from "nodemailer";
import { enquiryLines, PHONE_RE, type EnquiryLine } from "@/lib/enquiry-message";

/** Runs on demand as a Vercel serverless function — everything else on the site is static. */
export const prerender = false;

const env = (k: string) => (import.meta.env[k] as string | undefined) ?? process.env[k];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const clean = (v: unknown, max = 200) => String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
const html = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// Best-effort per-instance rate limit (5 requests / 10 min per IP).
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => t > now - 600_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request" }, 400);
  }
  if (body.website) return json({ ok: true }); // honeypot
  if (limited(clientAddress ?? "unknown")) return json({ ok: false, error: "Too many requests" }, 429);

  const name = clean(body.name, 100);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 150);
  const business = clean(body.business, 150);
  const city = clean(body.city, 100);
  const note = String(body.note ?? "").trim().slice(0, 4000);
  const type = body.type === "contact" ? "contact" : "quote";
  if (!name || !PHONE_RE.test(phone)) return json({ ok: false, error: "Name and a valid phone number are required" }, 422);
  const replyTo = /^\S+@\S+\.\S+$/.test(email) ? email : undefined;

  const items: EnquiryLine[] = Array.isArray(body.items)
    ? body.items.slice(0, 100).map((i: Record<string, unknown>) => ({
        product: clean(i.product), option: clean(i.option), qty: Math.max(1, Math.min(99999, Number(i.qty) || 1)), unit: clean(i.unit, 20),
      }))
    : [];

  const digits = phone.replace(/\D/g, "");
  const waCustomer = `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
  const subject = `${type === "quote" ? "Quote request" : "Website message"} from ${name}${business ? ` (${business})` : ""}`;
  const details: [string, string][] = [["Name", name], ["Phone", phone], ["Email", email], ["Business", business], ["City", city]].filter(([, v]) => v) as [string, string][];

  const text = [
    type === "quote" ? "New quote request from rtcdisposal.in" : "New message from rtcdisposal.in",
    "",
    ...details.map(([k, v]) => `${k}: ${v}`),
    ...(items.length ? ["", "Items:", ...enquiryLines(items)] : []),
    ...(note ? ["", "Message:", note] : []),
    "",
    `Reply on WhatsApp: ${waCustomer}`,
  ].join("\n");

  const htmlBody = `
  <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17130f">
    <div style="background:#f26a1b;color:#fff;padding:18px 22px;border-radius:14px 14px 0 0">
      <div style="font-size:13px;opacity:.85">${type === "quote" ? "New quote request" : "New website message"}</div>
      <div style="font-size:22px;font-weight:700">${html(name)}${business ? ` · ${html(business)}` : ""}</div>
    </div>
    <div style="border:1px solid #ebe3d6;border-top:0;padding:20px 22px;border-radius:0 0 14px 14px">
      <table style="font-size:14px;border-collapse:collapse">${details.map(([k, v]) => `<tr><td style="padding:3px 16px 3px 0;color:#736a5f">${k}</td><td style="padding:3px 0"><b>${html(v)}</b></td></tr>`).join("")}</table>
      ${items.length ? `<h3 style="margin:20px 0 8px;font-size:15px">Items requested</h3>
      <table style="width:100%;font-size:14px;border-collapse:collapse">${items.map((it, i) => `<tr style="border-top:1px solid #ebe3d6"><td style="padding:8px 8px 8px 0;color:#736a5f">${i + 1}.</td><td style="padding:8px 0"><b>${html(it.product)}</b>${it.option ? `<br><span style="color:#736a5f">${html(it.option)}</span>` : ""}</td><td style="padding:8px 0;text-align:right;white-space:nowrap"><b>${it.qty}</b> ${html(it.unit)}</td></tr>`).join("")}</table>` : ""}
      ${note ? `<h3 style="margin:20px 0 8px;font-size:15px">Message</h3><p style="font-size:14px;white-space:pre-wrap;margin:0">${html(note)}</p>` : ""}
      <a href="${waCustomer}" style="display:inline-block;margin-top:22px;background:#25d366;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">Reply on WhatsApp</a>
    </div>
  </div>`;

  const password = env("SMTP_PASSWORD");
  if (!password) {
    console.error("SMTP_PASSWORD is not set");
    return json({ ok: false, error: "Email is not configured" }, 503);
  }
  try {
    const transport = nodemailer.createTransport({
      host: env("SMTP_HOST") ?? "smtp.rtcdisposal.in",
      port: Number(env("SMTP_PORT") ?? 465),
      secure: (env("SMTP_SECURE") ?? "true") === "true",
      auth: { user: env("SMTP_USER") ?? "mail@rtcdisposal.in", pass: password },
    });
    await transport.sendMail({
      from: { name: "RTC Website", address: env("MAIL_FROM") ?? "mail@rtcdisposal.in" },
      to: env("MAIL_TO") ?? "rtcdisposal@gmail.com",
      replyTo: replyTo ? { name, address: replyTo } : undefined,
      subject,
      text,
      html: htmlBody,
    });
    return json({ ok: true });
  } catch (err) {
    console.error("Enquiry email failed:", err);
    return json({ ok: false, error: "Could not send email" }, 502);
  }
};
