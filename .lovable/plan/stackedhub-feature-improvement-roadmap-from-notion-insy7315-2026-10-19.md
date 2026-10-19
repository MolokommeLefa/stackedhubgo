# StackedHub — Feature Improvement Roadmap (from Notion "INSY7315 Task 3")

Source: the "INSY7315 Task 3" page in the Academia OS tasks database (due 30 Oct 2026, status In progress). Objective: better customer engagement, order transparency, retention and kitchen efficiency without breaking what already works.

Labels: **[Web]** built in this app. **[API]** needs the ASP.NET Core backend (Atlegang, Kea); the web app gets a demo-data version first and the backend change is written up as a proposal, not made directly.

## Phase 1 — Core experience and reliability (High)

### 1. Seamless order tracking
- **[Web]** New `Track order` page (`/track/<order>`) with a step timeline: Placed → In kitchen → Ready (or Out for delivery) → Completed; Cancelled shown separately.
- Each step shows the time it happened (timestamped history) and an estimated ready time ("ready in 20–25 min") only while the order is active.
- Refreshes every 10 seconds; shows a pop-up when the status changes.
- Remembers the customer's last 5 orders on the device, so the "Track order" link in the header works for guests.
- **[API]** Proposal: store a status history row per change and return it with the order.

### 2. Loyalty wallet
- **[Web]** New `Rewards` page for signed-in customers: points balance, progress bar to next reward, history of earned/redeemed points, available rewards.
- Clear rules shown on the page (e.g. 1 point per R10 spent, earned only on Completed orders; redeem in fixed reward amounts).
- Redeem a reward at checkout as a discount line; button disabled when balance is too low; each redemption carries a unique ID so it can't be applied twice.
- **[API]** Proposal: points ledger table, earn on Completed, redeem endpoint with idempotency key.

### 3. Notifications
- **[Web]** In-app notification bell for customers: order updates, rewards earned, promotions.
- Notification preferences in the customer's Settings: order updates (always on), promotional alerts (opt-in), rewards alerts.
- No duplicate alerts: one notification per order per status.
- **[API]** Proposal: notifications table with delivery outcome; email/push left for later.

Deliverable: one reliable order journey with tracking, rewards and notifications.

## Phase 2 — Engagement and retention (High)

### 4. Personalised ordering
- Heart icon to save favourites; "Order again" on past orders.
- Before re-adding, check current price and availability; sold-out items are skipped with a message.
- "You might like" row from past orders (later: the Gemini assistant).

### 5. Feedback and support
- After completion: 1–5 star rating and comment.
- "Report a problem": missing item, wrong order, delay.
- Staff "Issues" page: Open → In progress → Resolved, with notes.

### 6. Campaigns and promotions
- Admin Promotions page gains: double-points campaigns, reward milestones, start/end dates, eligible customer groups.
- Reports show redemptions and orders per campaign.

Deliverable: repeat orders and measurable feedback.

## Phase 3 — Differentiation (Medium)

### 7. Group ordering
- Shareable basket link; each person adds and customises items; combined summary before checkout. Split payments deferred.

### 8. Scheduled orders and express collection
- Pick a collection time slot at checkout; full slots hidden (kitchen capacity setting for Admin); "Ready for collection" notification.

### 10. Smart menu and loyalty missions
- Verified dietary filters (already partly present), optional "try something new" missions for bonus points. Referrals and demand forecasting only after the rest is stable.

## Cross-cutting requirements
- Keep the existing API, database and Azure deployment; backend checks for orders, points and rewards.
- Tests: points earn/redeem rules, no double redemption, status timeline order, reorder price check, checkout scenarios (QA: Tshepang).
- Work on a feature branch, check in a preview before merging.
- Monitoring and rollback notes in `docs/`.
- Success metrics page for Admin Reports: completion/cancel rate, repeat-order rate, loyalty participation, ratings, issue-resolution time.

## Build order in this session
1. Fix the current preview error, then Order tracking (1).
2. Loyalty wallet (2) and redeem at checkout.
3. Notifications and preferences (3).
4. Favourites and Order again (4), Feedback and Issues page (5).
5. Campaign fields on Promotions (6).
6. Phase 3 items as simple first versions; tests and docs for each.

## Team mapping (from the Notion page)
- Frontend — tracking timeline, loyalty wallet, notification preferences, customer flows: Lefa, Siviwe
- Backend — order states, rewards ledger, notifications, API checks: Atlegang, Kea
- QA — regression, checkout scenarios, duplicate transactions, failures: Tshepang
- DevOps — staging, configuration, monitoring, rollback: whole team

## Technical details
- Routes: `track.$reference.tsx`, `rewards.tsx`, `issues.tsx` (staff), extend `settings.tsx`, `checkout.tsx`, `promotions.tsx`, `reports.tsx`. Each new route gets its own head().
- `src/lib/loyalty.ts` (pure rules: earn, redeem, progress) + `loyalty.test.ts`; `src/lib/notifications.ts` with dedupe key `orderId:status`.
- `data.ts` gains getOrderHistory, getLoyalty, redeemReward, getNotifications, saveFeedback, getIssues — live API when available, demo store otherwise.
- Backend proposals in `docs/architecture/task3-backend-proposal.md`: StatusHistory, PointsLedger (unique idempotency key), Notifications, Feedback/Issues tables and endpoints.
- Definition of Done checklist added to the PR template.
