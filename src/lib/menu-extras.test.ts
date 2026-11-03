import { describe, expect, it } from "vitest";
import { imageFor } from "./menu-extras";

describe("menu photos", () => {
  it("gives each dish its own photo, including live numeric ids", () => {
    const lemonade = imageFor({ id: "7", name: "Homemade Lemonade", category: "Drinks" });
    const malva = imageFor({ id: "9", name: "Malva Pudding", category: "Desserts" });
    const rooibos = imageFor({ id: "8", name: "Iced Rooibos", category: "Drinks" });
    const boerewors = imageFor({ id: "4", name: "Boerewors Roll", category: "Mains" });
    const burger = imageFor({ id: "2", name: "Double Smash Burger", category: "Mains" });
    const chicken = imageFor({ id: "1", name: "Peri-Peri Chicken Stack", category: "Mains" });

    expect(lemonade).toBe(imageFor({ id: "m7" }));
    expect(malva).toBe(imageFor({ id: "m9" }));
    expect(new Set([lemonade, malva, rooibos, boerewors, burger, chicken]).size).toBe(6);
    expect(imageFor({ category: "Drinks" })).toBe(lemonade);
    expect(imageFor({ category: "Desserts" })).toBe(malva);
    expect(lemonade).not.toMatch(/drinks-desserts/);
    expect(malva).not.toMatch(/drinks-desserts/);
  });
});
