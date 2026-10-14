/** Presentation-only extras for menu items: photos, dietary tags, allergens and options. */
import mains from "@/assets/food-mains.jpg";
import sides from "@/assets/food-sides.jpg";
import drinksDesserts from "@/assets/food-drinks-desserts.jpg";
import periPeri from "@/assets/food-peri-peri-chicken.jpg";
import bunnyChow from "@/assets/food-bunny-chow.jpg";
import boerewors from "@/assets/food-boerewors-roll.jpg";
import onionRings from "@/assets/food-onion-rings.jpg";
import icedRooibos from "@/assets/food-iced-rooibos.jpg";
import koeksisters from "@/assets/food-koeksisters.jpg";
import type { MenuItem } from "./types";

export const categoryImage: Record<MenuItem["category"], string> = {
  Mains: mains,
  Sides: sides,
  Drinks: drinksDesserts,
  Desserts: drinksDesserts,
};

export const FALLBACK_IMAGE = mains;

/**
 * Item photos. Existing project shots first; generated studio mockups fill
 * gaps so cards do not reuse the burger hero for every main. See
 * src/assets/IMAGE-CREDITS.md. MenuPhoto falls back to the category image.
 */
const byId: Record<string, { src: string; position: string }> = {
  m1: { src: periPeri, position: "object-center" },
  m2: { src: mains, position: "object-center" },
  m3: { src: bunnyChow, position: "object-center" },
  m4: { src: boerewors, position: "object-center" },
  m5: { src: sides, position: "object-center" },
  m6: { src: onionRings, position: "object-center" },
  m7: { src: drinksDesserts, position: "object-[18%_48%]" },
  m8: { src: icedRooibos, position: "object-center" },
  m9: { src: drinksDesserts, position: "object-[82%_58%]" },
  m10: { src: koeksisters, position: "object-center" },
};

export function imageFor(item: { id?: string; category?: MenuItem["category"] }) {
  if (item.id && byId[item.id]) return byId[item.id].src;
  if (item.category) return categoryImage[item.category] ?? FALLBACK_IMAGE;
  return FALLBACK_IMAGE;
}

export function imagePosition(item: { id?: string; category?: MenuItem["category"] }) {
  if (item.id && byId[item.id]) return byId[item.id].position;
  return "object-center";
}

export interface ItemOption {
  label: string;
  price: number;
}

const byCategoryOptions: Record<MenuItem["category"], ItemOption[]> = {
  Mains: [
    { label: "Extra cheese", price: 15 },
    { label: "Add bacon", price: 20 },
    { label: "Make it a meal (fries + drink)", price: 45 },
  ],
  Sides: [{ label: "Large portion", price: 15 }],
  Drinks: [{ label: "Large", price: 10 }],
  Desserts: [{ label: "Extra custard", price: 8 }],
};

const allergens: Record<string, string[]> = {
  Mains: ["Gluten", "Dairy"],
  Sides: ["Dairy"],
  Drinks: [],
  Desserts: ["Gluten", "Dairy", "Egg"],
};

export function optionsFor(item: MenuItem) {
  return byCategoryOptions[item.category] ?? [];
}

export function tagsFor(item: MenuItem) {
  const tags: string[] = [];
  if (item.spicy) tags.push("Spicy");
  if (item.category === "Drinks" || item.category === "Sides") tags.push("Vegetarian");
  return tags;
}

export function allergensFor(item: MenuItem) {
  return allergens[item.category] ?? [];
}
