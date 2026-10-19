import { describe, expect, it } from "vitest";
import { addEntry, balance, nextReward, pointsForTotal, REWARDS } from "./loyalty";

const earn = (key: string, points: number) => ({
  key,
  type: "earn" as const,
  points,
  label: "x",
  at: "2026-10-19T00:00:00Z",
});

describe("loyalty rules", () => {
  it("earns 1 point per R10 spent", () => {
    expect(pointsForTotal(129)).toBe(12);
    expect(pointsForTotal(9)).toBe(0);
  });

  it("double points campaign doubles points", () => {
    expect(pointsForTotal(129, 2)).toBe(24);
  });

  it("the same order never earns twice", () => {
    let l = addEntry([], earn("earn:o1", 12));
    l = addEntry(l, earn("earn:o1", 12));
    expect(balance(l)).toBe(12);
  });

  it("cannot redeem more points than the balance", () => {
    const l = addEntry([], earn("earn:o1", 30));
    expect(() =>
      addEntry(l, { key: "redeem:o2", type: "redeem", points: -50, label: "R20 off", at: "" }),
    ).toThrow();
  });

  it("shows progress to the next reward", () => {
    expect(nextReward(25).reward?.id).toBe(REWARDS[0].id);
    expect(nextReward(25).needed).toBe(25);
  });
});
