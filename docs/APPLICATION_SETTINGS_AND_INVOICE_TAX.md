# Application settings and invoice tax

## Admin system page

The admin navigation route is `/admin/system`. The previous `/admin/monitoring` and `/admin/live-status` routes redirect to it.

The page combines:

- `GET /v1/admin/app-settings` for the current application settings.
- `POST /v1/admin/app-settings` for partial MapStruct-style updates.
- The existing live STOMP log stream.

The update payload always contains both top-level sections. An unchanged top-level section is sent as `null`. Inside an edited section, unchanged fields or period objects are also sent as `null`.

Example when only `taxPercentage` changes:

```json
{
  "invoiceProperties": {
    "minimumWalletChargeAmountIrt": null,
    "taxPercentage": 9
  },
  "productPeriodSettings": null
}
```

Example when only the daily suspend-delete timeout changes:

```json
{
  "invoiceProperties": null,
  "productPeriodSettings": {
    "hourly": null,
    "daily": {
      "suspendDeleteAfterSeconds": 86400
    },
    "monthly": null
  }
}
```

## Invoice tax

`taxPercentage` is an integer percentage. For example, `9` means 9 percent.

The frontend calculates:

- tax amount = rounded base amount × taxPercentage ÷ 100
- payable amount = base amount + tax amount

The user and admin invoice lists show the payable amount and a smaller tax line. Invoice detail pages show base amount, tax amount, and final payable amount separately.
