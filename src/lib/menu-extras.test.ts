import { describe, expect, it } from "vitest";
import { imageFor, imageFrame } from "./menu-extras";

describe("menu photos", () => {
  it("matches live numeric ids and dish names to the same photo", () => {
    expect(imageFor({ id: "7", name: "Homemade Lemonade", category: "Drinks" })).toBe(
      imageFor({ id: "m7" }),
    );
    expect(imageFrame({ id: "7", name: "Homemade Lemonade" })).toBe("w-[205%] max-w-none");
    expect(imageFrame({ id: "9", name: "Malva Pudding" })).toContain("-translate-x");
    expect(imageFor({ id: "9", name: "Malva Pudding", category: "Desserts" })).not.toBe(
      imageFor({ id: "2", name: "Double Smash Burger", category: "Mains" }),
    );
    expect(imageFor({ id: "4", name: "Boerewors Roll", category: "Mains" })).not.toBe(
      imageFor({ id: "1", name: "Peri-Peri Chicken Stack", category: "Mains" }),
    );
  });
});
