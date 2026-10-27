# Day 3 — Error Handling & Reliability

Branch: `feature/day3-reliability`  
Nothing was committed or pushed.

## Files changed

- `src/lib/api-client.ts` — 15s timeout, offline/timeout/parse errors, idempotency header, no automatic retries
- `src/lib/reliability.ts` — submit lock and payload-scoped idempotency keys
- `src/lib/validation.ts` — phone, schedule window, demo-card helpers
- `src/lib/order-rules.ts` — quantity clamp (1–20) and stored-basket sanitising
- `src/lib/cart.tsx` — clamp/sanitize basket quantities
- `src/lib/data.ts` — order/group idempotency keys, demo status-transition checks, quantity validation
- `src/routes/checkout.tsx` — submit lock, shared validation, idempotency key
- `src/routes/portal.tsx` — same checkout lock/validation; one confirm button; payment method no longer split
- `src/routes/group.tsx` — checkout lock, empty-basket check, live card block, idempotency key
- `src/routes/orders.tsx` — status-transition guard, one Refresh button, busy lock
- `src/routes/dashboard.tsx` — busy lock on queue actions; retry on read errors
- `src/routes/track.$reference.tsx` — retry on first load and on poll refresh; order-again errors
- `src/routes/order.tsx`, `src/routes/reports.tsx` — retry on read failures
- `src/components/AppShell.tsx` — `LoadState` shows string and `Error` messages
- `src/components/BasketSheet.tsx` — empty basket goes to the menu, not checkout
- Tests: `src/lib/api-client.test.ts`, `src/lib/reliability.test.ts`, `src/lib/validation.test.ts`, plus updates to `order-rules.test.ts` and `demo-store.test.ts`

## Features implemented

1. **Loading / empty / error**
   - Tracking: skeleton while loading, error + Try again if the order never loaded, banner + Try again if a later refresh fails (last known status kept).
   - Staff queue and dashboard: action errors stay visible; read failures have Retry.
   - Basket: empty state uses “Browse the menu”; checkout stays disabled when empty.

2. **API failures and timeouts**
   - Default request timeout is **15 seconds**.
   - Distinct messages for timeout, offline, network, HTTP, and malformed JSON.
   - GET/HEAD 5xx and parse failures are marked retryable for the UI. **POST/PATCH/PUT are never auto-retried.**

3. **Duplicate order prevention**
   - In-memory submit lock stays held until `placeOrder` / group checkout resolves or fails (covers double-click in the same tick).
   - Frontend sends `Idempotency-Key` (header + body) for live checkout and group checkout.
   - The same key is reused while the payload is unchanged, so a **manual** retry after a timeout can replay. A changed basket gets a new key.
   - Backend already stores `IdempotencyRecords` when a key is supplied (`OrdersController` / `OrderService`). That is not a full guarantee if the tab is refreshed and a new key is generated after the first request actually created an order.

4. **Invalid input**
   - Checkout reuses `validateName`, `validatePhoneZa`, `validateDeliveryAddress`, `validateScheduleWindow`, `validateDemoCard`.
   - Line quantities clamped to 1–20 (matches API `[Range(1, 20)]`).
   - Live card checkout still blocked; demo card still only accepts the sandbox PAN.

5. **Basket and order-state reliability**
   - Demo `updateOrderStatus` now uses `canTransition` (same rules as `OrderLifecycle` on the API).
   - Staff queue refuses skip-ahead locally and keeps the previous status if the API rejects.
   - Quantity 0 still removes a line.

## Tests run and results

| Command | Result |
| --- | --- |
| `npm test` (`vitest run`) | **Passed** — 7 files, 46 tests |
| `npm run build` | **Passed** (after fixing a duplicate import in `BasketSheet.tsx`) |
| `npm run lint` | **Failed overall** — mostly existing Prettier issues in files this day did not own (`portal.tsx` layout, `DeliveryTrackingMap.tsx`, `data.ts` older sections, UI kits). Day 3 files listed above lint clean except existing `react-refresh` warnings on `BasketSheet` / `cart`. |
| `dotnet test` | **Not run** in this pass |

`npm install` was required locally (`node_modules` was missing). `package-lock.json` was generated as an untracked file and was **not** treated as part of this feature.

## Remaining limitations

- Idempotency requires the client to send a key. A full page reload after a timeout creates a new key; if the first POST already succeeded, a second submit can create a second order.
- The API still does not charge cards; live “Card” is blocked on purpose.
- Order tracking polls every 10s; failures are shown, not auto-retried as extra POSTs.
- Portal still has two overlapping timing controls (`when` slots vs `scheduleMode`). Validation covers both; a later cleanup can merge them without changing pricing rules.
- Google Maps, PWA, and new loyalty product work were left alone.

## Manual test steps

1. Open checkout with an empty basket — confirm you cannot place an order; use Browse the menu from the basket sheet.
2. Fill name/phone badly, then correctly; try delivery with a one-word address; try card `4111…` then the 4242 sandbox card.
3. Double-click **Place order** / **Confirm order** — only one request should fire; button stays on “Placing order…” until it finishes.
4. Disconnect the network, load `/track` or staff **Order queue** — error + Retry. Place-order should fail with an offline/timeout message and **not** retry by itself.
5. Staff: Accept → Mark ready → Complete. Try to complete a new ticket in one jump in demo mode — should be rejected.
6. Change a basket qty above 20 — it should stop at 20. Remove to 0 — line disappears and totals update.

## Notes for teammates

- Keep sending `idempotencyKey` on any new checkout path (including group checkout).
- Do not add automatic retries around `placeOrder`, payments, or status PATCH.
- `isLiveApi()` is still true whenever `DEFAULT_API_BASE_URL` is set; demo-store tests mock `isLiveApi` to `false`.
- Please do not force-push this branch (Lovable history).
