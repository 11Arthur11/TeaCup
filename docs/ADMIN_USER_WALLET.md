# Admin user wallet — TeaCup 0.2.7

TeaCup now exposes a wallet-management view from the admin user-detail page.

## Route

`/admin/users/:id/wallet`

The Back action always returns to `/admin/users/:id`.

## Backend contract

- `GET /v1/admin/wallets/{userId}/overview`
- `GET /v1/admin/wallets/{userId}/transactions`
- `POST /v1/admin/wallets/{userId}/transactions`

The page displays the target user's current wallet overview and paginated transaction history.

Admin balance adjustments use `WalletTransactionAdminRequest`:

- `transactionType`: `CREDIT` or `DEBIT`
- `transactionReason`: `PROLONG`, `PURCHASE`, `REFUND`, or `WALLET_CHARGE`
- `amount`: amount in IRT
- `persist`: whether the transaction should be persisted in wallet history

The user-facing wallet transaction operation follows the OpenAPI 0.3.5 operation id `getWalletTransactions_1`; the admin endpoint owns `getWalletTransactions`.
