# Task 3 Improvement Plan — StackedHub (Stacked Foods)

This plan follows the feedback's four milestones. Work that can be built in this web app is marked **[Web]**. Work that happens outside it is marked **[Team]**: the Kotlin mobile app, Azure, and GitHub settings. For those, this app provides the docs, checks and API contracts the team needs.

## Milestone 1 — Foundation and audit

1. **Feature audit document** [Web]: list every page, role, API endpoint and mobile screen, and mark each one Implemented, Partial or Simulated. For example, the meal assistant is still simulated (not using Gemini yet).
2. **Order model and status agreement** [Web + Team]: the queue columns will use the backend's real states. "New" is Placed, "Preparing" is In kitchen, then Ready and Completed, with Cancelled kept separate. The steps from one state to the next will be written down once, for web, mobile and backend to share.
3. **Login and connection gaps** [Web]: when a session expires, send the user back to sign-in with a message. Show a clear "Can't reach the restaurant system" banner with a Retry button. Remove demo logins from the live API flow.
4. **GitHub checks** [Web]: tighten the existing frontend and backend checks. They will run lint, typecheck, unit tests and the build on every pull request. A new check will catch duplicated code in page files, which caused the blank screen after a past merge. Add a pull request template and branch naming notes.

## Milestone 2 — Core customer and staff experience

### A. Customer ordering journey (new public pages)
- **Landing page** (`/`): restaurant hero, consistent food photography generated in one style, featured items, and an "Order now" button. Sign-in moves to `/login`.
- **Menu** (`/order`): category tabs, search, dietary and allergen tags, sold-out badges, and product cards with price, description and image.
- **Item details**: options such as size, extras and notes, plus quantity.
- **Cart**: stays after a refresh, with a floating item count and subtotal. A short "Added" confirmation appears and the cart badge bounces gently.
- **Checkout**: order review, name and phone, collection or delivery, payment method (cash or card on collection), special instructions, required-field checks, and a button that can't submit twice.
- **Confirmation**: order reference, next steps and a "Track order" link.
- **Tracking** (`/track/$reference`): a step-by-step status timeline that refreshes every few seconds, showing the same status staff see.

### B. Staff operations dashboard
- Order Queue becomes a board with columns: New, Preparing, Ready, Completed.
- Large cards show the reference, time since the order was placed, items and highlighted special instructions.
- Each card has **one main next action** (Accept, Mark ready, Complete). Cancel sits in a menu.
- Alerts: a sound and highlight for new orders, an amber or red badge for orders that are taking too long, an unavailable-item warning, and a clear failure message with Retry.
- A status change shows the new status, a timestamp and a "Saved" confirmation.
- Search by reference or customer name, plus channel filters, with automatic refresh.

### C. Admin made useful
- Reports: choose a time period (Today, 7 days, 30 days) for orders and sales, plus best sellers.
- Inventory warnings for low-stock items on the Dashboard and Menu pages.
- Menu saving shows saving, saved or failed, and keeps what was typed if saving fails.
- Every list shows a helpful message when it's empty or a search matches nothing, with a next step.
- Users: change roles (Admin only).

### D. Design consistency and motion
- One heading style and readable body text. Only the blue is used for main actions, and each order status always has the same colour.
- Shared button, card, form, modal and badge components replace one-off styles.
- Pop-up notifications for short confirmations. Important order changes keep a status that stays visible.
- Grey placeholders while menus and dashboards load. Transitions last 150–250 ms and switch off for people who turn on reduced motion.
- Every page is checked at phone, tablet and desktop sizes, and with keyboard-only use.

## Milestone 3 — Mobile integration [Team, supported from web]
- Publish an API contract doc covering requests, replies and errors for: sign-in, menu, place order, order status and staff status updates.
- Add a contract checklist and a test plan for using web and mobile together. For example: place an order on mobile, see it in the web queue, update it, then see the change on mobile.
- Scope guard: deliver one complete mobile journey (browse, order, track) before anything else.

## Milestone 4 — Release hardening
- Automated tests for the price and status rules (cart totals, allowed status steps), plus an end-to-end test of the order flow.
- Accessibility pass: labels, focus order, colour contrast.
- Documents for monitoring, backups, rollback and a pilot with real staff [Team].

## Team mapping
- Lefa / Siviwe: Milestone 2 A and D, and the design system.
- Atlegang: Milestone 2 B, and checking the order flow with mobile.
- Kea: Milestone 3 and the GitHub checks.
- Tshepang: backend checks and permissions, consistent error replies, and API contract sign-off.

## Technical details
- New routes: `index` (landing), `login`, `order`, `checkout`, `order-confirmed.$reference`, `track.$reference`. Every route gets its own head() details.
- A cart store kept in the browser, with unit tests for the totals.
- `data.ts`: add `getOrderByReference` and a guest/customer `placeOrder` that sends options and instructions. The demo data fallback stays.
- `api-client.ts`: handle 401 errors (sign out and send to sign-in) and tag network failures for the reconnect banner.
- Use the `sonner` notifications and `Skeleton` placeholders that already exist. Status colours become tokens in `styles.css`.
- `.github/workflows/ci.yml`: separate frontend and backend jobs, plus a script that checks for duplicate code.
- Backend changes, such as adding optional fields to orders, are only proposed in the docs for Tshepang. They are not made directly unless approved.
