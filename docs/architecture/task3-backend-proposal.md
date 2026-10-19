# Task 3 backend proposal: loyalty points ledger + redemption

## Objective

Support customer-visible loyalty wallet balances and safe checkout redemption with idempotency.

## Proposed data model

### `PointsLedger`

Append-only ledger keyed by customer.

| Field         | Type                                              | Notes                                         |
| ------------- | ------------------------------------------------- | --------------------------------------------- |
| `id`          | string/uuid                                       | Ledger entry identifier                       |
| `customerId`  | string                                            | Owning customer                               |
| `entryType`   | enum(`earn`,`redeem`)                             | Earn from completed order, redeem from reward |
| `pointsDelta` | int                                               | Positive for earn, negative for redeem        |
| `sourceType`  | enum(`order`,`reward_redemption`,`seed`,`manual`) | Traceability                                  |
| `sourceId`    | string                                            | Order id, redemption id, or migration id      |
| `label`       | string                                            | Human-readable label shown in wallet history  |
| `createdAt`   | datetime                                          | Entry timestamp                               |

### `RewardRedemption`

Tracks reward applications and enforces idempotency.

| Field           | Type                                  | Notes                            |
| --------------- | ------------------------------------- | -------------------------------- |
| `redemptionId`  | string/uuid                           | Client-generated idempotency key |
| `customerId`    | string                                | Redeeming customer               |
| `rewardId`      | string                                | Reward catalog identifier        |
| `pointsCost`    | int                                   | Points spent                     |
| `discountValue` | decimal                               | Currency discount applied        |
| `orderId`       | string nullable                       | Linked order once placed         |
| `status`        | enum(`reserved`,`applied`,`rejected`) | Optional two-phase handling      |
| `createdAt`     | datetime                              | Created time                     |

## API proposal

### `GET /api/loyalty/wallet`

Returns:

- `points`
- `next` (reward, progress, needed)
- `availableRewards`
- `history`
- `rules`

### `POST /api/loyalty/redeem`

Request:

```json
{ "customerId": "c1", "rewardId": "r-20", "redemptionId": "uuid" }
```

Behavior:

- Reject if balance is insufficient.
- If `redemptionId` already exists, return prior outcome without applying second discount.
- Record `RewardRedemption` and matching negative `PointsLedger` entry when successful.

## Earning rules

- Award points only when an order transitions to `Completed`.
- Award rate: 1 point per R10 spent (floor).
- Idempotency key for earning: `earn:{orderId}` to prevent duplicate earn entries.

## Checkout integration notes

- Checkout submits optional `{ rewardId, redemptionId }` with order placement.
- Redemption discount appears as a separate checkout line item.
- If redemption fails validation, order placement should fail with actionable error text.
