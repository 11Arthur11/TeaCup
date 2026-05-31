# قرارداد پیشنهادی داشبورد کاربر

فرانت‌اند فعلاً برای داشبورد کاربر هیچ درخواست متریکی به backend ارسال نمی‌کند و از mock adapter در `src/api/dashboard.ts` استفاده می‌کند.

Endpoint پیشنهادی برای آینده:

```http
GET /v1/dashboard/overview
```

پاسخ پیشنهادی:

```json
{
  "success": true,
  "type": "DATA",
  "data": {
    "walletBalance": {
      "amount": 250000,
      "currency": "IRT"
    },
    "activeServices": 2,
    "totalServices": 3,
    "pendingInvoices": 1,
    "openTickets": 1,
    "generatedAt": "2026-07-24T12:00:00Z"
  }
}
```

پس از آماده‌شدن endpoint، تابع `getUserDashboardOverview` باید به API واقعی متصل شود. سایر صفحات نیازی به تغییر ندارند.

# داشبورد مدیریت

داشبورد مدیریت نیز فعلاً هیچ‌کدام از endpointهای users/resources/tickets/invoices/nodes را برای ساخت متریک تجمیعی فراخوانی نمی‌کند. پیشنهاد می‌شود بعداً endpoint سبک و تجمیعی مستقلی برای staff dashboard اضافه شود.
