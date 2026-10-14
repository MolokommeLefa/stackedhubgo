/** Presentation-only extras for menu items: photos, dietary tags, allergens and options. */
import mains from "@/assets/food-mains.jpg";
import sides from "@/assets/food-sides.jpg";
import drinksDesserts from "@/assets/food-drinks-desserts.jpg";
import peri from "@/assets/peri-peri.jpg";
import smash from "@/assets/smash-burger.jpg";
import bunny from "@/assets/bunny-chow.jpg";
import boerewors from "@/assets/boerewors.jpg";
import fries from "@/assets/chakalaka-fries.jpg";
import rings from "@/assets/onion-rings.jpg";
import lemonade from "@/assets/lemonade.jpg";
import rooibos from "@/assets/rooibos.jpg";
import malva from "@/assets/malva.jpg";
import koeksisters from "@/assets/koeksisters.jpg";
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

const foodPhotos: [string, string][] = [["peri", peri], ["smash", smash], ["bunny", bunny], ["boerewors", boerewors], ["chakalaka", fries], ["onion", rings], ["lemonade", lemonade], ["rooibos", rooibos], ["malva", malva], ["koeksister", koeksisters]];

/** Illustrative menu photography; unknown dishes retain the category image. */
export function imageFor(item: Pick<MenuItem, "name" | "category">) {
  return foodPhotos.find(([word]) => item.name.toLowerCase().includes(word))?.[1] ?? categoryImage[item.category];
}
