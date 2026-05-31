# OpenAPI enum audit — TeaCloud

این گزارش از `openapi/teacloud.openapi.json` جدید استخراج شده است. موارد زیر از نظر معنایی enum هستند اما در schema هنوز `type: string` بدون `enum` دارند، یا فیلد لازم اصلاً در schema وجود ندارد.

## موارد قطعی

| Schema | Field | وضعیت فعلی | پیشنهاد |
|---|---|---|---|
| `QueryInstanceListResponse` | `status` | `string` | enum: `DISABLED`, `FULL`, `UNREACHABLE`, `RECONNECTING`, `LOGIN_FAILED`, `DISPATCHED`, `INITIATED` |
| `InvoiceUserResponse` | `status` | `string` | enum: `PAID`, `CANCELLED`, `PENDING` |
| `InvoiceAdminResponse` | `status` | `string` | enum: `PAID`, `CANCELLED`, `PENDING` |
| `WalletTransactionResponse` | `reason` | `string` | enum: `PROLONG`, `PURCHASE`, `WALLET_CHARGE` |
| `TicketMessageResponse` | `senderRole` | `string` | همان enum نقش‌های سیستم، در صورتی که مقدار دقیق role identifier ارسال می‌شود |


## موارد برطرف‌شده در نسخه محلی

- endpoint مستقل `/v1/users/identity` حذف شده است.
- نقش از `GET /v1/users` دریافت می‌شود.
- فیلدهای نقش در مدل پروفایل، فهرست کاربر، جزئیات ادمین و فهرست نقش‌ها به enumهای `ROLE_USER`, `ROLE_SUPPORT`, `ROLE_ADMIN` محدود شده‌اند.
- `POST /v1/admin/tickets/submit` دارای query parameter الزامی `targetUserId` است.

## enumهای احتمالی که مقادیرشان در سند مشخص نشده است

| Schema | Field | توضیح |
|---|---|---|
| `ABPlayListItemResponse` | `audioType` | نوع فایل/منبع صوتی به نظر enum است؛ فهرست مقادیر backend در OpenAPI نیست. |
| `DnsZoneListResponse` | `status` | وضعیت zone به نظر enum است؛ مقادیر مجاز مستند نشده‌اند. |
| `LiaraDnsProviderDetailResponse` | `status` | وضعیت اتصال provider به نظر enum است؛ مقادیر مجاز مستند نشده‌اند. |

## Response type

فیلد `type` در تمام wrapperهای پاسخ به‌صورت `string` تعریف شده، ولی در توضیحات نمونه‌هایی مانند `SUCCESS`, `ERROR`, `PROCESSING`, `FAILURE` آمده و در رفتار واقعی مقادیری مانند `DATA`, `NO_DATA`, `LOGIN_SUCCESS`, `REGISTER_SUCCESS`, `LOGIN_INITIATED`, `REGISTER_INITIATED` نیز استفاده می‌شوند. بهتر است یک enum مشترک و کامل برای Response Type تعریف و در همه wrapperها `$ref` شود؛ تا زمانی که فهرست کامل مشخص نباشد، frontend آن را string نگه می‌دارد.

## فیلدهای غایب از schema

### `ResourceListResponse.resourceType` — برطرف‌شده در نسخه محلی

بر اساس قرارداد جدید backend، فیلد `resourceType` با enumهای `TEASPEAK` و `AUDIO_BOT` به نسخه OpenAPI پروژه اضافه شده و frontend دیگر برای تفکیک دو جدول به ترجمه نام محصول وابسته نیست. fallback نام محصول فقط برای سازگاری موقت با پاسخ‌های قدیمی باقی مانده است.

### `GET /v1/wallet/overview` — اضافه‌شده در نسخه محلی

این endpoint با پاسخ عددی IRT و مدل `DataResponseNumber` ثبت شده است. frontend مقدار عددی را در adapter کیف پول به ساختار `Money` تبدیل می‌کند.

### جزئیات اختصاصی TeaSpeak

نمونه واقعی backend این فیلدها را برمی‌گرداند، اما `AbstractResourceDetailResponse` آن‌ها را ندارد:

- `maxClients`
- `port`
- `teaSpeakStatus`
- `privilegeToken.token`

بهتر است schema اختصاصی `TeaSpeakResourceDetailResponse` با `allOf` از `AbstractResourceDetailResponse` ساخته شود. برای `teaSpeakStatus` نیز enum دقیق backend ثبت شود؛ در قرارداد فعلی فقط مقدار `ONLINE` قطعی است و frontend از `ONLINE` و `OFFLINE` پشتیبانی می‌کند و مقدار ناشناخته را بدون شکستن UI نمایش می‌دهد.
