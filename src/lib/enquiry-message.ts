/** Shared by the browser (WhatsApp link) and the server (email body). */
export interface EnquiryContact {
  name: string;
  phone: string;
  business?: string;
  city?: string;
  email?: string;
  note?: string;
}
export interface EnquiryLine {
  product: string;
  option?: string;
  qty: number;
  unit: string;
}

export function enquiryLines(items: EnquiryLine[]): string[] {
  return items.map((it, i) => `${i + 1}. ${it.product}${it.option ? ` – ${it.option}` : ""} × ${it.qty} ${it.unit}`);
}

export function enquiryText(items: EnquiryLine[], c: EnquiryContact): string {
  const who = [
    c.name && `Name: ${c.name}`,
    c.business && `Business: ${c.business}`,
    c.phone && `Phone: ${c.phone}`,
    c.city && `City: ${c.city}`,
  ].filter(Boolean);
  return [
    "Hello RTC, I would like a quotation for:",
    "",
    ...enquiryLines(items),
    ...(c.note ? ["", `Note: ${c.note}`] : []),
    ...(who.length ? ["", ...who] : []),
  ].join("\n");
}

export const PHONE_RE = /^[+\d][\d\s-]{7,}$/;
