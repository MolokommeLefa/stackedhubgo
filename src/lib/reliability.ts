import { newIdempotencyKey } from "./api-client";

/** Prevents overlapping submits until the in-flight request finishes. */
export function createSubmitLock() {
  let locked = false;
  return {
    get locked() {
      return locked;
    },
    acquire() {
      if (locked) return false;
      locked = true;
      return true;
    },
    release() {
      locked = false;
    },
  };
}

/**
 * Keeps one idempotency key for the same checkout payload so a manual retry
 * after a timeout can replay safely. A changed basket or payment details gets
 * a new key.
 */
export function createIdempotencySession() {
  let lastFingerprint = "";
  let key = newIdempotencyKey();
  return {
    keyFor(fingerprint: string) {
      if (fingerprint !== lastFingerprint) {
        lastFingerprint = fingerprint;
        key = newIdempotencyKey();
      }
      return key;
    },
    reset() {
      lastFingerprint = "";
      key = newIdempotencyKey();
    },
  };
}
