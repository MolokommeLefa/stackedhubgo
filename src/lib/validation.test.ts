import { describe, expect, it } from "vitest";
import {
  validateDemoCard,
  validateName,
  validatePhoneZa,
  validateScheduleWindow,
} from "./validation";

describe("checkout validation", () => {
  it("requires a name and a South African mobile number", () => {
    expect(validateName(" ")).toBe("Enter your name.");
    expect(validatePhoneZa("082123")).toBe("Enter a 10-digit phone number, e.g. 082 123 4567.");
    expect(validatePhoneZa("082 123 4567")).toBeNull();
  });

  it("accepts only the demo card details", () => {
    expect(
      validateDemoCard({
        cardholder: "Priya Nair",
        cardNumber: "4242 4242 4242 4242",
        cardExpiry: "12/30",
        cardCvv: "123",
      }),
    ).toBeNull();
    expect(
      validateDemoCard({
        cardholder: "Priya Nair",
        cardNumber: "4111111111111111",
        cardExpiry: "12/30",
        cardCvv: "123",
      }),
    ).toMatch(/Demo payment declined/);
  });

  it("keeps scheduled times inside the 45-minute to 7-day window", () => {
    const now = Date.parse("2026-10-27T10:00:00Z");
    expect(validateScheduleWindow("", now)).not.toBeNull();
    expect(validateScheduleWindow(new Date(now + 10 * 60_000).toISOString(), now)).not.toBeNull();
    expect(validateScheduleWindow(new Date(now + 60 * 60_000).toISOString(), now)).toBeNull();
  });
});
