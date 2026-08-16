# TeaCup 1.0.1

Patch release aligned with the TeaHub OpenAPI 4.0.1 contract.

## Changes

- Added admin Resource unlock support and a smart Lock/Unlock action.
- Replaced separate TeaSpeak start/stop controls with one state-aware power action; AudioBot uses the same unified behavior.
- Query Instance edit now consumes `defaultQueryServerGroupId` from the current backend response and keeps patch-like updates.
- AudioBot Node panel access reveal/hide is now local DOM state and no longer re-renders the page.
- AudioBot Node panel credential is the direct `username:password` value; Base64 encoding was removed.
- Updated the panel access helper text to describe the card purpose instead of encoding details.
