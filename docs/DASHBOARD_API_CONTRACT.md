# قرارداد داشبورد کاربر

داشبورد کاربر به endpoint واقعی زیر متصل است:

```http
GET /v1/dashboard/overview
```

پاسخ فعلی:

```json
{
  "success": true,
  "type": "DATA",
  "data": {
    "resourceMetric": {
      "total": 3,
      "active": 3,
      "suspended": 0
    },
    "openTickets": 0
  }
}
```

کاربرد در فرانت‌اند:

- `resourceMetric.total`: تعداد کل سرویس‌ها
- `resourceMetric.active`: تعداد سرویس‌های فعال
- `resourceMetric.suspended`: تعداد سرویس‌های تعلیق‌شده یا نیازمند بررسی
- `openTickets`: تعداد تیکت‌های باز

برای موجودی و زمان پوشش تمدید خودکار همچنان از `GET /v1/wallet/overview` استفاده می‌شود. پنج تیکت اخیر با `GET /v1/tickets?page=0&size=5` و دسترسی سریع سرویس‌ها با `GET /v1/services` دریافت می‌شوند.

# داشبورد مدیریت

داشبورد مدیریت از endpoint تجمیعی backend استفاده می‌کند؛ داده‌های mock حذف شده‌اند.

## بروزرسانی 0.2.1 — داشبورد مدیریت

داشبورد مدیریت اکنون به endpoint واقعی زیر متصل است:

```http
GET /v1/admin/dashboard/overview
```

پاسخ شامل `financeMetric`, `userMetric`, `ticketMetric`, `resourceMetric`, `queryInstanceMetric` و `audioBotNodeMetric` است. فرانت‌اند آن را با cache مشترک پنج‌ثانیه‌ای مصرف می‌کند و مقایسه دوره جاری/قبلی و استراتژی Provisioning نودها را نمایش می‌دهد.
