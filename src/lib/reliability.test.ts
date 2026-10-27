import { describe, expect, it } from "vitest";
import { createIdempotencySession, createSubmitLock } from "./reliability";

describe("createSubmitLock", () => {
  it("blocks a second acquire until release", () => {
    const lock = createSubmitLock();
    expect(lock.acquire()).toBe(true);
    expect(lock.acquire()).toBe(false);
    lock.release();
    expect(lock.acquire()).toBe(true);
  });
});

describe("createIdempotencySession", () => {
  it("reuses a key for the same payload and rotates when the payload changes", () => {
    const session = createIdempotencySession();
    const first = session.keyFor("burger-1");
    expect(session.keyFor("burger-1")).toBe(first);
    expect(session.keyFor("burger-2")).not.toBe(first);
  });
});
