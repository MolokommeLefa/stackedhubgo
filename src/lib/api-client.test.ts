import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_TIMEOUT_MS,
  ApiError,
  apiRequest,
  isReadOnlyMethod,
  toUserMessage,
} from "./api-client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiRequest", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ ok: true })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("maps non-2xx API errors without retrying", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Menu item is unavailable." }, 400)),
    );
    await expect(apiRequest("/api/orders")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "Menu item is unavailable.",
      retryable: false,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not automatically retry order creation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Kitchen busy" }, 500)),
    );
    await expect(apiRequest("/api/orders", { method: "POST", body: "{}" })).rejects.toMatchObject({
      status: 500,
      retryable: false,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>nope</html>", { status: 200 })),
    );
    const error = await apiRequest("/api/menu").catch((err) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("parse");
    expect(error.retryable).toBe(true);
  });

  it("times out hung requests after 15 seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const abort = new Error("Aborted");
            abort.name = "AbortError";
            reject(abort);
          });
        });
      }),
    );
    const pending = expect(apiRequest("/api/menu")).rejects.toMatchObject({
      code: "timeout",
      retryable: true,
    });
    await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS);
    await pending;
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("sends an idempotency key on demand", async () => {
    await apiRequest("/api/orders", { method: "POST", body: "{}", idempotencyKey: "abc-123" });
    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("Idempotency-Key")).toBe("abc-123");
  });
});

describe("api helpers", () => {
  it("treats GET as retryable and POST as unsafe", () => {
    expect(isReadOnlyMethod("GET")).toBe(true);
    expect(isReadOnlyMethod("POST")).toBe(false);
  });

  it("surfaces string and Error messages to the UI", () => {
    expect(toUserMessage("Enter a delivery street and suburb.")).toBe(
      "Enter a delivery street and suburb.",
    );
    expect(toUserMessage(new Error("Can't reach the API."))).toBe("Can't reach the API.");
  });
});
