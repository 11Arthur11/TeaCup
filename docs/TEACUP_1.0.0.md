# TeaCup 1.0.0

TeaCup 1.0.0 is the first major frontend release aligned with the TeaHub OpenAPI 4.0.0 contract.

## Admin user workspace

Admin user details now act as a user-scoped workspace with horizontal tabs for account information, tickets, wallet, services, and invoices. User-owned detail links carry navigation context so Back returns to the originating user tab.

## Resource administration

- `LOCKED` resource lifecycle is supported.
- Admin can lock an unlocked resource through the backend lock endpoint.
- Locked TeaSpeak and AudioBot resources stay readable while operational actions are disabled in both admin and user views.
- TeaSpeak admin detail displays the current Privilege Token and supports reveal/copy/new-token actions when unlocked.
- AudioBot scoped-panel actions are disabled while a resource is locked.

## Products and invoices

- Product enabled state uses one state-aware enable/disable control.
- Admin invoice tables prefer `ownerFullName` while preserving navigation through `ownerId`.

## Infrastructure nodes

- Query Instance credentials are displayed and prefilled in edit forms, including password reveal.
- Query Instance edit requests are patch-like: only changed values are submitted.
- AudioBot Node edit loads the full node detail, prefills current credentials, and only submits changed values.
- AudioBot Node detail includes an admin panel-access card. Its access token is Base64 of `username:password`; the panel URL comes from `webAddress`.

## API contract

The effective frontend OpenAPI is based on TeaHub OpenAPI 4.0.0 while preserving previously confirmed TeaCloud contract overrides required by TeaCup.
