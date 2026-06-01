# Payment and Invoice Frontend Contract

## User redirect

The frontend accepts gateway redirects in this form:

```text
/panel/invoices/{invoiceToken}?result=true
/panel/invoices/{invoiceToken}?result=false
```

The invoice is loaded first. The result dialog is then displayed once, and `result` is removed from the browser URL with `history.replaceState` so the five-second page refresh does not reopen the dialog.

## Admin invoice detail

Frontend route:

```text
/admin/invoices/{invoiceToken}
```

The current frontend calls:

```http
GET /v1/invoices/{invoiceToken}
```

For the admin page to be complete, the backend response should include:

- `invoiceToken`
- `ownerId`
- `money`
- `createdAt`
- `paidAt`
- `status`
- `description` and `items` when available
- `paymentTransaction` when payment has been completed

The backend must authorize `ROLE_ADMIN` and `ROLE_SUPPORT` for this read operation, or provide an equivalent staff-specific detail endpoint.
