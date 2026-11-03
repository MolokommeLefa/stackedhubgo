/** Presentation-only extras for menu items: photos, dietary tags, allergens and options. */
import mains from "@/assets/food-mains.jpg";
import sides from "@/assets/food-sides.jpg";
import periPeri from "@/assets/food-peri-peri-chicken.jpg";
import bunnyChow from "@/assets/food-bunny-chow.jpg";
import boerewors from "@/assets/food-boerewors-roll.jpg";
import onionRings from "@/assets/food-onion-rings.jpg";
import lemonade from "@/assets/food-lemonade.jpg";
import icedRooibos from "@/assets/food-iced-rooibos.jpg";
import malva from "@/assets/food-malva-pudding.jpg";
import koeksisters from "@/assets/food-koeksisters.jpg";
import type { MenuItem } from "./types";

export const categoryImage: Record<MenuItem["category"], string> = {
  Mains: mains,
  Sides: sides,
  Drinks: lemonade,
  Desserts: malva,
};

export const FALLBACK_IMAGE = mains;

/**
 * One photo per dish. Live API ids are numeric; demo ids are m1–m10.
 * Names stay stable across both. See src/assets/IMAGE-CREDITS.md.
 * MenuPhoto falls back to the category image.
 */
const byId: Record<string, string> = {
  m1: periPeri,
  m2: mains,
  m3: bunnyChow,
  m4: boerewors,
  m5: sides,
  m6: onionRings,
  m7: lemonade,
  m8: icedRooibos,
  m9: malva,
  m10: koeksisters,
};

const byName: Record<string, string> = {
  "peri peri chicken stack": byId["m1"]!,
  "double smash burger": byId["m2"]!,
  "bunny chow": byId["m3"]!,
  "boerewors roll": byId["m4"]!,
  "chakalaka fries": byId["m5"]!,
  "onion rings": byId["m6"]!,
  "homemade lemonade": byId["m7"]!,
  "iced rooibos": byId["m8"]!,
  "malva pudding": byId["m9"]!,
  "koeksister bites": byId["m10"]!,
};

function dishKey(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function photoFor(item: { id?: string; name?: string; category?: MenuItem["category"] }): string | undefined {
  if (item.name) {
    const named = byName[dishKey(item.name)];
    if (named) return named;
  }
  if (!item.id) return undefined;
  if (byId[item.id]) return byId[item.id];
  if (/^\d+$/.test(item.id)) return byId[`m${Number(item.id)}`];
  return undefined;
}

export function imageFor(item: { id?: string; name?: string; category?: MenuItem["category"] }) {
  const match = photoFor(item);
  if (match) return match;
  if (item.category) return categoryImage[item.category] ?? FALLBACK_IMAGE;
  return FALLBACK_IMAGE;
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
