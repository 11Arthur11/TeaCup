# قرارداد لاگ زنده backend

صفحه ادمین `/admin/system` از Polling یا داده Mock استفاده نمی‌کند. لاگ‌ها مستقیماً با WebSocket و پروتکل STOMP دریافت می‌شوند.

## اتصال

آدرس WebSocket از همان Base URL API ساخته می‌شود:

```text
http://localhost:8080  -> ws://localhost:8080/ws
https://api.example.ir -> wss://api.example.ir/ws
```

مقصد Subscription:

```text
/topic/logs
```

کلاینت با STOMP 1.2 متصل می‌شود، heartbeat را مدیریت می‌کند و در صورت قطع ارتباط هر ۵ ثانیه دوباره تلاش می‌کند. هنگام خروج از صفحه سیستم، Subscription و WebSocket بسته می‌شوند.

## مدل پیام

```json
{
  "logger": "dev.parhamziaei.teahub.service.ResourceService",
  "level": "INFO",
  "message": "resource #1842 transitioned to ACTIVE",
  "thread": "kafka-listener-1",
  "timestamp": "2026-08-02T17:42:30.615Z"
}
```

فیلدها:

- `logger`: نام Logger تولیدکننده پیام
- `level`: سطح لاگ، مانند `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`
- `message`: متن لاگ
- `thread`: Thread اجراکننده
- `timestamp`: زمان ISO-8601

## رفتار رابط کاربری

- حداکثر ۵۰۰ پیام آخر در DOM نگهداری می‌شود تا حافظه کنترل شود.
- اگر کاربر نزدیک انتهای خروجی باشد، با پیام جدید Auto-scroll انجام می‌شود.
- اگر کاربر برای خواندن لاگ‌های قدیمی بالا رفته باشد، موقعیت اسکرول او تغییر نمی‌کند.
- وضعیت اتصال، اتصال مجدد و خطای STOMP در Toolbar نشان داده می‌شود.
- صفحه سیستم Refresh پنج‌ثانیه‌ای ندارد؛ WebSocket تنها منبع داده آن است.

پیام‌های backend نباید credential، JWT، password، API key، کد OTP یا داده حساس کاربر را دربر بگیرند.
