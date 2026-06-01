# فهرست APIهای پیشنهادی و شکاف‌های فعلی TeaCloud

این گزارش بر اساس `docs (0.1.1).json` و نیازهای فعلی فرانت‌اند تهیه شده است. موارد «ضروری» مستقیماً روی صحت، امنیت یا فشار backend اثر دارند؛ موارد «پیشنهادی» برای کامل‌شدن محصول و کاهش تعداد درخواست‌ها هستند.

## اولویت فوری (P0)

### 1. وضعیت عمومی و Maintenance

**API پیشنهادی:**

```http
GET /v1/system/status
```

پاسخ پیشنهادی:

```json
{
  "success": true,
  "type": "DATA",
  "data": {
    "status": "OPERATIONAL",
    "maintenance": false,
    "message": null,
    "estimatedRecoveryAt": null,
    "version": "0.1.1"
  }
}
```

enum پیشنهادی `status`:

- `OPERATIONAL`
- `DEGRADED`
- `MAINTENANCE`
- `OUTAGE`

**شکاف فعلی:** endpoint عمومی و سبک برای تشخیص availability وجود ندارد. فرانت‌اند موقتاً `GET /v1/categories` را به‌عنوان probe استفاده می‌کند. این راه‌حل فقط برای تشخیص network failure مناسب است و وضعیت maintenance برنامه‌ریزی‌شده را منتقل نمی‌کند.

### 2. امنیت اطلاعات حساس

- `AudioBotNodeDetailResponse.password` نباید مقدار واقعی رمز را برگرداند. فقط `passwordConfigured: boolean` یا مقدار mask‌شده برگردد.
- `LiaraDnsProviderDetailResponse.apiKey` نباید API key خام را برگرداند. فقط `apiKeyConfigured: boolean` و حداکثر suffix ماسک‌شده مانند `****A91F` کافی است.
- برای تغییر secretها endpoint جدا با مجوز و audit log پیشنهاد می‌شود.

### 3. شناسه‌های `int64`

شناسه‌ها در OpenAPI به‌صورت `integer/int64` تعریف شده‌اند و در TypeScript به `number` تبدیل می‌شوند. مقادیر بالاتر از `Number.MAX_SAFE_INTEGER` دقت خود را از دست می‌دهند.

**پیشنهاد:** شناسه‌ها در JSON به‌صورت `string` ارسال شوند یا generator/frontend به bigint-safe serialization مجهز شود.

### 4. مبلغ و BigDecimal

`DataResponseBigDecimal.data` و `Money.amount` به‌صورت `number` تعریف شده‌اند. برای مبالغ بزرگ یا اعشاری، JSON number می‌تواند خطای precision ایجاد کند.

**پیشنهاد:** مبلغ به‌صورت decimal string ارسال شود:

```json
{ "amount": "99999950000", "currency": "IRT" }
```

## احراز هویت و نشست

### موجود و استفاده‌شده

- `POST /v1/auth/initiate`
- `POST /v1/auth/login`
- `POST /v1/auth/register`
- `POST /v1/auth/logout`
- `GET /v1/users` برای پروفایل و نقش احراز‌شده

### شکاف‌ها و پیشنهادها

1. پاسخ‌های `initiate` در OpenAPI فقط `object` هستند. schema تایپ‌شده لازم است:
   - `LOGIN_INITIATED`
   - `REGISTER_INITIATED`
   - TTL نشست OTP
   - زمان مجاز ارسال مجدد
2. پاسخ‌های login/register بهتر است schema مشخص و یکسان داشته باشند.
3. قرارداد cookieها، SameSite، Secure، دامنه، CSRF و رفتار CORS در OpenAPI یا مستند امنیتی ثبت شود.
4. semantics سراسری `403 = session ended` صریحاً مستند شود؛ در استاندارد رایج، `401` برای نشست نامعتبر و `403` برای مجوز ناکافی است.
5. API اختیاری برای ابطال همه نشست‌ها:

```http
POST /v1/auth/logout-all
```

6. API فهرست نشست‌های فعال برای امنیت حساب:

```http
GET /v1/users/sessions
DELETE /v1/users/sessions/{sessionId}
```

## پروفایل احراز‌شده و حساب کاربری

### شکاف‌ها

- endpoint مستقل identity حذف شده و `GET /v1/users` منبع نقش frontend است.
- نقش‌های `UserDetailResponse`, `UserListResponse`, `UserDetailAdminResponse` و `RoleListResponse.name` در نسخه محلی با enumهای `ROLE_USER`, `ROLE_SUPPORT`, `ROLE_ADMIN` محدود شده‌اند.
- کاربر endpoint ویرایش پروفایل خودش ندارد.
- flow تأیید ایمیل با وجود `emailVerified` مستند نشده است.

### APIهای پیشنهادی

```http
PATCH /v1/users/profile
POST  /v1/users/email/verification
POST  /v1/users/email/verification/confirm
```

## داشبورد کاربر

### موجود

```http
GET /v1/dashboard/overview
```

این endpoint اکنون تعداد کل، فعال و تعلیق‌شده سرویس‌ها و تعداد تیکت‌های باز را برمی‌گرداند.

### شکاف‌های باقی‌مانده

- نزدیک‌ترین تاریخ انقضای سرویس
- آخرین فعالیت‌های مهم حساب
- فهرست کوتاه سرویس‌های فعال در همان پاسخ، برای حذف درخواست جداگانه `/v1/services` در داشبورد
- فهرست پنج تیکت اخیر در همان پاسخ، برای حذف درخواست جداگانه `/v1/tickets` در داشبورد

## کیف پول و مالی کاربر

### موجود

- `GET /v1/wallet/overview`
- `GET /v1/wallet/transactions`
- `POST /v1/wallet/charge`
- `GET /v1/invoices`
- `GET /v1/invoices/{invoiceToken}`
- عملیات پرداخت و درگاه‌ها

### شکاف‌ها

1. `WalletTransactionResponse.reason` string است، ولی enum واقعی باید باشد:
   - `PROLONG`
   - `PURCHASE`
   - `WALLET_CHARGE`
2. `InvoiceUserResponse.status` و `InvoiceAdminResponse.status` باید enum `PAID/CANCELLED/PENDING` باشند.
3. پاسخ `GET /v1/invoices/{invoiceToken}` فقط `object` است و مدل تایپ‌شده ندارد.
4. پاسخ charge wallet یک `Map<String,String>` است؛ بهتر است مدل مشخص شامل `invoiceToken` باشد.
5. برای متریک‌های مالی فعلی، فرانت‌اند چند request جدا برای تعداد credit/debit و آخرین تراکنش می‌فرستد.

### API پیشنهادی

```http
GET /v1/wallet/summary
```

داده پیشنهادی:

- balance
- creditTransactionCount
- debitTransactionCount
- totalTransactionCount
- lastTransactionAt
- pendingInvoiceCount
- totalInvoiceCount

همچنین برای export:

```http
GET /v1/wallet/transactions/export
GET /v1/invoices/export
```

## سرویس‌های کاربر

### موجود

- فهرست سرویس‌ها
- جزئیات
- ساخت، تمدید و ویرایش پایه
- start/stop TeaSpeak و AudioBot
- Privilege و Playlist

### شکاف‌ها

1. `AbstractResourceDetailResponse` فیلدهای اختصاصی TeaSpeak را ندارد:
   - `maxClients`
   - `port`
   - `teaSpeakStatus`
   - `privilegeToken`
2. مدل اختصاصی AudioBot detail نیز موجود نیست؛ فیلدهای اتصال، nickname و runtime status باید تایپ شوند.
3. endpoint edit نام operation نامناسب `prolongResource_1` دارد؛ پیشنهاد `editResource`.
4. start/stop پاسخ فقط پیام می‌دهد و وضعیت جدید را برنمی‌گرداند؛ فرانت‌اند مجبور به refetch است.
5. فهرست سرویس‌های کاربر pagination/filter ندارد.
6. تاریخ‌ها باید همیشه offset/UTC مشخص داشته باشند.

### schema پیشنهادی

- `TeaSpeakResourceDetailResponse` با `allOf` از base detail
- `AudioBotResourceDetailResponse` با `allOf` از base detail
- discriminator واقعی روی `resourceType`

### APIهای پیشنهادی

```http
GET /v1/services?type=&status=&page=&size=
GET /v1/services/{id}/events
GET /v1/services/{id}/usage
```

برای جلوگیری از double-submit در خرید/تمدید، پشتیبانی از `Idempotency-Key` پیشنهاد می‌شود.

## محصولات و دسته‌بندی‌ها

### شکاف‌های مهم

1. `GET /v1/products/{categorySlug}`, `GET /v1/admin/products` و `GET /v1/admin/products/{id}` عمدتاً example دارند و response schema کامل ندارند.
2. `POST /v1/admin/products/add` اشتباهاً از `AbstractNewResourceRequest` استفاده می‌کند، در حالی که example شامل فیلدهای محصول است.
3. unionهای TeaSpeak/AudioBot product باید schemaهای اختصاصی و discriminator داشته باشند.
4. دسته‌بندی‌ها pagination، sorting و جست‌وجو ندارند.
5. رفتار حذف دسته یا محصول دارای resource فعال مستند نشده است.

### API/قابلیت پیشنهادی

- product create/update schemaهای مجزا
- preview قیمت و validation سمت backend
- ترتیب نمایش دسته‌ها و محصولات
- soft-delete/archive به‌جای حذف قطعی
- endpoint availability محصول

## تیکت و پشتیبانی

### شکاف‌ها

- `TicketMessageResponse.senderRole` string آزاد است.
- `sortedBy` در `TicketFilterRequest` string آزاد و بدون مقادیر معتبر است.
- جست‌وجوی متن subject/message وجود ندارد.
- unread state، priority، SLA و assignment اپراتور وجود ندارد.
- وضعیت upload، محدودیت MIME و حداکثر حجم فایل مستند نشده است.

### APIهای پیشنهادی

```http
GET   /v1/tickets/unread-count
PATCH /v1/tickets/{id}/read
PATCH /v1/admin/tickets/{id}/assign
PATCH /v1/admin/tickets/{id}/priority
```

و افزودن filterهای:

- `search`
- `priority`
- `assignedTo`
- `unreadOnly`

## اعلان‌های عمومی

### شکاف فعلی

endpoint فعلی کل فهرست را هر ۵ ثانیه برمی‌گرداند و read/unread per-user ندارد. badge هدر در نتیجه «تعداد کل» است، نه تعداد خوانده‌نشده.

### APIهای پیشنهادی

```http
GET   /v1/notifications?since=&page=&size=
GET   /v1/notifications/unread-count
PATCH /v1/notifications/{id}/read
PATCH /v1/notifications/read-all
```

بهتر است پاسخ list شامل `expiresAt`, `readAt`, `severity` و `actionUrl` باشد. برای real-time واقعی SSE یا WebSocket به‌جای polling پیشنهاد می‌شود.

## مدیریت کاربران

### بهبود انجام‌شده در 0.1.1

`UsersFilterRequest.search` اضافه شده و فرانت‌اند جست‌وجو را به backend می‌فرستد. فیلتر `byRoleId` نیز از `/v1/admin/users/roles` تغذیه می‌شود.

### شکاف‌ها

- sorting تعریف نشده است.
- audit history تغییر نقش/قفل/ویرایش وجود ندارد.
- bulk action وجود ندارد.
- نقش‌ها فقط قابل مشاهده و assign هستند؛ permission model مستند نشده است.

### APIهای پیشنهادی

```http
GET /v1/admin/users/{id}/audit-log
POST /v1/admin/users/bulk-action
GET /v1/admin/permissions
```

## داشبورد مدیریت

### API پیشنهادی

```http
GET /v1/admin/dashboard/overview
```

متریک‌های پیشنهادی:

- user counts و registration trend
- resource counts by type/status
- node capacity/utilization
- pending/paid invoice totals
- open tickets by department/status
- payment success rate
- infrastructure alerts

**شکاف فعلی:** داشبورد ادمین عمداً metric API فراخوانی نمی‌کند.

## مدیریت منابع ادمین

### موجود

- فهرست با `page`, `size`, `byResourceStatus`, `byType`, `byOwnerId`
- جزئیات resource
- انتخاب owner با جست‌وجوی backend

### شکاف‌ها

1. endpoint `POST /v1/admin/resources` فیلتر را در query می‌گیرد؛ قرارداد غیرمعمول است. یا GET با query ساده، یا POST با JSON body انتخاب شود.
2. جزئیات ادمین از همان base detail کاربر استفاده می‌کند و owner، node assignment، provisioning errors و audit را ندارد.
3. عملیات مدیریتی suspend/redeploy/migrate/force-prolong وجود ندارد.
4. فیلتر search بر اساس label/product/identifier وجود ندارد.

### APIهای پیشنهادی

```http
POST /v1/admin/resources/search
GET  /v1/admin/resources/{id}/events
POST /v1/admin/resources/{id}/redeploy
POST /v1/admin/resources/{id}/migrate
POST /v1/admin/resources/{id}/suspend
```

## Query Instance

### شکاف schema

`QueryInstanceListResponse.status` هنوز string است و باید enum زیر باشد:

- `DISABLED`
- `FULL`
- `UNREACHABLE`
- `RECONNECTING`
- `LOGIN_FAILED`
- `DISPATCHED`
- `INITIATED`

### قابلیت‌های پیشنهادی

- endpoint جزئیات نود
- health/latency/lastHeartbeat
- provisioning error و lastError
- resource list روی هر نود
- test-connection قبل از ذخیره
- rotate credentials بدون بازگرداندن secret
- utilization history

```http
GET  /v1/admin/query-instances/{id}
POST /v1/admin/query-instances/test-connection
GET  /v1/admin/query-instances/{id}/metrics
GET  /v1/admin/query-instances/{id}/resources
```

## AudioBot Node

### موجود

status enum در OpenAPI تعریف شده است.

### شکاف‌ها و پیشنهادها

- password خام نباید برگردد.
- test connection و heartbeat لازم است.
- فهرست resourceهای متصل و utilization history مفید است.
- وضعیت `RECONNECTING` در صورت استفاده backend باید به enum اضافه شود.

```http
POST /v1/admin/audio-bot-nodes/test-connection
GET  /v1/admin/audio-bot-nodes/{id}/metrics
GET  /v1/admin/audio-bot-nodes/{id}/resources
```

## Playlist و AudioBot

### شکاف‌ها

- `ABPlayListItemResponse.audioType` string بدون enum است.
- حذف track، reorder، rename playlist و playback control مستند نشده‌اند.
- pagination detail با POST غیرمعمول است.

### APIهای پیشنهادی

```http
PATCH  /v1/services/audio-bot/{id}/playlists/{file}
DELETE /v1/services/audio-bot/{id}/playlists/{file}/tracks/{trackId}
PATCH  /v1/services/audio-bot/{id}/playlists/{file}/tracks/reorder
POST   /v1/services/audio-bot/{id}/player/play
POST   /v1/services/audio-bot/{id}/player/pause
POST   /v1/services/audio-bot/{id}/player/skip
GET    /v1/services/audio-bot/{id}/player/status
```

## پرداخت و درگاه‌ها

### شکاف‌ها

- جزئیات transaction و callback errors کامل مستند نشده‌اند.
- فهرست transactionهای پرداخت ادمین endpoint مستقل ندارد.
- refund، reconciliation و retry وجود ندارد.
- callback بهتر است کاربر را به route نتیجه پرداخت هدایت کند و endpoint verify idempotent باشد.

### APIهای پیشنهادی

```http
GET  /v1/admin/payments/transactions
GET  /v1/admin/payments/transactions/{id}
POST /v1/admin/payments/transactions/{id}/refund
POST /v1/admin/payments/reconcile
GET  /v1/payments/result/{invoiceToken}
```

## DNS

### شکاف‌ها

- API فقط Liara-specific است؛ provider abstraction وجود ندارد.
- `DnsZoneListResponse.status` و provider `status` string بدون enum هستند.
- API key خام برمی‌گردد.
- عملیات zone create/delete/sync مشخص نیست.

### API پیشنهادی عمومی

```http
GET    /v1/admin/dns/providers
POST   /v1/admin/dns/providers
GET    /v1/admin/dns/providers/{id}
PATCH  /v1/admin/dns/providers/{id}
DELETE /v1/admin/dns/providers/{id}
POST   /v1/admin/dns/providers/{id}/test
POST   /v1/admin/dns/providers/{id}/sync
GET    /v1/admin/dns/providers/{id}/zones
```

Provider-specific config می‌تواند با discriminator یا `configuration` تایپ‌شده مدیریت شود.

## اعلان‌های ادمین و عملیات سیستمی

قابلیت‌های پیشنهادی:

- severity: info/warning/critical
- target audience بر اساس role/user
- draft/scheduled publishing
- read statistics
- audit trail و publisher detail

```http
POST /v1/admin/notifications/schedule
GET  /v1/admin/notifications/{id}/statistics
```

## استانداردهای مشترک API

1. یک enum مشترک برای response `type` تعریف شود. مقادیر فعلی شامل `DATA`, `NO_DATA`, `SUCCESS`, `ERROR`, `FAILURE`, `PROCESSING` و typeهای auth است.
2. error schema یکسان با `code`, `message`, `fieldErrors`, `traceId`.
3. تمام عملیات mutation دارای idempotency و correlation/trace ID باشند.
4. pagination و sorting contract در تمام listها یکسان شود.
5. تمام تاریخ‌ها RFC3339 با timezone/offset باشند.
6. `required: true` برای query objectهایی که تمام فیلدهایشان nullable هستند بازبینی شود.
7. rate-limit headers و response `429` استاندارد مستند شود.
8. ETag/Last-Modified یا SSE/WebSocket برای کاهش polling پیشنهاد می‌شود.
9. API version و deprecation headers مشخص باشند.
10. audit log برای تمام عملیات مدیریتی ضروری است.

## فیلدهای string که احتمالاً باید enum شوند

موارد قطعی یا بسیار محتمل در نسخه 0.1.1:

- `QueryInstanceListResponse.status`
- `TicketMessageResponse.senderRole`
- `WalletTransactionResponse.reason`
- `InvoiceUserResponse.status`
- `InvoiceAdminResponse.status`
- `ABPlayListItemResponse.audioType`
- `DnsZoneListResponse.status`
- `LiaraDnsProviderDetailResponse.status`
- `TicketFilterRequest.sortedBy`
- تمام response wrapperهای `type`



## Live service status

صفحه `/admin/live-status` فعلاً از mock adapter استفاده می‌کند. endpoint پیشنهادی آینده:

```http
GET /v1/admin/system/live-status
GET /v1/admin/system/events?cursor=...
```

برای جریان واقعی لاگ، SSE (`text/event-stream`) یا WebSocket بهتر از polling است. پاسخ snapshot باید وضعیت کلی، متریک منابع، سلامت componentها و cursor آخرین event را برگرداند. داده‌های حساس و credentialها نباید در log payload ارسال شوند.

## انتخاب کاربر در عملیات مدیریت

Picker مشترک برای منابع، تیکت‌ها و فاکتورها از `GET /v1/admin/users` و `GET /v1/admin/users/roles` استفاده می‌کند. برای `ROLE_SUPPORT` نیز backend باید حداقل دسترسی read-only و محدودشده به همین جست‌وجو را فراهم کند، وگرنه ساخت تیکت/فاکتور برای کاربر در پنل پشتیبانی ممکن نیست.
