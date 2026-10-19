/** Loyalty rules shared by the wallet, checkout and tests. Pure functions only. */

export const RAND_PER_POINT = 10; // 1 point for every R10 spent
export const DOUBLE_POINTS_MULTIPLIER = 2;

export interface Reward {
  id: string;
  title: string;
  points: number;
  value: number; // Rand off the order
}

export const REWARDS: Reward[] = [
  { id: "r-20", title: "R20 off", points: 50, value: 20 },
  { id: "r-50", title: "R50 off", points: 100, value: 50 },
  { id: "r-120", title: "R120 off", points: 200, value: 120 },
];

export interface LedgerEntry {
  key: string; // idempotency key, e.g. "earn:o123" or "redeem:o123"
  type: "earn" | "redeem";
  points: number; // positive for earn, negative for redeem
  label: string;
  at: string;
}

export function pointsForTotal(total: number, multiplier = 1): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.floor(total / RAND_PER_POINT) * multiplier;
}

export function balance(ledger: LedgerEntry[]): number {
  return ledger.reduce((sum, e) => sum + e.points, 0);
}

export function nextReward(points: number): { reward: Reward | null; progress: number; needed: number } {
  const reward = REWARDS.find((r) => r.points > points) ?? null;
  if (!reward) return { reward: null, progress: 1, needed: 0 };
  return { reward, progress: Math.max(0, points) / reward.points, needed: reward.points - points };
}

export function canRedeem(ledger: LedgerEntry[], reward: Reward): boolean {
  return balance(ledger) >= reward.points;
}

/** Adds an entry only if its key is new — repeating the same earn/redeem does nothing. */
export function addEntry(ledger: LedgerEntry[], entry: LedgerEntry): LedgerEntry[] {
  if (ledger.some((e) => e.key === entry.key)) return ledger;
  if (entry.type === "redeem" && balance(ledger) + entry.points < 0) {
    throw new Error("Not enough points for that reward.");
  }
  return [entry, ...ledger];
}
