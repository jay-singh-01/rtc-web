import type { Category, IconName, Material } from "@/types";

export const categories: Category[] = [
  { id: "containers", name: "Food Containers", short: "Containers", blurb: "Round, rectangular, hinged and sauce containers with lids", image: "life-pet" },
  { id: "meal-trays", name: "Meal Trays & Boxes", short: "Meal Trays", blurb: "Compartment meal boxes, sealable trays and lids", image: "pt-sealable" },
  { id: "plates-bowls", name: "Plates, Bowls & Trays", short: "Plates & Bowls", blurb: "Round, compartment and square plates, bowls and serving trays", image: "bg-cp-plate-hero" },
  { id: "takeaway", name: "Clamshells & Takeaway", short: "Takeaway", blurb: "Burger boxes, clamshells and lunch boxes", image: "bg-burger" },
  { id: "cups", name: "Cups, Glasses & Lids", short: "Cups & Glasses", blurb: "Tea, coffee, juice and mocktail cups with lids", image: "cup-ripple-b" },
  { id: "dessert", name: "Dessertware", short: "Dessertware", blurb: "Premium PS acrylic dessert cups, bowls and platters", image: "ds-d-30" },
  { id: "mitti", name: "Mitti Kulhad & Clayware", short: "Kulhad & Clay", blurb: "Eco-friendly kulhads, handis and clay bowls", image: "mi-kulhad-100" },
  { id: "wooden", name: "Wooden & Bamboo", short: "Wooden", blurb: "Cutlery, ice-cream sticks, stirrers and skewers", image: "wd-cutlery-a" },
  { id: "straws", name: "Straws", short: "Straws", blurb: "Paper, mocktail, bend and umbrella straws", image: "st-paper-a" },
];

const bagasseFeatures: { icon: IconName; label: string }[] = [
  { icon: "microwave", label: "Microwave safe" },
  { icon: "snow", label: "Freezer friendly" },
  { icon: "drop", label: "Water & oil resistant" },
  { icon: "flame", label: "Hot food friendly" },
  { icon: "shield", label: "Food grade" },
  { icon: "leaf", label: "No plastic coating" },
];

export const materials: Material[] = [
  { id: "bagasse", name: "Sugarcane Bagasse", eco: true, image: "bg-round-plate-hero", blurb: "Compostable, made from sugarcane pulp", features: bagasseFeatures },
  { id: "cornstarch", name: "Cornstarch", eco: true, image: "cs-mealbox", blurb: "Biodegradable, microwave & freezer safe",
    features: [{ icon: "leaf", label: "Biodegradable" }, { icon: "microwave", label: "Microwave safe" }, { icon: "snow", label: "Freezer safe" }, { icon: "shield", label: "Strong & sturdy" }] },
  { id: "pet", name: "PET", image: "pt-hinge", blurb: "Crystal-clear and food-grade" },
  { id: "pp", name: "PP", image: "fc-rect-lid-a", blurb: "Strong, sturdy containers" },
  { id: "paper", name: "Paper & Kraft", eco: true, image: "fc-kraft-rect-a", blurb: "Food-grade paper and kraft board" },
  { id: "ps", name: "PS Acrylic", image: "ds-d-15", blurb: "Glass-like premium serveware" },
  { id: "clay", name: "Clay (Mitti)", eco: true, image: "mi-kulhad-180", blurb: "Traditional, natural terracotta",
    features: [{ icon: "leaf", label: "Natural terracotta" }, { icon: "recycle", label: "Eco-friendly" }] },
  { id: "wood", name: "Wood & Bamboo", eco: true, image: "wd-skewer-b", blurb: "Natural, plastic-free",
    features: [{ icon: "leaf", label: "Plastic-free" }, { icon: "recycle", label: "Natural material" }] },
  { id: "aluminium", name: "Aluminium", image: "fc-alu-rect-a", blurb: "Foil containers that keep food hot" },
];

export const industries: { name: string; icon: IconName }[] = [
  { name: "Restaurants & Hotels", icon: "restaurant" },
  { name: "Caterers & Events", icon: "event" },
  { name: "Sweet Shops & Bakeries", icon: "cake" },
  { name: "Cafés & Juice Bars", icon: "cafe" },
  { name: "Cloud Kitchens & Takeaways", icon: "bag" },
  { name: "Fruit & Dry-fruit Sellers", icon: "fruit" },
];


export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<Category["id"], Category>;
export const materialById = Object.fromEntries(materials.map((m) => [m.id, m])) as Record<Material["id"], Material>;
