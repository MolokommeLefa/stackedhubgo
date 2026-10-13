/** Presentation-only extras for menu items: photos, dietary tags, allergens and options. */
import mains from "@/assets/food-mains.jpg";
import sides from "@/assets/food-sides.jpg";
import drinksDesserts from "@/assets/food-drinks-desserts.jpg";
import type { MenuItem } from "./types";

export const categoryImage: Record<MenuItem["category"], string> = {
  Mains: mains,
  Sides: sides,
  Drinks: drinksDesserts,
  Desserts: drinksDesserts,
};

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
