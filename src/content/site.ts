import data from "./site.json";

/**
 * Business details. Edit them in the admin (/keystatic → Business details) or in src/content/site.json.
 * Derived values (display phone, WhatsApp link number) are computed here.
 */
const digits = (s: string) => s.replace(/\D/g, "").slice(-10);
const phone = digits(data.phone);

export const site = {
  ...data,
  phone,
  phoneDisplay: `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`,
  whatsapp: `91${digits(data.whatsapp)}`,
  url: "https://rtcdisposal.in",
} as const;

export const addressText = [site.address.line1, site.address.line2, `${site.address.city}, ${site.address.state} ${site.address.pin}`]
  .filter((s) => s.trim())
  .join(", ");
export const telHref = `tel:+91${site.phone}`;
export const mailHref = `mailto:${site.email}`;
export const instagramHref = `https://instagram.com/${site.instagram}`;
export const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapQuery)}`;
export const waHref = (text = "Hi RTC, I have an enquiry.") =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
